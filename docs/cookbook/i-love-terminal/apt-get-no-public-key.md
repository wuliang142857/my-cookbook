# GPG error The following signatures couldn't be verified because the public key is not available NO_PUBKEY 解决办法

在`apt-get update`时，如果遇到==NO_PUBLIC==错误：

::: warning

W: GPG error: http://ppa.launchpad.net karmic Release: The following signatures couldn't be verified because the public key is not available: NO_PUBKEY **D45DF2E8FC91AE7E**

:::

解决办法：

````bash
sudo apt-key adv --keyserver keyserver.ubuntu.com --recv-keys D45DF2E8FC91AE7E
````
