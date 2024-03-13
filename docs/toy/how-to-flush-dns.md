---
icon: dns
---
# 各个Mac版本如何刷新DNS

DNS缓存有时候真的很烦，感觉迟迟不能生效。这里主要两方面原因:

- 一方面自身所连接到的DNS服务器的原因，DNS服务器端都没有更新，你自然更新不到。这种尤其是当服务部署在国外的一些运营商时尤其明显。
- 另一方面是自己本机的DNS有缓存。

我们针对这两种情况，都需要解决。

## 添加Google的公共DNS服务器

当出现服务部署在国外的运营商，而本地迟迟更新不到的情况时，这时通过添加Google的公共DNS地址来解决：

编辑`/etc/resolv.conf`，添加：

```
nameserver 8.8.8.8
nameserver 8.8.4.4
```

::: tip

一般而言，我不会长期将Google的DNS地址保存在`/etc/resolv.conf`中，只有当实在是需要时添加那么一会。因为延迟有点高。

:::

## 清除本机的DNS缓存

### Mac

Mac系统中，各个版本的清楚命令不太一样，汇总一样：

| MACOS 版本                   | 使用的命令                                                   |
| :--------------------------- | :----------------------------------------------------------- |
| macOS 12 (Monterey)          | `sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder` |
| macOS 11 (Big Sur)           | `sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder` |
| macOS 10.15 (Catalina)       | `sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder` |
| macOS 10.14 (Mojave)         | `sudo killall -HUP mDNSResponder`                            |
| macOS 10.13 (High Sierra)    | `sudo killall -HUP mDNSResponder`                            |
| macOS 10.12 (Sierra)         | `sudo killall -HUP mDNSResponder`                            |
| OS X 10.11 (El Capitan)      | `sudo killall -HUP mDNSResponder`                            |
| OS X 10.10 (Yosemite)        | `sudo discoveryutil udnsflushcaches`                         |
| OS X 10.9 (Mavericks)        | `sudo killall -HUP mDNSResponder`                            |
| OS X 10.8 (Mountain Lion)    | `sudo killall -HUP mDNSResponder`                            |
| Mac OS X 10.7 (Lion)         | `sudo killall -HUP mDNSResponder`                            |
| Mac OS X 10.6 (Snow Leopard) | `sudo dscacheutil -flushcache`                               |
| Mac OS X 10.5 (Leopard)      | `sudo lookupd -flushcache`                                   |
| Mac OS X 10.4 (Tiger)        | `lookupd -flushcache`                                        |

### Linux

Linux的话，根据发行版不同，方法也不太相同。也是汇总一下：

#### 系统化解决

大多数现代 Linux 发行版，例如 Ubuntu 18.04，都使用 systemd 解析的服务来缓存 DNS 条目:

```bash
sudo systemctl is-active systemd-resolved.service
```

如果该服务正在运行，则将打印命令 active，否则将看到 inactive。

要清除系统解析的 DNS 缓存，你需要键入以下命令:

```bash
sudo systemd-resolve --flush-caches
```

成功后，该命令不会返回任何消息。

#### Dnsmasq

Dnsmasq 是轻量级的 DHCP 和 DNS 缓存名称服务器。

如果你的系统使用 DNSMasq 作为缓存服务器，则要清除 DNS 缓存，需要重新启动 Dnsmasq 服务：

```bash
sudo systemctl restart dnsmasq.service
```

#### NSCD

NSCD是一个缓存守护进程，它是大多数RedHat发行版的首选DNS缓存系统（ubuntu也有）。

```bash
# 安装nscd
yum -y install nscd
# 查看状态
systemctl status nscd 
# 没启动的话启动一下
systemctl start nscd
# 删除
apt install nscd
# 或者重启nscd服务也可以删除
systemctl restart nscd
```

### Windows

Windows下命令比较统一：

```powershell
ipconfig /flushdns
```



