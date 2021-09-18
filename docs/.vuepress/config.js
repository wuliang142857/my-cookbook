const path = require("path");
const os = require("os");
const moment = require("moment");
require("moment/locale/zh-cn");
moment.locale(`zh-cn`);

/**
 * 导航页
 */
const NAV = [{
    text: "首页",
    link: "/"
},
    {
        text: "Cookbook",
        link: "/cookbook/"
    }
];

const HEAD = [
    ["link", {
        rel: "icon",
        href: "/wuliang142857.png"
    }]
];

module.exports = ctx => ({
    dest: path.join(path.dirname(path.dirname(__dirname)), "dist"),
    title: "GISTer's Cookbook",
    description: `多年来一直没有很好的沉淀`,
    host: "0.0.0.0",
    port: "8080",
    temp: path.join(os.tmpdir(), "my-cookbook"),
    head: HEAD,
    cache: true,
    markdown: {
        lineNumbers: false,
        extendMarkdown: md => {
            md.use(require("markdown-it-mark"));
            md.use(require("markdown-it-fontawesome"));
        }
    },
    themeConfig: {
        nav: NAV,
        sidebarDepth: 1,
        lastUpdated: "上次更新",
        repo: 'https://github.com/wuliang142857/my-cookbook', // 启用到 GitHub 仓库的链接，显示在页面右上角
        repoLabel: 'GitHub', // repo 链接显示的名字
        docsDir: 'docs', // 使用 GitHub 仓库中哪个目录下的文档
        docsBranch: 'master', // 指向 GitHub 仓库的哪个分支
        editLinks: true, // 启用快速编辑的链接，显示在文章末尾的左下角
        editLinkText: "在 GitHub 上编辑此页",
        smoothScroll: true
    },
    plugins: [
        ["autobar", {
            stripNumbers: true,
            maxLevel: 5,
            pinyinNav: false,
            setHomepage: "top",
            multipleSideBar: true,
            skipEmptyNavbar: true,
            skipEmptySidebar: true,
        }],
        ["@vuepress/back-to-top", true],
        // last-updated 插件
        [
            "@vuepress/last-updated",
            {
                transformer: (timestamp, lang) => {
                    return moment(timestamp).fromNow();
                }
            }
        ],
        ["@vuepress/medium-zoom", true],
        [
            "@vuepress/search",
            {
                searchMaxSuggestions: 10
            }
        ],
        ['@mr-hope/sitemap', {
            hostname: "https://www.wuliang.me",
            // 排除无实际内容的页面
            exclude: ["/404.html"]
        }
        ],
        ["vuepress-plugin-baidu-autopush", true],
        ['permalink-pinyin', {
            lowercase: false,
            separator: '-'
        }]
    ]
});