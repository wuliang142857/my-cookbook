# 在ubuntu18.04上安装Intel SGX SDK

## 写到最前面

在[Intel SGX驱动](https://github.com/intel/linux-sgx-driver)安装完成后，下面就需要安装SDK：[intel/linux-sgx](https://github.com/intel/linux-sgx)。

和驱动一样，目前，目前Intel的SDK也只能支持少部分的操作系统版本：

> - Ubuntu* 16.04 LTS Desktop 64bits
> - Ubuntu* 16.04 LTS Server 64bits
> - Ubuntu* 18.04 LTS Desktop 64bits
> - Ubuntu* 18.04 LTS Server 64bits
> - Red Hat Enterprise Linux Server release 7.6 64bits
> - Red Hat Enterprise Linux Server release 8.2 64bits
> - CentOS 8.1 64bits
> - Fedora 31 Server 64bits
> - SUSE Linux Enterprise Server 15 64bits

在这里，我依旧使用的是`Ubuntu 18.04.5 LTS`。

## 安装依赖

````bash
sudo apt-get install build-essential ocaml automake autoconf libtool wget python libssl-dev git cmake perl libssl-dev libcurl4-openssl-dev protobuf-compiler libprotobuf-dev debhelper cmake reprepro unzip
````

## 编译&安装

### clone代码

````bash
git clone https://github.com/intel/linux-sgx.git
# 切换到最新分支
git checkout sgx_2.11
````

### 编译&安装SDK

````bash
# 下载依赖
make preparation
# 安装一些优化后的编译工具
sudo cp external/toolset/ubuntu18.04/{as,ld,ld.gold,objdump} /usr/local/bin
````

::: tip

在`make preparation`时，它会去调用另外一个脚本：`download_prebuilt.sh`去下载一些优化后的编译工具：`as,ld,ld.gold,objdump`。这些工具命令本身Linux也有提供，但Intel应该是在原本的命令中做了扩展，并且这部分源码貌似也没有开源，只能预先编译好的二进制文件提供下载：[intel-software-guard-extensions/downloads](https://01.org/intel-software-guard-extensions/downloads)，当然可能也是因为这个原因，所以目前Intel SGX并不能支持所有的操作系统。

:::

````bash
# 先编译SDK
make sdk
# 再编译出安装包
make sdk_install_pkg
# 执行安装
sudo ./linux/installer/bin/sgx_linux_x64_sdk_*.bin
````

::: tip

在执行安装时，会提示指定安装路径，可以自行选择，比如`/opt/intel`之类的自定义目录。

:::

安装完成后，需要`source`一下环境变量以便生效：

````bash
source /opt/intel/sgxsdk/environment
````

## 编译&安装PSW

在安装完SDK后，还需要安装PSW。

````bash
make clean
make psw
make psw_install_pkg
# 安装
sudo ./linux/installer/bin/sgx_linux_x64_psw_*.bin
````

### 启动服务

````bash
sudo systemctl enable aesmd
sudo systemctl restart aesmd
sudo systemctl status aesmd
````

### 验证环境

使用示例程序来验证一下

````bash
cd SampleCode/SampleEnclave
make
./app
````

如果看到类似的信息，说明启动成功了：

````
Checksum(0x0x7ffe295733c0, 100) = 0xfffd4143
Info: executing thread synchronization, please wait...
Info: SampleEnclave successfully returned.
Enter a character before exit ...
````

