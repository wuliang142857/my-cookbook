---
sidebar: auto
---
# git使用Socks5代理的合理配置
## 背景

国内从[github](https://github.com/)中clone实在太慢了，而且还经常压根连不上。

于是就想着干脆通过代理吧，参考网上的一些方法，总结一下git使用Socks5代理的合理设置。

### 需求

先总结一下我对git使用代理的需求：
- 支持`ssh://`和`https://`两种协议
- 仅clone github时使用代理，其他地址比如公司内部的gitlab地址不使用代理

## 设置
### `ssh://协议`
通过我个人亲测，针对`ssh://`协议最简单的方式还是通过[gotoh/connect](https://bitbucket.org/gotoh/connect)来指定代理命令（ProxyCommand）。

#### 安装connect
[gotoh/connect](https://bitbucket.org/gotoh/connect)的安装比较简单，通过`brew`、`yum`、`apt-get`等安装包工具都可以安装。实在不行的话，还可以自己编译，反正就一个[connect.c](https://bitbucket.org/gotoh/connect/src/default/connect.c)文件。

#### ssh配置
在`$HOME/.ssh/`目录下编辑/新增一个名为`config`文件，配置如下：
````
Host github.com
    User git
    ProxyCommand connect -S <your-proxy-host>:<your-proxy-port> %h %p
````
其中的`<your-proxy-host>`是你的代理服务器IP/主机名；`<your-proxy-port>`是你的代理服务器监听的端口。

然后需要修改一下你这个`$HOME/.ssh/config`文件的权限：
````bash
chmod 755 $HOME/.ssh/config
````

经过上述的配置，现在我们clone走`ssh://`协议的github仓库时就可以走代理了。

### `https://协议`
`https://`协议比较坑，走了一些弯路，问题主要是很多人都说类似的配置：
````bash
git config --global https.proxy http://proxy.com:1234
````
其实就也就是在`$HOME/.gitconfig`下加类似如下两行：
````ini
[https]
    proxy = http://proxy.com:1234
````
但实事证明，这样设置是完全没有用的！！！

经过我的反复尝试，最后竟然是这样设置：
````bash
git config --global http.proxy http://proxy.com:1234
````
也就是即使是走`https://`协议的代理，但也得设置到`http`上。

另外，我们还是希望只有[github](https://github.com/)时才走代理，因此整个设置就是如下：
````ini
[http]
    sslverify = false
[http "https://github.com/"]
    proxy = socks5h://<your-proxy-host>:<your-proxy-port>
````
另外，注意一下这里我使用的是`socks5h://`，而不是`socks5://`，当然使用`socks5://`也可以，两者的区别在于`socks5h://`使用的是代理服务器上的DNS解析，`socks5://`使用的是本机的DNS解析。

::: tip

只有当git 1.8.5开始才能支持可以针对为每个URL配置不同的代理[git 1.8.5 RelNotes](https://github.com/git/git/blob/bb80ee09974667a1db6bbc5e33574ed869b76a88/Documentation/RelNotes/1.8.5.txt#L69-L78)

:::

## 参考

- [如何为 Git 设置代理？](https://segmentfault.com/q/1010000000118837)：此问答上大家各抒己见介绍了多种代理的办法，有对有错，可以自行参考实践。

- [Short tip: Clone Git repository via SSH and SOCKS proxy](https://cstan.io/?p=11673&lang=en)：关于`socks5h://`和`socks5://`的区别
- [Only use a proxy for certain git urls/domains?](https://stackoverflow.com/questions/16067534/only-use-a-proxy-for-certain-git-urls-domains)：`https://`协议下，如何只针对github地址使用代理
- [git 1.8.5 RelNotes](https://github.com/git/git/blob/bb80ee09974667a1db6bbc5e33574ed869b76a88/Documentation/RelNotes/1.8.5.txt#L69-L78)

