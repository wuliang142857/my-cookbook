---
icon: cmake
---

# 如何在Linux下使用osxcross交叉编译Mac程序

[osxcross](https://github.com/tpoechtrager/osxcross)是一款为Linux提供的针对MacOS的交叉工具链，支持x86、x86_64、arm、arm64等多种输出架构，非常方便。

## 安装osxcross

### 安装基础工具

```bash
sudo apt-get update
sudo apt-get install clang llvm libxml2-dev uuid-dev libssl-dev bash patch make tar xz-utils bzip2 gzip sed cpio unzip rsync git libbz2-dev
```

### clone osxcross代码

```bash
git clone https://github.com/tpoechtrager/osxcross.git
cd osxcross
```

### 下载MacOS SDK

我们需要一个合适的MacOS SDK，这两个仓库都有下载：

- [https://github.com/phracker/MacOSX-SDKs](https://github.com/phracker/MacOSX-SDKs)
- [https://github.com/joseluisq/macosx-sdks](https://github.com/joseluisq/macosx-sdks)

我下载的是`MacOSX12.0.sdk.tar.xz`，把这个文件扔到`tarballs`目录下。

### 编译osxcross

在代码目录下运行`./build.sh`即可，需要等待一会：

```bash
TARGET_DIR=/opt/cross-tools/osxcross ./build.sh
```

如果编译没有问题的话，可以类似设置一下环境变量：

```bash
export PATH=/opt/cross-tools/osxcross/bin:$PATH
```

### 测试

可以随便写一个hello world，然后使用 `target/bin` 目录中的 `o64-clang` 和 `o64-clang++`来编译一下试试。

## 和vcpkg如何结合使用

因为我的代码都是使用[vcpkg](https://github.com/microsoft/vcpkg)来安装第三方包的，目前vcpkg没有针对osxcross的triplet，因此我们可以添加一下。

在`vcpkg/triplets/`目录下，分别添加`arm64-osx-osxcross.cmake`和`x64-osx-osxcross.cmake`两个文件，内容分别是：

```cmake
# arm64-osx-osxcross.cmake
set(VCPKG_TARGET_ARCHITECTURE arm64)
set(VCPKG_CMAKE_SYSTEM_NAME Darwin)
set(VCPKG_CRT_LINKAGE dynamic)
set(VCPKG_LIBRARY_LINKAGE static)

set(ENV{OSXCROSS_HOST} "arm64-apple-darwin21.1")
set(ENV{OSXCROSS_SDK} "MacOSX12.0.sdk")
set(ENV{OSXCROSS_TARGET} "darwin21.1")

# 寻找编译器的完整路径
find_program(ARM64_APPLE_DARWIN_CC arm64-apple-darwin21.1-cc)

if(NOT ARM64_APPLE_DARWIN_CC)
  message(FATAL_ERROR "无法找到 arm64-apple-darwin21.1-cc 编译器")
endif()

# 从找到的编译器路径中提取目录
get_filename_component(OSXCROSS_TARGET_BIN_DIR "${ARM64_APPLE_DARWIN_CC}" DIRECTORY)
# 设置 OSXCROSS_TARGET_DIR
# 假设 toolchain.cmake 在编译器目录的上一级目录中
set(OSXCROSS_TARGET_DIR "${OSXCROSS_TARGET_BIN_DIR}/..")

# 环境变量设置
set(ENV{OSXCROSS_TARGET_DIR} "${OSXCROSS_TARGET_DIR}")

# 设置 VCPKG_CHAINLOAD_TOOLCHAIN_FILE
set(VCPKG_CHAINLOAD_TOOLCHAIN_FILE "${OSXCROSS_TARGET_DIR}/toolchain.cmake")
```

```cmake
# x64-osx-osxcross.cmake
# 寻找编译器的完整路径
find_program(X86_64_APPLE_DARWIN_CC x86_64-apple-darwin21.1-cc)

if(NOT X86_64_APPLE_DARWIN_CC)
  message(FATAL_ERROR "无法找到 x86_64-apple-darwin21.1-cc 编译器")
endif()

# 从找到的编译器路径中提取目录
get_filename_component(OSXCROSS_TARGET_BIN_DIR "${X86_64_APPLE_DARWIN_CC}" DIRECTORY)

# 基于编译器路径设置 OSXCROSS_TARGET_DIR
set(OSXCROSS_TARGET_DIR "${OSXCROSS_TARGET_BIN_DIR}/..")

# 设置架构和系统信息
set(VCPKG_TARGET_ARCHITECTURE x64)
set(VCPKG_CMAKE_SYSTEM_NAME Darwin)
set(VCPKG_CRT_LINKAGE dynamic)
set(VCPKG_LIBRARY_LINKAGE static)
set(VCPKG_CMAKE_SYSTEM_NAME Darwin)
set(VCPKG_OSX_ARCHITECTURES x86_64)

# 设置工具链文件路径
set(VCPKG_CHAINLOAD_TOOLCHAIN_FILE "${OSXCROSS_TARGET_DIR}/toolchain.cmake")

# 环境变量设置
set(ENV{OSXCROSS_HOST} "x86_64-apple-darwin21.1")
set(ENV{OSXCROSS_SDK} "MacOSX12.0.sdk")
set(ENV{OSXCROSS_TARGET} "darwin21.1")
set(ENV{OSXCROSS_TARGET_DIR} "${OSXCROSS_TARGET_DIR}")
```

然后就可以使用类似`vcpkg install pystring:arm64-osx-osxcross`这样来安装依赖包了。

## 如何和cmake结合

类似如此，指定编译器等参数：

```bash
cmake \
	-DVCPKG_TARGET_TRIPLET=x64-osx-osxcross \
	-DCMAKE_SYSTEM_NAME=Darwin \
	-DCMAKE_OSX_ARCHITECTURES=x86_64 \
	-DCMAKE_C_COMPILER=x86_64-apple-darwin21.1-cc \
	-DCMAKE_CXX_COMPILER=x86_64-apple-darwin21.1-c++ \
	-G "Unix Makefiles" \
	-S $(pwd) \
	-B $(pwd)/build
```

