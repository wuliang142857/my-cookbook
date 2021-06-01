# Linux下设置主机名（hostname）的最完整方法

在较新版本的Linux发行版中，都引入了一个名为[systemd](https://systemd.io/)的系统管理工具，而`systemd`又提供了一个名为[hostnamectl](https://man7.org/linux/man-pages/man1/hostnamectl.1.html)的工具来管理主机名。

````bash
sudo hostnamectl set-hostname NEW_HOSTNAME
````

一般而言，通过`hostnamectl`来修改就差不多了，但事实上，有些时候还是不够的。我们还需要做如下检查和修改：

#### 检查`/etc/hosts`

检查`/etc/hosts`中没有将之前的主机名映射，或者`127.0.0.1`被映射到其他主机名。

### 检查`/etc/sysconfig/network`

检查`/etc/sysconfig/network`中的`HOSTNAME`值是不是期望的主机名。

## 参考

 - [How to Set or Change System Hostname in Linux](https://www.tecmint.com/set-hostname-permanently-in-linux/)

