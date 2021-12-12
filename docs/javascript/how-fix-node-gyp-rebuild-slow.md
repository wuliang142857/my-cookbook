---
icon: nodejs
---

# 如何修复node-gyp rebuild非常慢/卡死的问题

````bash
#!/usr/bin/env bash

# 获得 nodejs 版本号
NODE_VERSION=`node -v | cut -d'v' -f 2`

# node-gyp缓存目录
NODE_GYP_DIR=$HOME/.node-gyp
rm -rf $NODE_GYP_DIR
mkdir -pv $NODE_GYP_DIR/$NODE_VERSION

wget -qO- https://npm.taobao.org/mirrors/node/v$NODE_VERSION/node-v$NODE_VERSION.tar.gz | tar xz --strip-components 1 - -C $NODE_GYP_DIR/$NODE_VERSION

# 创建一个标记文件
printf "9\n"> $NODE_GYP_DIR/$NODE_VERSION/installVersion
````

## 参考

- [Node Gyp Rebuild Too Slow](https://juejin.cn/post/6844903919638806535)

