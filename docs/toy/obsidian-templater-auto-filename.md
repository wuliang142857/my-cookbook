---
icon: obsidian
---

# Obsidian Templater 自动文件名配置

使用 Templater 插件实现新建笔记时自动按日期格式命名文件。

## 安装 Templater 插件

1. 在 Obsidian 中打开 **设置 → 第三方插件 → 浏览**
2. 搜索 **Templater** 并安装
3. 启用插件

## 创建模板文件

在 Vault 中创建模板目录和模板文件，例如 `模板/自动文件名.md`：

```javascript
<%*
const folder = tp.file.folder(true);
const baseName = tp.date.now("YYYYMMDD") + "-每日工作";
let fileName = baseName;
let counter = 1;

// Check if file exists, auto increment suffix if needed
while (await tp.file.exists(folder + "/" + fileName + ".md")) {
  fileName = baseName + "-" + counter;
  counter++;
}

await tp.file.rename(fileName);
%>
```

**说明：**
- `tp.file.folder(true)` - 获取当前文件的完整文件夹路径
- `tp.date.now("YYYYMMDD")` - 获取当前日期，格式为 `20260123`
- `tp.file.exists()` - 检查文件是否存在
- `tp.file.rename()` - 重命名当前文件
- 如果同名文件已存在，自动添加序号后缀：`20260123-每日工作-1.md`

## 配置 Templater

在 `.obsidian/plugins/templater-obsidian/data.json` 中配置：

```json
{
  "templates_folder": "模板",
  "trigger_on_file_creation": true,
  "enable_folder_templates": true,
  "folder_templates": [
    {
      "folder": "/",
      "template": "模板/自动文件名.md"
    }
  ]
}
```

**关键配置项：**

| 配置项 | 说明 |
|--------|------|
| `templates_folder` | 模板文件所在目录 |
| `trigger_on_file_creation` | 创建新文件时触发模板 |
| `enable_folder_templates` | 启用文件夹模板功能 |
| `folder_templates` | 为指定文件夹设置默认模板，`"/"` 表示所有文件夹 |

## 日期格式参考

Templater 使用 [Moment.js](https://momentjs.com/docs/#/displaying/format/) 日期格式：

| 格式 | 示例 | 说明 |
|------|------|------|
| `YYYY` | 2026 | 四位年份 |
| `MM` | 01 | 两位月份 |
| `DD` | 23 | 两位日期 |
| `HH` | 14 | 24小时制小时 |
| `mm` | 30 | 分钟 |
| `ss` | 45 | 秒 |
| `YYYYMMDD` | 20260123 | 年月日 |
| `YYYY-MM-DD` | 2026-01-23 | 带分隔符 |

## 常见问题

### 报错：Template parsing error

打开开发者工具查看详细错误：`Cmd + Option + I` (macOS)

常见原因：
- **Destination file already exists** - 目标文件已存在，使用上述带文件存在检查的模板可解决
- 模板语法错误 - 检查 `<%*` 和 `%>` 是否匹配

### 手动应用模板

如果自动触发不工作，可手动应用：
1. 新建笔记
2. `Cmd + P` → 输入 "Templater"
3. 选择 **Templater: Insert template**
4. 选择模板文件

## 参考链接

- [Templater 官方文档](https://silentvoid13.github.io/Templater/)
- [Templater GitHub](https://github.com/SilentVoid13/Templater)
