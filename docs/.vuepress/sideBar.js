const {sidebarConfig} = require("vuepress-theme-hope");
const path = require("path");
const fs = require("fs");
const _ = require("lodash");
const docsPath = path.dirname(__dirname);

const listMarkdownFiles = (dir) => {
    return fs.readdirSync(dir).filter(filename => {
        const fullFilename = path.join(dir, filename);
        if (!fs.lstatSync(fullFilename).isFile()) {
            return false;
        }
        const extname = path.extname(filename);
        return extname.toLowerCase() === ".md" || extname.toLowerCase() === ".markdown";
    });
}

module.exports = sidebarConfig({
    "/": [
        "",
        {
            title: "大数据",
            icon: "bigdata",
            prefix: "bigdata/",
            collapsable: false,
            children: listMarkdownFiles(path.join(docsPath, "bigdata"))
        },
        {
            title: "构建",
            icon: "build",
            prefix: "build/",
            collapsable: false,
            children: listMarkdownFiles(path.join(docsPath, "build"))
        },
        {
            title: "CRACK",
            icon: "crack",
            prefix: "crack/",
            collapsable: false,
            children: listMarkdownFiles(path.join(docsPath, "crack"))
        },
        {
            title: "GIT",
            icon: "git",
            prefix: "version-control/",
            collapsable: false,
            children: listMarkdownFiles(path.join(docsPath, "git")),
        },
        {
            title: "瞎折腾",
            icon: "hodgepodge",
            prefix: "hodgepodge/",
            collapsable: false,
            children: listMarkdownFiles(path.join(docsPath, "hodgepodge")),
        },
        {
            title: "IDE",
            icon: "ide",
            prefix: "ide/",
            collapsable: false,
            children: listMarkdownFiles(path.join(docsPath, "ide"))
        },
        {
            title: "JavaScript",
            icon: "javascript",
            prefix: "javascript/",
            collapsable: false,
            children: listMarkdownFiles(path.join(docsPath, "javascript"))
        },
        {
            title: "网络加速",
            icon: "acceleration",
            prefix: "network-acceleration/",
            collapsable: false,
            children: listMarkdownFiles(path.join(docsPath, "network-acceleration"))
        },
        {
            title: "PYTHON",
            icon: "python",
            prefix: "python/",
            collapsable: false,
            children: listMarkdownFiles(path.join(docsPath, "python"))
        },
        {
            title: "可信执行环境",
            icon: "tee",
            prefix: "tee/",
            collapsable: false,
            children: listMarkdownFiles(path.join(docsPath, "tee"))
        }
    ],
})