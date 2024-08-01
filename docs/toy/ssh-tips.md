---
icon: ssh
---

# ssh使用小技巧

## 解决ssh登录慢的问题

如果ssh登录慢，可以尝试用如下两种方式解决：

### 第一招：可能是DNS反向解析的问题

修改 ==/etc/ssh/sshd_config== 文件，添加/修改：

````ini
UseDNS no
````

然后重启ssh服务：

````bash
service ssh restart
````

### 第二招：关闭GSSAPIAuthentication

修改 ==/etc/ssh/ssh_config== 文件，添加/修改：

````ini
GSSAPIAuthentication no
````

最后还是重启一下ssh服务

## 通过代理登录

编辑==~/.ssh/config==，类似：

```ini
Host a1
    HostName 192.168.0.1
    User root
    Port 22
    StrictHostKeyChecking no

Host a2
    HostName 192.168.0.2
    User admin
    Port 22
    StrictHostKeyChecking no
    ProxyJump gpu
```

## 端口转发

类似这样：通过172.23.2.55，将172.19.2.152的3389端口映射带本地的33333端口：

```bash
ssh -N -f -L 033333:172.19.2.152:3389 root@172.23.2.55
```

参考：

- [ssh端口转发](https://wangdoc.com/ssh/port-forwarding)
