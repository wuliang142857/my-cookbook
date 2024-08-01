---
icon: go
---

# 当CGO遇到交叉编译时的一些小技巧

## 背景

Go本身比较完美地支持交叉编译，通常只要指定==GOOS==和==GOARCH==就可以在本机为不同的操作系统和CPU架构编译出相应的二进制程序。

但如果涉及CGO了，就带来一些问题，当然这也不是Go带来的问题，本质上还是C的问题。

因此，这里总结一下相关使用技巧，以被后续再遇到时可以参考。

PS：我这里构建的机器是X86架构下ubuntu 20.04。

我们以比较常见的[mattn/go-sqlite3](https://github.com/mattn/go-sqlite3)为例，实例代码如下：

```go
package main

import (
	"database/sql"
	"fmt"
	"log"
	_ "github.com/mattn/go-sqlite3"
)

func main() {
	// 打开或创建数据库
	db, err := sql.Open("sqlite3", "./example.db")
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	// 创建表
	sqlStmt := `
	CREATE TABLE IF NOT EXISTS foo (id INTEGER NOT NULL PRIMARY KEY, name TEXT);
	DELETE FROM foo;
	`
	_, err = db.Exec(sqlStmt)
	if err != nil {
		log.Printf("%q: %s\n", err, sqlStmt)
		return
	}

	// 插入数据
	tx, err := db.Begin()
	if err != nil {
		log.Fatal(err)
	}
	stmt, err := tx.Prepare("INSERT INTO foo(id, name) VALUES (?, ?)")
	if err != nil {
		log.Fatal(err)
	}
	defer stmt.Close()
	_, err = stmt.Exec(1, "Hello")
	if err != nil {
		log.Fatal(err)
	}
	tx.Commit()

	// 读取数据
	rows, err := db.Query("SELECT id, name FROM foo")
	if err != nil {
		log.Fatal(err)
	}
	defer rows.Close()
	for rows.Next() {
		var id int
		var name string
		err = rows.Scan(&id, &name)
		if err != nil {
			log.Fatal(err)
		}
		fmt.Println(id, name)
	}
	err = rows.Err()
	if err != nil {
		log.Fatal(err)
	}
}
```

## 不同Linux版本的GLIBC版本不一致，低版本无法运行高版本的产物

我在ubuntu 20.04编译得到的二进制，放到centos7上就无法运行了。在centos7上`ldd`的结果如下：

```
./test: /lib64/libc.so.6: version `GLIBC_2.28' not found (required by ./test)
	linux-vdso.so.1 =>  (0x00007fff3b153000)
	libdl.so.2 => /lib64/libdl.so.2 (0x00007f13c2e3b000)
	libpthread.so.0 => /lib64/libpthread.so.0 (0x00007f13c2c1f000)
	libc.so.6 => /lib64/libc.so.6 (0x00007f13c2851000)
	/lib64/ld-linux-x86-64.so.2 (0x00007f13c303f000)

```

这里需要两方面的调整：

- 使用[musl libc](https://www.musl-libc.org/)来替代glibc
- 使用静态链接，而非动态链接

ubuntu 20.04下安装musl libc比较简单：

```bash
apt install -y musl-tools
```

然后指定使用`musl-gcc`和`-ldflags '-extldflags -static'`：

```bash
CGO_ENABLED=1 GOOS=linux GOARCH=amd64 CC=musl-gcc CXX=musl-gcc go build -ldflags '-extldflags -static'
```

通过`file`命令可以看出编译得到的产物是静态链接的：

```
test: ELF 64-bit LSB executable, x86-64, version 1 (SYSV), statically linked, Go BuildID=mIKpQ1G9dBl-hHZFDqUn/2Ub5ZRjfBAXEUgn9agR5/vlAboSCCToT3-frNQy9m/XXW5y9zlGcjE5CWwkWc4, with debug_info, not stripped
```

## 如何在X86架构的Linux编译得到针对ARM架构的Linux二进制

正如前面所言，Go的交叉编译是比较吸引人的特性。现在我们使用了musl libc来实现静态链接，但上面安装的musl libc是X86架构下的，想直接用它来编译针对ARM的二进制，还是不行的：

```
CGO_ENABLED=1 GOOS=linux GOARCH=arm64 CC=musl-gcc CXX=musl-gcc  go build -ldflags '-extldflags -static'
# runtime/cgo
gcc_arm64.S: Assembler messages:
gcc_arm64.S:30: Error: no such instruction: `stp x29,x30,[sp,'
gcc_arm64.S:34: Error: too many memory references for `mov'
gcc_arm64.S:36: Error: no such instruction: `stp x19,x20,[sp,'
gcc_arm64.S:39: Error: no such instruction: `stp x21,x22,[sp,'
gcc_arm64.S:42: Error: no such instruction: `stp x23,x24,[sp,'
gcc_arm64.S:45: Error: no such instruction: `stp x25,x26,[sp,'
gcc_arm64.S:48: Error: no such instruction: `stp x27,x28,[sp,'
gcc_arm64.S:52: Error: too many memory references for `mov'
gcc_arm64.S:53: Error: too many memory references for `mov'
gcc_arm64.S:54: Error: too many memory references for `mov'
gcc_arm64.S:56: Error: no such instruction: `blr x20'
gcc_arm64.S:57: Error: no such instruction: `blr x19'
gcc_arm64.S:59: Error: no such instruction: `ldp x27,x28,[sp,'
gcc_arm64.S:62: Error: no such instruction: `ldp x25,x26,[sp,'
gcc_arm64.S:65: Error: no such instruction: `ldp x23,x24,[sp,'
gcc_arm64.S:68: Error: no such instruction: `ldp x21,x22,[sp,'
gcc_arm64.S:71: Error: no such instruction: `ldp x19,x20,[sp,'
gcc_arm64.S:74: Error: no such instruction: `ldp x29,x30,[sp],'
```

因此，我们需要在我当前X86架构的ubuntu上，先编译得到一个ARM架构的musl libc，回头用这个ARM架构下的`musl-gcc`来作为工具链。

我们首先需要一个Linux下GCC针对ARM64的编译工具链：

```bash
sudo apt-get install gcc-aarch64-linux-gnu g++-aarch64-linux-gnu
```

然后下载musl-libc代码后，指定`CC`为`aarch64-linux-gnu-gcc`：

```bash
./configure --prefix=/opt/aarch64-musl CC=aarch64-linux-gnu-gcc
make
make install
```

然后在`go build`时，指定`CC`和`CXX`为这个刚安装的musl libc：`/opt/aarch64-musl/bin/musl-gcc`:

```bash
CGO_ENABLED=1 GOOS=linux GOARCH=arm64 CC=/opt/aarch64-musl/bin/musl-gcc CXX=/opt/aarch64-musl/bin/musl-gcc  go build -ldflags '-extldflags -static'
```

对产出物使用`file`来参看一下，确实是ARM架构下的：

```
test: ELF 64-bit LSB executable, ARM aarch64, version 1 (SYSV), statically linked, Go BuildID=n4wfJ_5W4z89w7rfoX91/R0HZHgZUXmp8dcwUM3kj/3Abaky1qezrDfOBLuwym/_u0wqEHF3h8CnMKg3KPB, with debug_info, not stripped
```

## Windows下的CC和CXX应该指定成什么

ARM架构下的Windows比较少，可以先不考虑。

安装`gcc-mingw-w64-x86-64`：

```bash
apt install gcc-mingw-w64-x86-64 gcc-mingw-w64-i686
```

针对64位的Windows：

```bash
CGO_ENABLED=1 GOOS=windows GOARCH=amd64 CC=x86_64-w64-mingw32-gcc CXX=x86_64-w64-mingw32-g++ go build -ldflags '-extldflags -static'
```

针对32位的Windows：

```bash
CGO_ENABLED=1 GOOS=windows GOARCH=386 CC=i686-w64-mingw32-gcc CXX=i686-w64-mingw32-g++ go build -ldflags '-extldflags -static'
```



