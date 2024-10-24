---
icon: geoserver
---

# 使用GeoServer+OpenStreetMap搭建地图服务

## 一、背景

## 二、具体步骤

### 2.1 使用imposm3导入OpenStreetMap数据到PostgreSQL中

[imposm3](https://github.com/omniscale/imposm3) 是一款使用Go编写的将OpenStreetMap的PBF文件导入到PostgreSQL/PostGIS的工具。它官方提供了Linux已经预编译好的Linux可执行二进制文件。只要你的glibc版本不是太低的话，直接使用就行。

![](https://image-hosting.wuliang142857.me/2024/10/97a9b90876f477044e1441b9981d145d.png)

如果不幸你的Linux/glibc比较低，那么只能自己编译。如果自己编译的话，它依赖 [libleveldb](https://github.com/google/leveldb/) 和 [libgeos](https://libgeos.org/) ，因此得先编译安装这两个库。

对OpenStreetMap的PBF文件的导入比较简单，一个命令搞定：

```bash
imposm import -mapping <mapping.yml文件路径> -connection postgis://<username>:<password>@<hostname>:<port>/<dbname> -dbschema-import <schema_name> -overwritecache -read <PBF文件> -write  -cachedir <缓存路径> -optimize
```

上述命令中有一些参数需要解释一下：

- `mapping.yml文件路径`：这个文件定义了OpenStreetMap (OSM) 数据映射到 PostGIS 数据库中的表结构。
- `username`、`password`、`hostname`、`port`、`dbname`、`schema_name` ：这些都是PostgreSQL的基本信息。这里唯一需要注意的就是DB需要用户手动创建好，imposm会自动创建schema，但不会自己创建DB。
- `缓存路径`：这个就一个路径也有，默认值是：`/tmp/imposm3`
- `-optimize`：开启这个参数的话，会对最终导入的数据的索引做优化（具体优化就是`Clustering`和`Analyse`）

因为我们这里是为了把GeoServer+OpenStreetMap快速应用起来，因此先不探究`mapping.yml`具体怎么写，可以先用一个现成的：[geosolutions-it/osm-styles](https://github.com/geosolutions-it/osm-styles)中的[mapping.yml](https://github.com/geosolutions-it/osm-styles/blob/master/imposm/mapping.yml)就比较适合，可以直接拿来使用。

PS：

- [geosolutions-it/osm-styles](https://github.com/geosolutions-it/osm-styles/)是一个比较实用的GeoServer的数据目录集，可以clone下来，后面我们还得用上。

- [geosolutions-it/osm-styles](https://github.com/geosolutions-it/osm-styles)中的[mapping.yml](https://github.com/geosolutions-it/osm-styles/blob/master/imposm/mapping.yml)算是比较完整的mapping文件了，但我实测时它漏掉了[OpenStreetMap中的某些amenity](https://wiki.openstreetmap.org/wiki/Zh-hans:Key:amenity)，因此如果希望能够支持所有[amenity](https://wiki.openstreetmap.org/wiki/Zh-hans:Key:amenity)的话，得自己稍微修改一下。

- 刚上手的话，不建议直接来个`planet.osm.pbf`，太大了，可以先搞一个国家、甚至更小省、市试试。

### 2.2 下载GeoServer并且解压

从[GeoServer][https://geoserver.org/release/stable/]下载稳定版，因为我本地环境没有tomcat之类的环境，因此直接 ==Platform Independent Binary==：

![](https://image-hosting.wuliang142857.me/2024/10/a421013f045178dde540ced1bd56e90e.png)

解压：

```bash
unzip geoserver-x.y.z-bin.zip -d geoserver
```

另外，还需要两个插件：

- Pregeneralized Features：处理预先生成的简化矢量数据（generalized data），以提高地图服务的性能。因为我们待会会有一个预制的低缩放的OSM地图数据需要加载，因此需要这个插件。
- CSS Styling：允许用户使用类似于网页 CSS 的语法来编写样式（SLD），简化了样式的配置过程。比如当我们自定义一些POI数据的图标等，采用CSS的方式会简单很多。

![](https://image-hosting.wuliang142857.me/2024/10/beaa0551c73bf37b5d3031fa9dcd847d.png)

两个插件下载下来后，解压到geoserver的`webapps/geoserver/WEB-INF/lib/`目录下：

```bash
unzip geoserver-x.y.z-feature-pregeneralized-plugin.zip -d <geoserver的路径>/webapps/geoserver/WEB-INF/lib/

unzip geoserver-x.y.z-css-plugin.zip -d <geoserver的路径>/webapps/geoserver/WEB-INF/lib/
```

### 2.3 使用geosolutions-it/osm-styles提供的数据

正如前文所言，[geosolutions-it/osm-styles](https://github.com/geosolutions-it/osm-styles/)是一个比较实用的GeoServer的数据目录集。我们将[geosolutions-it/osm-styles](https://github.com/geosolutions-it/osm-styles/)下除了imposm外的所有文件/目录都拷贝到geoserver下的`data_dir`目录下。

### 2.4 安装字体

因为OSM数据包含多国语言，因此需要安装多个国家的字体。在基于Debian的系统上可以：

```bash
apt install fonts-noto fonts-dejavu unifont fonts-hanazono fonts-noto-cjk fonts-noto-extra fonts-noto-color-emoji fonts-dejavu-core fonts-liberation fonts-arphic-ukai fonts-arphic-uming fonts-indic fonts-thai-tlwg ttf-mscorefonts-installer fonts-dejavu fontconfig
```



### 2.5 下载OSM下的低缩放的数据

下载：[osm-lowres.gpkg](https://image-hosting.wuliang142857.me/osm/osm-lowres.gpkg) 到 geoserver下的`data_dir/data`目录下。

### 2.6 启动GeoServer进行进一步的配置

首先，GeoSever是用Java编写的服务，因此运行依赖JRE，最低要求：JAVA 11。

现在，可以启动GeoServer了，启动命令很简单：

```bash
./bin/startup.sh
```

如果需要关闭就：

```bash
./bin/shutdown.sh
```

启动过程中出现的类似missing style的ERROR日志可以暂且忽略：

```
24 Oct 14:53:46 ERROR  [org.geoserver] - Layer 'poly_landmarks' references a missing style
24 Oct 14:53:46 ERROR  [org.geoserver] - Layer 'tiger_roads' references a missing style
24 Oct 14:53:46 ERROR  [org.geoserver] - Layer 'poi' references a missing style
24 Oct 14:53:47 ERROR  [org.geoserver] - Layer 'states' references a missing style
24 Oct 14:53:47 ERROR  [org.geoserver] - Layer 'countries' references a missing style
24 Oct 14:53:47 ERROR  [org.geoserver] - Layer 'coastlines' references a missing style
24 Oct 14:53:47 ERROR  [org.geoserver] - Layer 'populated_places' references a missing style
24 Oct 14:53:47 ERROR  [org.geoserver] - Layer 'boundary_lines' references a missing style
24 Oct 14:53:47 ERROR  [org.geoserver] - Layer 'streams' references a missing style
24 Oct 14:53:47 ERROR  [org.geoserver] - Layer 'roads' references a missing style
24 Oct 14:53:47 ERROR  [org.geoserver] - Layer 'restricted' references a missing style
24 Oct 14:53:47 ERROR  [org.geoserver] - Layer 'bugsites' references a missing style
24 Oct 14:53:47 ERROR  [org.geoserver] - Layer 'Arc_Sample' references a missing style
24 Oct 14:53:48 WARN   [gce.imagemosaic] - Unable to set ordering between tiff readers spi
```

启动后，默认监听端口是：==8080==。

访问`http://<hostname or ip>:<port>/geoserver`，默认的用户名：admin，密码：geoserver。

下面需要配置一下数据库连接信息：存储仓库 -> osm

![](https://image-hosting.wuliang142857.me/2024/10/f3efe6ac4c9f504700a73ab0cd3f30bc.png)

连接参数都需要填写：

![](https://image-hosting.wuliang142857.me/2024/10/0aeabfb572fcea4ef3fe848f29cde5a2.png)

### 2.7 预览OSM地图

下面就预览一下：

![](https://image-hosting.wuliang142857.me/2024/10/928174810bcdd558cdfbc2caf9c8099e.png)

在新打开的窗口上就可以看到预览的地图了：

![](https://image-hosting.wuliang142857.me/2024/10/0fd8099d7428e5e8f9cd9b950a530da4.png)

当然也可以自己写一个demo页面：

```html
<!DOCTYPE html>
<html>
<head>
    <title>Simple Map</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ol@v10.2.1/ol.css">
    <script src="https://cdn.jsdelivr.net/npm/ol@v10.2.1/dist/ol.js"></script>
    <style>
        html, body {
            height: 100%;
            margin: 0;
            padding: 0;
            overflow: hidden; /* 防止滚动条影响布局 */
        }
        #map {
            height: 100%;
            width: 100%;
        }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        var map = new ol.Map({
            target: 'map',
            layers: [
                new ol.layer.Tile({
                    source: new ol.source.TileWMS({
                        url: 'http://<主机+端口>/geoserver/osm/wms',
                        params: {
                            'LAYERS': 'osm:osm',
                            'VERSION': '1.3.0',  // 使用 WMS 1.3.0 版本
                            'FORMAT': 'image/png',  // 输出格式
                            'TRANSPARENT': 'true'  // 背景透明
                        },
                        ratio: 1,
                        serverType: 'geoserver',
                    })
                })
            ],
            view: new ol.View({
                center: ol.proj.fromLonLat([120.1551, 30.2741]),
                zoom: 10
            })
        });
    </script>
</body>
</html>

```

## 三、小技巧

### 3.1 自己编译imposm3

正如上文所言，假如你的Linux或者Glibc版本比较低，官方预编译的可执行二进制的imposm3不能运行：

![](https://image-hosting.wuliang142857.me/2024/10/14a29efc0bfb2a899a1ff64e4c43c9a0.png)

那么，只能自己编译了。这里我以CentOS 7 为例。

CentOS 7的GCC和Libc版本都比较低，因此我们先安装较新版本的GCC：

```bash
# 新增scl源
yum install centos-release-scl centos-release-scl-rh

# 安装gcc-10和较新的git
yum install devtoolset-10-* rh-git227-git

# 激活使用
source /opt/rh/devtoolset-10/enable
```

imposm3依赖[leveldb](https://github.com/google/leveldb)和[libgeos](https://github.com/libgeos/geos)。这两个都是cmake工程，编译&安装很简单。

然后clone [imposm3](https://github.com/omniscale/imposm3)代码，直接`make build`就可以。

### 3.2 支持所有amenity

在地图上，很多POI信息都会被渲染成“图标+文字”的形式：

![](https://image-hosting.wuliang142857.me/2024/10/6a6e17169abf3cc7be64192ad73089c8.png)

但我们使用[geosolutions-it/osm-styles](https://github.com/geosolutions-it/osm-styles)相比OpenStreetMap完整的[amenity](https://wiki.openstreetmap.org/wiki/Key:amenity)、[Symbols](https://wiki.openstreetmap.org/wiki/OpenStreetMap_Carto/Symbols)，还是确实了不少的。要补充完整的话，得改两个地方：

（1）mapping.yml文件中三处有`amenity`的都改成`__any__`：

![](https://image-hosting.wuliang142857.me/2024/10/0a95d6e1393198cfb0c2356e4dca7a59.png)

（2）样式补充：进入 样式 ，找到 amenities：

![](https://image-hosting.wuliang142857.me/2024/10/985e27d53f33cc6e32e6883f6710765a.png)

修改其中的样式（内容比较长，可以复制出来修改）：可以找一个已有的amenity然后照着修改。

![](https://image-hosting.wuliang142857.me/2024/10/50df110a28b992d338424bbad52c2a65.png)

## 3.3 优化字体

采用[geosolutions-it/osm-styles](https://github.com/geosolutions-it/osm-styles)提供的样式后，发现在关于字体上有两个问题：

- 朝鲜/韩国字体没有显示出来，全成了方框。我不太确定其他国家的字体有没有类似的问题，朝鲜/韩国那是很明显。

![](https://image-hosting.wuliang142857.me/2024/10/a83d659aaed53eb53c4703be484b2d36.png)

- 自定义的`amenity`显示的字体太小

这两个的解决办法：

- 问题一：针对朝韩字体，还是修改`amenities`这个样式，将其中的`Noto Sans CJK KR Regular` 改成：`Noto Sans CJK KR`即可。
- 问题二：针对自定义的`amenity`显示的字体太小，一个比较简单的办法是加入`font-family`的定义，比如：

```css
[type = 'weighbridge'][@sd < 6k] {
  label: [name];   
  font-family: "Microsoft YaHei", "Noto Sans", "DejaVu Sans", "Arial", "Arphic Ukai", "MingLiU", sans-serif;
  font-fill: #734a08;
  halo-color: #ffffff;
  label-offset: 0 -12;
};
[type = 'weighbridge'][@sd < 6k] {
  shield: symbol('file://new/weighbridge.svg');
  :shield { fill: #734a08 }; 
}; 
```

注意：这个`font-family`的定义貌似必须在`font-fill`之前，不然就不生效。此外，可以自己把类似==微软雅黑==的字体注册到系统中，然后采用微软雅黑，这个比较好看。

![](https://image-hosting.wuliang142857.me/2024/10/e0b5512971bac85748c9fbafb1f11e01.png)

## 四、参考

- [Geoserver发布OSM官网地图](https://blog.csdn.net/qq_40953393/article/details/120611304?spm=1001.2014.3001.5502)
