---
icon: postgresql
---

# pg_bulkload在Windows上编译通过

[pg_bulkload](https://github.com/ossc-db/pg_bulkload/)是针对[PostgreSQL](https://www.postgresql.org/)的一款高性能数据导入工具。

但遗憾的是，作者默认只支持Linux/Unix版本，但没有考虑Windows。并且作者也说了，“因为他不熟悉Windows编程”。

![Screenshot2022-06-24-11](https://cdn.jsdelivr.net/gh/wuliang142857/pictures-hosting@main/20220624/Screenshot2022-06-24-11.5grws6312ic0.png)

相关issue: [ossc-db/pg_bulkload/issues/15](https://github.com/ossc-db/pg_bulkload/issues/15)。

但我司恰恰需要在Windows上的PostgreSQL上使用上这款工具，毕竟它的性能优势吸引力还是挺大的。

于是，尝试在Windows上编译了一把，并解决了过程中的很多问题。

## 问题一：EBADFD 没有声明

````
In file included from recovery.c:1076:
pg_bulkload_win32.c: In function 'TranslateSocketError':
pg_bulkload_win32.c:91:33: error: 'EBADFD' undeclared (first use in this function); did you mean 'EBADF'?
   91 |                         errno = EBADFD;
      |                                 ^~~~~~
      |                                 EBADF
pg_bulkload_win32.c:91:33: note: each undeclared identifier is reported only once for each function it appears in
make[1]: *** [<builtin>: recovery.o] Error 1
````



