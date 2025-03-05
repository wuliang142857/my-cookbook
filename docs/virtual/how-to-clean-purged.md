---
icon: docker
---

# 对Docker资源做清理

开发服务器上的docker永久了，自然上面有一堆不再需要的资源，比如镜像、Volumne等。汇总、备份一下清理命令：

1. 删除所有悬空（dangling）的镜像

```bash
docker image prune -f
```

2. 删除所有未被容器引用的镜像

这将删除所有未被**任何容器**使用的镜像，而不仅仅是悬空镜像。

```bash
docker image prune -a
```

3. 强制删除所有未使用的镜像

```bash
docker rmi $(docker images -q)
```

4. 对整个Docker所有资源做清理

```bash
docker system prune -a -f
```

5. 清理不再使用的Volumne

```bash
docker system prune --volumes -f
```

