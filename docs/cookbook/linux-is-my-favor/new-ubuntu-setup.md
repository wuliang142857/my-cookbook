# ubuntu 设置

设置源

````
deb http://mirrors.aliyun.com/ubuntu/ focal main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ focal main restricted universe multiverse

deb http://mirrors.aliyun.com/ubuntu/ focal-security main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ focal-security main restricted universe multiverse

deb http://mirrors.aliyun.com/ubuntu/ focal-updates main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ focal-updates main restricted universe multiverse

deb http://mirrors.aliyun.com/ubuntu/ focal-proposed main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ focal-proposed main restricted universe multiverse

deb http://mirrors.aliyun.com/ubuntu/ focal-backports main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ focal-backports main restricted universe multiverse
````

安装openssh-server

````bash
sudo apt-get install openssh-server vim
````

ssh打通



安装apt-fast

````bash
sudo apt-get install apt-fast
````

恢复apt-get install

https://askubuntu.com/questions/2389/generating-list-of-manually-installed-packages-and-querying-individual-packages

https://askubuntu.com/questions/9135/how-to-backup-settings-and-list-of-installed-packages

恢复 pip

https://stackoverflow.com/questions/6600878/find-all-packages-installed-with-easy-install-pip

恢复 npm

https://stackoverflow.com/questions/17937960/how-to-list-npm-user-installed-packages/25497068

Sudo 免密码

````
sgxadmin ALL=(ALL) NOPASSWD: ALL
````

修改host



````bash
python3 /home/sgxadmin/zone/AliDDNS/aliddns.py LTAIf7w45WAfbqRA rzTpBet8w0IqH8ucGRC3OiAjGKqtVQ sgx-test cydw.xyz
````



