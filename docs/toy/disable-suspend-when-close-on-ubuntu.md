---
icon: ubuntu
---

# ubuntu中，设置合上笔记本盖子不修改的方法

## 方法

编辑`/etc/systemd/logind.conf`文件，将

````ini
#HandleLidSwitch=suspend
````

修改为：

````ini
HandleLidSwitch=ignore
````

然后重启服务：

````bash
sudo service systemd-logind restart
````

## 测试环境

| Ubuntu版本 | 是否可行           |
| ---------- | ------------------ |
| 20.04      | :white_check_mark: |
| 18.04      | :white_check_mark: |

## 参考

- [https://blog.csdn.net/xiaoxiao133/article/details/82847936](https://blog.csdn.net/xiaoxiao133/article/details/82847936)

