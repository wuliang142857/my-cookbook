---
icon: ftp
---

# 如何使用pyftpdlib搭建一个简易的FTP服务器

## 背景

最近公司的项目，要对接客户这边的FTP。天啊，竟然还有用FTP的，这玩意我感觉大学时上Linux课时搭建过后，再也没有用过了。

搭建FTP服务器，最标准的方法自然是用[vsftpd](https://security.appspot.com/vsftpd.html)，事实我也是。只是`vsftpd`配置确实复杂，我这边也就是为了简单搭建一个用于开发对接，也不求性能，因此在用`vsftpd`搭建完成后，过后我尝试了自己写一个Python版本的FTP。可以后续简单易用。

## 过程

### 安装依赖

咱们直接基于现成的[pyftpdlib](https://github.com/giampaolo/pyftpdlib)开搞即可。

```bash
pip install pyftpdlib
```

 ### 代码

```python
from argparse import ArgumentParser
import os
from pyftpdlib.authorizers import DummyAuthorizer
from pyftpdlib.handlers import FTPHandler
from pyftpdlib.servers import FTPServer

def main():
    parser = ArgumentParser("测试FTP, vsftpd太繁琐了")
    parser.add_argument("--username", type=str, dest="username", default=os.environ.get("FTP_USERNAME", "admin"), help="FTP用户名")
    parser.add_argument("--password", type=str, dest="password", default=os.environ.get("FTP_PASSWORD", "admin"), help="FTP用户的密码")
    parser.add_argument("--data-dir", type=str, dest="dataDir", default=os.environ.get("FTP_DATA_DIR", os.getcwd()), help="数据存放目录")
    parser.add_argument("--port", type=int, dest="port", default=os.environ.get("FTP_PORT", 2121), help="端口")
    arguments = parser.parse_args()
    username = arguments.username
    password = arguments.password
    dataDir = arguments.dataDir
    port = arguments.port

    authorizer = DummyAuthorizer()
    authorizer.add_user(username, password, dataDir, perm="elradfmwMT")

    handler = FTPHandler
    handler.authorizer = authorizer

    server = FTPServer(("0.0.0.0", int(port)), handler)
    server.max_cons = 128
    server.max_cons_per_ip = 32
    server.serve_forever()

if __name__ == '__main__':
    main()
```

