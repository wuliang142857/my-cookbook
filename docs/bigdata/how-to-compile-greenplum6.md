---
icon: greenplum
---

# 如何编译Greenplum 6

[Greenplum](https://github.com/greenplum-db/gpdb) 官方只提供了针对ubuntu 18.04和RHEL 6/7/8的安装包，现在我们需要在ubuntu 20.04和统信上编译&运行。

## ubuntu 20.04上编译Greenplum 6

安装依赖：

```bash
apt install libreadline-dev libzstd-dev libuv1-dev libuv1 libgss-dev libapr1-dev libevent-dev libyaml-dev libaprutil1-dev libcurl4-openssl-dev libbz2-dev libxerces-c-dev libkrb5-dev python2-dev libpam0g-dev libxml2 libxml2-dev libperl-dev libssl-dev flex
```

生成Makefile：

```bash
CFLAGS='-m64 -O3 -fargument-noalias-global -fno-omit-frame-pointer -g' CC='gcc -m64' LDFLAGS='-Wl,--enable-new-dtags -Wl,-rpath,$ORIGIN/../lib' ./configure --prefix=/usr/local/greenplum-db-devel --mandir=/usr/local/greenplum-db-devel/man  --with-gssapi --enable-mapreduce --enable-orafce --enable-orca --with-libxml --with-pythonsrc-ext --with-pgport=5432 --disable-debug-extensions --disable-tap-tests --enable-ic-proxy --with-perl --with-python --with-openssl --with-pam --with-ldap --disable-rpath
```

修改编译参数：

```bash
sed -s -i 's#-std=c++98#-std=c++11#g'  src/backend/gpopt/gpopt.mk
sed -s -i 's#-std=gnu++98#-std=c++11#g' src/backend/gporca/libgpos/src/common/Makefile
sed -s -i 's#-std=gnu++98#-std=c++11#g' src/backend/gporca/gporca.mk
```

还有一处编译参数需要修改，修改`src/backend/gporca/gporca.mk`，在`CPPFLAGS`参数中新增：`-Wno-deprecated-copy`。



编译：

```bash
make
```

## 在统信UOS上编译Greenplum 6

相比在ubuntu 20.04上，除了第一步安装依赖不一样，在通信上安装依赖：

```bash
dnf groupinstall "Development Tools"
dnf install readline.x86_64 apr apr-devel libevent-devel openssl-devel pam-devel libxml2.x86_64 libxml2-devel.x86_64 libcurl-devel.x86_64 bzip2-devel.x86_64 libzip-devel.x86_64 openldap openldap-devel openldap openldap-devel 
```

