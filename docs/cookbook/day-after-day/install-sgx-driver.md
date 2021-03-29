# 安装Intel SGX Driver

## 写到最前面

### 驱动地址

要使用[Intel SGX](https://software.intel.com/content/www/us/en/develop/topics/software-guard-extensions.html)，必须先安装驱动，驱动地址：[https://github.com/intel/linux-sgx-driver](https://github.com/intel/linux-sgx-driver)。

### 操作系统的要求

目前Intel官方启动的这个驱动，还并不支持所有的操作系统，[目前支持情况](https://github.com/intel/linux-sgx-driver#prerequisites)。

## 驱动安装步骤

### 安装系统内核头文件

````bash
sudo apt-get install linux-headers-$(uname -r)
````

### 编译驱动

````bash
# clone驱动代码
git clone https://github.com/intel/linux-sgx-driver.git
# 切换到最新的TAG，我这里是：sgx_driver_2.11
git checkout sgx_driver_2.11
# 编译
make
# 拷贝驱动文件
sudo mkdir -pv /lib/modules/$(uname -r)/kernel/drivers/intel/sgx
sudo cp -v isgx.ko /lib/modules/$(uname -r)/kernel/drivers/intel/sgx
sudo sh -c "cat /etc/modules | grep -Fxq isgx || echo isgx >> /etc/modules"
sudo /sbin/depmod
sudo /sbin/modprobe isgx
sudo /sbin/lsmod |grep isgx
````

## 我的运行环境

