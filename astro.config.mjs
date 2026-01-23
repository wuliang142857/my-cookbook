// ABOUTME: Astro configuration file for the my-cookbook documentation site.
// ABOUTME: Configures Starlight theme with GitHub Dark styling and Chinese localization.

import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://www.wuliang142857.me/',
  devToolbar: {
    enabled: false,
  },
  integrations: [
    starlight({
      title: '我的个人知识库',
      description: '日常做一些知识沉淀，内容很水，就是想记什么就记什么',
      defaultLocale: 'zh-CN',
      locales: {
        root: {
          label: '简体中文',
          lang: 'zh-CN',
        },
      },
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/wuliang142857/my-cookbook' },
      ],
      customCss: [
        './src/styles/custom.css',
      ],
      sidebar: [
        {
          label: '大数据',
          autogenerate: { directory: 'bigdata' },
        },
        {
          label: 'C++',
          autogenerate: { directory: 'cpp' },
        },
        {
          label: '数据库',
          autogenerate: { directory: 'database' },
        },
        {
          label: '编辑器',
          autogenerate: { directory: 'editor' },
        },
        {
          label: 'Go',
          autogenerate: { directory: 'go' },
        },
        {
          label: 'Java',
          autogenerate: { directory: 'java' },
        },
        {
          label: 'JavaScript',
          autogenerate: { directory: 'javascript' },
        },
        {
          label: 'Python',
          autogenerate: { directory: 'python' },
        },
        {
          label: '瞎折腾',
          autogenerate: { directory: 'toy' },
        },
        {
          label: '版本控制',
          autogenerate: { directory: 'version-control' },
        },
        {
          label: '地图',
          autogenerate: { directory: 'map' },
        },
      ],
      head: [
        {
          tag: 'meta',
          attrs: {
            name: 'bytedance-verification-code',
            content: 'aoaIafLOrn9ocwOB6/b7',
          },
        },
        {
          tag: 'meta',
          attrs: {
            name: 'baidu-site-verification',
            content: 'codeva-BIsU2OiV53',
          },
        },
      ],
    }),
  ],
});
