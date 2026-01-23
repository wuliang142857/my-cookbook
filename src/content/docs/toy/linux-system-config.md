---
title: "Linux 系统配置指南"

---

# Linux 系统配置指南

常用的 Linux 系统配置，包括网络、电源管理、主机名等。

## 网络配置

### 禁用 IPv6

#### 临时生效

```bash
sudo sysctl -w net.ipv6.conf.all.disable_ipv6=1
sudo sysctl -w net.ipv6.conf.default.disable_ipv6=1
sudo sysctl -w net.ipv6.conf.lo.disable_ipv6=1
```

#### 永久生效

编辑 `/etc/sysctl.conf`：

```bash
net.ipv6.conf.all.disable_ipv6=1
net.ipv6.conf.default.disable_ipv6=1
net.ipv6.conf.lo.disable_ipv6=1
```

应用配置：

```bash
sudo sysctl -p /etc/sysctl.conf
```

### 设置主机名

使用 systemd 的 `hostnamectl`：

```bash
sudo hostnamectl set-hostname NEW_HOSTNAME
```

还需检查以下配置：

1. **检查 `/etc/hosts`**：确保没有旧主机名的映射
2. **检查 `/etc/sysconfig/network`**：确认 `HOSTNAME` 值正确（如果存在）

### 刷新 DNS 缓存

#### Mac

```bash
# macOS 10.15+ (Catalina, Big Sur, Monterey, Ventura...)
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
```

#### Linux

```bash
# systemd-resolved（Ubuntu 18.04+）
sudo systemd-resolve --flush-caches

# Dnsmasq
sudo systemctl restart dnsmasq.service

# NSCD（RedHat 系）
sudo systemctl restart nscd
```

#### Windows

```powershell
ipconfig /flushdns
```

#### 添加公共 DNS

编辑 `/etc/resolv.conf`：

```
nameserver 8.8.8.8
nameserver 8.8.4.4
```

::: tip
Google DNS 延迟较高，建议仅在需要时临时添加。
:::

## 电源管理

### 合盖不休眠（笔记本服务器）

编辑 `/etc/systemd/logind.conf`：

```ini
HandleLidSwitch=ignore
```

重启服务：

```bash
sudo service systemd-logind restart
```

| Ubuntu 版本 | 测试状态 |
|-------------|----------|
| 20.04 | ✅ |
| 18.04 | ✅ |

## 参考

- [How to Disable IPv6 on Ubuntu Linux](https://itsfoss.com/disable-ipv6-ubuntu-linux/)
- [How to Set or Change System Hostname in Linux](https://www.tecmint.com/set-hostname-permanently-in-linux/)
