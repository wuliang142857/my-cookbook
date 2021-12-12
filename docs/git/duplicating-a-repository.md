---
icon: git
---

# 如何复制一个git仓库

有时候，我们需要复制[Github](https://github.com/)一个仓库到自己、公司的私有库，类似Fork的功能。

## 镜像一个仓库

1. bare clone一个仓库

````bash
git clone --bare https://github.com/exampleuser/old-repository.git
````

2. mirror push到新仓库

````bash
git push --mirror https://github.com/exampleuser/new-repository.git
````

## 参考

- [Github Duplicating a repository](https://docs.github.com/en/github/creating-cloning-and-archiving-repositories/creating-a-repository-on-github/duplicating-a-repository)