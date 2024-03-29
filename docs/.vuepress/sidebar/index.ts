import {sidebar} from "vuepress-theme-hope";

export const zhSidebar = sidebar({
  "/": [
    "",
    {
      text: "C++",
      icon: "cpp",
      prefix: "cpp/",
      link: "cpp/",
      children: "structure",
    },
    {
      text: "Python",
      icon: "python",
      prefix: "python/",
      link: "python/",
      children: "structure",
    },
    {
      text: "JavaScript",
      icon: "javascript",
      prefix: "javascript/",
      link: "javascript/",
      children: "structure",
    },
    {
      text: "软件构建",
      icon: "build",
      prefix: "build/",
      link: "build/",
      children: "structure",
    },
    {
      text: "版本控制",
      icon: "version-control",
      prefix: "version-control/",
      link: "version-control/",
      children: "structure",
    },
    {
      text: "大数据",
      icon: "bigdata",
      prefix: "bigdata/",
      link: "bigdata/",
      children: "structure",
    },


    {
      text: "虚拟化",
      icon: "virtual",
      prefix: "virtual/",
      link: "virtual/",
      children: "structure",
    },
    {
      text: "编辑器",
      icon: "editor",
      prefix: "editor/",
      link: "editor/",
      children: "structure",
    },
    {
      text: "网络加速",
      icon: "acceleration",
      prefix: "speed-my-network/",
      link: "speed-my-network/",
      children: "structure",
    },
    {
      text: "瞎折腾",
      icon: "toy",
      prefix: "toy/",
      link: "toy/",
      children: "structure",
    }
  ]
});
