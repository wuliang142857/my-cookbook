---
title: "SSH 完整指南"

---

# SSH 完整指南

SSH 配置、优化和常见问题解决方案汇总。

## 常见问题排查

### 解决 SSH 登录慢

#### 方法一：关闭 DNS 反向解析

编辑 `/etc/ssh/sshd_config`：

```ini
UseDNS no
```

重启服务：

```bash
service ssh restart
```

#### 方法二：关闭 GSSAPI 认证

编辑 `/etc/ssh/ssh_config`：

```ini
GSSAPIAuthentication no
```

重启服务生效。

### 允许密码登录（Ubuntu 20.04+）

新安装的 Ubuntu 默认禁用密码登录，报错：

```
Permission denied (publickey)
```

编辑 `/etc/ssh/sshd_config`：

```ini
# 允许密码认证
PasswordAuthentication yes

# 如需 root 登录
PermitRootLogin yes
```

重启 SSH 服务：

```bash
sudo systemctl restart sshd
```

## 代理跳转

通过跳板机连接目标服务器，编辑 `~/.ssh/config`：

```ini
Host jump-server
    HostName 192.168.0.1
    User root
    Port 22
    StrictHostKeyChecking no

Host target-server
    HostName 192.168.0.2
    User admin
    Port 22
    StrictHostKeyChecking no
    ProxyJump jump-server
```

然后直接：

```bash
ssh target-server
```

## 端口转发

### 本地端口转发

将远程服务映射到本地端口：

```bash
# 通过 172.23.2.55 跳板机，将 172.19.2.152:3389 映射到本地 33333 端口
ssh -N -f -L 33333:172.19.2.152:3389 root@172.23.2.55
```

参数说明：
- `-N`：不执行远程命令
- `-f`：后台运行
- `-L`：本地端口转发

### 远程端口转发

将本地服务暴露到远程：

```bash
# 将本地 8080 端口暴露到远程服务器的 9090 端口
ssh -N -f -R 9090:localhost:8080 user@remote-server
```

## 参考

- [ssh端口转发](https://wangdoc.com/ssh/port-forwarding)
