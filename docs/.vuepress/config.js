const path = require("path");
const os = require("os");
const moment = require("moment");
require("moment/locale/zh-cn");
moment.locale(`zh-cn`);

/**
 * 导航页
 */
const NAV = [
    {
        text: "首页",
        link: "/"
    },
    {
        text: "Cookbook",
        link: "/cookbook/"
    },
    {
        text: "关于我",
        items: [
            {
                text: "Github",
                link: "https://github.com/wuliang142857"
            }
        ]
    }
];

const HEAD = [["link", { rel: "icon", href: "/wuliang142857.png" }]];

module.exports = ctx => ({
    dist: path.dirname(path.dirname(__dirname)),
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
        sidebarDepth: 2,
        lastUpdated: "上次更新",
        editLinks: true,
        editLinkText: "在 GitHub 上编辑此页"
    },
    plugins: [
        // 页面滚动时自动激活侧边栏链接的插件
        [
            "@vuepress/active-header-links",
            {
                sidebarLinkSelector: ".sidebar-link",
                headerAnchorSelector: ".header-anchor"
            }
        ],
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
        ["@vuepress/nprogress", true],
        [
            "@vuepress/search",
            {
                searchMaxSuggestions: 10
            }
        ]
    ]
});
