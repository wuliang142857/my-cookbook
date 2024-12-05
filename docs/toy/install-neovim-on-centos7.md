---
icon: neovim
---

# 在CentOS7上安装neovim

虽然之前在ubuntu下我不喜欢snapd，但无奈我们的hadoop集群是在CentOS7上，想用neovim，因此最简单的方法还是通过snapd来安装。

具体步骤：

1. 使用阿里云的epel源，官方这个epel源已经失效了，幸好阿里云的还能用

```bash
wget -O /etc/yum.repos.d/epel.repo https://mirrors.aliyun.com/repo/epel-7.repo

yum makecache
```

2. epel源中有snapd，安装上

```bash
yum install snapd

systemctl enable --now snapd.socket
systemctl start snapd

# 这步很关键，nvim貌似只能从/snap/bin/nvim来运行
ln -s /var/lib/snapd/snap /snap
```

3. 通过snapd来安装neovim：

```bash
snap install nvim --classic
```

4. 我个人喜欢用nvim来替换vim

```bash
alias vim=/snap/bin/nvim
alias vimdiff="/snap/bin/nvim -d"
export EDITOR=/snap/bin/nvim
```

## 参考

- [Enable snaps on CentOS and install Neovim](https://snapcraft.io/install/nvim/centos)
- [阿里云epel镜像](https://developer.aliyun.com/mirror/epel/)

