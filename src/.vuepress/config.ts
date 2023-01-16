import {defineUserConfig} from "vuepress";
import theme from "./theme.js";
import * as path from "path";
import * as os from "os";

export default defineUserConfig({
  base: "/",

  dest: path.join(path.dirname(path.dirname(__dirname)), "dist"),
  temp: path.join(os.tmpdir(), "my-cookbook", "temp"),
  cache: path.join(os.tmpdir(), "my-cookbook", "cache"),
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

});
