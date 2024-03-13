---
icon: virtualbox
---
# 如何通过RDP协议访问VirtualBox中的Windows虚拟机

因一些工作需要，有时候不得不通过VirtualBox安装了Windows虚拟机。但我想通过远程访问（RDP协议）这些Windows虚拟机。

解决方案其实很简单，也就是如何把Windows远程访问的**3389端口**暴露出来。

在 *设置->显示* 中，启用 *远程桌面*：

![Screenshot2022-04-18-15](https://jsd.cdn.zzko.cn/gh/wuliang142857/pictures-hosting@main/20220418/Screenshot2022-04-18-15.388xlmn6knc0.png)

在 *设置->网络->网卡1->端口转发* 中，新增一条 *端口转发规则*：

![Screenshot2022-04-18-15](https://jsd.cdn.zzko.cn/gh/wuliang142857/pictures-hosting@main/20220418/Screenshot2022-04-18-15.2k248jj3t6w0.png)

其中：

- 协议：TCP
- 主机IP：127.0.0.1
- 主机端口：暴露出来的端口，端口不冲突即可
- 子系统IP：0.0.0.0
- 子系统端口：3389

最后，通过支持RDP的客户端软件登录即可。



