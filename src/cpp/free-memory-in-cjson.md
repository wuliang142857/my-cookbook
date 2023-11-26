---
icon: json
---

# CJSON中的内存释放

CJSON是我比较喜欢和常用的JSON解析库，但没注意的话容易内存泄露，主要因为它有两个释放内存的函数：`cJSON_free`和`cJSON_Delete`。

其中`cJSON_free`是用于释放`cJSON_Print`和`cJSON_PrintUnformatted`的内存的，也就是说，如果你代码里有用到`cJSON_Print`或者`cJSON_PrintUnformatted`，就得通过`cJSON_free`来释放内存：

```c
char *json_string = cJSON_Print(item);
if (json_string != NULL) {
    cJSON_free(json_string);
}
```

此外，`cJSON_Delete`用于释放`cJSON_Parse`或者`cJSON_CreateObject`所创建出来对象：

```bash
cJSON *json=cJSON_CreateObject();
cJSON_Delete(json);
```

