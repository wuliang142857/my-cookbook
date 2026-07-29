---
title: "Linux 截图与滚动长截图：X11、Wayland 和内容重叠拼接"
description: "从实机结果出发，介绍 Linux 如何不依赖外部截图命令完成 X11 与 Wayland 区域采集，并通过内容重叠实现多数 Linux 工具缺少的滚动长截图。"
---

# Linux 截图与滚动长截图

我们想在 Linux 上实现两个结果：先把指定显示器区域保存成普通 PNG，再在用户向下滚动时生成长图。当前示例已经在 Linux 实机完成普通截图和滚动截图验证。它没有把核心能力交给 `gnome-screenshot`、`scrot` 一类外部命令，而是直接取得屏幕像素、统一成内存 RGBA 图像，再完成滚动帧匹配和拼接。

Linux 同时存在 X11 和 Wayland。特别是 Wayland，它不允许应用像 X11 那样直接读取根窗口，很多跨平台截图库只能标注为“部分支持”。下面仍然先运行命令、看到结果，再解释为什么选择自己实现采集，以及这套方案如何在 Ubuntu 22.04 GNOME Wayland 上完成普通截图和滚动截图。

## 1、如何实现截图

### Step 1：先在 Ubuntu 22.04 上运行普通截图

安装最小构建依赖：

```bash
sudo apt-get install build-essential pkg-config libxcb1-dev
```

D-Bus 依赖启用了 vendored 构建，因此 Ubuntu 22.04 不需要额外安装 `libdbus-1-dev`。

先列出显示器序号和尺寸：

```bash
cargo run --release -- list
```

然后运行：

```bash
make dev
```

默认从第 0 块显示器的左上角截取 `1000 × 700` 像素，生成 `dev-shot.png`。完整等价命令是：

```bash
cargo run -- shot \
  --monitor 0 --x 0 --y 0 --width 1000 --height 700 \
  --output dev-shot.png
```

看到图片后，参数含义就明确了：`monitor` 选择显示器，`x`、`y` 是相对该显示器的起点，`width`、`height` 是截图范围。

### Step 2：为什么不直接调用现有截图命令

调研 Linux 截图工具时，很容易把它们概括成“执行一个系统截图命令”。更准确地说，不同功能走的是不同路线：

| 工具或能力 | 实际路线 | 对滚动截图的影响 |
| --- | --- | --- |
| Shutter 普通 X11 截图 | 主要使用 GDK/Xlib 读取窗口像素 | 只能得到某一时刻的一帧 |
| Shutter Wayland 截图 | 通过 XDG Screenshot Portal 获取画面 | 受系统授权和 portal 返回形式限制 |
| Shutter 网站截图 | 调用外部 `gnome-web-photo`，根据 URL 渲染网页 | 不是当前浏览器窗口，也不适用于任意桌面程序 |
| `gnome-screenshot`、`scrot` 一类命令 | 启动外部进程并输出截图文件 | 连续采样要反复创建进程、读取文件 |
| 当前示例 | X11 直接调用 XCB；Wayland 通过桌面截图接口取得图像；统一返回 `RgbaImage` | 同一块区域可以持续采样并直接进入拼接 |

Shutter 官方介绍明确区分了区域、桌面、窗口和“网站截图”，并说明网站模式依赖 `gnome-web-photo`；官方 FAQ 同时说明普通截图大量依赖 Xlib，而 Wayland 目前主要依赖 portal。[Shutter 功能介绍](https://shutter-project.org/)、[Shutter FAQ](https://shutter-project.org/faq-help/)

所以这里所说的“自己实现得更优雅”，不是绕开操作系统，而是把系统能力放在清晰边界内：

1. X11 路径直接读取根窗口，不组装 shell 命令。
2. Wayland 路径通过桌面允许的接口取得显示器图像。
3. 两条路径都在进程内返回同一种 RGBA 数据。
4. 保存 PNG、重复检测和滚动拼接都不依赖外部截图程序。

这样既避免了外部程序版本、命令参数和临时文件协议侵入核心逻辑，也让普通截图与滚动截图真正复用同一个 `capture()` 接口。

### Step 3：判断当前图形会话

最直接的判断依据是 `XDG_SESSION_TYPE`：

```rust
fn is_wayland() -> bool {
    std::env::var("XDG_SESSION_TYPE")
        .map(|value| value.eq_ignore_ascii_case("wayland"))
        .unwrap_or(false)
}
```

输入参数使用“相对某块显示器”的坐标：

| 参数 | 含义 |
| --- | --- |
| `monitor` | 显示器序号 |
| `x`、`y` | 区域左上角，相对该显示器 |
| `width`、`height` | 区域像素宽高 |

相对坐标比直接让调用者计算虚拟桌面负坐标更容易使用。X11 捕获前再把它换算成根窗口绝对坐标。

### Step 4：在 X11 下枚举显示器

通过 RandR 的 `GetMonitors` 读取每块显示器的原点和尺寸：

```rust
let (connection, screen_index) = xcb::Connection::connect(None)?;
let screen = connection
    .get_setup()
    .roots()
    .nth(screen_index as usize)
    .context("X screen 不存在")?;

let cookie = connection.send_request(&xcb::randr::GetMonitors {
    window: screen.root(),
    get_active: true,
});
let reply = connection.wait_for_reply(cookie)?;

let monitors = reply.monitors().map(|m| {
    (
        i32::from(m.x()),
        i32::from(m.y()),
        u32::from(m.width()),
        u32::from(m.height()),
    )
});
```

若 RandR 没有返回 monitor，则退回根 screen 的 `width_in_pixels` 和 `height_in_pixels`，至少保证单屏环境可用。

### Step 5：在 X11 下用 GetImage 抓取根窗口

把显示器原点和区域相对坐标相加，然后读取根窗口：

```rust
let absolute_x = monitor_x + region_x as i32;
let absolute_y = monitor_y + region_y as i32;

let cookie = connection.send_request(&xcb::x::GetImage {
    format: xcb::x::ImageFormat::ZPixmap,
    drawable: xcb::x::Drawable::Window(screen.root()),
    x: absolute_x as i16,
    y: absolute_y as i16,
    width: width as u16,
    height: height as u16,
    plane_mask: u32::MAX,
});
let reply = connection.wait_for_reply(cookie)?;
let bytes = reply.data();
```

不能直接把 `bytes` 当成 RGBA。要读取当前 pixmap format 的 `bits_per_pixel`、每行跨度和服务器字节序。常见 32 位 little-endian 数据按 B、G、R、未使用字节排列：

```rust
for row in 0..height as usize {
    for column in 0..width as usize {
        let offset = row * row_stride + column * bytes_per_pixel;
        let (r, g, b) = match bits_per_pixel {
            16 => decode_rgb565(&bytes[offset..offset + 2], lsb_first),
            24 | 32 if lsb_first => (
                bytes[offset + 2],
                bytes[offset + 1],
                bytes[offset],
            ),
            24 | 32 => (
                bytes[offset],
                bytes[offset + 1],
                bytes[offset + 2],
            ),
            _ => bail!("不支持的 X11 像素格式"),
        };
        rgba.extend_from_slice(&[r, g, b, 255]);
    }
}
```

处理 `16/24/32 bpp` 和行对齐后，`RgbaImage::from_raw(width, height, rgba)` 就是最终截图。

### Step 6：在 Wayland 下通过桌面截图接口获取图像

Wayland 不允许直接读取根窗口。Ubuntu 22.04 的 GNOME 会话可以调用 `org.gnome.Shell.Screenshot` 的 `ScreenshotArea`；如果桌面不开放该接口，则退回 `org.freedesktop.portal.Screenshot`。

调用方不应假设返回的文件就是目标矩形。稳妥的流程是先拿到显示器图像，再按相对坐标裁剪：

```rust
let monitor = monitors
    .into_iter()
    .nth(region.monitor)
    .context("显示器序号不存在")?;

let full = monitor
    .capture_image()
    .context("Wayland 截图失败")?;

let image = full
    .view(region.x, region.y, region.width, region.height)
    .to_image();
```

portal 可能显示系统权限对话框，这不是程序卡死。当前实现把 portal 作为普通单次截图的回退；滚动截图需要连续抓取多帧，因此在 Wayland 下更适合使用能够重复调用的 GNOME Shell 截图服务。一个每帧都要求用户确认的 portal 不适合滚动采集。

### Step 7：xcap 标注“部分支持”，为什么当前示例仍然支持 Wayland

[xcap 的官方状态表](https://github.com/nashaofu/xcap#implementation-status)给 Linux Wayland 的屏幕截图、窗口截图和录屏都标了 `⛔`。这里要先读准它的图例：`⛔` 不是“完全不可用”，而是“功能可用，但在一些特殊场景中没有完整支持”。

这两个结论并不矛盾：

| 讨论范围 | 结论 |
| --- | --- |
| xcap 面向所有 Linux Wayland 桌面给出的通用承诺 | 部分支持，不能保证所有合成器和所有截图类型 |
| 当前示例在 Ubuntu 22.04 GNOME Wayland 上的实测结果 | 显示器区域截图可用，使用可重复的 GNOME 截图服务时滚动截图也可用 |
| 只有每帧都弹出授权窗口的 portal 环境 | 可以作为单次截图回退，不适合连续滚动采集 |
| KDE、wlroots 等尚未逐一验证的环境 | 不把 GNOME 上的结果扩大成“所有 Wayland 都支持” |

当前示例固定使用已经验证过的版本：

```toml
xcap = "=0.4.0"
```

但实现并不是不分会话地调用一次 `capture_image()` 就结束，而是把 Wayland 支持收敛为几个可验证的步骤：

1. 读取 `XDG_SESSION_TYPE`，明确把 Wayland 与 X11 分流，避免在 Wayland 下误走根窗口截图。
2. 使用 `Monitor::all()` 枚举显示器，先检查区域没有超出目标显示器。
3. 调用 `monitor.capture_image()`。在 GNOME Wayland 下，底层优先使用 Shell 的区域截图服务，失败后才尝试标准 Screenshot Portal。
4. 将得到的显示器图像裁剪为调用者要求的 `x、y、width、height`，统一输出 `RgbaImage`。
5. 滚动截图创建一次 `ScrollSource`，保留选中的显示器并重复执行同一区域采集，让每一帧直接进入后面的重叠匹配。

核心分流代码很短：

```rust
pub fn capture_region(region: Region) -> Result<RgbaImage> {
    if is_wayland() {
        let monitor = selected_wayland_monitor(region.monitor)?;
        validate_region(
            monitor.width()?,
            monitor.height()?,
            region,
        )?;

        let full = monitor.capture_image()?;
        return Ok(full
            .view(region.x, region.y, region.width, region.height)
            .to_image());
    }

    let monitor = selected_x11_monitor(region.monitor)?;
    validate_region(monitor.width, monitor.height, region)?;
    capture_x11_absolute(
        monitor.x + i32::try_from(region.x)?,
        monitor.y + i32::try_from(region.y)?,
        region.width,
        region.height,
    )
}
```

因此，这里不是修改了 Wayland 的安全模型，也不是宣称补齐了 xcap 在所有桌面上的能力。我们做的是选定一个已经实测的 GNOME Wayland 路径，显式处理会话分流、区域校验、内存裁剪和连续帧采集，从“库的部分支持”得到一个范围清楚、能够实际运行的截图方案。

### Step 8：保存普通截图

两条采集路径都返回相同类型，保存逻辑只有一行：

```rust
let image = capture_region(region)?;
image.save("shot.png")?;
```

Linux 下最值得先验证的不是 PNG 编码，而是：

- X11 的绝对坐标是否包含显示器原点。
- Wayland portal 是否有当前桌面对应的 backend。
- 返回图像的像素尺寸是否和显示器缩放后的坐标一致。

## 2、如何实现滚动截图

### Step 1：先运行一次滚动截图

确认 `dev-shot.png` 覆盖目标正文后，执行：

```bash
make scroll
```

默认从第 0 块显示器截取 `1000 × 700` 区域，持续 15 秒，每 `600ms` 采样一次：

```bash
cargo run -- scroll \
  --monitor 0 --x 0 --y 0 --width 1000 --height 700 \
  --seconds 15 --interval-ms 600 \
  --fixed-top 0 --output dev-scroll.png
```

程序倒计时三秒后开始采集，时间到会自动停止并保存，不需要按 `Ctrl-C`。正常接收滚动内容时会看到：

```text
accepted frame 2: overlap=430px, appended=270px, score=0.0240
```

最终 `dev-scroll.png` 的高度应明显大于第一帧的 `700px`。如果没有增长，先确认捕获区域内确实在向下滚动，再检查固定页头、采样间隔和会话坐标。

### Step 2：为什么多数 Linux 截图工具没有滚动截图

主流 Linux 截图工具的公开功能通常集中在“全屏、显示器、窗口、矩形区域”：

- Flameshot 的官方功能和命令列出 GUI 选区、全屏与指定屏幕，没有把滚动截图列为正式能力。[Flameshot](https://github.com/flameshot-org/flameshot)
- KDE Spectacle 官方列出的也是桌面、显示器、窗口和矩形区域。[KDE Spectacle](https://apps.kde.org/spectacle/)
- ksnip 的截图类型矩阵覆盖 X11、Plasma Wayland、GNOME Wayland 和 portal，但同样没有滚动截图类型。[ksnip](https://github.com/ksnip/ksnip)
- Shutter 的“网站截图”可以生成网页图片，但它根据 URL 重新渲染网页，不等于捕获用户当前已经登录、已经展开或带有临时状态的浏览器页面，更不能覆盖文件管理器、终端输出和其他桌面应用。

这不是简单增加一个“长图”按钮就能解决的问题。普通截图只需要一帧；滚动截图至少还要处理：

1. 在同一坐标稳定取得连续帧。
2. 识别页面没有移动时产生的重复帧。
3. 从像素内容推导每次实际滚动距离。
4. 排除吸顶栏等始终不动的区域。
5. 在匹配不可信时拒绝坏帧，避免长图从中间断裂。
6. 兼容 X11 与 Wayland 不同的屏幕访问规则。

当前实现不要求目标程序提供网页 DOM，也不要求它支持“导出整页”。只要用户能够向下滚动，并且相邻画面保留一部分共同内容，浏览器、文档阅读器和普通桌面列表都可以使用同一套拼接算法。

### Step 3：为当前会话准备连续帧来源

X11 下每次调用 `GetImage` 即可，读取同一块根窗口区域：

```rust
let mut capture = || {
    capture_x11_absolute(
        absolute_x,
        absolute_y,
        width,
        height,
    )
};
```

Ubuntu 22.04 GNOME Wayland 可以重复调用同一显示器的区域截图：

```rust
let mut capture = || {
    let full = monitor.capture_image()?;
    Ok(full
        .view(region.x, region.y, region.width, region.height)
        .to_image())
};
```

两条路径都封装为 `ScrollSource::capture()`。后面的代码只接收 `RgbaImage`，不需要知道当前帧来自 XCB 还是 GNOME 桌面截图服务。

### Step 4：按固定间隔采样

Linux 桌面截图调用通常比 Windows GDI 慢，实机验证后的默认间隔是 `600 ms`：

```rust
let mut source = ScrollSource::new(region)?;
let (image, summary) = capture_scrolling(
    || source.capture(),
    Duration::from_secs(15),
    Duration::from_millis(600),
    fixed_top,
)?;
```

CLI 会把小于 `50ms` 的输入提升到 `50ms`，避免过高采样频率持续占用桌面截图服务。

采样期间由用户手动向下滚动。每次滚动距离必须小于动态区域高度，否则相邻帧完全没有共同内容，任何图像算法都无法恢复中间缺失部分。

### Step 5：过滤重复帧

先比较两帧同一位置的稀疏采样分数：

```rust
let dynamic_height = previous.height() - fixed_top;
let duplicate_score = sampled_score(
    previous,
    fixed_top,
    next,
    fixed_top,
    dynamic_height,
);

if duplicate_score <= 0.012 {
    // 没有可见滚动，忽略该帧
    continue;
}
```

这一步会过滤滚动停顿、页面到底和截图服务重复返回旧图像的情况，对应日志是：

```text
ignored frame: no visible movement
```

### Step 6：寻找上一帧底部与下一帧顶部的重叠

向下滚动后的几何关系是：

```text
previous 的最后 overlap 行
    ==
next 从 fixed_top 开始的 overlap 行
```

在 `24..=(dynamic_height - 8)` 范围搜索 `overlap`。每个候选都使用最多 64 × 48 个采样点计算平均 RGB 差异：

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

先按约 96 个候选做粗搜，再在最佳候选前后逐行精搜。最佳分数不超过 `0.055` 才接收：

```rust
let Some((overlap, score)) =
    find_downward_overlap(previous, next, fixed_top)
else {
    // 不可信的帧宁可丢弃
    continue;
};

if score > 0.055 {
    continue;
}
```

这个“拒绝坏帧”的规则比补空白或直接追加整帧重要。Linux 截图服务可能短暂返回旧帧，Wayland 截图也可能在授权、缩放变化或窗口动画时产生内容突变；错误帧一旦写进长图，后面的匹配会继续建立在错误基础上。

找不到分数不超过 `0.055` 的候选时，程序会输出：

```text
ignored frame: no trustworthy downward overlap
```

### Step 7：处理固定页头并计算新增高度

如果顶部有吸顶栏，传入其实际像素高度 `fixed_top`，匹配时从它的下方开始。当前帧真正需要追加的部分是：

```text
crop_top      = fixed_top + overlap
append_height = frame_height - crop_top
movement      = dynamic_height - overlap
```

`fixed_top` 太大时会导致动态区域不足。至少要留下：

```text
24 像素最小重叠 + 8 像素最小移动
```

可以直接覆盖 Makefile 默认值：

```bash
make scroll FIXED_TOP=64 INTERVAL_MS=400 SECONDS=10
```

### Step 8：结束后一次性拼接

先记录每个接收帧及其 `crop_top`，结束时计算长图总高度：

```rust
let total_height = frames.iter().try_fold(0u32, |sum, frame| {
    sum.checked_add(frame.image.height() - frame.crop_top)
})?;

let mut output = RgbaImage::new(first.width(), total_height);
let mut output_y = 0;

for frame in frames {
    let height = frame.image.height() - frame.crop_top;
    let visible = frame.image
        .view(0, frame.crop_top, frame.image.width(), height)
        .to_image();
    image::imageops::replace(
        &mut output,
        &visible,
        0,
        i64::from(output_y),
    );
    output_y += height;
}
```

调试时先观察每一帧的 `overlap`、`appended` 和 `score`。大量重复帧说明间隔太短或页面没有移动；大量无匹配帧通常说明滚动太快、动态内容过多，或 Wayland 返回图像的坐标与裁剪参数没有处在同一像素尺度。

采集时间到后会输出最终摘要：

```text
saved dev-scroll.png: accepted=8, rejected=5, size=1000x2380
```

测试结束后运行：

```bash
make clean
```

它会删除 Cargo 构建产物、`dev-shot.png` 和 `dev-scroll.png`。

完整可运行示例：[Linux Screenshot Demo](https://github.com/wuliang142857/crossplatform-screenshot-demo/tree/main/linux)
