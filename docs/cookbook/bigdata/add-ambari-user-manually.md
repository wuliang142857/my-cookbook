# 手工添加Ambari必备的用戶

[Ambari](https://ambari.apache.org/)添加新的主机后，需要添加相应的用户：

````bash
useradd -s  /bin/bash -d /home/hive -m -G hadoop hive
useradd -s  /bin/bash -d /home/hbase -m -G hadoop hbase
useradd -s  /bin/bash -d /home/yarn -m -G hadoop yarn
useradd -s  /bin/bash -d /home/mapred -m -G hadoop mapred
useradd -s  /bin/bash -d /home/yarn-ats -m -G hadoop yarn-ats
useradd -s  /bin/bash -d /home/ambari-qa -m -G hadoop ambari-qa
useradd -s  /bin/bash -d /home/ams -m -G hadoop ams
useradd -s  /bin/bash -d /home/spark -m -G hadoop spark
useradd -s  /bin/bash -d /home/hdfs -m -G hadoop hdfs
useradd -s  /bin/bash -d /home/tez -m -G hadoop tez
````

