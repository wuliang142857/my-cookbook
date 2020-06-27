---
title: 使用树莓派来创建NAS服务器
date: 2019-06-29 21:34:05
tags:
    - 树莓派
    - NAS
    - Samba
---

# 背景

如果不了解==NAS==是什么的，请自行百度。我想要说的是，目前NAS服务器都太多了，不带硬盘的竟然都得2000+元

![](https://tva1.sinaimg.cn/large/703708dcly1g7vw3esfpoj21gk0n0gqf)

想想其实NAS又不是什么高科技的玩意，简单架构无非如此：

![](https://tva1.sinaimg.cn/large/703708dcly1g7vw3gpofij20zk0u0whf)

- 最底层是一个Linux操作系统，当然Windows其实也可以，无所谓什么
- 目前大多数NAS都支持插多块硬盘，这无非是用[RAID](https://zh.wikipedia.org/wiki/RAID)来做一个硬盘矩阵，就是让多块物理硬盘做成一个逻辑硬盘，说得直白点，就是看上去想是一块硬盘；当然，如果你只有一块硬盘，就可以忽略
- NAS最核心的就是文件共享，如果是Linux的话，自然选择[Samba](https://zh.wikipedia.org/wiki/Samba)
- 其实设置好Samba后，NAS就已经完成了；其他的无非是各个厂商提供的第三方应用了，无非是一些文件共享、家庭影院什么的，这些对一些会一些开发技术的人来说都好简单的。

经过我这么一分析，大家都可以看出NAS其实没啥了吧，真心不知道为啥卖得这么贵；不过没事，作为一个技术宅来说，这些都完全自己做。

首先先看一下的最终的效果：

![](https://tva1.sinaimg.cn/large/703708dcly1g7vw3iqq40j20u00ye0xg)

我的方案：

- 树莓派一块：我用的是Raspberry 3B(手头上只有这款，￥150二手入的)，其实Raspberry 1代就足够了。当然还需要一张最小8G的SD卡，这个很便宜的。
- 硬盘盒一个：我有5块硬盘，因此买一个可以插5块硬盘的硬盘柜，价格￥670

把硬盘装到硬盘盒中，USB接入树莓派，150+670=820就搞定了，是不是很划算。

# 树莓派安装

这块内容可以自行百度，很简单的，没啥好说的

# RAID设置

关于RAID我以前也没配置过，因此这块对我来说可以尝试一下，记录一下。大体参考^[1]^

## Step 1：安装mdadm

关于mdadm的介绍，可以参见[wikipedia/mdadm](https://en.wikipedia.org/wiki/Mdadm)，安装办法大致类似：

````bash
apt-get install mdadm
````

## Step 2：确认硬盘都识别出来了

````bash
fdisk -l
````

看一下就可以

## Step 3：检查硬盘是否已经被现有的 RAID 使用

````bash
mdadm --examine /dev/sd[a-e]
````

![](https://tva1.sinaimg.cn/large/703708dcly1g7vw3l9xqej211q0hcaeg)

如果几块硬盘都是"No md superblock detected on /dev/sd*"之类的，说明就OK了。

否则可以**mkfs.ext4**之类的命令把硬盘重新格式化一把。

![](https://tva1.sinaimg.cn/large/703708dcly1g7vw3nem4wj218e0jwgt6)

## Step 4：创建RAID分区

这里需要注意一下，一般我们创建分区使用**fdisk**命令，但fdisk单个分区最大只能2T，而我们既然做NAS，同时都是比较大的硬盘，比如我这里一块8T、两块4T的，因此我们得上[parted](https://www.gnu.org/software/parted/)了。

````bash
parted /dev/sde
````

![](https://tva1.sinaimg.cn/large/703708dcly1g7vw3pmlh0j21zg0j2gr9)

这里需要注意一点，我们需要把硬盘的分区创建为RAID类型，在parted中设置为raid类型的命令是：

````bash
set 1 raid on
````

每块硬盘创建完成后，我们来检查一下：

````bash
mdadm --examine /dev/sd[a-e]
mdadm --examine /dev/sd[a-e]1
````

![](https://tva1.sinaimg.cn/large/703708dcly1g7vw3ry57nj212e0r410f)

## Step 5：创建 RAID md 设备

````bash
mdadm --create /dev/md0 --level=stripe --raid-devices=5 /dev/sd[a-e]1
````

执行完成后，我们可以检查一下硬盘盒阵列的情况

````bash
cat /proc/mdstat
````

![](https://tva1.sinaimg.cn/large/703708dcly1g7vw3u4r8jj21b20b8djq)

## Step 6：给RAID设备创建文件系统

用`mkfs.ext4`来格式化`/dev/md0`

````bash
mkfs.ext4 /dev/md0
````

然后挂载就搞定了哦

```bash
mkdir /mnt/raid0
mount /dev/md0 /mnt/raid0
```

默认`mount`上的目录是**root**权限的，为了后续方便操作，我们可以改为当前用户的属性：

````shell
chown -hR pi:pi /mnt/raid0
````



# 用Samba来做目录共享

## 安装Samba

````bash
apt-get install samba
````

## 共享一个目录

我们在之前的`/mnt/raid0`目录下在创建一个`public`目录作为被共享的目录

Samba的配置还是比较简单的，最要在`/etc/samba/smb.conf`下追加对`public`目录的共享配置即可：

````ini
[public]
	map hidden = yes
	force user = pi
	delete readonly = yes
	path = /mnt/raid0/public
	map system = yes
	public = yes
	write list = pi,@pi
	writeable = yes
	case sensitive = yes
	valid users = pi,@pi
	guest account = pi
	force group = pi
````

## 为Samba用户设置密码

````shell
smbpasswd -a pi
````

## 重启Samba

````shell
service smbd restart
````

# 结束

好了，我们使用树莓派+Samba创建NAS服务的基本设置已经完成了

# 参考

- [[1] 在 Linux 下使用 RAID（二）：使用 mdadm 工具创建软件 RAID 0 （条带化）](https://linux.cn/article-6087-1.html)
- [[2] Using parted to create a RAID primary partition](https://plone.lucidsolutions.co.nz/linux/io/using-parted-to-create-a-raid-primary-partition)
