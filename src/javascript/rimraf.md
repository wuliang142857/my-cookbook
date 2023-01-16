---
icon: rm
---
# rimraf：用node编写的`rm -rf`

## 一、背景

在使用nodejs中，很多时候需要做一些删除目录/文件的操作。比如在`package.json`中自定义`clean`命令：

````json
{
    "scripts": {
    	"clean": "rimraf lib-es5"
    }
}
````

这个问题的核心在于Windows和Unix的`rm`命令有差异。

因此需要一个跨平台的`rm`命令。

## 二、使用rimraf

[isaacs/rimraf](https://github.com/isaacs/rimraf) 本身实现很简单，无非就是递归地判断&删除。

简单使用即可。

