# 批量修改git提交的用户名和Email

有时候git配置错了用户名和邮箱，想修改过来，可以用如下这个脚本：

[fix-git-username-email.sh](https://gist.github.com/wuliang142857/cd2a505273dedcd80677c9f7526bec54)

使用方法：

````
Usage fix-git-username-email.sh arguments ...
 
Arguments:
  --help
        Display the help screen
 
  --unexpected-username
        Unexpected username which you want to fix
 
  --unexpected-email
        Unexpected email which you want to fix
 
  --expected-username
        Username what you expected
 
  --expected-email
        Email what you expected
````

这个脚本可以支持对用户名和email的修改：`--unexpected-username` 和 `--unexpected-email` 两者必须至少指定一个；`--expected-username` 和 `--expected-email` 也必须至少指定一个。

