---
icon: msys2
---

# 在Windows上使用MSYS2准备构建环境

## 一、背景

很多时候，习惯了Unix/Linux的工具链，因此在Windows上自然也复用这种方式，至少得是个GCC for Windows的方式。

其实GCC for Windows的方案也挺多的，比如：

- [Cygwin](https://www.cygwin.com/)：我最早用过的类似方案就是Cygwin，其实它最得挺不错的，但我感觉可移植性不够强，编译得到的文件跳出Cygwin运行时就往往不可用。
- [MinGW-w64](https://www.mingw-w64.org/)：这玩意就比较NB了，其实Cygwin、[git for windows](https://gitforwindows.org/)、以及[MSYS2](https://www.msys2.org/)等都基于它。其实[MinGW-w64](https://www.mingw-w64.org/)提供了一套完整的交叉工具链，MacOS、Linux上想交叉编译得到针对Windows的输出物，基本上首选都是[MinGW-w64](https://www.mingw-w64.org/)。

在尝试过市面上一些同类的产品后，我最终选择采用[MSYS2](https://www.msys2.org/)。相比其他工具，它包含一些比较好使的特性：

- 它使用pacman作为包管理工具，作者应该是深受[ArchLinux](https://archlinux.org/)的影响。
- 仓库源中的软件非常丰富，且比较完整。更新也挺及时的。
- 包含mingw32和mingw64，也就是说，它可以提供32位和64位两种构建环境。

## 二、安装和配置

## 2.1 下载

在 https://www.msys2.org/#installation 下载安装工具后，安装即可。

## 2.2 修改仓库镜像源地址

和大多数工具类似，官方提供仓库源由于在国外因此访问数据比较慢，因此可以修改为国内源。我就采用比较喜欢的中科大的源：

```bash
sed -i "s#mirror.msys2.org/#mirrors.ustc.edu.cn/msys2/#g" /etc/pacman.d/mirrorlist*
```

然后刷新缓存：

```bash
pacman -Syu 
```

## 2.2 安装一些基本的工具链

这里我也就是自己萝莉了一些常用的，肯定还需要更多：

```bash
pacman --needed -S git \
	base-devel \
	mingw-w64-x86_64-gcc \
	mingw-w64-x86_64-binutils \
	mingw-w64-x86_64-boost \
	mingw-w64-x86_64-cmake \
	mingw-w64-x86_64-diffutils \
	mingw-w64-x86_64-doxygen \
	mingw-w64-x86_64-gdb \
	mingw-w64-x86_64-make \
	mingw-w64-x86_64-ninja \
	mingw-w64-x86_64-pkgconf \
	mingw-w64-x86_64-python2 \
	mingw-w64-x86_64-tools-git \
	mingw-w64-x86_64-winpthreads-git \
	mingw-w64-x86_64-winstorecompat-git \
	procps \
	rsync \
	unzip
```

