# 删除Docker中的APT的缓存

当在docker ubuntu中使用apt安装一些软件包后，会需要进行删除。比较合理&干净的命令是：

````bash
apt-get clean autoclean
apt-get autoremove --yes
rm -rf /var/lib/{apt,dpkg,cache,log}/
````

