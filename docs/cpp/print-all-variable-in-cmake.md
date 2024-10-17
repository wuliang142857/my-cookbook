---
icon: cmake
---

# CMake输出所有的变量

有时候为了查看具体有哪些变量，为此可以在CMakeLists.txt中加入：

````cmake
get_cmake_property(_variableNames VARIABLES)
list (SORT _variableNames)
foreach (_variableName ${_variableNames})
    message(STATUS "${_variableName}=${${_variableName}}")
endforeach()
````

