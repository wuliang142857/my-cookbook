---
icon: picture
---

# ImageMagick中的convert命令使用汇总

## 将png转换成jpg

```bash
convert input.png -quality 90 -background white -alpha remove -alpha off output.jpg
```

参数说明：

- `-quality 90`：将JPG的质量设置为90%，这个值可以从1（最差质量，最小文件）到100（最佳质量，最大文件）范围选择
- `-background white`：设置背景颜色为白色。
- `-alpha remove`：移除图片的alpha通道（透明度），使透明部分变为之前通过`-background`指定的颜色。
- `-alpha off`：确保在处理后的图片中完全关闭alpha通道。

