const {config} = require("vuepress-theme-hope");
const path = require("path");
const os = require("os");
const navBarConfig = require("./navBar");
const sideBarConfig = require("./sideBar");

module.exports = config({
    title: "我的个人知识库",
    description: "学习、沉淀、分享 ……",

    dest: path.join(path.dirname(path.dirname(__dirname)), "dist"),
    temp: path.join(os.tmpdir(), "my-cookbook"),
    host: "0.0.0.0",
    port: "8080",
    cache: false,

    locales: {
        "/": {lang: "zh-CN"},
    },

    themeConfig: {
        logo: "/logo.svg",
        hostname: "https://www.wuliang.me/cookbook/",
        iconPrefix: 'icon-mycookbook-',

        author: "wuliang142857",
        lastUpdated: "上次更新",
        repo: 'https://github.com/wuliang142857/my-cookbook', // 启用到 GitHub 仓库的链接，显示在页面右上角
        repoLabel: 'GitHub', // repo 链接显示的名字
        docsDir: 'docs', // 使用 GitHub 仓库中哪个目录下的文档
        docsBranch: 'master', // 指向 GitHub 仓库的哪个分支
        editLinks: true, // 启用快速编辑的链接，显示在文章末尾的左下角
        editLinkText: "在 GitHub 上编辑此页",

        nav: navBarConfig,
        sidebar: sideBarConfig,

        search: true,
        searchMaxSuggestions: 10,
        searchPlaceholder: "Search...",

        footer: {
            display: true,
            copyright: 'MIT Licensed | Copyright © 2019-present wuliang142857 | <a href="https://beian.miit.gov.cn">浙ICP备17055787号-1</a>',
        },

        comment: false,

        copyright: false,

        git: {
            timezone: "Asia/Shanghai",
        },

        mdEnhance: {
            enableAll: true,
            presentation: {
                plugins: ["highlight", "math", "search", "notes", "zoom"],
            },
        },

        pwa: {
            favicon: "/favicon.ico",
            themeColor: "#46bd87",
            cachePic: true,
            apple: {
                icon: "/assets/icon/apple-icon-152.png",
                statusBarColor: "black",
            },
            msTile: {
                image: "/assets/icon/ms-icon-144.png",
                color: "#ffffff",
            },
            manifest: {
                icons: [
                    {
                        src: "/assets/icon/chrome-mask-512.png",
                        sizes: "512x512",
                        purpose: "maskable",
                        type: "image/png",
                    },
                    {
                        src: "/assets/icon/chrome-mask-192.png",
                        sizes: "192x192",
                        purpose: "maskable",
                        type: "image/png",
                    },
                    {
                        src: "/assets/icon/chrome-512.png",
                        sizes: "512x512",
                        type: "image/png",
                    },
                    {
                        src: "/assets/icon/chrome-192.png",
                        sizes: "192x192",
                        type: "image/png",
                    },
                ]
            },
        },
        
        sitemap: {
            changefreq: "always"
        },
        
        photoSwipe: false,
        
        pageInfo: false
    },
});
