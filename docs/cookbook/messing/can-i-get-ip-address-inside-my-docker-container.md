# 如何在Docker容器中得到IP地址

一般而言，Docker容器中的基础镜像都尽可能地小巧，因此往往不包含`ifconfig`等命令。

因此如果想不安装`net-tools`等包的情况下，如何得到当前的IP地址？

解决办法：

````bash
hostname -i
````

## 参考

- [Can I get ip address inside my docker container?](https://stackoverflow.com/questions/27670495/can-i-get-ip-address-inside-my-docker-container)

