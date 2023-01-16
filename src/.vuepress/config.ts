import {defineUserConfig} from "vuepress";
import theme from "./theme.js";
import * as path from "path";
import * as os from "os";
import {containerPlugin} from "@vuepress/plugin-container";
import {externalLinkIconPlugin} from "@vuepress/plugin-external-link-icon";
import {mediumZoomPlugin} from "@vuepress/plugin-medium-zoom";
import {nprogressPlugin} from "@vuepress/plugin-nprogress";
import {activeHeaderLinksPlugin} from "@vuepress/plugin-active-header-links";
import {gitPlugin} from "@vuepress/plugin-git";
import {tocPlugin} from "@vuepress/plugin-toc";
import {shikiPlugin} from "@vuepress/plugin-shiki";
import {searchPlugin} from "@vuepress/plugin-search";

export default defineUserConfig({
  base: "/",

  dest: path.join(path.dirname(path.dirname(__dirname)), "dist"),
  host: "0.0.0.0",
  port: 8080,

  locales: {
    "/": {
      lang: "zh-CN",
      title: "我的个人知识库",
      description: "日常做一些知识沉淀，内容很水，就是想记什么就记什么",
    }
  },

  theme,

  shouldPrefetch: false,
  
  plugins: [
    containerPlugin({
      type: "tip",
      locales: {
        "/": {
          defaultInfo: "提示"
        }
      }
    }),
    externalLinkIconPlugin({
      locales: {
        "/": {
          openInNewWindow: '在新窗口打开',
        }
      }
    }),
    mediumZoomPlugin(),
    nprogressPlugin(),
    activeHeaderLinksPlugin(),
    gitPlugin({
      createdTime: true,
      updatedTime: true,
      contributors: true
    }),
    tocPlugin(),
    shikiPlugin({
      theme: "github-light",
    }),
    searchPlugin({
      locales: {
        "/": {
          placeholder: '搜索',
        }
      },
      maxSuggestions: 10,
    })
  ]

});
