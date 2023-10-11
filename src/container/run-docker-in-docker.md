---
icon: docker
---

# 如何在Docker容器中运行Docker

要想在Docker容器中运行Docker，最简单实用的方法就是挂载宿主机的`/var/run/docker.sock `给容器，例如：

```bash
docker run -v /var/run/docker.sock:/var/run/docker.sock -ti docker
```

然后就可以在容器中使用Docker了。



参考：

- [How To Run Docker in Docker Container [3 Easy Methods]](https://devopscube.com/run-docker-in-docker/)