---
title: "Windows 截图与滚动长截图：GDI BitBlt 和相邻帧拼接"
description: "Step by step 介绍 Windows 区域截图、DPI 与 BGRA 像素处理，以及滚动长截图的重叠搜索和拼接。"
---

# Windows 截图与滚动长截图

我们想在 Windows 上实现两个结果：先用一条命令把屏幕区域保存成 PNG，再让用户向下滚动页面，把连续画面拼成一张长图。先实际运行、看到输出，再解释 GDI、DPI 和帧重叠，会比一开始直接介绍系统 API 更容易理解。

普通截图的关键是从 GDI 拿到正确的像素；真正需要反复调试的是滚动截图。它不是简单地连续截图，而是必须判断页面到底移动了多少、找出相邻帧的共同内容、排除浏览器工具栏和吸顶栏，最后只追加新出现的部分。下面就沿着这两个结果逐步实现。

## 1、如何实现截图

### Step 1：先运行一次普通截图

在 Windows 目录执行：

```powershell
make dev
```

默认会截取虚拟桌面左上角 `1000 × 700` 的物理像素区域，生成 `dev-shot.png`。完整等价命令是：

```powershell
cargo run -- shot `
  --x 0 --y 0 --width 1000 --height 700 `
  --output dev-shot.png
```

看到图片后，参数就很直观了：`x`、`y` 决定从虚拟桌面的哪里开始，`width`、`height` 决定截取多大范围。

### Step 2：启用 Per-Monitor DPI 感知

如果进程不是 DPI aware，Windows 可能对坐标和尺寸做虚拟化。在 125%、150% 缩放或混合缩放的多屏环境中，结果通常是截取位置偏移、宽高不一致。

程序启动后先声明 Per-Monitor V2 DPI 感知：

```rust
use windows::Win32::UI::HiDpi::{
    DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE_V2,
    DPI_AWARENESS_PER_MONITOR_AWARE,
    GetAwarenessFromDpiAwarenessContext,
    GetThreadDpiAwarenessContext,
    SetProcessDpiAwarenessContext,
};

if let Err(error) = unsafe {
    SetProcessDpiAwarenessContext(
        DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE_V2
    )
} {
    let current = unsafe {
        GetAwarenessFromDpiAwarenessContext(
            GetThreadDpiAwarenessContext()
        )
    };
    if current != DPI_AWARENESS_PER_MONITOR_AWARE {
        return Err(error.into());
    }
}
```

如果宿主已经通过 manifest 设置了相同的 DPI 模式，`SetProcessDpiAwarenessContext` 可能返回拒绝访问；此时检查当前线程确实已经是 Per-Monitor aware 后即可继续。之后 `x`、`y`、`width`、`height` 都按物理像素解释。副显示器在主显示器左侧时，`x` 可能为负数，因此坐标仍要使用 `i32`。

### Step 3：准备屏幕 DC、内存 DC 和顶向下 DIB

GDI 截图需要三个对象：

1. `GetDC(None)` 获取整个虚拟桌面的屏幕 DC。
2. `CreateCompatibleDC` 创建离屏内存 DC。
3. `CreateDIBSection` 创建 32 位像素缓冲区。

```rust
let screen_dc = GetDC(None);
let memory_dc = CreateCompatibleDC(Some(screen_dc));

let bitmap_info = BITMAPINFO {
    bmiHeader: BITMAPINFOHEADER {
        biSize: std::mem::size_of::<BITMAPINFOHEADER>() as u32,
        biWidth: width as i32,
        biHeight: -(height as i32),
        biPlanes: 1,
        biBitCount: 32,
        biCompression: BI_RGB.0,
        ..Default::default()
    },
    ..Default::default()
};

let mut bits = std::ptr::null_mut();
let bitmap = CreateDIBSection(
    Some(screen_dc),
    &bitmap_info,
    DIB_RGB_COLORS,
    &mut bits,
    None,
    0,
)?;
SelectObject(memory_dc, HGDIOBJ::from(bitmap));
```

`biHeight` 使用负数非常重要。它让 DIB 从上到下存储，这样第一行就是屏幕矩形的顶部，不需要在保存前再做一次垂直翻转。

### Step 4：用 BitBlt 复制屏幕像素

把指定屏幕区域复制到内存 DC：

```rust
let result = BitBlt(
    memory_dc,
    0,
    0,
    width as i32,
    height as i32,
    Some(screen_dc),
    x,
    y,
    SRCCOPY | CAPTUREBLT,
);

if result.is_err() {
    BitBlt(
        memory_dc,
        0,
        0,
        width as i32,
        height as i32,
        Some(screen_dc),
        x,
        y,
        SRCCOPY,
    )?;
}
```

`SRCCOPY` 是正常的像素复制。`CAPTUREBLT` 会尽量包含分层窗口；少数驱动或远程桌面环境不支持这个组合，所以失败时再用纯 `SRCCOPY` 重试。

### Step 5：把 BGRA 转成 RGBA

32 位 DIB 返回的是 BGRA 顺序，而常用 PNG 编码接口期望 RGBA：

```rust
let byte_len = width as usize * height as usize * 4;
let bgra = unsafe {
    std::slice::from_raw_parts(bits.cast::<u8>(), byte_len)
};

let mut rgba = Vec::with_capacity(byte_len);
for pixel in bgra.chunks_exact(4) {
    rgba.extend_from_slice(&[
        pixel[2],
        pixel[1],
        pixel[0],
        255,
    ]);
}

let image = RgbaImage::from_raw(width, height, rgba)
    .context("无法构造 RGBA 图像")?;
image.save("shot.png")?;
```

用完后要恢复 `SelectObject` 返回的旧对象，再依次调用 `DeleteObject`、`DeleteDC` 和 `ReleaseDC`。Rust 中可用作用域守卫管理这些句柄，保证中途报错时也能释放。

## 2、如何实现滚动截图

### Step 1：先运行一次滚动截图

确认 `dev-shot.png` 覆盖了需要滚动的正文后，执行：

```powershell
make scroll
```

默认参数是 `1000 × 700`、持续 15 秒、每 `120ms` 采样一次，并忽略截图顶部 `370px` 的固定区域。程序倒计时三秒后开始采集，时间到会自动停止并保存 `dev-scroll.png`：

```powershell
cargo run -- scroll `
  --x 0 --y 0 --width 1000 --height 700 `
  --seconds 15 --interval-ms 120 `
  --fixed-top 370 --output dev-scroll.png
```

用户只需要在采集期间持续向下滚动，不需要在结束时按 `Ctrl-C`。成功接收新内容时会看到类似日志：

```text
accepted frame 2: overlap=250px, appended=80px, score=0.0210
```

最终图片高度应明显大于普通截图的 `700px`。如果日志只有重复帧，说明捕获区域没有发生滚动；如果一直无法找到可信重叠，则应检查滚动速度、固定页头和 DPI 坐标。

这里的 `370` 不是 Windows API 的固定要求，而是当前 `1000 × 700` 浏览器测试区域的实测值：浏览器标签栏、地址栏、页面搜索栏和吸顶导航都不会跟随正文移动，因此必须先从匹配区域中排除。换成其他窗口布局时，要按实际固定区域高度调整：

```powershell
make scroll FIXED_TOP=200
```

### Step 2：重复抓取同一块物理像素区域

滚动期间不要改变截图矩形。用户滚动目标窗口，程序每隔一段时间再次调用同一个 `BitBlt` 捕获函数：

```rust
let first = capture_region(x, y, width, height)?;
let started = Instant::now();

while started.elapsed() < Duration::from_secs(seconds) {
    std::thread::sleep(Duration::from_millis(interval_ms));
    let next = capture_region(x, y, width, height)?;
    // 检查并接收 next
}
```

Windows 上可以从 `120 ms` 开始。GDI 区域捕获速度较快，这个频率既能保留足够重叠，又不会像逐帧录屏那样制造过多数据。

### Step 3：先排除固定页头——这是滚动截图最关键的参数

滚动截图最容易踩的坑，是把浏览器工具栏和吸顶栏也拿去参与重叠匹配。它们在相邻帧中的位置完全不变，而正文正在移动，这两种信号互相冲突，很容易让算法找到一个勉强过线但实际不可靠的结果。

我们实测过将 `fixed-top` 设为 `0` 的情况：

```text
accepted frame 2: overlap=620px, appended=80px, score=0.0543
ignored frame: no trustworthy downward overlap
...
saved dev-scroll.png: accepted=2, rejected=50, size=1000x780
```

首帧是 `700px`，最终图片只有 `780px`，说明 15 秒内实际上只追加了 `80px`。更值得注意的是，匹配阈值为 `0.055`，而第一帧的分数是 `0.0543`：它只是擦着阈值被接收，并不是一个高质量匹配。后续帧继续滚动后，就再也找不到可信重叠。

传入 `fixed_top` 后，算法只比较真正会滚动的区域：

```text
动态区域高度：frame_height - fixed_top
上一帧匹配区域：底部 overlap 行
下一帧匹配区域：从 fixed_top 开始的 overlap 行
下一帧裁剪起点：fixed_top + overlap
```

对于默认参数，动态区域高度是：

```text
700 - 370 = 330px
```

如果页面向下移动了 `80px`，理论重叠高度就是 `250px`，最终仍然只追加新出现的 `80px`：

```text
movement = 330 - 250 = 80px
crop_top = 370 + 250 = 620px
appended = 700 - 620 = 80px
```

这也是为什么不能通过一味放宽匹配阈值解决问题：固定区域没有排除时，提高阈值只会让更多错误位置被当成正确重叠。

### Step 4：用稀疏采样判断两帧是否相同

对动态区域最多采样 64 列、48 行，计算平均 RGB 差异：

```rust
fn sampled_score(
    a: &RgbaImage,
    a_y: u32,
    b: &RgbaImage,
    b_y: u32,
    height: u32,
) -> f64 {
    let width = a.width().min(b.width());
    let step_x = (width / 64).max(1);
    let step_y = (height / 48).max(1);
    let mut total = 0u64;
    let mut channels = 0u64;

    for y in (0..height).step_by(step_y as usize) {
        for x in (0..width).step_by(step_x as usize) {
            let p = a.get_pixel(x, a_y + y).0;
            let q = b.get_pixel(x, b_y + y).0;
            total += u64::from(p[0].abs_diff(q[0]));
            total += u64::from(p[1].abs_diff(q[1]));
            total += u64::from(p[2].abs_diff(q[2]));
            channels += 3;
        }
    }

    total as f64 / (channels as f64 * 255.0)
}
```

同位置分数不超过 `0.012` 时丢弃新帧。这个检查很重要，因为用户滚轮停顿、动画尚未开始或滚动到页面底部时，都会连续产生相同截图。

### Step 5：计算向下滚动距离

假设动态区域高度为：

```text
dynamic_height = frame_height - fixed_top
```

如果最佳重叠高度是 `overlap`，实际向下移动量就是：

```text
movement = dynamic_height - overlap
```

对候选 `overlap`，比较上一帧底部和下一帧顶部：

```rust
let previous_y = previous.height() - overlap;
let score = sampled_score(
    previous,
    previous_y,
    next,
    fixed_top,
    overlap,
);
```

搜索范围要同时限制：

- `overlap >= 24`，确保匹配区域足够大。
- `movement >= 8`，过滤微小抖动。
- 最佳 `score <= 0.055`，否则认为没有可信重叠。

实际搜索先把整个范围分成约 96 步粗查，再在最优候选附近逐像素精查。这样即使区域高达数千像素，也不需要对每个高度做完整比较。

页面中的光标、视频、加载动画可能让少量采样点变化，所以分数不能要求等于零。另一方面，也不要为了接收快速滚动产生的坏帧而无限放宽阈值；无匹配帧直接丢弃，比错误追加更安全。

### Step 6：把新出现的行追加到长图

第一帧完整保留。后续每帧仅保留 `fixed_top + overlap` 以下的内容：

```rust
let crop_top = fixed_top + overlap;
let new_height = next.height() - crop_top;
let new_content = next
    .view(0, crop_top, next.width(), new_height)
    .to_image();

image::imageops::replace(
    &mut output,
    &new_content,
    0,
    i64::from(output_y),
);
output_y += new_height;
```

不要边采集边反复扩容一张巨大 RGBA 图。更简单的做法是先保存“已接收帧 + 每帧裁剪起点”，结束后一次计算总高度、分配输出图并顺序拷贝。

`ignored frame: no visible movement` 表示新帧和上一张已接收帧几乎相同，常见于尚未开始滚动或已经到达页面底部。`ignored frame: no trustworthy downward overlap` 则不是“页面没有变化”，而是“页面发生了变化，但算法无法证明两帧在什么位置连续”。

当前示例会继续拿后续帧和最后一张已接收帧比较。如果用户在失配期间仍快速滚动，两者距离会越来越大，后面就可能连续失配。因此出现大量“无可信重叠”时，应按下面的顺序检查：

1. `fixed-top` 是否完整覆盖浏览器工具栏和吸顶栏。
2. 是否以适中的速度向下滚动，让相邻采样帧保留足够正文重叠。
3. 截图区域中是否存在大面积视频、动画或持续重排的内容。
4. DPI 感知和物理像素坐标是否正确。

只有这些条件都正确后，才需要调整 `interval-ms` 或匹配阈值。Windows 当前实测默认值是 `FIXED_TOP=370`、`INTERVAL_MS=120`。

结束测试后可以同时删除 Cargo 构建产物和两张开发截图：

```powershell
make clean
```

完整可运行示例：[Windows Screenshot Demo](https://github.com/wuliang142857/crossplatform-screenshot-demo/tree/main/windows)
