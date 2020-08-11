---
title: Win10连接无线“需要执行操作”或无网络问题的解决方法
date: 2020-03-02 23:34:16
tags: 
	- Windows
---

突然有一天，可能经过了系统更新，Windows 10每次启动时，都不能自动连接到无线网络了。提示：“需要执行操作”。

![20190829041605894.jpg](https://ww1.sinaimg.cn/large/703708dcly1gcg0byp69ij206w02a0sj.jpg)

分析原因：

> 这是微软更新协议导致连接外网需要与服务商重新签订ISP，不影响上网，只是可能对微软的产品或服务会弹出提醒、警示，待微软协议更新完成，服务商重新签订后就好了，据悉，只有移动宽带用户受到了影响，电信没有问题。

 解决办法：

1. 打开注册表：regedit
2. 定位到注册表`HKEY_LOCAL_MACHINE\SYSTEM\CurrentControSet\servicces\NlaSvc\Parameters\Internet`
3. 找到EnableActiveProbing，将其值改为0就可以了

参考：

- [Win10连接无线“需要执行操作”或无网络问题的解决方法](http://www.kkx.net/wz/127.html)



