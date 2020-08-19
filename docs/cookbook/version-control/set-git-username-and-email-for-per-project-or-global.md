---
title: git用户名和邮箱的设置
tags:
    - git
---

# 背景

很多码农除了日常公司的一些项目开发外，自己也会玩一些开源项目。因此这里就涉及了如何为不同类型的项目设置不同的`用户名`和`邮箱`。

Git提供了三处可以为设置`用户名`和`邮箱`的地方：

1. `项目级别` 我们可以为每个仓库（Repository）单独配置，它存储在项目根目录下的 `.git/config`。
2. `全局` 我们也可以为每个当前用户进行配置，他存在在用户目录下的 `.gitconfig`，比如：`~/.gitconfig`。
3. `系统` 也可以为整个系统进行配置，它对系统中的所有用户和项目都有效，在Linux系统中，一般在`/etc/gitconfig`里。

上述这些配置，它们的生效优先级是： `1 > 2 > 3`

# 为单个仓库配置用户名/邮箱

````bash
git config user.name "Your project specific name"
git config user.email "your@project-specific-email.com"
````

# 为全局配置用户名/邮箱

````bash
git config --global --get user.name
git config --global --get user.email
````

# 为系统配置用户名/邮箱

````bash
git config --system user.name "Your default name"
git config --system user.email "your@system-email.com"
````

