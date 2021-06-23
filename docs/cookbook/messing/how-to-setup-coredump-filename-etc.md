# 如何设置core dump时coredump文件的路径和文件名

core dump所生产的core文件是我们还原异常的重要信息。

# 一、如何打开coredump文件

最简单粗暴：

````bash
ulimit -c unlimited
````

可以将上述这句命令写入`~/.bashrc`等登录加载的运行时配置文件中。

# 二、设置coredump和核心转储文件目录和命名规则

## 2.1 临时方法

`/proc/sys/kernel/core_uses_pid` 可以控制产生的 coredump 文件的文件名中是否添加 pid 作为扩展 ，如果添加则文件内容为 1 ，否则为 0。

`/proc/sys/kernel/core_pattern` 可以设置格式化的 coredump 文件保存位置或文件名，比如可以设置成：`/corefile/core-%e-%p-%t`，这样就会将coredump文件存放到`/corefile`目录下，并且文件名格式是：`core-命令-PID-时间戳`。

具体可选的参数有：

````
%p - insert pid into filename 添加 pid
%u - insert current uid into filename 添加当前 uid
%g - insert current gid into filename 添加当前 gid
%s - insert signal that caused the coredump into the filename 添加导致产生 core 的信号
%t - insert UNIX time that the coredump occurred into filename 添加 core 文件生成时的 unix 时间
%h - insert hostname where the coredump happened into filename 添加主机名
%e - insert coredumping executable name into filename 添加命令名
````

## 2.2 永久设置

编辑`/etc/sysctl.conf`，添加类似：

````ini
kernel.core_pattern=core.%p
````

然后运行生效：

````bash
sysctl -p /etc/sysctl.conf
````

# 参考

- [linux下的core文件路径及文件名设置](https://blog.csdn.net/qq_15437667/article/details/83934113)

