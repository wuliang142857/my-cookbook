---
title: "macOS 截图与滚动长截图：从 CoreGraphics 采集到重叠拼接"
description: "Step by step 介绍 macOS 区域截图、Retina 像素处理，以及经过实际页面验证的相邻帧重叠滚动长截图。"
---

# macOS 截图与滚动长截图

我们想在 macOS 上实现两个直接可见的结果：运行一次命令得到当前屏幕区域的 PNG，再运行一次命令，在用户向下滚动页面时得到一张明显高于屏幕的长图。下面每一部分都先运行示例、确认输出，再逐步解释参数和代码。

## 1、如何实现截图

### Step 1：先运行一次普通截图

在 macOS 目录执行：

```bash
make dev
```

程序会截取屏幕左上角 `1000 × 700` 的逻辑区域，保存为 `dev-shot.png`。在 2 倍 Retina 屏幕上，图片实际尺寸是 `2000 × 1400` 像素。看到这张图片后，我们就能明确后面几个参数的含义：它们描述的正是“从屏幕哪里开始、截取多大范围”。

完整等价命令是：

```bash
cargo run -- shot \
  --x 0 --y 0 --width 1000 --height 700 \
  --output dev-shot.png
```

### Step 2：定义截图参数

最小实现只需要五个参数：

| 参数 | 含义 |
| --- | --- |
| `x`、`y` | 截图区域左上角的全局屏幕坐标 |
| `width`、`height` | 截图区域的逻辑宽高 |
| `output` | PNG 输出文件 |

多显示器可能位于主显示器左侧或上方，因此 `x`、`y` 必须使用有符号整数。不要把它们限制为大于等于零。

### Step 3：检查屏幕录制权限

macOS 在读取屏幕像素前会检查 Screen Recording 权限。第一次运行时，请求权限后要让用户到系统设置中授权，然后重新启动程序。

```rust
use anyhow::{Result, bail};
use objc2_core_graphics::{
    CGPreflightScreenCaptureAccess,
    CGRequestScreenCaptureAccess,
};

fn ensure_permission() -> Result<()> {
    if CGPreflightScreenCaptureAccess() {
        return Ok(());
    }

    let _ = CGRequestScreenCaptureAccess();
    bail!("请授予屏幕录制权限，然后重新运行程序")
}
```

权限检查要放在第一次截图之前，而不是等捕获返回空图后再猜测原因。

### Step 4：用 CoreGraphics 抓取矩形区域

把命令行参数转换为 `CGRect`，再调用同步区域截图 API：

```rust
use anyhow::{Context, Result};
use objc2_core_foundation::{CFRetained, CGPoint, CGRect, CGSize};
use objc2_core_graphics::{
    CGImage,
    CGWindowImageOption,
    CGWindowListCreateImage,
    CGWindowListOption,
};

fn capture_cgimage(
    x: i32,
    y: i32,
    width: u32,
    height: u32,
) -> Result<CFRetained<CGImage>> {
    let rect = CGRect {
        origin: CGPoint {
            x: f64::from(x),
            y: f64::from(y),
        },
        size: CGSize {
            width: f64::from(width),
            height: f64::from(height),
        },
    };

    CGWindowListCreateImage(
        rect,
        CGWindowListOption::OptionOnScreenOnly,
        0,
        CGWindowImageOption::BestResolution,
    )
    .context("指定区域没有可捕获的屏幕图像")
}
```

这里的两个关键选项是：

- `OptionOnScreenOnly`：只合成当前在屏幕上的窗口。
- `BestResolution`：在 Retina 显示器上保留实际像素分辨率。

这套 CoreGraphics API 已被 macOS 标记为 deprecated，但它非常适合展示同步区域截图的核心过程。新项目若需要窗口级选择、音视频流或更完整的未来兼容性，可以把采集层换成 ScreenCaptureKit；后面的像素转换和滚动拼接逻辑不需要改变。

### Step 5：正确处理 Retina 和行跨度

输入的 `CGRect` 是逻辑坐标，返回的 `CGImage` 是实际像素。例如当前示例默认截取 `1000 × 700` 的逻辑区域，在 2 倍 Retina 屏幕上会得到 `2000 × 1400` 像素。

不能假设每行字节数一定等于 `width * 4`。CoreGraphics 可能给每一行增加对齐填充，所以必须按 `bytes_per_row` 逐行拷贝：

```rust
let pixel_width = CGImage::width(Some(&cg_image));
let pixel_height = CGImage::height(Some(&cg_image));
let bytes_per_row = CGImage::bytes_per_row(Some(&cg_image));

let provider = CGImage::data_provider(Some(&cg_image))
    .context("图像没有 data provider")?;
let data = CGDataProvider::data(Some(provider.as_ref()))
    .context("图像没有像素数据")?;
let source = data.to_vec();

let row_bytes = pixel_width * 4;
let mut rgba = Vec::with_capacity(row_bytes * pixel_height);
for row in source.chunks_exact(bytes_per_row).take(pixel_height) {
    rgba.extend_from_slice(&row[..row_bytes]);
}

for pixel in rgba.chunks_exact_mut(4) {
    pixel.swap(0, 2); // BGRA -> RGBA
    pixel[3] = 255;
}

let image = RgbaImage::from_raw(
    pixel_width as u32,
    pixel_height as u32,
    rgba,
)
.context("无法构造 RGBA 图像")?;
```

最后调用 `image.save("shot.png")` 即可得到普通截图。

## 2、如何实现滚动截图

### Step 1：先运行一次滚动截图

确认 `dev-shot.png` 覆盖了目标页面后，执行：

```bash
make scroll
```

当前经过 Google 搜索页验证的默认参数是：

```text
x=0
y=0
width=1000
height=700
seconds=15
interval_ms=120
fixed_top=370
```

程序先倒计时三秒，然后在 15 秒内连续采集。用户只需要把鼠标放在页面上并持续向下滚动；时间到后程序会自动拼接并生成 `dev-scroll.png`，不需要按 `Ctrl-C`。如果中途强制中断，最终拼接和保存可能尚未执行。

完整等价命令是：

```bash
cargo run -- scroll \
  --x 0 --y 0 --width 1000 --height 700 \
  --seconds 15 --interval-ms 120 \
  --fixed-top 370 --output dev-scroll.png
```

一张普通截图在 Retina 屏幕上高 `1400px`，所以成功的 `dev-scroll.png` 应明显高于 `1400px`。运行期间可以从日志直接观察拼接是否有效：

```text
accepted frame 2: overlap=830px, appended=200px, score=0.0180
```

`accepted` 表示接收了一帧，`appended` 表示这次给长图增加了多少像素。如果它长期停留在最小值 `8px` 附近，说明固定区域或捕获范围仍需调整。

### Step 2：固定捕获区域，让用户手动滚动

滚动截图不需要控制目标应用的滚轮。更稳定的办法是：

1. 记录一个固定的屏幕矩形。
2. 倒计时三秒，让用户把鼠标移到目标内容上。
3. 用户持续向下滚动。
4. 程序按固定间隔重复抓取同一个矩形。

```rust
let (image, summary) = capture_scrolling(
    || capture_region(x, y, width, height),
    Duration::from_secs(15),
    Duration::from_millis(120),
    fixed_top,
)?;
image.save("dev-scroll.png")?;
```

当前经过实际页面验证的采样间隔是 `120 ms`。间隔过短会产生较多重复帧，但重复帧可以被快速过滤；间隔过长则可能让两帧之间完全失去重叠。因此，相比冒险使用较长间隔，滚动截图更适合稍高频率采集，再由重复检测决定哪些帧需要保留。

15 秒从第一帧捕获完成后开始计算，三秒倒计时不包含在内。时间到后程序会自动停止、拼接并保存文件；如果中途按下 `Ctrl-C`，进程会在最终拼接前退出，因而不能保证生成完整的 `dev-scroll.png`。

### Step 3：先过滤没有移动的重复帧

对两帧动态内容区域做稀疏采样，计算 RGB 三通道的平均归一化差异：

```text
score = Σ |previous.rgb - next.rgb| / (采样通道数 × 255)
```

如果 `score <= 0.012`，认为页面没有产生可见移动，直接丢弃新帧，并输出：

```text
ignored frame: no visible movement
```

这不代表截图失败，只说明本次定时采样期间页面没有移动。稀疏采样不需要扫描每一个像素，最多取 64 列、48 行就足以完成第一道门控。

### Step 4：搜索相邻帧的纵向重叠

假设用户向下滚动，那么上一帧底部的一段内容，会出现在下一帧顶部。对每个候选重叠高度 `overlap`，比较这两个区域：

```text
上一帧：[height - overlap, height)
下一帧：[fixed_top, fixed_top + overlap)
```

核心搜索代码如下：

```rust
fn find_downward_overlap(
    previous: &RgbaImage,
    next: &RgbaImage,
    fixed_top: u32,
) -> Option<(u32, f64)> {
    let dynamic_height = next.height().checked_sub(fixed_top)?;
    let min_overlap = 24;
    let max_overlap = dynamic_height.checked_sub(8)?;
    let coarse_step = ((max_overlap - min_overlap) / 96).max(1);

    let mut best: Option<(u32, f64)> = None;
    let mut overlap = min_overlap;
    while overlap <= max_overlap {
        let score = sampled_score(
            previous,
            previous.height() - overlap,
            next,
            fixed_top,
            overlap,
        );
        if best.is_none_or(|(_, old)| score < old) {
            best = Some((overlap, score));
        }
        overlap += coarse_step;
    }

    let (coarse_overlap, _) = best?;
    let start = coarse_overlap.saturating_sub(coarse_step).max(min_overlap);
    let end = (coarse_overlap + coarse_step).min(max_overlap);
    for candidate in start..=end {
        let score = sampled_score(
            previous,
            previous.height() - candidate,
            next,
            fixed_top,
            candidate,
        );
        if best.is_none_or(|(_, old)| score < old) {
            best = Some((candidate, score));
        }
    }

    best.filter(|(_, score)| *score <= 0.055)
}
```

先粗搜、再在最佳点附近逐像素精搜，比遍历所有重叠高度快很多。这里还保留两个硬约束：

- 最少重叠 24 像素，避免很小的相似区域误匹配。
- 至少移动 8 像素，避免把轻微抖动当成一次滚动。

### Step 5：排除固定页头

网页或文档顶部常有吸顶导航栏。它在每一帧中的位置不变，如果参与匹配，算法很容易错误地认为两帧没有移动。

解决方法是提供 `fixed_top` 参数，单位是最终截图的实际像素：

```text
dynamic_height = frame_height - fixed_top
movement       = dynamic_height - overlap
crop_top       = fixed_top + overlap
```

Retina 屏幕上要特别注意：如果肉眼看到的吸顶栏是 32 个逻辑点，而截图是 2 倍分辨率，那么应传入 `--fixed-top 64`。

实际验证 Google 搜索页时，捕获区域从屏幕左上角 `x=0, y=0` 开始，里面同时包含 macOS 菜单栏、Chrome 标签栏、地址栏和 Google 固定搜索栏。这些固定区域在 `2000 × 1400` 的 Retina 截图中约占顶部 `370px`，因此示例把默认值设为：

```text
fixed_top = 370
```

如果错误地使用 `fixed_top=0`，固定区域会主导相似度，常见表现是：

```text
overlap=1392px, appended=8px
```

一张高 `1400px` 的图片每次只追加 `8px`，通常意味着算法把近似整帧误认为重叠区域，并不是真正有效的页面滚动。排除顶部固定区域后，`overlap` 应明显变小，`appended` 应接近这次滚动真正产生的新内容高度。

### Step 6：只追加下一帧中的新内容

第一帧完整写入输出。后续每一帧都裁掉固定页头和已经出现过的重叠部分：

```rust
let crop_top = fixed_top + overlap;
let visible_height = frame.height() - crop_top;
let visible = frame
    .view(0, crop_top, frame.width(), visible_height)
    .to_image();

image::imageops::replace(
    &mut output,
    &visible,
    0,
    i64::from(output_y),
);
output_y += visible_height;
```

如果找不到可信重叠，不要猜一个滚动距离，也不要直接追加整帧；当前帧会被丢弃，并输出：

```text
ignored frame: no trustworthy downward overlap
```

这条日志和“没有移动”含义相反：新旧帧明显不同，但最佳重叠分数超过了 `0.055`，无法证明它们是一次连续向下滚动。常见原因包括滚动过快、发生反向滚动、固定区域没有通过 `fixed_top` 排除，或者页面中存在大面积动画。

匹配始终以最后一张已接收帧为基准。如果一次滚动跨度过大导致拒帧，之后继续快速滚动会让当前画面离基准越来越远，从而连续拒绝。因此看到多次 `no trustworthy downward overlap` 时，应暂停并重新开始一次采集，同时缩短间隔或减小每次滚动幅度。

其他页面的固定区域不一定是 `370px`，可以在命令行覆盖：

```bash
make scroll FIXED_TOP=120 INTERVAL_MS=100 SECONDS=10
```

最终日志中的 `accepted` 是保留下来的帧数，`rejected` 是重复或无法可信匹配的帧数。如果输出只增加几十或一两百像素，应检查 `appended` 是否长期停留在最小值附近。

清理构建产物和两张开发截图：

```bash
make clean
```

若快速滚动经常被拒绝，应先缩短采样间隔、缩小每次滚动幅度或重新测量固定区域，而不是直接放宽 `0.055` 的匹配阈值。

完整可运行示例：[macOS Screenshot Demo](https://github.com/wuliang142857/crossplatform-screenshot-demo/tree/main/macos)
