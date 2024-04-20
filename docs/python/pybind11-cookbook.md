---
icon: python
---

# pybind11 Cookbook

[pybind11](https://github.com/pybind/pybind11/)是一个简化C++和Python相互调用的一个库，相比[Boost.Python](https://www.boost.org/libs/python/)更现代化，更易用。

这里，记录了一些在使用中的技巧。

# 在嵌入Python解释器时，如何自动设置`PYTHONHOME`和`PYTHONPATH`。

这个问题在Windows上会出现，在Mac和Linux上貌似都没有出现。现象是类似这样的代码：

```c++
#include <pybind11/embed.h>
void main() {
   pybind11::scoped_interpreter guard{};
   pybind11::exec("print('hello world')");
}
```

然后在Windows上运行时报错了， 错误信息类似：

```
Python path configuration:
PYTHONHOME = (not set)
PYTHONPATH = (not set)
program name = 'python'
isolated = 0
environment = 1
user site = 1
import site = 1
sys._base_executable = 'C:\\Users\\ben.wolfley\\Desktop\\Test3\\vsstudio\\Debug\\pybind11app.exe'
sys.base_prefix = 'C:\\Users\\ben.wolfley\\Anaconda3'
sys.base_exec_prefix = 'C:\\Users\\ben.wolfley\\Anaconda3'
sys.executable = 'C:\\Users\\ben.wolfley\\Desktop\\Test3\\vsstudio\\Debug\\pybind11app.exe'
sys.prefix = 'C:\\Users\\ben.wolfley\\Anaconda3'
sys.exec_prefix = 'C:\\Users\\ben.wolfley\\Anaconda3'
sys.path = [
'C:\\Users\\ben.wolfley\\Anaconda3\\python38.zip',
'.\\DLLs',
'.\\lib',
'C:\\Users\\ben.wolfley\\Desktop\\Test3\\vsstudio\\Debug',
]
Fatal Python error: init_fs_encoding: failed to get the Python codec of the filesystem encoding
Python runtime state: core initialized
ModuleNotFoundError: No module named 'encodings'`
```

问题的原因在于需要设置`PYTHONHOME`，`PYTHONHOME`可以从通过环境变量来设置，也可以通过调用函数：`Py_SetPythonHome`来设置。

当然，更方便的方法可以通过如下代码来自动设置：

```c++
#include <boost/dll.hpp>

#ifndef _WIN32
static auto pythonHome = boost::dll::symbol_location(Py_Initialize).parent_path().parent_path().string();
#else
static auto pythonHome = boost::dll::symbol_location(Py_Initialize).parent_path().string();
#endif
Py_SetPythonHome(pythonHome.data());
```

参考资料：

- [Windows 10: Enable Python Embedding Without Setting PYTHONPATH and PYTHONHOME](https://github.com/pybind/pybind11/issues/2369)



# import C扩展时报错

类似这种错误：

```
ImportError: /root/.cache/pycchain/python38/lib/python3.8/lib-dynload/math.cpython-38-x86_64-linux-gnu.so: undefined symbol: PyFloat_Type

At:
  /root/.cache/pycchain/python38/lib/python3.8/datetime.py(8): <module>
  <frozen importlib._bootstrap>(219): _call_with_frames_removed
  <frozen importlib._bootstrap_external>(843): exec_module
  <frozen importlib._bootstrap>(686): _load_unlocked
  <frozen importlib._bootstrap>(975): _find_and_load_unlocked
  <frozen importlib._bootstrap>(991): _find_and_load
  /root/.cache/pycchain/python38/lib/python3.8/site-packages/dateutil/parser/_parser.py(33): <module>
  <frozen importlib._bootstrap>(219): _call_with_frames_removed
  <frozen importlib._bootstrap_external>(843): exec_module
  <frozen importlib._bootstrap>(686): _load_unlocked
  <frozen importlib._bootstrap>(975): _find_and_load_unlocked
  <frozen importlib._bootstrap>(991): _find_and_load
  /root/.cache/pycchain/python38/lib/python3.8/site-packages/dateutil/parser/__init__.py(2): <module>
  <frozen importlib._bootstrap>(219): _call_with_frames_removed
  <frozen importlib._bootstrap_external>(843): exec_module
  <frozen importlib._bootstrap>(686): _load_unlocked
  <frozen importlib._bootstrap>(975): _find_and_load_unlocked
  <frozen importlib._bootstrap>(991): _find_and_load
  <string>(2): <module>
```

当我在C++内嵌Python解释器时，其实倒没有遇到这个问题，但我通过JNI实现Java内嵌Python解释器时，就遇到这个问题了。并且这个问题只出现在Linux上。

解决办法：

```c++
// 在初始化阶段
#ifdef __linux__
    auto pythonLibrary = boost::dll::symbol_location(Py_Initialize).string();
    python = dlopen(pythonLibrary.c_str(), RTLD_NOW | RTLD_GLOBAL);
#endif

// 在结束阶段
#ifdef __linux__
    if (python != nullptr) {
        dlclose(python);
        python = nullptr;
    }
#endif
```

# 如何捕获stdout和stderr

实现方法倒是很简单，也就是把Python的stdout和stderr分别指向一个类的属性中：

```c++
#include <pybind11/iostream.h>

/**
 * @class PyStdErrOutStreamRedirect
 * @brief 用于重定向Python的标准输出和错误输出流的类
 */
class PyStdErrOutStreamRedirect {
    pybind11::object _stdout;         ///< 原始的标准输出流
    pybind11::object _stderr;         ///< 原始的错误输出流
    pybind11::object _stdout_buffer;  ///< 重定向后的标准输出流
    pybind11::object _stderr_buffer;  ///< 重定向后的错误输出流
public:
    /**
     * @brief 构造函数，进行流的重定向
     */
    PyStdErrOutStreamRedirect() {
        auto sysm = pybind11::module::import("sys");
        _stdout = sysm.attr("stdout");
        _stderr = sysm.attr("stderr");
        auto stringio = pybind11::module::import("io").attr("StringIO");
        _stdout_buffer = stringio();
        _stderr_buffer = stringio();
        sysm.attr("stdout") = _stdout_buffer;
        sysm.attr("stderr") = _stderr_buffer;
    }

    /**
     * @brief 获取重定向后的标准输出流的内容
     * @return 标准输出流的内容
     */
    std::string stdoutString() {
        _stdout_buffer.attr("seek")(0);
        return pybind11::str(_stdout_buffer.attr("read")());
    }

    /**
     * @brief 获取重定向后的错误输出流的内容
     * @return 错误输出流的内容
     */
    std::string stderrString() {
        _stderr_buffer.attr("seek")(0);
        return pybind11::str(_stderr_buffer.attr("read")());
    }

    /**
     * @brief 析构函数，恢复原始的流
     */
    virtual ~PyStdErrOutStreamRedirect() {
        auto sysm = pybind11::module::import("sys");
        sysm.attr("stdout") = _stdout;
        sysm.attr("stderr") = _stderr;
    }
};

// 然后使用时，只需要即可：
PyStdErrOutStreamRedirect pyOutputRedirect;

```



