---
icon: cdn
---

# 使用jsDelivr and Github作为免费CDN

最近发现通过 `https://cdn.jsdelivr.net/gh/Github用户名/Github仓库名@版本号/文件路径` 来访问Github的资源。

其中的 `@版本号` 是可选的，默认是 `master`，`版本号`可以是`Branch`、`TAG`和发布的版本号。

也就是说，以下这些地址都是可以的：

- 不指定版本号，默认走`master`： [https://cdn.jsdelivr.net/gh/wuliang142857/webfonts/css/monaco.css](https://cdn.jsdelivr.net/gh/wuliang142857/webfonts/css/monaco.css)
- 指定分支：[https://cdn.jsdelivr.net/gh/wuliang142857/webfonts@master/css/monaco.css](https://cdn.jsdelivr.net/gh/wuliang142857/webfonts@master/css/monaco.css)
- 指定TAG：[https://cdn.jsdelivr.net/gh/wuliang142857/webfonts@v0.1.0/css/monaco.css](https://cdn.jsdelivr.net/gh/wuliang142857/webfonts@v0.1.0/css/monaco.css)

此外，还有一个小技巧：直接访问 `https://cdn.jsdelivr.net/gh/Github用户名/Github仓库名@版本号/` 看到是资源目录列表。

PS：

[jsDelivr](https://www.jsdelivr.com/)作为免费CDN的一个非常大的优势就在于它在我们国内也有大量的节点：

![Screenshot2021-06-11 20.24.42.png](https://tva1.sinaimg.cn/large/008jQjtOly1grelkcjawaj31qu0wqdsq.jpg)

图片来源于：[https://www.jsdelivr.com/network)

::: tip

有了这个功能，那么即使用Github做图床，速度也是非常可以的了。

:::

