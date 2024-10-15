---
icon: git
---

# 如何对git项目中的文件进行加密

## 需求

日常工作我都是用markdown来记录，然后通过git上传到公司的gitlab的某个仓库进行存储。这就带来一个问题，虽然这个gitlab仓库中成员看似只有我一个人，但gitlab管理员对所有仓库有权限，这样就不太好玩了。

于是我就想当我push时，能够对所有的markdown文件进行加密；然后我pull时，对其中加密的markdown进行解密（因为可能有一些历史文件没有加密，或者有些文件是直接在gitlab页面上添加进去的等等情况）。

## 实现

实现过程其实很简单，通过Git过滤器就可以实现。

STEP 1，我们先通过GPG生成一对公私钥：

```bash
gpg --full-generate-key
```

查找刚才生成的公私钥的ID：

```bash
gpg --list-keys
```

![](https://image-hosting.wuliang142857.me/20240313/Xnip2024-03-13_22-50-25.6ik1j8h403.webp)

STEP 2，我们分别编写一个加密脚本和解密脚本。

加密脚本：

```bash
#!/usr/bin/env bash

# 临时文件用于保存stdin的内容
temp_file=$(mktemp)

# 从stdin读取内容并保存到临时文件
cat > "$temp_file"

# 检查文件是否为空或大小为0
if [ -s "$temp_file" ]; then
    # 文件非空，执行加密
    gpg --yes --batch --encrypt --recipient '密钥ID' < "$temp_file"
else
    # 文件为空，直接将空内容输出
    cat "$temp_file"
fi

# 清理临时文件
rm "$temp_file"
```

解密脚本：

```bash
#!/usr/bin/env bash

# 临时文件用于保存输入流
temp_file=$(mktemp)

# 保存标准输入到临时文件
cat > "$temp_file"

# 检查是否为GPG加密文件
if gpg --quiet --batch --list-packets "$temp_file" &> /dev/null; then
    # 是GPG加密文件，进行解密
    gpg --quiet --batch --decrypt "$temp_file"
else
    # 不是加密文件，直接输出原内容
    cat "$temp_file"
fi

# 清理临时文件
rm "$temp_file"
```

从这个加解密脚本也可以看出，其实加解密过程也并不是一定得用GPG，完全可以自定义。



STEP 3，为Git仓库根目录配置过滤器

```bash
git config filter.crypt.clean "path/to/scripts/encrypt.sh"
git config filter.crypt.smudge "path/to/scripts/decrypt.sh"
```

STEP 4，配置哪些文件需要经过上述的过滤器

在Git仓库根目录下新增/编辑`.gitattributes`文件，内容类似：

```bash
*.md filter=crypt
```

这样就实现了当push时自动加密，pull时解密：

![](https://image-hosting.wuliang142857.me/20240313/Xnip2024-03-13_22-58-05.8s322qa90e.webp)

## 其他注意事项

### 密钥备份

我这里因为采用GPG生成的公私钥作为密钥，为了防止密钥丢失，那么可以考虑将密钥导出后保存，下次万一丢失后就知道导入即可。

```bash
# 备份私钥
gpg --export-secret-keys 你的密钥ID > 私钥备份文件名.gpg

# 备份公钥
gpg --export 你的密钥ID > 公钥备份文件名.gpg

# 恢复私钥
gpg --import 私钥备份文件名.gpg

# 恢复公钥
gpg --import 公钥备份文件名.gpg

```

### 将本地所有文件全部加密

因为我本地已经有不少文档了，因此需要全部加密一下。很简单，只要将这些文档全部标记为==modified==即可：

```bash
find . -type f -name "*.md" -exec touch {} +
```

