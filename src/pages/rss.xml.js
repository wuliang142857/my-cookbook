// ABOUTME: RSS feed generator for the documentation site.
// ABOUTME: Generates an RSS 2.0 feed with all documentation articles.

import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const docs = await getCollection('docs');

  // Filter out index pages and sort by title
  const articles = docs
    .filter(doc => !doc.slug.endsWith('index') && doc.slug !== '' && doc.slug !== '404')
    .sort((a, b) => a.data.title.localeCompare(b.data.title, 'zh-CN'));

  return rss({
    title: '技术笔记索引',
    description: '面向编译构建、环境配置、数据系统、地图服务和开发工具的个人技术笔记索引。',
    site: context.site,
    items: articles.map((doc) => ({
      title: doc.data.title,
      description: doc.data.description || doc.data.title,
      link: `/${doc.slug}/`,
      pubDate: doc.data.lastUpdated || new Date(),
    })),
    customData: `<language>zh-CN</language>`,
  });
}
