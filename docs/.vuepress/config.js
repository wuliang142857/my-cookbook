const path = require("path");
const os = require("os");
const moment = require("moment");

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
    title: "Cookbook & Gist ...",
    description: "个人沉淀",
    host: "0.0.0.0",
    port: "8080",
    temp: path.join(os.tmpdir(), "my-cookbook"),
    head: HEAD,
    cache: true,
    markdown: {
        lineNumbers: false
    },
    themeConfig: {
        nav: NAV,
        sidebarDepth: 2,
        lastUpdated: "上次更新",
        searchMaxSuggestoins: 10,
        serviceWorker: {
            updatePopup: {
                message: "New content is available.",
                buttonText: "Refresh"
            }
        },
        editLinks: true,
        editLinkText: "在 GitHub 上编辑此页 ！"
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
        [
            "@vuepress/last-updated",
            {
                transformer: (timestamp, lang) => {
                    moment.locale(lang);
                    return moment(timestamp).fromNow();
                }
            }
        ]
    ]
});
