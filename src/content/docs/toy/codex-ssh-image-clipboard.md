---
title: "在 iTerm2 中将 macOS 图片剪贴板粘贴到远端 Codex"
description: "通过 XQuartz、SSH X11 转发和 LaunchAgent 剪贴板桥接，在 iTerm2 连接远端 Linux 时用 Ctrl-V 向 Codex CLI 粘贴本机图片。"
---

# 在 iTerm2 中将 macOS 图片剪贴板粘贴到远端 Codex

目标体验很简单：

```text
在 macOS 复制图片
        ↓
切回 iTerm2 中的 SSH 会话
        ↓
在远端 Codex CLI 按 Ctrl-V
        ↓
图片显示为 [Image #1]
```

问题在于，Codex CLI 运行在远端 Linux 上时，`Ctrl-V` 读取的是**远端进程可见的系统剪贴板**，而不是 iTerm2 所在 Mac 的剪贴板。仅仅开启 SSH X11 转发还不够：XQuartz 自带的 Pasteboard 代理通常只在 X11 应用重新获得焦点时同步剪贴板，所以同一条命令在 XQuartz 的 `xterm` 中有效，在原生 iTerm2 中却可能失败。

本文记录一个经过端到端验证的方案：使用一个用户级 LaunchAgent 持续监听 macOS Pasteboard，并将图片或文本同步到 XQuartz 的 X11 `CLIPBOARD`。配置完成后不再需要打开或聚焦 `xterm`，日常操作只剩下 `Ctrl-V`。

## 测试环境

| 组件 | 版本 |
| --- | --- |
| macOS | 15.7.7 |
| iTerm2 | 3.6.10 |
| XQuartz | 2.8.6 |
| 本机 xclip | 0.13 |
| 桥接器 xclip helper | 0.13-strict |
| 远端系统 | Ubuntu 22.04 |
| Codex CLI | 0.149.1 |

## 现象

在 iTerm2 中 SSH 到远端服务器，启动 Codex 后按 `Ctrl-V`：

```text
Failed to paste image: clipboard unavailable:
Unknown error while interacting with the clipboard:
X11 server connection timed out because it was unreachable
```

开启 X11 转发后，报错可能变成：

```text
Error: target image/png not available
```

此时常见的误判是 X11 转发仍未生效。但如果：

```bash
echo "$DISPLAY"
```

已经得到类似：

```text
localhost:10.0
```

并且远端存在 `xauth`，那么 SSH 转发本身通常已经正常。真正缺失的是 macOS Pasteboard 到 XQuartz `CLIPBOARD` 的自动同步。

## 根因

完整路径包含五层：

```text
macOS Pasteboard
    → XQuartz X11 CLIPBOARD
    → ssh -Y 转发
    → 远端 DISPLAY
    → Codex 的 Ctrl-V 图片读取
```

Codex 在 Linux 上通过系统剪贴板接口读取图片，最终依赖 X11 或 Wayland。SSH 不会自动把本机图片剪贴板上传给远端进程；`ssh -Y` 只是让远端 X11 客户端连接到本机的 XQuartz。

XQuartz 的 Pasteboard 代理能够在 macOS 和 X11 之间转换文本与图片，但它检测 macOS Pasteboard 变化的时机与 X11 激活事件相关。这解释了一个关键差异：

- 从 XQuartz `xterm` 运行 `ssh -Y`：切回 `xterm` 时 XQuartz 获得焦点，剪贴板随之同步。
- 从 iTerm2 运行 `ssh -Y`：iTerm2 是原生 macOS 应用，不会触发 XQuartz 的激活事件，X11 `CLIPBOARD` 可能继续保留旧内容。

因此，继续使用 iTerm2 且要求只按 `Ctrl-V`，需要一个独立于窗口焦点的剪贴板桥接器。

另外，不能直接把 Homebrew 的 `xclip 0.13` 当作桥接器 owner。Codex 0.149.1
使用的 `arboard 3.6.1` 会先请求文件列表，再请求 `image/png`；`xclip 0.13`
却会把当前数据返回给所有不支持的 target，并将属性类型标成原始 target。
当前 X11 剪贴板是文本时，这会触发：

```text
Unknown error while interacting with the clipboard:
incorrect type received from clipboard
```

图片足够大、进入 X11 的 INCR 分段传输后，错误的文件列表请求还会卡住
`xclip` owner。因此这两个现象分别与 target 类型和大数据传输有关，不能靠
压缩图片或延迟重试彻底解决。下文会构建一个只供桥接器使用的兼容版本，
让不支持的 target 按 ICCCM 要求返回失败。

## 基础配置

### 安装并配置 XQuartz

```bash
brew install --cask xquartz
open -a XQuartz
```

自定义桥接器会直接成为 X11 `CLIPBOARD` 的 owner，因此应关闭 XQuartz
自带的 Pasteboard 同步，避免两个同步器相互覆盖：

```bash
defaults write org.xquartz.X11 sync_pasteboard -bool false
```

也可以在 XQuartz 的“偏好设置 → 粘贴板”中取消“启用同步”。修改后退出并
重新打开 XQuartz。关闭该功能后，远端 X11 剪贴板不会反向写回 Mac；本文
需要的 Mac 到远端同步仍由桥接器负责。

重新打开后确认设置：

```bash
defaults read org.xquartz.X11 sync_pasteboard
```

期望输出为 `0`。

安装 XQuartz 后建议注销并重新登录 macOS，确保 SSH 能找到 `/opt/X11/bin/xauth`。

### 构建桥接器专用的 strict xclip

不要覆盖 Homebrew 管理的 `xclip`。从 xclip 0.13 的固定版本构建一个独立
helper，只修改不支持 target 的响应：

```bash
(
set -e
mkdir -p "$HOME/.local/bin"
strict_xclip_src="$(mktemp -d)"
cleanup_strict_xclip_src() {
    rm -rf -- "$strict_xclip_src"
}
trap cleanup_strict_xclip_src EXIT

git clone --depth 1 --branch 0.13 \
    https://github.com/astrand/xclip.git "$strict_xclip_src"

patch -l -d "$strict_xclip_src" -p1 <<'PATCH'
diff --git a/xclib.c b/xclib.c
index cf55f2e..6d2c698 100644
--- a/xclib.c
+++ b/xclib.c
@@ -373,6 +373,10 @@ xcin(Display * dpy,
                 (int) (sizeof(types) / sizeof(Atom))
         );
     }
+    else if (evt.xselectionrequest.target != target) {
+        /* ICCCM 2.2: reject conversion targets that we do not support. */
+        *pty = None;
+    }
     else if (len > chunk_size) {
         /* send INCR response */
         XChangeProperty(dpy, *win, *pty, inc, 32, PropModeReplace, 0, 0);
@@ -415,4 +419,8 @@ xcin(Display * dpy,
     if (evt.xselectionrequest.target == targets)
         return 0;
-
+
+    /* Unsupported targets are not successful paste operations. */
+    if (evt.xselectionrequest.target != target)
+        return 0;
+
     /* if len < chunk_size, then the data was sent all at
PATCH

clang -O2 \
    -I/opt/X11/include \
    -DPACKAGE_NAME='"xclip"' \
    -DPACKAGE_VERSION='"0.13-strict"' \
    "$strict_xclip_src/xclip.c" \
    "$strict_xclip_src/xclib.c" \
    "$strict_xclip_src/xcprint.c" \
    -L/opt/X11/lib -lX11 -lXmu \
    -o "$strict_xclip_src/codex-xclip-strict"

install -m 0755 "$strict_xclip_src/codex-xclip-strict" \
    "$HOME/.local/bin/codex-xclip-strict"
)
"$HOME/.local/bin/codex-xclip-strict" -version
```

期望版本为 `xclip version 0.13-strict`。编译需要 Xcode Command Line Tools；
如果 `clang` 不存在，先运行 `xcode-select --install`。

### 配置 SSH X11 转发

编辑本机 `~/.ssh/config`：

```text
Host gpu
    HostName your-server.example.com
    User root
    ForwardX11 yes
    ForwardX11Trusted yes
```

也可以临时使用：

```bash
ssh -Y gpu
```

远端需要启用 `X11Forwarding`，并安装 `xauth` 和用于验证的 `xclip`：

```bash
# Ubuntu / Debian
sudo apt-get install xauth xclip

sudo sshd -T | grep '^x11forwarding'
```

期望结果：

```text
x11forwarding yes
```

## 创建剪贴板桥接器

桥接器使用 `NSPasteboard.changeCount` 检测变化，只有剪贴板真正变化时才读取内容：

- 优先直接读取 Pasteboard 中的 PNG，其他图片再转换为 PNG，并写入 X11
  的 `image/png` target。
- 每 10ms 检查一次变化；如果 Pasteboard 已声明图片但数据暂时不可读，
  保留当前 X11 剪贴板并继续重试，不使用空文本覆盖图片。
- 图片和文本 owner 都以前台子进程运行；剪贴板变化时先终止旧 owner，再由
  strict helper 接管，避免残留旧图片，并能在 helper 异常退出后自动重试。
- 使用 SHA-256 避免重复写入相同内容。
- 动态读取 `launchctl getenv DISPLAY`，不固化 XQuartz 每次登录生成的 socket 地址。
- XQuartz 尚未运行时尝试在后台启动，并保留待同步内容继续重试。

创建源码目录：

```bash
mkdir -p "$HOME/.local/share/codex-x11-clipboard-bridge"
mkdir -p "$HOME/.local/bin"
```

将下面内容保存为：

```text
~/.local/share/codex-x11-clipboard-bridge/bridge.swift
```

```swift
import AppKit
import CryptoKit
import Foundation

private let xclipPath = FileManager.default.homeDirectoryForCurrentUser
    .appendingPathComponent(".local/bin/codex-xclip-strict")
    .path

private let pollInterval: TimeInterval = 0.01
private let retryInterval: TimeInterval = 2

struct ClipboardPayload {
    let target: String
    let data: Data
    let signature: String
}

private let timestampFormatter = ISO8601DateFormatter()

private func log(_ message: String) {
    let line = "\(timestampFormatter.string(from: Date())) \(message)\n"
    FileHandle.standardError.write(Data(line.utf8))
}

private func signature(kind: String, data: Data) -> String {
    let digest = SHA256.hash(data: data)
    return "\(kind):\(digest.map { String(format: "%02x", $0) }.joined())"
}

private func pngData(from pasteboard: NSPasteboard) -> Data? {
    if let data = pasteboard.data(forType: .png), !data.isEmpty {
        return data
    }

    guard
        let image = pasteboard
            .readObjects(forClasses: [NSImage.self], options: nil)?
            .first as? NSImage,
        let tiffData = image.tiffRepresentation,
        let bitmap = NSBitmapImageRep(data: tiffData)
    else {
        return nil
    }

    return bitmap.representation(using: .png, properties: [:])
}

private func readPayload(from pasteboard: NSPasteboard) -> ClipboardPayload? {
    let imageIsAdvertised = pasteboard.availableType(from: [.png, .tiff]) != nil
        || pasteboard.canReadObject(forClasses: [NSImage.self], options: nil)

    if let data = pngData(from: pasteboard) {
        return ClipboardPayload(
            target: "image/png",
            data: data,
            signature: signature(kind: "image/png", data: data)
        )
    }

    guard !imageIsAdvertised else {
        return nil
    }

    let text = pasteboard.string(forType: .string) ?? ""
    let data = Data(text.utf8)
    return ClipboardPayload(
        target: "UTF8_STRING",
        data: data,
        signature: signature(kind: "UTF8_STRING", data: data)
    )
}

private func commandOutput(_ executable: String, _ arguments: [String]) -> String? {
    let process = Process()
    let output = Pipe()

    process.executableURL = URL(fileURLWithPath: executable)
    process.arguments = arguments
    process.standardOutput = output
    process.standardError = FileHandle.nullDevice

    do {
        try process.run()
        process.waitUntilExit()
    } catch {
        return nil
    }

    guard process.terminationStatus == 0 else {
        return nil
    }

    let data = output.fileHandleForReading.readDataToEndOfFile()
    return String(data: data, encoding: .utf8)?
        .trimmingCharacters(in: .whitespacesAndNewlines)
}

private func currentDisplay() -> String? {
    guard
        let display = commandOutput("/bin/launchctl", ["getenv", "DISPLAY"]),
        !display.isEmpty
    else {
        return nil
    }

    return display
}

private func startXQuartz() {
    let process = Process()
    process.executableURL = URL(fileURLWithPath: "/usr/bin/open")
    process.arguments = ["-g", "-j", "-a", "XQuartz"]
    process.standardOutput = FileHandle.nullDevice
    process.standardError = FileHandle.nullDevice
    try? process.run()
}

private func x11Targets(display: String) -> Set<String>? {
    let process = Process()
    let output = Pipe()
    var environment = ProcessInfo.processInfo.environment
    environment["DISPLAY"] = display

    process.executableURL = URL(fileURLWithPath: xclipPath)
    process.arguments = [
        "-selection", "clipboard",
        "-target", "TARGETS",
        "-out",
    ]
    process.environment = environment
    process.standardOutput = output
    process.standardError = FileHandle.nullDevice

    do {
        try process.run()
        process.waitUntilExit()
    } catch {
        return nil
    }

    guard process.terminationStatus == 0 else {
        return nil
    }

    let data = output.fileHandleForReading.readDataToEndOfFile()
    guard let targets = String(data: data, encoding: .utf8) else {
        return nil
    }

    return Set(targets.split(whereSeparator: \Character.isWhitespace).map(String.init))
}

private func stopOwner(_ process: Process?) {
    guard let process, process.isRunning else {
        return
    }

    process.terminate()
    process.waitUntilExit()
}

private func startOwner(_ payload: ClipboardPayload, display: String) -> Process? {
    let process = Process()
    let input = Pipe()
    var environment = ProcessInfo.processInfo.environment
    environment["DISPLAY"] = display

    process.executableURL = URL(fileURLWithPath: xclipPath)
    process.arguments = [
        "-quiet",
        "-selection", "clipboard",
        "-target", payload.target,
        "-in",
    ]
    process.environment = environment
    process.standardInput = input
    process.standardOutput = FileHandle.nullDevice
    process.standardError = FileHandle.nullDevice

    do {
        try process.run()
        input.fileHandleForWriting.write(payload.data)
        try input.fileHandleForWriting.close()
    } catch {
        stopOwner(process)
        log("sync failed: \(error)")
        return nil
    }

    for _ in 0..<20 {
        if !process.isRunning {
            return nil
        }
        if x11Targets(display: display)?.contains(payload.target) == true {
            return process
        }
        Thread.sleep(forTimeInterval: 0.005)
    }

    stopOwner(process)
    return nil
}

private func sync(
    _ payload: ClipboardPayload,
    display: String,
    ownerProcess: inout Process?
) -> Bool {
    stopOwner(ownerProcess)
    ownerProcess = nil

    guard let process = startOwner(payload, display: display) else {
        return false
    }
    ownerProcess = process
    return true
}

guard FileManager.default.isExecutableFile(atPath: xclipPath) else {
    log("strict xclip helper is missing: \(xclipPath)")
    exit(1)
}

let pasteboard = NSPasteboard.general
var observedChangeCount = -1
var pendingPayload: ClipboardPayload?
var lastSyncedSignature: String?
var ownerProcess: Process?
var nextRetryAt = Date.distantPast
var lastXQuartzStartAttempt = Date.distantPast

log("bridge started")

while true {
    autoreleasepool {
        if let process = ownerProcess, !process.isRunning {
            ownerProcess = nil
            lastSyncedSignature = nil
            observedChangeCount = -1
        }

        let changeCount = pasteboard.changeCount
        if changeCount != observedChangeCount {
            if let payload = readPayload(from: pasteboard) {
                observedChangeCount = changeCount
                pendingPayload = payload.signature == lastSyncedSignature
                    ? nil
                    : payload
                nextRetryAt = Date.distantPast
            } else {
                pendingPayload = nil
            }
        }

        let now = Date()
        if let payload = pendingPayload, now >= nextRetryAt {
            if let display = currentDisplay() {
                if sync(
                    payload,
                    display: display,
                    ownerProcess: &ownerProcess
                ) {
                    lastSyncedSignature = payload.signature
                    pendingPayload = nil
                } else {
                    nextRetryAt = now.addingTimeInterval(retryInterval)
                }
            } else {
                if now.timeIntervalSince(lastXQuartzStartAttempt) >= 10 {
                    log("XQuartz DISPLAY unavailable; starting XQuartz")
                    startXQuartz()
                    lastXQuartzStartAttempt = now
                }
                nextRetryAt = now.addingTimeInterval(retryInterval)
            }
        }
    }

    Thread.sleep(forTimeInterval: pollInterval)
}
```

编译：

```bash
swiftc -warnings-as-errors -O \
    "$HOME/.local/share/codex-x11-clipboard-bridge/bridge.swift" \
    -o "$HOME/.local/bin/codex-x11-clipboard-bridge"
```

## 添加 LaunchAgent

创建：

```text
~/Library/LaunchAgents/com.local.codex-clipboard-x11-bridge.plist
```

`launchd` 不会在 plist 的字符串中展开 `$HOME`，因此下面的 `YOUR_HOME` 必须替换成真实绝对路径，例如 `/Users/alice`。

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.local.codex-clipboard-x11-bridge</string>

    <key>ProgramArguments</key>
    <array>
        <string>YOUR_HOME/.local/bin/codex-x11-clipboard-bridge</string>
    </array>

    <key>RunAtLoad</key>
    <true/>

    <key>KeepAlive</key>
    <true/>

    <key>ProcessType</key>
    <string>Background</string>

    <key>ThrottleInterval</key>
    <integer>10</integer>

    <key>StandardErrorPath</key>
    <string>YOUR_HOME/Library/Logs/codex-x11-clipboard-bridge.log</string>

    <key>StandardOutPath</key>
    <string>YOUR_HOME/Library/Logs/codex-x11-clipboard-bridge.log</string>
</dict>
</plist>
```

校验并加载：

```bash
plutil -lint \
    "$HOME/Library/LaunchAgents/com.local.codex-clipboard-x11-bridge.plist"

launchctl bootstrap "gui/$(id -u)" \
    "$HOME/Library/LaunchAgents/com.local.codex-clipboard-x11-bridge.plist"

launchctl enable \
    "gui/$(id -u)/com.local.codex-clipboard-x11-bridge"

launchctl kickstart -k \
    "gui/$(id -u)/com.local.codex-clipboard-x11-bridge"
```

查看运行状态：

```bash
launchctl print \
    "gui/$(id -u)/com.local.codex-clipboard-x11-bridge" |
    grep -E 'state =|pid =|runs ='
```

正常结果包含：

```text
state = running
```

日志只记录启动和错误，不记录剪贴板正文：

```bash
tail -f "$HOME/Library/Logs/codex-x11-clipboard-bridge.log"
```

## 端到端验证

先确认 macOS 剪贴板中确实是图片。截图到剪贴板必须包含 `Control`：

```text
Control + Shift + Command + 4
```

本机检查：

```bash
osascript -e 'clipboard info'
```

输出应包含 `TIFF picture`、`PNGf` 等图片类型，而不应只有 `utf8` 和 `string`。

不要打开或聚焦 `xterm`，直接从 iTerm2 连接：

```bash
ssh -Y gpu
```

远端检查：

```bash
echo "$DISPLAY"
xclip -selection clipboard -t image/png -o > /tmp/clipboard-test.png
file /tmp/clipboard-test.png
```

期望结果类似：

```text
/tmp/clipboard-test.png: PNG image data, 990 x 744, 8-bit/color RGBA
```

最后启动 Codex：

```bash
codex
```

按 `Ctrl-V` 后，输入框应出现：

```text
[Image #1]
```

如果出现下面的错误：

```text
Failed to paste image: no image on clipboard: The clipboard contents were not
available in the requested format or the clipboard is empty.
```

先在同一 `DISPLAY` 的远端 shell 中检查 X11 当前公开的 target：

```bash
xclip -selection clipboard -target TARGETS -out
```

复制图片后结果应包含 `image/png`。如果持续只有 `UTF8_STRING`，用
`osascript -e 'clipboard info'` 确认 Mac 剪贴板是否仍有图片，再检查
LaunchAgent 日志；如果已经有 `image/png`，使用前面的
`/tmp/clipboard-test.png` 命令检查图片是否能够完整读出。

如果再次看到 `incorrect type received from clipboard`，说明当前 owner 仍是
未修补的 `xclip`，而不是 strict helper。检查并重启：

```bash
"$HOME/.local/bin/codex-xclip-strict" -version

bridge_pid="$(launchctl print \
    "gui/$(id -u)/com.local.codex-clipboard-x11-bridge" |
    awk '/pid =/ { print $3; exit }')"
pgrep -P "$bridge_pid" -fl codex-xclip-strict

launchctl kickstart -k \
    "gui/$(id -u)/com.local.codex-clipboard-x11-bridge"
```

版本应为 `0.13-strict`，并且桥接器应只有一个对应的 owner 子进程。无需通过
压缩图片规避错误；strict helper 已同时处理不支持的 target 和大图 INCR
传输。

## tmux 的额外注意事项

`DISPLAY` 是进程启动时继承的环境变量。已经运行的 Codex 或已经存在的 tmux pane 不会自动获得新 SSH 会话中的 `DISPLAY`。

推荐顺序：

```bash
ssh -Y gpu

# 在带有正确 DISPLAY 的 SSH 会话中再进入 tmux
tmux attach

# 新建窗口后重新启动或恢复 Codex
```

如果 Codex 进程是在 X11 转发配置之前启动的，必须重新启动该进程；剪贴板桥接器无法修改既有进程的环境。

## 服务管理与卸载

重启桥接器：

```bash
launchctl kickstart -k \
    "gui/$(id -u)/com.local.codex-clipboard-x11-bridge"
```

停止并卸载：

```bash
launchctl bootout \
    "gui/$(id -u)/com.local.codex-clipboard-x11-bridge"
```

卸载后再按需删除二进制、源码和 plist。

## 安全边界

`ssh -Y` 是可信 X11 转发。远端 X11 客户端能够访问本机 XQuartz 暴露的资源，其中包括同步后的剪贴板内容。因此：

- 只对可信服务器设置 `ForwardX11Trusted yes`。
- 不要对通配的 `Host *` 全局启用可信 X11 转发。
- 不使用时可以停止 LaunchAgent 或退出 XQuartz。
- 桥接器本身只写入本机 X11 `CLIPBOARD`，不会主动建立网络连接；真正跨机器的数据通道仍是 SSH X11 转发。

## 参考

- [Codex Image inputs](https://learn.chatgpt.com/docs/image-inputs)
- [Codex CLI 图片剪贴板实现](https://github.com/openai/codex/blob/rust-v0.149.1/codex-rs/tui/src/clipboard_paste.rs)
- [Codex CLI Ctrl-V 快捷键](https://github.com/openai/codex/blob/rust-v0.149.1/codex-rs/tui/src/chatwidget/interaction.rs)
- [arboard 3.6.1 X11 剪贴板实现](https://github.com/1Password/arboard/blob/v3.6.1/src/platform/linux/x11.rs)
- [XQuartz Pasteboard 代理实现](https://github.com/XQuartz/xorg-server/blob/master/hw/xquartz/pbproxy/x-selection.m)
- [xclip](https://github.com/astrand/xclip)
