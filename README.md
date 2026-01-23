# 我的个人知识库

使用 [Astro](https://astro.build/) + [Starlight](https://starlight.astro.build/) 构建的个人知识库。

## 安装启动方法

```bash
# 安装依赖
npm install

# 开发环境运行
npm run dev

# 静态文件构建
npm run build

# 预览构建结果
npm run preview
```

## 项目结构

```
.
├── public/              # 静态资源
├── src/
│   ├── assets/          # 图片等资源
│   ├── content/
│   │   └── docs/        # Markdown 文档
│   └── styles/          # 自定义样式
├── astro.config.mjs     # Astro 配置
└── package.json
```

## 文档分类

- **大数据** - Hadoop、Greenplum、Elasticsearch 等
- **C++** - 编译、跨平台开发、CMake 技巧
- **数据库** - PostgreSQL、分布式数据库
- **编辑器** - IDE 配置、LSP、字体美化
- **Go** - Go 语言交叉编译、CGO 技巧
- **Java** - Maven、构建工具
- **JavaScript** - npm、webpack、node-gyp
- **Python** - pip、pybind11、FTP 服务
- **瞎折腾** - 系统配置、命令行工具、小技巧
- **版本控制** - Git 配置、代理、加密
- **虚拟化** - Docker、VirtualBox
- **地图** - GeoServer、POI、OSM 数据处理
