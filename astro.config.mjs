// ABOUTME: Astro configuration file for the my-cookbook documentation site.
// ABOUTME: Configures Starlight, SEO metadata, and Chinese localization.

import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

const siteUrl = 'https://www.wuliang142857.me/';
const siteName = '技术笔记索引';
const siteDescription = '面向编译构建、环境配置、数据系统、地图服务和开发工具的个人技术笔记索引，沉淀可复用的命令、配置路径和排错上下文。';
const authorName = 'wuliang142857';
const authorUrl = 'https://github.com/wuliang142857';
const repositoryUrl = 'https://github.com/wuliang142857/my-cookbook';
const ogImageUrl = `${siteUrl}assets/og/knowledge-console.png`;

const topicKeywords = [
  '技术博客',
  '编译构建',
  '环境配置',
  '大数据',
  '数据库',
  'PostgreSQL',
  'Hadoop',
  'Greenplum',
  'GeoServer',
  'OpenStreetMap',
  'Git',
  'Linux',
  'macOS',
  'Python',
  'Go',
  'C++',
  'JavaScript',
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Person',
      '@id': `${siteUrl}#author`,
      name: authorName,
      url: authorUrl,
      sameAs: [authorUrl],
      knowsAbout: topicKeywords,
    },
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}#website`,
      name: siteName,
      alternateName: ['my-cookbook', '我的个人知识库'],
      url: siteUrl,
      description: siteDescription,
      inLanguage: 'zh-CN',
      author: { '@id': `${siteUrl}#author` },
      publisher: { '@id': `${siteUrl}#author` },
      image: ogImageUrl,
      license: 'https://opensource.org/license/mit',
      keywords: topicKeywords,
    },
    {
      '@type': 'Blog',
      '@id': `${siteUrl}#blog`,
      name: siteName,
      url: siteUrl,
      description: siteDescription,
      inLanguage: 'zh-CN',
      author: { '@id': `${siteUrl}#author` },
      publisher: { '@id': `${siteUrl}#author` },
      isPartOf: { '@id': `${siteUrl}#website` },
      about: topicKeywords.map((name) => ({ '@type': 'Thing', name })),
    },
    {
      '@type': 'SiteNavigationElement',
      '@id': `${siteUrl}#navigation`,
      name: ['大数据', 'C++', '数据库', '编辑器', 'Go', 'Java', 'JavaScript', 'Python', '瞎折腾', '版本控制', '地图'],
      url: [
        `${siteUrl}bigdata/`,
        `${siteUrl}cpp/`,
        `${siteUrl}database/`,
        `${siteUrl}editor/`,
        `${siteUrl}go/`,
        `${siteUrl}java/`,
        `${siteUrl}javascript/`,
        `${siteUrl}python/`,
        `${siteUrl}toy/`,
        `${siteUrl}version-control/`,
        `${siteUrl}map/`,
      ],
    },
  ],
};

export default defineConfig({
  site: siteUrl,
  devToolbar: {
    enabled: false,
  },
  integrations: [
    starlight({
      title: siteName,
      description: siteDescription,
      disable404Route: true,
      defaultLocale: 'zh-CN',
      locales: {
        root: {
          label: '简体中文',
          lang: 'zh-CN',
        },
      },
      social: [
        { icon: 'github', label: 'GitHub', href: repositoryUrl },
      ],
      customCss: [
        './src/styles/custom.css',
      ],
      favicon: '/favicon.ico',
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
        // Discovery links
        {
          tag: 'link',
          attrs: {
            rel: 'sitemap',
            href: '/sitemap-index.xml',
          },
        },
        {
          tag: 'link',
          attrs: {
            rel: 'alternate',
            type: 'application/rss+xml',
            title: '我的个人知识库 RSS',
            href: '/rss.xml',
          },
        },
        {
          tag: 'link',
          attrs: {
            rel: 'alternate',
            type: 'text/plain',
            title: 'llms.txt',
            href: '/llms.txt',
          },
        },
        {
          tag: 'link',
          attrs: {
            rel: 'me',
            href: authorUrl,
          },
        },
        // Icons and install metadata
        {
          tag: 'link',
          attrs: {
            rel: 'manifest',
            href: '/site.webmanifest',
          },
        },
        {
          tag: 'link',
          attrs: {
            rel: 'icon',
            type: 'image/svg+xml',
            href: '/favicon.svg',
          },
        },
        {
          tag: 'link',
          attrs: {
            rel: 'icon',
            type: 'image/png',
            sizes: '32x32',
            href: '/assets/icon/favicon-32.png',
          },
        },
        {
          tag: 'link',
          attrs: {
            rel: 'icon',
            type: 'image/png',
            sizes: '16x16',
            href: '/assets/icon/favicon-16.png',
          },
        },
        {
          tag: 'link',
          attrs: {
            rel: 'apple-touch-icon',
            sizes: '180x180',
            href: '/assets/icon/apple-touch-icon.png',
          },
        },
        // Search engine verification
        {
          tag: 'meta',
          attrs: {
            name: 'bytedance-verification-code',
            content: 's7VKpqSphzXoXfNAslZZ',
          },
        },
        {
          tag: 'meta',
          attrs: {
            name: 'baidu-site-verification',
            content: 'codeva-BIsU2OiV53',
          },
        },
        {
          tag: 'meta',
          attrs: {
            name: 'msvalidate.01',
            content: '13FD3929F74B972B769A60E186914A80',
          },
        },
        // SEO meta tags
        {
          tag: 'meta',
          attrs: {
            name: 'author',
            content: authorName,
          },
        },
        {
          tag: 'meta',
          attrs: {
            name: 'creator',
            content: authorName,
          },
        },
        {
          tag: 'meta',
          attrs: {
            name: 'publisher',
            content: authorName,
          },
        },
        {
          tag: 'meta',
          attrs: {
            name: 'keywords',
            content: topicKeywords.join(','),
          },
        },
        {
          tag: 'meta',
          attrs: {
            name: 'robots',
            content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
          },
        },
        {
          tag: 'meta',
          attrs: {
            name: 'googlebot',
            content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
          },
        },
        {
          tag: 'meta',
          attrs: {
            name: 'bingbot',
            content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
          },
        },
        {
          tag: 'meta',
          attrs: {
            name: 'theme-color',
            content: '#f7f5ee',
          },
        },
        {
          tag: 'meta',
          attrs: {
            name: 'color-scheme',
            content: 'light',
          },
        },
        {
          tag: 'meta',
          attrs: {
            name: 'application-name',
            content: siteName,
          },
        },
        {
          tag: 'meta',
          attrs: {
            name: 'apple-mobile-web-app-title',
            content: siteName,
          },
        },
        // Open Graph meta tags
        {
          tag: 'meta',
          attrs: {
            property: 'og:type',
            content: 'website',
          },
        },
        {
          tag: 'meta',
          attrs: {
            property: 'og:site_name',
            content: siteName,
          },
        },
        {
          tag: 'meta',
          attrs: {
            property: 'og:locale',
            content: 'zh_CN',
          },
        },
        {
          tag: 'meta',
          attrs: {
            property: 'og:image',
            content: ogImageUrl,
          },
        },
        {
          tag: 'meta',
          attrs: {
            property: 'og:image:width',
            content: '1200',
          },
        },
        {
          tag: 'meta',
          attrs: {
            property: 'og:image:height',
            content: '630',
          },
        },
        {
          tag: 'meta',
          attrs: {
            property: 'og:image:alt',
            content: '技术笔记索引的命令行知识库封面图',
          },
        },
        // Twitter Card meta tags
        {
          tag: 'meta',
          attrs: {
            name: 'twitter:card',
            content: 'summary_large_image',
          },
        },
        {
          tag: 'meta',
          attrs: {
            name: 'twitter:image',
            content: ogImageUrl,
          },
        },
        {
          tag: 'meta',
          attrs: {
            name: 'twitter:image:alt',
            content: '技术笔记索引的命令行知识库封面图',
          },
        },
        // Structured data (JSON-LD)
        {
          tag: 'script',
          attrs: {
            type: 'application/ld+json',
          },
          content: JSON.stringify(jsonLd),
        },
      ],
    }),
  ],
});
