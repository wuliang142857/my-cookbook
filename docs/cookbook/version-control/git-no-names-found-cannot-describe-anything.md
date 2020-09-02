# 解决当git describe时出现“No names found, cannot describe anything”的错误

# 背景

一般而言，我们喜欢直接将git项目仓库的Tag号打包到代码中，这样至少可以很明确地知道线上究竟是哪一个版本。

通常这个版本信息的获取都是通过类似如下命令：

````bash
git describe --long --tags --dirty
````

但遇到一个问题，如果这个git仓库还没有任何一个Tag，那么就报了一个错误：

````bash
fatal: No names found, cannot describe anything.
````

# 解决办法

一个最简单的解决思路就是当Tag不存在时，直接使用最新的Commit Id来作为版本号也可以，因此只需这样：

````bash
git describe --long --tags --dirty --always
````

这个命令在有Tag时会取Tag信息作为版本号，没有Tag时会取Commit Id，非常赞。

