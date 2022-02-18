---
icon: git
---


# git status中文乱码问题解决

当使用`git status`时，发现中文显示的是乱码：

![Screenshot2022-02-09-14](https://cdn.jsdelivr.net/gh/wuliang142857/pictures-hosting@main/20220209/Screenshot2022-02-09-14.2up54u4kcfu0.png)

原因：

在默认设置下，中文文件名在工作区状态输出，中文名不能正确显示，而是显示为八进制的字符编码。

解决办法：

````bash
git config --global core.quotepath false
````

![Screenshot2022-02-09-14](https://cdn.jsdelivr.net/gh/wuliang142857/pictures-hosting@main/20220209/Screenshot2022-02-09-14.606ewqtvu4o0.png)