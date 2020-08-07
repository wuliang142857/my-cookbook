---
title: 解决ssh登录慢
tags:
    - ssh
---

如果ssh登录慢，可以尝试用如下两种方式解决：

# 第一招：可能是DNS反向解析的问题

修改==/etc/ssh/sshd_config==文件，添加/修改：

````ini
UseDNS no
````

然后重启ssh服务：

````bash
service ssh restart
````

# 第二招：关闭GSSAPIAuthentication

修改==/etc/ssh/ssh_config==文件，添加/修改：

````ini
GSSAPIAuthentication no
````

最后还是重启一下ssh服务

