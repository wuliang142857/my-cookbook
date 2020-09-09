---
sidebar: auto
---
# npm离线安装
## 背景
想使用[pm2](https://pm2.keymetrics.io/)来管理进程，但因为线上环境不能访问外网，又没有内部源。因此就想看看npm能否离线安装包。

## 使用npm-bundle
[npm-bundle](https://github.com/majgis/npm-bundle)可以将一个包及其依赖全部打包成一个`.tgz`文件。
先在联网环境安装`npm-bundle`
````bash
npm install -g npm-bundle
````
然后打包pm2
````bash
npm-bundle pm2
````
上述名称会生成一个tgz的包文件，复制这个文件到线上环境安装即可。
````bash
npm install -g ./pm2-3.2.2.tgz
````

## 参考
- [离线安装npm包的几种方法](https://jingsam.github.io/2018/11/24/npm-package-offline-install.html)
