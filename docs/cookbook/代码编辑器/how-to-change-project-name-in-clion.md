# 在CLion中如何修改项目名称

[CLion](https://www.jetbrains.com/clion/)是[jetbrains](https://www.jetbrains.com/)退出的非常优秀的跨平台C/C++ IDE。最近我在使用过程中遇到一个问题，想修改一下项目名，发现还是“潜规则”的。

总结一下步骤：

STEP 1：在CLion中重命令项目名：

![Screenshot2021-08-12 09.41.14.png](https://tva1.sinaimg.cn/large/008jQjtOly1gtdrfc9pmbj317611sann.jpg)

STEP 2：修改CMakeLists.txt中的名称

![Screenshot2021-08-12 09.44.40.png](https://tva1.sinaimg.cn/large/008jQjtOly1gtdrgoyvh5j30pw01umy6.jpg)

STEP 3：修改`.name`文件

进入项目目录下的`.idea`目录，里面有一个名为`.name`文件，修改这个内容为新项目名

## 参考：

- [stackoverflow上的回答](https://stackoverflow.com/questions/33066772/in-clion-how-can-i-rename-a-project)