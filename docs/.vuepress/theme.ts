import { hopeTheme } from "vuepress-theme-hope";
import { zhNavbar } from "./navbar";
import { zhSidebar } from "./sidebar";

export default hopeTheme({
  hostname: "https://www.wuliang142857.me/",

  author: {
    name: "wuliang142857",
    url: "https://www.wuliang142857.me/",
    email: "wuliang142857@gmail.com"
  },
  lastUpdated: false,
  pageInfo: false,

  iconAssets: "iconfont",

  logo: "/logo.svg",

  repo: false,

  docsDir: "docs",
  
  locales: {
    /**
     * Chinese locale config
     */
    "/": {
      // navbar
      navbar: zhNavbar,

      // sidebar
      sidebar: zhSidebar,

      footer: 'wuliang142857@gmail.com',

      displayFooter: true,
      copyright: false,

      // page meta
      metaLocales: false,
      toc: false,
      rtl: true
    },
  },

  plugins: {
    copyCode: {
      duration: 1000
    },
    photoSwipe: true,
    copyright: false,
    autoCatalog: false,

    // Disable features you don’t want here
    mdEnhance: {
      align: true,
      attrs: true,
      chart: true,
      codetabs: true,
      container: true,
      demo: true,
      echarts: true,
      figure: true,
      flowchart: true,
      gfm: true,
      imgLazyload: true,
      imgSize: true,
      include: true,
      katex: true,
      mark: true,
      mermaid: true,
      playground: {
        presets: ["ts", "vue"],
      },
      presentation: {
        plugins: ["highlight", "math", "search", "notes", "zoom"],
      },
      stylize: [
        {
          matcher: "Recommended",
          replacer: ({ tag }) => {
            if (tag === "em")
              return {
                tag: "Badge",
                attrs: { type: "tip" },
                content: "Recommended",
              };
          },
        },
      ],
      sub: true,
      sup: true,
      tabs: true,
      vPre: true,
      vuePlayground: true,
    },
  },
});