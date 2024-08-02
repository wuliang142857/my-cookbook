---
icon: debian 
---

# 制作deb包的简单模板

简单总结一下如何制作deb包，以便后续再有需要。需要达到的目标：

- 支持X86、ARM两种CPU架构
- 安装以及服务注册；当然，卸载时也需要把服务停掉并且删除。

因为涉及服务注册，因为我就用一个比较简单的服务来演示吧：

```go
package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func main() {
	// 创建一个默认的路由引擎
	r := gin.Default()

	// 添加一个简单的路由处理函数，当访问 "/" 时调用
	r.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "hello world",
		})
	})

	r.Run("0.0.0.0:8888")
}
```

新建`debian`目录，目录结构如下：

```
debian/
├── changelog
├── compat
├── control
├── postinst
├── prerm
└── rules
```

- 其中`changelog`记录的是更新日志，它有比较严格的格式要求：

```
包名 (版本号) 发行版; urgency=紧急度
  * 更改说明1
  * 更改说明2

 -- 维护者姓名 <维护者邮箱>  日期
```

我这里内容如下：

```
deb-demo (0.1.0) UNRELEASED; urgency=medium

  * Initial release. (Closes: #XXXXXX)

 -- root <root@hadoop-00>  Tue, 09 Jul 2024 11:18:20 +0800
```

- `compat`：表示debhelper的兼容版本，写成`9`就行。

- `control`：包的一些基本信息，例如：

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

- `postinst`、`prerm`、`rules`三个文件的文件权限都得是`755`。

- `rules`：本身其实就是一个`Makefile`，这里我的内容是：

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

- `postinst`是安装完成后的后置脚本，我这边主要为了注册服务和启动服务：

```bash
#!/bin/sh
# Post-install script for deb-demo

# DEBHELPER

set -e

# 确保 systemd 知道我们添加了一个新的服务文件
systemctl daemon-reload

# 启用服务以便它在启动时自动启动
systemctl enable deb-demo.service

# 启动服务
systemctl start deb-demo.service

exit 0
```

- `prerm` 是卸载前的前置脚本，我这边和`postinst`对应，用于卸载服务：

```bash
#!/bin/sh
set -e

# 如果服务正在运行，则停止它
if systemctl is-active --quiet deb-demo.service; then
    systemctl stop deb-demo.service
fi

# 禁用服务，防止它在系统启动时运行
systemctl disable deb-demo.service

# 重新加载 systemd，以确保它更新状态
systemctl daemon-reload

exit 0
```

- `deb-demo.service`文件内容：

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



构建deb包的命令，构建完成后，会在当前目录的上一层目录下生成相应的deb包：

```bash
debuild -d -us -uc -b
```

因为我本机是X86_64的，如果要构建针对ARM架构的，则多指定一个参数即可：

```bash
debuild -aarm64 -d -us -uc -b
```

