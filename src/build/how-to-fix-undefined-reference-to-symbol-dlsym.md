---
icon: cpp
---

# 如何解决undefined reference to symbol 'dlsym@@GLIBC_2.2.5'

今天在尝试通过[pybind11](https://pybind11.readthedocs.io/en/stable/)来将Python解释器嵌入C++的过程中，遇到几个问题。

## 问题一：undefined reference to symbol 'dlsym@@GLIBC_2.2.5'

::: warning

/usr/bin/ld: /mnt/data_1/home/admin/Configuration/vcpkg/installed/x64-linux/lib/libpython3.10.a(dynload_shlib.o): undefined reference to symbol 'dlsym@@GLIBC_2.2.5'
/usr/bin/ld: /usr/lib/gcc/x86_64-linux-gnu/9/../../../x86_64-linux-gnu/libdl.so: error adding symbols: DSO missing from command line

:::

通过通过`man dlsym`就可以知道，需要加入链接参数：`-ldl`：

![Screenshot2022-06-02-17](https://cdn.jsdelivr.net/gh/wuliang142857/pictures-hosting@main/20220602/Screenshot2022-06-02-17.tqilyepjf3k.png)

但有一点，这个链接参数必须是所有链接参数中的最后一个，但我项目是用[cmake](https://cmake.org/)来构建的，直接`target_link_libraries(${main} "-ldl")`并不能保证是最后一个。

正确的做法在于：

````cmake
target_link_libraries(${main} ${CMAKE_DL_LIBS})
````

参考：

- [Need to link cmake project to dl library](https://stackoverflow.com/questions/33678965/need-to-link-cmake-project-to-dl-library)

## 问题二：undefined reference to `openpty'

这个问题其实是问题一类似，也得用cmake自带的变量：

lutil
