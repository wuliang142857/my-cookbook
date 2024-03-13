---
icon: docker
---

# 如何使用Azure镜像解决K8S仓库下载问题

## 背景
在一些K8S环境中，服务器并没有直接访问`k8s.gcr.io`、`gcr.io`等仓库的权限，这就需要docker命令能使用代理。

其中的办法其实挺多，单最简单的还是直接使用azure提供的容器服务。

:::tip
此方法只能用作IP在中国大陆的服务器
:::

## 配置方法

和直接提供镜像服务器不同的话，Azure提供的是不同的镜像名称。

| Global | Proxy in China | format | example |
| ---- | ---- | ---- | ---- |
| [dockerhub](hub.docker.com) (docker.io) | [dockerhub.azk8s.cn](http://mirror.azk8s.cn/help/docker-registry-proxy-cache.html) | `dockerhub.azk8s.cn/<repo-name>/<image-name>:<version>` | `dockerhub.azk8s.cn/microsoft/azure-cli:2.0.61` `dockerhub.azk8s.cn/library/nginx:1.15` |
| gcr.io | [gcr.azk8s.cn](http://mirror.azk8s.cn/help/gcr-proxy-cache.html) | `gcr.azk8s.cn/<repo-name>/<image-name>:<version>` | `gcr.azk8s.cn/google_containers/hyperkube-amd64:v1.18.4` |
| us.gcr.io | usgcr.azk8s.cn | `usgcr.azk8s.cn/<repo-name>/<image-name>:<version>` | `usgcr.azk8s.cn/k8s-artifacts-prod/ingress-nginx/controller:v0.34.1` |
| k8s.gcr.io | k8sgcr.azk8s.cn | `k8sgcr.azk8s.cn/<repo-name>/<image-name>:<version>` | `k8sgcr.azk8s.cn/ingress-nginx/controller:v0.35.0` <br>`k8sgcr.azk8s.cn/autoscaling/cluster-autoscaler:v1.18.2` |
| quay.io | [quay.azk8s.cn](http://mirror.azk8s.cn/help/quay-proxy-cache.html) | `quay.azk8s.cn/<repo-name>/<image-name>:<version>` | `quay.azk8s.cn/deis/go-dev:v1.10.0` |
| mcr.microsoft.com | mcr.azk8s.cn| `mcr.azk8s.cn/<repo-name>/<image-name>:<version>` | `mcr.azk8s.cn/oss/nginx/nginx:1.17.3-alpine` |

## 参考

- [AKS on Azure China Best Practices](https://github.com/Azure/container-service-for-azure-china/blob/master/aks/README.md)
- [下载k8s.gcr.io仓库的镜像的两个方式](https://blog.csdn.net/fly910905/article/details/120911981)