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
    title: '我的个人知识库',
    description: '日常做一些知识沉淀，内容很水，就是想记什么就记什么',
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
