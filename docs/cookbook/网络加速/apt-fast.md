# 使用apt-fast来提升apt下载速度

相比[debian](https://www.debian.org/)、[CentOS](https://www.centos.org/)等系统，[ubuntu](https://ubuntu.com/)有一个很吸引人地方在于提供了个人包服务（Personal Package Archive，PPA）。

但与此同时，PPA服务通常托管在[launchpad.net](https://launchpad.net/)上，从国内下载非常慢。

[apt-fast](https://github.com/ilikenwf/apt-fast)本身就是为了解决类似问题的，它本身是一个`shell`脚本，原理很简单，但非常好使。

## apt-fast的原理

 - `apt-fast`的最基本想法就是采用多线程下载以提升下载数据
 - 采用的多线程加载工具是[aria2](https://aria2.github.io/)
 - 在下载前，`apt-get`会先分析目标软件包的依赖，然后下载到`/var/cache/apt/archives/`目录下，然后最后调用`apt`或者`apt-get`或者`aptitude`命令来安装。

## apt-get安装

ubuntu系统的话，比较简便：

````bash
sudo add-apt-repository ppa:apt-fast/stable
sudo apt-get update
sudo apt-get -y install apt-fast
````

此外，因为ubuntu其实是源于debian，大家都使用`apt`包管理工具，因此debian下其实也可以使用apt-fast。只不过在debian下需要手工安装。

````bash
# 首先得安装aria2
apt-get install aria2

git clone https://github.com/ilikenwf/apt-fast.git apt-fast
cp -pv apt-fast/apt-fast /usr/local/bin
chmod a+x /usr/local/bin/apt-fast
cp apt-fast/apt-fast.conf /etc
````

然后可以编辑一下`/etc/apt-fast.conf`,以修改缺省采用`apt`命令和线程数等等。

## 参考

 - [ilikenwf/apt-fast](https://github.com/ilikenwf/apt-fast)