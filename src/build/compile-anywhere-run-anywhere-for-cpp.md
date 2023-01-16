---
icon: cpp
---

# CPP下的随处编译到处运行实践

## 一、引子

因为我们公司的主要技术栈都是JAVA，JAVA在跨平台特性的口号就是：一次编写，到处运行（Write Once, Run Anywhere）。当然，这主要归功于JAVA虚拟机（JVM）的作用。

>![](https://cdn.jsdelivr.net/gh/wuliang142857/pictures-hosting@main/20211220/JAVA虚拟机提供的语言无关性.1gr3ag7hyxxc.png)
>
>图片摘自《深入理解Java虚拟机》Java虚拟机提供的语言无关性

我个人对此的粗浅理解，之所以JAVA虚拟机可以提供语言无关性，很大程度上是因为它加载的是直接是字节码（Byte-code）。也就是说，在我们使用[maven](https://maven.apache.org/)/[gradle](https://gradle.org/)来调用**javac**执行项目构建过程，本质上只有**编译（Compile）**过程，并，没有**链接（Link）**过程。

以C语言为例，代码构建可以分为：预处理（PreProcessing）、编译（Compiling）、链接（Linking）三个过程。

>![](https://cdn.jsdelivr.net/gh/wuliang142857/pictures-hosting@main/20211220/GCC编译过程分解.292zc3az5msk.png)
>
>图片摘自《程序员的自我修养：链接、装载与库》第二章《编译和链接》

但JAVA在编译过程中其实没有链接，链接是由JVM再启动、加载类的过程中去完成的：

>![](https://cdn.jsdelivr.net/gh/wuliang142857/pictures-hosting@main/20211220/类的生命周期.6gojni4g4lk0.png)
>
>图片摘自《深入理解Java虚拟机》类的生命周期

JAVA虚拟机这些设计的孰是孰非并不是我想去讨论的，这里我只是想引第一个问题：假如JAVA也在构建环节对字节码文件（\*.class）执行链接过程，那么它还能不能做到所谓的*一次编写，到处运行*呢？

并不是每种编程语言都有类似的虚拟机，[Golang](https://go.dev/)等语言也自带一种新的方式，我称之为：随处编译，到处运行（Compile Anywhere, Run AnyWhere）。

![](https://cdn.jsdelivr.net/gh/wuliang142857/pictures-hosting@main/20211220/golang的交叉编译.671gkjoum5s0.png)

简而言之，这种**随处编译，到处运行**就是*同一份代码，在任何一个操作系统上，都可以编译出其他操作系统的执行文件*。

Golang通过*编译选项*的差别，来告诉编译器目标格式究竟是什么。当然，这是Golang本身在工具链上提供的特性。

现在，我要引出第二个问题，如果是类似C/C++这种语言，压根没有在语言的工具链层面提供这一特性，我们怎么为其实现**随处编译，到处运行**？

## 二 实际的问题诉求

在前面，我们更多地引出的是一个技术层面的问题。但这个问题究竟想解决日常工作中的什么问题呢？

以我们目前的一个案例举例，目前我们需要提供一个核心加密组件，这个组件需要为不同语言类型的应用提供SDK。那么现在怎么办？

![](https://cdn.jsdelivr.net/gh/wuliang142857/pictures-hosting@main/20211220/核心组件被多个语言类型的应用调研.5ll3wt5nfdc0.png)

当然，有些同学可能会说，很好办呀，核心加密组件包装成Restful服务，然后或提供RESTful API、或提供基于RESTful API的各语言版本的SDK即可。

但可惜我们这个组件有一个重要的功能，就是**加解密**。面对海量数据，如果是调用远程RESTful加解密的方式势必会消耗大量的网络开销，并且这种消耗将远远大于加解密本身的性能开销。

因此，我们调用采用提供原生SDK（Native SDK）的方案，也就是核心加解密库用C/C++开发，然后针对各种语言提供相应的基于动态库文件的SDK。

![](https://cdn.jsdelivr.net/gh/wuliang142857/pictures-hosting@main/20211220/核心组件SDK遇到的问题.3pc8gbm2wc20.png)

采用原生SDK的方案，同样也带来一个问题，因为操作系统和编程语言各个版本的差异，我们需要针对各种操作各种编程语言的不同版本分别构建相应的SDK。

### 2.1 传统的构建方案

传统的构建方案是在我本业务应用构建前，通过构建工具提供的钩子（Hook），拉取基础库的代码，然后进行相应的构建。

![](https://cdn.jsdelivr.net/gh/wuliang142857/pictures-hosting@main/20211220/核心组件被多个语言类型的应用调研.5ll3wt5nfdc0.png)

这种构建方式遇到的核心问题在于需要提供基础库的编译环境，有时候这种环境往往还挺复杂：

![](https://cdn.jsdelivr.net/gh/wuliang142857/pictures-hosting@main/20211220/传统的构建方案.2tzqlkgs76c0.png)

以构建[pyyaml](https://github.com/yaml/pyyaml)为例，因为缺少[libyaml](https://github.com/yaml/libyaml)而构建失败：

![](https://cdn.jsdelivr.net/gh/wuliang142857/pictures-hosting@main/20211221/Screenshot2021-12-20-15.52.07.77gerfcc5cw0.png)

### 2.2 预构建的构建方案

因为是针对公司的项目，因此可能的操作系统版本和语言版本其实可枚举，那么我们就完全可以将C/C++基础库预编译完成；在业务应用启动时，只需要根据运行环境加载对应版本的基础库文件即可。

![](https://cdn.jsdelivr.net/gh/wuliang142857/pictures-hosting@main/20211220/预构建方案.2r1arv0vros0.png)

## 三、整体方案

按前面所言，我们期望在本机实现“**随处编译，到处运行**”。我本机怎么能提供这么多种环境呢？

最简单的办法自然是通过容器，通过在容器中创建不同版本的操作系统，以获取干净的构建环境。

然后在每个环境中，根据环境变量等工具可以分别提供多个版本的JDK、Python、NODE等。

![](https://cdn.jsdelivr.net/gh/wuliang142857/pictures-hosting@main/20211220/整体方案.2e1asmgllg4k.png)

正如此图所示，最后我们只需运行`make`一条命令即可实现**随处编译，到处运行**。

接下去，我再介绍一下针对各个语言和系统构建中的实践经验。

### 3.1 通过swig来简化JAVA调用C/C++

传统的C/C++要变成JNI接口，来供JAVA使用。但JNI接口本身编写比较麻烦。

针对此问题，推荐使用[SWIG(http://www.swig.org/)](http://www.swig.org/)来简化此过程。

SWIG是一种“胶水工具”（Glue Code），它将用C和C++编写的程序与各种高级编程语言连接起来。这里的所谓的高级语言可以是：JAVA、Golang、JavaScript、Python、Perl等等。

经过我的一系列实践，发现使用SWIG来简化C/C++到JAVA还是挺不错的，针对其他语言有些弱，比如针对Node它只支持比较早版本的NODE。

### 3.2 通过pybind11来简化Python调用C/C++

在[pybind11(https://pybind11.readthedocs.io/)](https://pybind11.readthedocs.io/)推出之前，很多知名的库也都是采用SWIG作为C/C++和Python的连接器。

但pybind11的横空出世打破了这一局面，比如[tensorflow](https://www.tensorflow.org/)也从SWIG迁移到了pybind11。

经过我的实践，发现pybind11使用起来真心方便，值得推荐。

### 3.3 使用napi来简化Node调用C/C++

对于Node来调用C/C++，其实Node官方文档上已经有比较详细的文档（https://nodejs.org/api/addons.html](https://nodejs.org/api/addons.html)）。根据官方文档，推荐采用[napi(https://github.com/nodejs/node-addon-api)](https://github.com/nodejs/node-addon-api)的方案。

此外，如果项目是基于[CMake](https://cmake.org/)来构建，因此还可以搭配[cmake-js(https://github.com/cmake-js/cmake-js)](https://github.com/cmake-js/cmake-js)来搭配使用，简化napi的构建。

### 3.4 如何在Mac/Linux下交叉编译得到Windows库文件

因为Docker本身并没有提供GUI机制，因此也不支持启动Windows容器。

针对此，我们可以使用[Mingw-w64](https://www.mingw-w64.org/)来做**交叉编译**。

具体关于交叉编译的相关介绍，我们往后再介绍，比较复杂。

