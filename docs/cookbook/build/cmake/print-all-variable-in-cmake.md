# CMAKE輸出所有的變量

有時候爲了調試看看CMAKE定義了哪些變量，可以在CMakeLists.txt中加入：

````cmake
get_cmake_property(_variableNames VARIABLES)
list (SORT _variableNames)
foreach (_variableName ${_variableNames})
    message(STATUS "${_variableName}=${${_variableName}}")
endforeach()
````

