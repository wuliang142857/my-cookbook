---
icon: iterm2
---

# iTerm2下使用rz和sz

虽然大多数时候，我都更喜欢使用`scp`命令来传输文件。但有时候不得不用到`rz`和`sz`，比如通过跳板机登录的情况下。

折腾了一下[iTerm2](https://iterm2.com/)下怎么使用`rz`和`sz`。

## 配置手册

### 安装iterm2-zmodem

经过一通比较，比较好用的Z-Modem脚本是 [aurora/iterm2-zmodem](https://github.com/aurora/iterm2-zmodem)。

````bash
git clone https://github.com/aurora/iterm2-zmodem iterm2-zmodem
cp iterm2-zmodem/iterm2-zmodem /usr/local/bin/
sudo chmod a+x /usr/local/bin/iterm2-zmodem
````

### 配置iterm2-zmodem

打开 `iTerm2` -> `Preferences` -> `Profiles` 下选择相应的 `Profile`，然后编辑 `Advanced` -> `Triggers`，新增：

````
Regular expression: \*\*B0100
Action:             Run Coprocess
Parameters:         /usr/local/bin/iterm2-zmodem sz

Regular expression: \*\*B00000000000000
Action:             Run Coprocess
Parameters:         /usr/local/bin/iterm2-zmodem rz
````

类似：

![](https://cdn.jsdelivr.net/gh/wuliang142857/pictures-hosting@main/20211213/1.7dmu8xqryt00.jpg)

### 目标机器上安装lrzsz

````bash
# ubuntu/debian
apt-get install lrzsz

# CentOS/RHEL
yum install lrzsz
````

## 参考

 - [aurora/iterm2-zmodem](https://github.com/aurora/iterm2-zmodem)

