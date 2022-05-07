---
icon: git
---

# 如何解决no matching host key type found. Their offer: ssh-rsa,ssh-dss

## 一、问题现象

在使用[MSYS2](https://www.msys2.org/)中push代码时，发现出现了这么一个错误：

````console
Unable to negotiate with A.B.C.D port 22: no matching host key type found. Their offer: ssh-rsa,ssh-dss
fatal: Could not read from remote repository.

Please make sure you have the correct access rights
````

## 二、解决办法

编辑`~/.ssh/config`文件，添加对ssh-rsa的识别。

````
Host *
    HostKeyAlgorithms +ssh-rsa 
    PubkeyAcceptedKeyTypes +ssh-rsa
````

## 三、问题原因

参考[官方Release Notes](https://www.openssh.com/txt/release-8.7)的介绍：

>```
>OpenSSH will disable the ssh-rsa signature scheme by default in the
>next release.
>
>In the SSH protocol, the "ssh-rsa" signature scheme uses the SHA-1
>hash algorithm in conjunction with the RSA public key algorithm.
>It is now possible[1] to perform chosen-prefix attacks against the
>SHA-1 algorithm for less than USD$50K.
>
>Note that the deactivation of "ssh-rsa" signatures does not necessarily
>require cessation of use for RSA keys. In the SSH protocol, keys may be
>capable of signing using multiple algorithms. In particular, "ssh-rsa"
>keys are capable of signing using "rsa-sha2-256" (RSA/SHA256),
>"rsa-sha2-512" (RSA/SHA512) and "ssh-rsa" (RSA/SHA1). Only the last of
>these is being turned off by default.
>
>This algorithm is unfortunately still used widely despite the
>existence of better alternatives, being the only remaining public key
>signature algorithm specified by the original SSH RFCs that is still
>enabled by default.
>```

也就是说，从openssh 8.7开始，客户端默认禁用了`ssh-rsa`算法。

## 四、参考文档

- [no matching host key type found. Their offer: ssh-rsa,ssh-dss](https://www.zllr.top/archives/nomatchinghostkeytypefoundtheirofferssh-rsassh-dss)
- [Solution to openssh-8.8-p1 update: no matching host key type found. Their offer: ssh-rsa](https://ttys3.dev/post/openssh-8-8-p1-no-matching-host-key-type-found-their-offer-ssh-rsa/)
- [openssh release-8.7](https://www.openssh.com/txt/release-8.7)
