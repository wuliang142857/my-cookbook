import {sidebar} from "vuepress-theme-hope";

export const zhSidebar = sidebar({
  "/": [
    "",
    {
      text: "大数据",
      icon: "bigdata",
      prefix: "bigdata/",
      link: "bigdata/",
      children: "structure",
    },
    {
      text: "C++",
      icon: "cpp",
      prefix: "cpp/",
      link: "cpp/",
      children: "structure",
    },
    {
      text: "数据库",
      icon: "database",
      prefix: "database/",
      link: "database/",
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
      text: "Go",
      icon: "go",
      prefix: "go/",
      link: "go/",
      children: "structure",
    },
    {
      text: "Java",
      icon: "java",
      prefix: "java/",
      link: "java/",
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
      text: "Python",
      icon: "python",
      prefix: "python/",
      link: "python/",
      children: "structure",
    },
    {
      text: "瞎折腾",
      icon: "toy",
      prefix: "toy/",
      link: "toy/",
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
      text: "虚拟化",
      icon: "virtual",
      prefix: "virtual/",
      link: "virtual/",
      children: "structure",
    }
  ]
});
