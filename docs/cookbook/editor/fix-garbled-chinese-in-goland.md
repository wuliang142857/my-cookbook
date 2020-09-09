# 解决goland的中文乱码问题

编辑器配置：

![Image-2020-08-12-004.png](https://tva1.sinaimg.cn/large/703708dcly1ghodvr56myj215r0s6n0w.jpg)

goland JVM配置：

在 `Help` -> `Edit Custom VM Options`添加

````
-Dfile.encoding=UTF8
````

![Image-2020-08-12-005.png](https://tva1.sinaimg.cn/large/703708dcly1ghody8vwzhj20yp0b9q4n.jpg)



另外，还推荐使用[editorconfig](https://editorconfig.org/)来为整个项目进行配置：在项目根目录下添加：`.editorconfig`，内容可以大致如下：

````yaml
# http://editorconfig.org

root = true

[*]
charset = utf-8
indent_style = space
indent_size = 4
end_of_line = lf
insert_final_newline = true

[*.yaml]
indent_size = 2

[*.yml]
indent_size = 2

[*.xml]
indent_size = 2
max_line_length = 1000

[*.json]
indent_size = 2
max_line_length = 1000

# https://github.com/Dreamscapes/makefiles/blob/master/.editorconfig
[{Makefile,**.mk}]
indent_style = tab

````



::: tip

[Jetbrains](https://www.jetbrains.com/)家的其他编辑器应该也一样

:::