---
icon: intel
---

# 如何识别CPU是否支持SGX特性

在[ayeks/SGX-hardware](https://github.com/ayeks/SGX-hardware)中提供了一个测试程序，可以帮助我们来判断自己的CPU是否支持[SGX](https://software.intel.com/content/www/us/en/develop/topics/software-guard-extensions.html)。

## 使用办法

````bash
git clone https://github.com/ayeks/SGX-hardware.git
````

编译代码

````bash
gcc test-sgx.c -o test-sgx
````

运行测试

````bash
./test-sgx
````

## 根据输出结果分析

### 首先看CPU究竟是否支持SGX

目前大多数PC机的CPU都是支持的，服务器的CPU截止到目前只有E3支持

````bash
sgx available: 1
````

如果看到`sgx available: 1`，说明至少CPU是支持SGX的。

### BIOS中是否开启SGX特性

默认情况，BIOS中会关闭SGX特性，得到的情况就是`sgx [1|2] supported`都是`0`

````
sgx 1 supported: 0
sgx 2 supported: 0
````

这种情况，可以去BIOS中开启。

Thinkpad在如下中开启：

![](https://cdn.jsdelivr.net/gh/wuliang142857/pictures-hosting@main/20211213/1.1u2ewr78uz0g.jpg)

![](https://cdn.jsdelivr.net/gh/wuliang142857/pictures-hosting@main/20211213/1.6mtavnnmblg0.jpg)

### 最终效果

最终只要`sgx available: 1`并且`sgx [1|2] supported`中其中有一个是`1`就说明CPU已经支持并开启了SGX特性。

