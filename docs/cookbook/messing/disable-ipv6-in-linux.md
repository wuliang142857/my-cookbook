# 在Linux中禁用IPv6

## 临时生效

```` bash
sudo sysctl -w net.ipv6.conf.all.disable_ipv6=1
sudo sysctl -w net.ipv6.conf.default.disable_ipv6=1
sudo sysctl -w net.ipv6.conf.lo.disable_ipv6=1
````

## 永久生效

编辑`/etc/sysctl.conf`文件，修改/新增：

````bash
net.ipv6.conf.all.disable_ipv6=1
net.ipv6.conf.default.disable_ipv6=1
net.ipv6.conf.lo.disable_ipv6=1
````

然后重启生效或者运行命令：

````bash
sudo sysctl -p /etc/sysctl.conf
````

## 参考

- [How to Disable IPv6 on Ubuntu Linux](https://itsfoss.com/disable-ipv6-ubuntu-linux/)