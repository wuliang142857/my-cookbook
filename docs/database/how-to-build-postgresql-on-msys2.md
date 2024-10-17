---
icon: postgresql
---

# 如何在MSYS2上编译PostgreSQL

## 一、背景

虽然PostgreSQL官方确实也提供了基于EDB制作的[PostgreSQL for Windows](https://www.postgresql.org/download/windows/)，但一方面整体比较庞大，不太适合作为软件的一部分被集成；另一方面相关特性也不能被自定义，插件的安装都是问题。因此，我们还是需要自己重新编译PostgreSQL。

## 二、环境准备和编译

### 2.1 准备MSYS2环境

MSYS2提供了一套基于[Mingw-w64](https://www.mingw-w64.org/) 的编译构建环境，非常好用。具体配置参考：[在Windows上使用MSYS2准备构建环境](msys2-introduction)

### 2.2 编译PostgreSQL

```bash
CFLAGS="-D WINVER=0x0600 -D _WIN32_WINNT=0x0600" LIBS="-ladvapi32" ./configure --host=x86_64-w64-mingw32 --prefix=/d/PostgreSQL/ --enable-thread-safety 
make
make install
```

其中：

- `CFLAGS="-D WINVER=0x0600 -D _WIN32_WINNT=0x0600"`是为了解决在Windows7上运行时的一个问题，具体参考：[Clean build MINGW64 CreateProcessAsUserA could not be located](https://www.spinics.net/lists/pgsql/msg205260.html)。如果不支持Windows7，这个不加也没事。

### 2.3 简单验证

```bash
# 创建数据库目录
initdb.exe -d d:\testdb

# 启动
pg_ctl.exe -D d:\testdb -l logfile start

# 停止
pg_ctl.exe -D d:\testdb -l logfile stop

# 创建用户
createuser.exe postgres

# 登录
psql -d postgres

# 修改密码
ALTER USER postgres WITH PASSWORD '123456';
# 创建数据库
CREATE DATABASE postgres;
# 授权
grant all privileges on database postgres to postgres;
# 授权给超级用户
ALTER USER postgres WITH SUPERUSER;
```

## 三、开启相关特性

## 3.1 Python3扩展

#### 3.1.1 修改源码并编译

在我的场景中，因为需要支持Windows7，Python版本中3.9版本就不支持Windows7了，但与此同时，目前最新版本的MSYS2上的Python已经更新到了3.11了，因此只能找之前的包，我找到的是：[https://ftp.opencpu.org/rtools/mingw64/mingw-w64-x86_64-python-3.8.6-6-any.pkg.tar.xz](https://ftp.opencpu.org/rtools/mingw64/mingw-w64-x86_64-python-3.8.6-6-any.pkg.tar.xz)。

并且因为我不想替换当前的Python 3.11，因此我干脆就把`mingw-w64-x86_64-python-3.8.6-6-any.pkg.tar.xz`解压后另存其他目录。

然后再上述`configure`的基础上，新增类似：`--with-python PYTHON=<path>/mingw-w64-x86_64-python-3.8.6-6/bin/python.exe`，比如：

```bash
CFLAGS="-D WINVER=0x0600 -D _WIN32_WINNT=0x0600" LIBS="-ladvapi32" ./configure --host=x86_64-w64-mingw32 --prefix=/e/PostgreSQL/ --enable-thread-safety  --with-python PYTHON=/e/mingw-w64-x86_64-python-3.8.6-6/bin/python.exe
```

但PostgreSQL的`configure`其实有一点bug（我认为它是BUG，没有考虑完全），其实得修改一下`configure`:

（1）首先在`python_ldlibrary=`的这样增加一个`python_bindir`的定义：

```bash
python_bindir=`${PYTHON} -c "import distutils.sysconfig; print(' '.join(filter(None,distutils.sysconfig.get_config_vars('BINDIR'))))"`
```

（2）然后对这块代码做一个修改：

```bash
if test "$found_shlib" != 1 -a \( "$PORTNAME" = win32 -o "$PORTNAME" = cygwin \); then
    for d in "${python_libdir}" "${python_configdir}" c:/Windows/System32 /usr/bin
    do
            echo "$d/lib${ldlibrary}.dll" "$d/${ldlibrary}.dll"
            for f in "$d/lib${ldlibrary}.dll" "$d/${ldlibrary}.dll" ; do
                    if test -e "$f"; then
                            python_libdir="$d"
                            found_shlib=1
                            break 2
                    fi
            done
    done
fi
```

修改为：

```bash
if test "$found_shlib" != 1 -a \( "$PORTNAME" = win32 -o "$PORTNAME" = cygwin \); then
    for d in "${python_libdir}" "${python_configdir}" c:/Windows/System32 /usr/bin ${python_bindir}
    do
            echo "$d/lib${ldlibrary}.dll" "$d/${ldlibrary}.dll"
            for f in "$d/lib${ldlibrary}.dll" "$d/${ldlibrary}.dll" ; do
                    if test -e "$f"; then
                            python_libdir="$d"
                            found_shlib=1
                            break 2
                    fi
            done
    done
fi
```

其实就是寻找Python动态库的路径增加`bin`目录（因为和Linux不一样，Windows的exe文件和dll文件通常得同一个目录下），因此针对`mingw-w64`的Python，`dll`需要从`bin`目录寻找。

（3）然后因为我们在后续编译Python扩展时还需要链接这个DLL，因此需要将`python_bindir`输出，修改`ac_subst_vars`的定义，新增：`python_bindir`。

（4）修改`src/Makefile.global.in`，添加对`python_bindir`的输出：

```makefile
python_bindir           = @python_bindir@
```



（5）修改`src/pl/plpython/Makefile`，将原始内容：

```makefile
ifeq ($(PORTNAME), win32)

pytverstr=$(subst .,,${python_version})
PYTHONDLL=$(subst \,/,$(WINDIR))/system32/python${pytverstr}.dll
PYTHONDLL=${python_bindir}/libpython${python_version}.dll

OBJS += libpython${pytverstr}.a

libpython${pytverstr}.a: python${pytverstr}.def
       dlltool --dllname python${pytverstr}.dll --def python${pytverstr}.def --output-lib libpython${pytverstr}.a

python${pytverstr}.def:
       pexports $(PYTHONDLL) > $@

endif # win32
```

修改为：

```makefile
ifeq ($(PORTNAME), win32)
OBJS += ${python_bindir}/libpython${python_version}.dll
endif # win32
```

上面添加的`python_bindir`也就是在这里会用上。

`src/pl/plpython/Makefile`中的`clean`和`distclean`任务也得修改一下，不然把`${python_bindir}/libpython${python_version}.dll`会被误删：

```makefile
CLEAN_OBJS := $(filter-out ${python_bindir}/libpython${python_version}.dll, $(OBJS))
clean distclean: clean-lib
	rm -f $(CLEAN_OBJS)
	rm -rf $(pg_regress_clean_files)
```

另外，还有一点，在启动需要指定刚才的Python路径，类似：

```bash
PYTHONHOME=/e/mingw-w64-x86_64-python-3.8.6-6 PATH=/e/mingw-w64-x86_64-python-3.8.6-6/bin/:$PATH ./bin/pg_ctl.exe -D /e/testdb/ -l logfile start
```

#### 3.1.2 验证

创建 PL/Python3u 扩展:

```sql
CREATE EXTENSION plpython3u;
```

验证扩展安装是否成功：

```sql
SELECT lanname FROM pg_language;
```

一个简单验证的SQL：

```sql
CREATE OR REPLACE FUNCTION upper_case(text) RETURNS text AS $$
return args[0].upper()
$$ LANGUAGE plpython3u;

SELECT upper_case('hello, world!');
```



