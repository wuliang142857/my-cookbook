---
icon: redhat
---

# 制作rpm包的简单模板

简单总结一下如何制作rpm包，以便后续再有需要。需要达到的目标：

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

相比deb的制作，rpm的制作其实更简单一些，新建文件`rpm/deb-demo.spec`，内容大致如下：

```
%define release 1
%define __os_install_post %{nil}

Name: deb-demo
Packager:root
Version:0.1.0
Release: 1

AutoReqProv:no
Summary: demo for deb package
URL: http://exmaple.com
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
rm -rfv  %{buildroot}
mkdir -pv %{buildroot}%{rootPath}/
mkdir -pv %{buildroot}%{rootPath}/bin
cp -v deb-demo %{buildroot}%{rootPath}/bin/
chmod a+x %{buildroot}%{rootPath}/bin/deb-demo
mkdir -pv %{buildroot}/etc/systemd/system
cp -v  deb-demo.service %{buildroot}/etc/systemd/system/

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
if systemctl is-active --quiet deb-demo.service; then systemctl stop deb-demo.service; fi
systemctl disable deb-demo.service
systemctl daemon-reload

```

然后运行如下命令来构建即可：

```bash
rpmbuild -ba rpm/deb-demo.spec
```

此外，如果要打包arm64架构下的rpm包：

``` bash
rpmbuild -ba --target aarch64 rpm/deb-demo.spec
```

