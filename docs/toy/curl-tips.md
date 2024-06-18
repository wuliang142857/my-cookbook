---
icon: curl
---

# curl命令使用技巧汇总

## 输出响应时间

```bash
curl -o /dev/null -s -w "time_connect: %{time_connect}\ntime_starttransfer: %{time_starttransfer}\ntime_total: %{time_total}\n" http://www.example.com
```

输出结果类似：

```
time_connect: 0.147957
time_starttransfer: 0.291432
time_total: 0.292078
```

- time_connect：建立到服务器的 TCP 连接所用的时间
- time_starttransfer：在发出请求之后，Web 服务器返回数据的第一个字节所用的时间
- time_total：完成请求所用的时间