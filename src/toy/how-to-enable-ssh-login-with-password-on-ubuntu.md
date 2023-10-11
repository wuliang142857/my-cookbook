---
icon: ubuntu
---

# ubuntu 20.04允许使用密码SSH登录

新安装完成的ubuntu 20.04.4，不允许使用ssh密码登录，报错信息：

````
Permission denied (publickey)
````

解决办法：编辑`/etc/ssh/sshd_config`，修改：

````
PasswordAuthentication yes
````

还有一点，如果想使用root登录，也得修改：

````
PermitRootLogin yes
````

