---
icon: mac
---

# MacPorts

## 为什么不用Homebrew?

之前我一直使用[Homebrew](https://brew.sh/)，但[Home-brew 从4.4开始不支持macOS Monterey(12)](https://brew.sh/2024/10/01/homebrew-4.4.0/)了，而公司电脑不能顺便升级系统。因此只能采用替代的方法。而MacPorts支持对macOS的历史版本支持得非常全，从最新的16.x到比较古老的3.1竟然都还支持。

## 下载

macPorts下载地址：[https://www.macports.org/install.php](https://www.macports.org/install.php)

和Homebrew一款软件支持覆盖反而内的所有macOS版本不同，MacPort是针对各个macOS版本一个安装包：

![](https://image-hosting.wuliang142857.me/2024/11/cc2571b36eeb446dc9f3196e4c1ca862.jpg)

## 配置环境变量

MacPorts会将软件安装到`/opt/local`目录下，因此我们可以设置如下环境变量：

```bash
if [[ -e "/opt/local/bin" ]];then
    export PATH=/opt/local/bin:/opt/local/sbin:$PATH
    export PATH=/opt/local/libexec/gnubin:$PATH
fi
if [ -f /opt/local/etc/profile.d/bash_completion.sh ]; then
  . /opt/local/etc/profile.d/bash_completion.sh
fi
```

## 配置国内源

和几乎所有软件安装工具一样，我们一上来就需要配置上国内源。

修改`/opt/local/etc/macports/macports.conf`，添加：

```ini
rsync_server mirrors.tuna.tsinghua.edu.cn
```

修改`/opt/local/etc/macports/sources.conf`，删除之前的地址，然后添加：

```
rsync://mirrors.tuna.tsinghua.edu.cn/macports/release/tarballs/ports.tar [default]
```

上述两处配置好后，更新一下缓存：

```bash
sudo port -v selfupdate
```

## 一些MacPorts的基本命令

```bash
# 查看MacPorts中当前可用的软件包及其版本
port list
 
# 搜索索引中的软件
port search name
 
# 查看包详细信息
port info name
 
# 查看包详细信赖信息
port deps name
 
# 安装新软件
sudo port install name
 
# 安装完毕之后，清除安装时产生的临时文件
sudo port clean --all name
 
# 卸载软件
sudo port uninstall name
 
# 查看有更新的软件以及版本
port outdated
 
# 升级可以更新的软件
sudo port upgrade outdated
```



