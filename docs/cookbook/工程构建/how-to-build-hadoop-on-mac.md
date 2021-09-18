# 如何在MacOS下编译hadoop 

# 一、缘由

最近因为需要用C++写一个MapReduce程序，虽然比较简单的办法自然是用[Hadoop Streaming](https://hadoop.apache.org/docs/r1.2.1/streaming.html)，但这次打算尝试一下[Hadoop Pipes](https://hadoop.apache.org/docs/r1.2.1/api/org/apache/hadoop/mapred/pipes/package-summary.html)。

和Hadoop Streaming不同，Hadoop Pipes用Socket让Java代码和C++通信，我想当然地解决性能会优于Hadoop Streaming采用标准输入输出的方式。

因为我的开发环境是MacOS，IDE用的是[CLion](https://www.jetbrains.com/clion/)，既然使用上了IDE，那么就想能够用上代码补全这些功能，因此就需要在在MacOS上编译一个hadoop native library。

## 1.1 本文档使用的环境

- Hadoop 版本：hadoop-3.1.1

- MacOS版本：10.15.7

# 二、安装依赖

首先需要JDK、Maven等基本工具我就不提了。

## 2.1 一些可以用[Homebrew](https://brew.sh/)安装的工具

````bash
brew install gcc autoconf automake libtool cmake snappy gzip bzip2 zlib openssl
````

## 2.2 安装protobuf 2.5.0

Hadoop用的protobuf还是几年前[2.5.0](https://github.com/protocolbuffers/protobuf/releases/tag/v2.5.0)版本的，在brew上已经没有这个版本了，因此得自己安装一个。

````bash
./configure --prefix=/usr/local/Cellar/protobuf/2.5.0
make
make install
# 添加到环境变量
brew link protobuf@2.5.0
````

## 2.3 openssl配置

在编译过程中，Hadoop native library会依赖openssl@1.1，因为MacOS系统也版本一个openssl，但版本不匹配，因此得指定openssl所在的路径等。

话说这里我看到过三种指定openssl的方法，三种方法我都罗列一下，同时也表明是哪种是在我这里亲测有效的：

### 方法一：修改源码中的CMakeLists.txt（亲测有效）

修改`./hadoop-tools/hadoop-pipes/src/CMakeLists.txt`，在其中加入如下几行：

````cmake
if (APPLE)
    # This is a bug in CMake that causes it to prefer the system version over
    # the one in the specified ROOT folder.
    set(OPENSSL_ROOT_DIR ${OPENSSL_ROOT_DIR} /usr/local/opt/openssl@1.1/)
    set(OPENSSL_CRYPTO_LIBRARY ${OPENSSL_ROOT_DIR}/lib/libcrypto.dylib CACHE FILEPATH "" FORCE)
    set(OPENSSL_SSL_LIBRARY ${OPENSSL_ROOT_DIR}/lib/libssl.dylib CACHE FILEPATH "" FORCE)
endif()
find_package(OpenSSL REQUIRED)
````

### 方法二：通过编译参数来指定

默认的编译参数是：

````bash
mvn package -Pdist,native -DskipTests -Dtar -Dmaven.javadoc.skip
````

可以通过`-Dopenssl.prefix`来指定openssl的路径：

````bash
mvn package -Pdist,native -DskipTests -Dtar -Dmaven.javadoc.skip -Dopenssl.prefix=/usr/local/opt/openssl@1.1
````

### 方法三：通过环境变量来指定

````bash
export OPENSSL_ROOT_DIR="/usr/local/opt/openssl@1.1"
export OPENSSL_INCLUDE_DIR="$OPENSSL_ROOT_DIR/include"
export LDFLAGS="-L${OPENSSL_ROOT_DIR}/lib"
export CPPFLAGS="-I${OPENSSL_ROOT_DIR}/include"
export PKG_CONFIG_PATH="${OPENSSL_ROOT_DIR}/lib/pkgconfig" 
````

## 三、过程中可能出现的一些错误的解决办法

## 3.1 `constexpr`错误

在编译时，发现`constexpr`一个错误，它是C++11的关键字，解决办法需要修改：`hadoop-mapreduce-project/hadoop-mapreduce-client/hadoop-mapreduce-client-nativetask/src/CMakeLists.txt`，在`include(HadoopJNI)`后面加上：

````cmake
include(CheckFunctionExists)
include(CheckIncludeFiles)
include(CheckCXXCompilerFlag) 
CHECK_CXX_COMPILER_FLAG("-std=c++11" COMPILER_SUPPORTS_CXX11) 
CHECK_CXX_COMPILER_FLAG("-std=c++0x" COMPILER_SUPPORTS_CXX0X) 
if(COMPILER_SUPPORTS_CXX11) 
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -std=c++11") 
elseif(COMPILER_SUPPORTS_CXX0X) 
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -std=c++0x") 
else() 
    message(STATUS "The compiler ${CMAKE_CXX_COMPILER} has no C++11 support. Please use a different C++ compiler.") 
endif()
````

## 3.2 "%"PRId64、"%"PRIu64错误

`hadoop-mapreduce-client-nativetask/src/main/native`中所有的`*.cc`中出现的`"%"PRId64`、`"%"PRIu64`，需要改成引号和P之间要加空格，否则c++11编译不过。

另外，我试过，这个问题在Linux下编译也会出现。

# 四、编译

## 4.1 编译命令

````bash
mvn package -Pdist,native -DskipTests -Dtar -Dmaven.javadoc.skip
````

## 4.2 拷贝编译好的文件到$HADOOP_HOME

如果编译成功，则可以将输出文件拷贝到$HADOOP_HOME（这个环境变量自行设置）目录下

````bash
cp -rp hadoop-dist/target/hadoop-3.1.1/lib $HADOOP_HOME
````

# 五、参考

- [Mac OSX 编译hadoop本地库](https://zhuanlan.zhihu.com/p/112307334)
- [mac系统编译3.2.1版本hadoop](https://blog.csdn.net/weixin_44570264/article/details/106846117)

- [Native Libraries Guide](https://hadoop.apache.org/docs/stable/hadoop-project-dist/hadoop-common/NativeLibraries.html)

    





