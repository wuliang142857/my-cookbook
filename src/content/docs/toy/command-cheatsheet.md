---
title: "命令行速查手册"
description: "日常开发中常用的命令速查，涵盖 APT、Docker、Git、Windows、Node.js 等。"

---

# 命令行速查手册

日常开发中常用的命令速查，涵盖 APT、Docker、Git、Windows、Node.js 等。

## APT 包管理

### GPG 公钥问题

在 `apt-get update` 时遇到 `NO_PUBKEY` 错误：

```
W: GPG error: http://ppa.launchpad.net karmic Release: The following signatures couldn't be verified because the public key is not available: NO_PUBKEY D45DF2E8FC91AE7E
```

解决办法：

```bash
sudo apt-key adv --keyserver keyserver.ubuntu.com --recv-keys D45DF2E8FC91AE7E
```

### Docker 中清理 APT 缓存

在 Docker Ubuntu 镜像中安装软件后，清理缓存以减小镜像体积：

```bash
apt-get clean autoclean
apt-get autoremove --yes
rm -rf /var/lib/{apt,dpkg,cache,log}/
```

## Docker

### 获取容器内 IP 地址

Docker 基础镜像通常不包含 `ifconfig`，可用以下命令获取 IP：

```bash
hostname -i
```

### Docker in Docker

在容器中运行 Docker，挂载宿主机的 docker.sock：

```bash
docker run -v /var/run/docker.sock:/var/run/docker.sock -ti docker
```

### Docker 资源清理

```bash
# 删除所有悬空（dangling）镜像
docker image prune -f

# 删除所有未被容器引用的镜像
docker image prune -a

# 强制删除所有未使用的镜像
docker rmi $(docker images -q)

# 清理整个 Docker 所有资源（镜像、容器、网络）
docker system prune -a -f

# 清理不再使用的 Volume
docker system prune --volumes -f
```

## Git

### 用户名和邮箱设置

Git 提供三级配置，优先级：项目级 > 全局 > 系统

```bash
# 项目级别（存储在 .git/config）
git config user.name "Your project specific name"
git config user.email "your@project-specific-email.com"

# 全局级别（存储在 ~/.gitconfig）
git config --global user.name "Your Name"
git config --global user.email "your@email.com"

# 系统级别（存储在 /etc/gitconfig）
git config --system user.name "Your default name"
git config --system user.email "your@system-email.com"
```

### 中文乱码问题

`git status` 显示中文为八进制编码：

```bash
git config --global core.quotepath false
```

### 批量修改提交的用户名和邮箱

使用脚本 [fix-git-username-email.sh](https://gist.github.com/wuliang142857/cd2a505273dedcd80677c9f7526bec54)：

```bash
./fix-git-username-email.sh \
  --unexpected-username "old-name" \
  --unexpected-email "old@email.com" \
  --expected-username "new-name" \
  --expected-email "new@email.com"
```

## Windows

### 激活自带图片查看器

将以下内容保存为 `.reg` 文件并运行：

```
Windows Registry Editor Version 5.00
[HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows Photo Viewer\Capabilities\FileAssociations]
".tif"="PhotoViewer.FileAssoc.Tiff"
".tiff"="PhotoViewer.FileAssoc.Tiff"
".jpg"="PhotoViewer.FileAssoc.Tiff"
".png"="PhotoViewer.FileAssoc.Tiff"
".gif"="PhotoViewer.FileAssoc.Tiff"
```

## Node.js

### rimraf：跨平台的 `rm -rf`

Windows 和 Unix 的 `rm` 命令有差异，[rimraf](https://github.com/isaacs/rimraf) 提供跨平台支持：

```json
{
    "scripts": {
        "clean": "rimraf lib-es5"
    }
}
```

## 参考

- [Can I get ip address inside my docker container?](https://stackoverflow.com/questions/27670495/can-i-get-ip-address-inside-my-docker-container)
- [How To Run Docker in Docker Container](https://devopscube.com/run-docker-in-docker/)
