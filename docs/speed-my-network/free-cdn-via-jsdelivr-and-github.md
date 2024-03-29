---
icon: cdn
---

# 使用jsDelivr and Github作为免费CDN

最近发现通过 `https://jsd.cdn.zzko.cn/gh/Github用户名/Github仓库名@版本号/文件路径` 来访问Github的资源。

其中的 `@版本号` 是可选的，默认是 `master`，`版本号`可以是`Branch`、`TAG`和发布的版本号。

也就是说，以下这些地址都是可以的：

- 不指定版本号，默认走`master`： [https://jsd.cdn.zzko.cn/gh/wuliang142857/webfonts/css/monaco.css](https://jsd.cdn.zzko.cn/gh/wuliang142857/webfonts/css/monaco.css)
- 指定分支：[https://jsd.cdn.zzko.cn/gh/wuliang142857/webfonts@master/css/monaco.css](https://jsd.cdn.zzko.cn/gh/wuliang142857/webfonts@master/css/monaco.css)
- 指定TAG：[https://jsd.cdn.zzko.cn/gh/wuliang142857/webfonts@v0.1.0/css/monaco.css](https://jsd.cdn.zzko.cn/gh/wuliang142857/webfonts@v0.1.0/css/monaco.css)

此外，还有一个小技巧：直接访问 `https://jsd.cdn.zzko.cn/gh/Github用户名/Github仓库名@版本号/` 看到是资源目录列表。

PS：

[jsDelivr](https://www.jsdelivr.com/)作为免费CDN的一个非常大的优势就在于它在我们国内也有大量的节点：

![](https://jsd.cdn.zzko.cn/gh/wuliang142857/pictures-hosting@main/20211213/1.2houipfxj0s0.jpg)

图片来源于：[https://www.jsdelivr.com/network)

::: tip

有了这个功能，那么即使用Github做图床，速度也是非常可以的了。

:::

