---
icon: maven
---

# 解决org.apache.rat:apache-rat-plugin check, Too many unapproved license

在Maven打包时，遇到报错信息：

````
[ERROR] Failed to execute goal org.apache.rat:apache-rat-plugin:0.8:check (default) on project hbase: Too many unapproved licenses: 513 -> [Help 1]
````
这个是因为有大量源文件缺少版权的头部信息。两种解决办法：

## 方法一：在各个源文件的头部添加版权信息
````java
/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
````

## 方法二：跳过检查
在maven命令中，添加参数：
````bash
-Dlicense.skip=true -Drat.ignoreErrors=true 
````
或者添加参数：
````bash
apache-rat:check -Drat.numUnapprovedLicenses=9999
````
其中`rat.numUnapprovedLicenses`是需要检查源文件的阈值，可以设置得大一点。

## 参考
- [解决org.apache.rat:apache-rat-plugin:0.8:check (default) on project hbase: Too many unapproved license](https://blog.csdn.net/plgy_Y/article/details/78098285)