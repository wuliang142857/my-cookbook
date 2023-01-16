---
icon: ambari
---

# 如何在Ambari中更新主机名

因为公司测试环境所有主机的主机名的变化，需要修改整套环境的所有主机的主机名。

## 前置工作

- 所有主机的本身的主机名已修改
- 备份Ambari数据库
- 禁用Kerberos
    - 在Ambari页面中，访问**Admin** > **Kerberos** 并且点击 **Disable Kerberos**

## 步骤

1. 在 **Ambari Web > Background Operations** 中，停止所有的组件和任务。
2. 停止所有的服务
3. 去每台机器上停用 `ambari-server` 和 `ambari-agents`

````bash
ambari-server stop
ambari-agent stop
````

4.  创建一个**\*.json**文件，比如 `host_names_changes.json`：

````json
{
  "cluster1" : {
      "c6400.ambari.apache.org" : "c6410.ambari.apache.org",
      "c6401.ambari.apache.org" : "c6411.ambari.apache.org",
     ....
  }
}
````

文件格式是K/V格式，`"current_host_name" : "new_host_name"`。

5. 在ambari-server上所在的主机上执行类似以下命令：

````bash
ambari-server update-host-names host_names_changes.json
````

6. 上述这个命令只会修改存储在数据库中的主机名信息，但并不会修改`/etc/ambari-agent/conf/ambari-agent.ini`文件。因为`ambari-agent.ini`包含了ambari-server的地址，因此得手动修改一下。
7. 启动所有主机上的`ambari-server`和`ambari-agent`

````bash
ambari-server start
ambari-agent start
````

8. 此外还有一个问题，如果你使用了**NameNode HA**，那么还得：

    a. 先启动ZooKeeper服务

    b. 在某台NameNode主机上执行：

    `````bash
    hdfs zkfc -formatZK -force
    `````

9. 在**Ambari页面**上启动所有的服务

## 参考

- [Ambari官方文档:Chapter 8. Changing Host Names](https://docs.cloudera.com/HDPDocuments/Ambari-2.6.2.0/bk_ambari-administration/content/ch_changing_host_names.html)

