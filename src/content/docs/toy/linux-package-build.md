---
title: "Linux 软件包制作指南"
description: "制作 DEB（Debian/Ubuntu）和 RPM（RedHat/CentOS）软件包的完整模板。"
---

# Linux 软件包制作指南

制作 DEB（Debian/Ubuntu）和 RPM（RedHat/CentOS）软件包的完整模板。

## 目标

- 支持 X86、ARM 两种 CPU 架构
- 安装时自动注册 systemd 服务
- 卸载时自动停止并删除服务

## 示例服务

以一个简单的 Go HTTP 服务为例：

```go
package main

import (
	"net/http"
	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()
	r.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "hello world"})
	})
	r.Run("0.0.0.0:8888")
}
```

systemd 服务文件 `deb-demo.service`：

```ini
[Unit]
Description=deb-demo
After=network.target

[Service]
Type=simple
User=root
ExecStart=/opt/deb-demo/bin/deb-demo
Restart=on-abort

[Install]
WantedBy=default.target
```

## DEB 包制作（Debian/Ubuntu）

### 目录结构

```
debian/
├── changelog    # 更新日志
├── compat       # debhelper 兼容版本
├── control      # 包元信息
├── postinst     # 安装后脚本（755权限）
├── prerm        # 卸载前脚本（755权限）
└── rules        # 构建规则（755权限）
```

### changelog

```
deb-demo (0.1.0) UNRELEASED; urgency=medium

  * Initial release. (Closes: #XXXXXX)

 -- root <root@example.com>  Tue, 09 Jul 2024 11:18:20 +0800
```

### compat

```
9
```

### control

```
Source: deb-demo
Section: utils
Priority: optional
Maintainer: Your Name <your.email@example.com>
Build-Depends: debhelper (>= 9), systemd
Standards-Version: 4.5.0

Package: deb-demo
Depends: ${misc:Depends}, ${shlibs:Depends}, systemd
Description: deb-demo is demo for deb package.
Architecture: amd64 arm64
```

### rules

```makefile
#!/usr/bin/make -f

%:
	dh $@

override_dh_strip:
	echo "Skipping dh_strip"

override_dh_shlibdeps:
	echo "Skipping dh_shlibdeps"

override_dh_auto_build:
ifeq ($(DEB_HOST_ARCH),amd64)
	GOOS=linux GOARCH=amd64 make
else
	GOOS=linux GOARCH=arm64 make
endif

override_dh_auto_install:
	dh_auto_install
	mkdir -pv debian/deb-demo/opt/deb-demo/bin
	cp -v deb-demo debian/deb-demo/opt/deb-demo/bin/deb-demo
	mkdir -pv debian/deb-demo/etc/systemd/system
	cp -v deb-demo.service debian/deb-demo/etc/systemd/system/
```

### postinst（安装后）

```bash
#!/bin/sh
set -e

systemctl daemon-reload
systemctl enable deb-demo.service
systemctl start deb-demo.service

exit 0
```

### prerm（卸载前）

```bash
#!/bin/sh
set -e

if systemctl is-active --quiet deb-demo.service; then
    systemctl stop deb-demo.service
fi
systemctl disable deb-demo.service
systemctl daemon-reload

exit 0
```

### 构建命令

```bash
# X86_64
debuild -d -us -uc -b

# ARM64
debuild -aarm64 -d -us -uc -b
```

构建完成后，deb 包生成在上级目录。

## RPM 包制作（RedHat/CentOS）

### spec 文件

创建 `rpm/deb-demo.spec`：

```text
%define release 1
%define __os_install_post %{nil}

Name: deb-demo
Packager: root
Version: 0.1.0
Release: 1
AutoReqProv: no
Summary: demo for deb package
URL: http://example.com
Group: Development
License: Commercial
BuildRoot: %{_tmppath}/%{name}-%{version}-%{release}

%description

%define rootPath /opt/deb-demo

%build
cd $OLDPWD
%ifarch aarch64
GOOS=linux GOARCH=arm64 make
%else
GOOS=linux GOARCH=amd64 make
%endif

%install
cd $OLDPWD
rm -rfv %{buildroot}
mkdir -pv %{buildroot}%{rootPath}/bin
cp -v deb-demo %{buildroot}%{rootPath}/bin/
chmod a+x %{buildroot}%{rootPath}/bin/deb-demo
mkdir -pv %{buildroot}/etc/systemd/system
cp -v deb-demo.service %{buildroot}/etc/systemd/system/

%clean
cd $OLDPWD
make clean

%files
%{rootPath}/
/etc/systemd/system/deb-demo.service

%post
systemctl daemon-reload
systemctl enable deb-demo.service
systemctl start deb-demo.service

%preun
if systemctl is-active --quiet deb-demo.service; then
    systemctl stop deb-demo.service
fi
systemctl disable deb-demo.service
systemctl daemon-reload
```

### 构建命令

```bash
# X86_64
rpmbuild -ba rpm/deb-demo.spec

# ARM64
rpmbuild -ba --target aarch64 rpm/deb-demo.spec
```

## 对比

| 特性 | DEB | RPM |
|------|-----|-----|
| 配置文件 | 多个文件 | 单个 spec 文件 |
| 复杂度 | 较高 | 较低 |
| 适用发行版 | Debian/Ubuntu | RedHat/CentOS/Fedora |
| 构建工具 | debuild | rpmbuild |
