---
icon: vue
---

# 如何让VuePress输出的HTML文档可以离线阅读

[VuePress](https://vuepress.vuejs.org/) 是一个非常不错的静态网站生成器，但它生成的静态文件只能托管在HTTP服务上采用浏览。

但有时候我们并没有HTTP服务器可以托管，因此希望在本地浏览器打开就可以访问。在VuePress Issue中也有很多类似问题，比如：

 - [#796](https://github.com/vuejs/vuepress/issues/796)
 - [#387](https://github.com/vuejs/vuepress/issues/387) 

于是最近就撸了一个工具：[offline-vuepress](https://github.com/wuliang142857/offline-vuepress)，可将输出的HTML文件被离线阅读。

## 使用方法

安装

````bash
yarn install -g vuepress-offline
````

假如您的VuePress输出目录是`dist`，那么通过`-d`参数来指定输出目录:

````bash
vuepress-offline -d dist
````

## 特征

 - 支持对HTML页面中`css`、`javascript`、`image`、`超链接`的转换
 - 支持对CSS中部分`import`的转换