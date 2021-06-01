# 如何解决开机总是有一个弹窗http://www.msftconnecttest.com/redirect
最近电脑每次连上网络后，都会在浏览器上弹出一个窗口，打开的是`http://www.msftconnecttest.com/redirect`

想关闭这无聊的微软：

- 输入：gpedit.msc ，开组策略控制台
- 依次展开：计算机配置 -> 管理模板 -> 系统 -> Internet 通信管理
- 在【`Internet 通信管理`】中找到【关闭 Windows 网络连接状态指示器活动测试】，选择“已启用”，这样就屏蔽了。

参考：

- [开机总是有一个弹窗 http://www.msftconnecttest.com/redirect ?](https://www.zhihu.com/question/59865134)

