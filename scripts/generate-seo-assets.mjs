#!/usr/bin/env node

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = dirname(fileURLToPath(new URL('../package.json', import.meta.url)));
const docsDir = join(rootDir, 'src/content/docs');
const publicDir = join(rootDir, 'public');

const site = {
  name: '技术笔记索引',
  url: 'https://www.wuliang142857.me/',
  language: 'zh-CN',
  author: 'wuliang142857',
  source: 'https://github.com/wuliang142857/my-cookbook',
  description: '面向编译构建、环境配置、数据系统、地图服务和开发工具的中文技术笔记索引。站点以静态 HTML 发布，重点保存可复用的命令、配置路径、排错步骤和上下文。',
};

const indexNowKeyFile = '55fc09c95960efa836b09c545ae7c78d.txt';

const categoryMeta = {
  bigdata: {
    label: '大数据',
    description: 'Hadoop、Greenplum、Elasticsearch、Ambari 相关构建和配置记录。',
  },
  cpp: {
    label: 'C++',
    description: 'CMake、cJSON、跨平台编译和运行环境记录。',
  },
  database: {
    label: '数据库',
    description: 'PostgreSQL、MSYS2 构建和分布式数据库笔记。',
  },
  editor: {
    label: '编辑器',
    description: 'JetBrains IDE、字体、项目配置和 Language Server Protocol 记录。',
  },
  go: {
    label: 'Go',
    description: 'Go 语言交叉编译和 CGO 场景记录。',
  },
  java: {
    label: 'Java',
    description: 'Maven、许可证检查和 Java 构建工具记录。',
  },
  javascript: {
    label: 'JavaScript',
    description: 'npm、webpack、node-gyp 和 Node.js 构建问题记录。',
  },
  map: {
    label: '地图',
    description: 'GeoServer、OpenStreetMap、POI 去重和瓦片服务。',
  },
  python: {
    label: 'Python',
    description: 'pybind11、pip 内部 API 和 pyftpdlib。',
  },
  toy: {
    label: '瞎折腾',
    description: 'Linux、macOS、SSH、ffmpeg、NAS、软件包制作和命令行速查。',
  },
  'version-control': {
    label: '版本控制',
    description: 'Git 代理、仓库复制、文件加密和 SSH 兼容性。',
  },
};

const featuredSlugs = [
  'bigdata/how-to-build-hadoop-on-mac',
  'bigdata/how-to-compile-greenplum6',
  'version-control/git-proxy',
  'map/geoserver',
  'toy/command-cheatsheet',
  'toy/linux-package-build',
];

const aiCrawlers = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-SearchBot',
  'PerplexityBot',
  'Perplexity-User',
  'anthropic-ai',
  'cohere-ai',
  'Applebot',
];

const searchCrawlers = [
  'Googlebot',
  'Bingbot',
  'Baiduspider',
  'Bytespider',
  'YandexBot',
  'DuckDuckBot',
  'NaverBot',
  'SeznamBot',
  'Sogou web spider',
  '360Spider',
  'Sosospider',
  'YisouSpider',
];

const notes = readNotes();
const articles = notes.filter((note) => note.slug !== 'index' && note.slug !== '404');
const indexNowKey = readIndexNowKey();

writeIfChanged(join(publicDir, 'sitemap.xml'), generateCompatibilitySitemap());
writeIfChanged(join(publicDir, 'robots.txt'), generateRobotsTxt());
writeIfChanged(join(publicDir, 'llms.txt'), generateLlmsTxt());

console.log(`Generated SEO assets from ${articles.length} article note(s).`);

function readNotes() {
  return walkMarkdown(docsDir)
    .map((file) => {
      const raw = readFileSync(file, 'utf8');
      const frontmatter = parseFrontmatter(raw, file);
      const rel = relative(docsDir, file).replaceAll('\\', '/');
      const slug = rel.replace(/\.md$/, '').toLowerCase();
      const category = slug.includes('/') ? slug.split('/')[0] : 'root';
      const title = frontmatter.title || slug;
      const description = frontmatter.description || '';

      return {
        file,
        rel,
        slug,
        category,
        title,
        description,
        url: noteUrl(slug),
      };
    })
    .sort((a, b) => {
      const categoryOrder = Object.keys(categoryMeta);
      const aCategory = categoryOrder.indexOf(a.category);
      const bCategory = categoryOrder.indexOf(b.category);
      const normalizedA = aCategory === -1 ? Number.MAX_SAFE_INTEGER : aCategory;
      const normalizedB = bCategory === -1 ? Number.MAX_SAFE_INTEGER : bCategory;
      if (normalizedA !== normalizedB) return normalizedA - normalizedB;
      return a.slug.localeCompare(b.slug, 'zh-CN');
    });
}

function walkMarkdown(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) return walkMarkdown(fullPath);
    if (entry.isFile() && entry.name.endsWith('.md')) return [fullPath];
    return [];
  });
}

function parseFrontmatter(raw, file) {
  const match = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!match) throw new Error(`Missing frontmatter in ${file}`);

  const data = {};
  for (const line of match[1].split('\n')) {
    const field = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!field) continue;

    const [, key, value] = field;
    data[key] = stripQuotes(value.trim());
  }
  return data;
}

function stripQuotes(value) {
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  return value;
}

function noteUrl(slug) {
  if (slug === 'index') return site.url;
  return new URL(`${slug}/`, site.url).href;
}

function generateCompatibilitySitemap() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${new URL('sitemap-0.xml', site.url).href}</loc>
  </sitemap>
</sitemapindex>
`;
}

function generateRobotsTxt() {
  const lines = [
    '# ABOUTME: Generated robots.txt for search engines and AI search crawlers.',
    '# ABOUTME: Run npm run seo:generate to update this file.',
    '',
    'User-agent: *',
    'Allow: /',
    '',
    '# Search engines',
    ...crawlerRules(searchCrawlers),
    '# AI search and answer engines',
    ...crawlerRules(aiCrawlers),
    '# Discovery',
    `Sitemap: ${new URL('sitemap-index.xml', site.url).href}`,
    '',
  ];

  return lines.join('\n');
}

function crawlerRules(crawlers) {
  return crawlers.flatMap((crawler) => [`User-agent: ${crawler}`, 'Allow: /', '']);
}

function generateLlmsTxt() {
  const featured = featuredSlugs
    .map((slug) => articles.find((note) => note.slug === slug))
    .filter(Boolean);

  const grouped = Object.entries(categoryMeta)
    .map(([category, meta]) => {
      const categoryNotes = articles.filter((note) => note.category === category);
      if (categoryNotes.length === 0) return '';

      const noteLines = categoryNotes.map((note) => `  - [${note.title}](${note.url})`);
      return [
        `### ${meta.label}`,
        '',
        `${meta.description} 共 ${categoryNotes.length} 篇。`,
        '',
        ...noteLines,
      ].join('\n');
    })
    .filter(Boolean);

  const featuredLines = featured.map((note) => {
    const suffix = note.description ? `: ${note.description}` : '';
    return `- [${note.title}](${note.url})${suffix}`;
  });

  return [
    `# ${site.name}`,
    '',
    `> ${site.description}`,
    '',
    '## Site',
    '',
    `- Canonical URL: ${site.url}`,
    `- Language: ${site.language}`,
    `- Author: ${site.author}`,
    `- Source: ${site.source}`,
    `- Sitemap: ${new URL('sitemap-index.xml', site.url).href}`,
    `- Direct sitemap: ${new URL('sitemap-0.xml', site.url).href}`,
    `- RSS: ${new URL('rss.xml', site.url).href}`,
    `- IndexNow key: ${new URL(indexNowKeyFile, site.url).href}`,
    '- License: MIT for source code. Article quotations should attribute the source page URL.',
    '',
    '## Primary Entry Points',
    '',
    `- [首页](${site.url}): 技术笔记索引入口，按命令、主题和常用运维动作组织内容。`,
    `- [RSS](${new URL('rss.xml', site.url).href}): 全站文章订阅源。`,
    `- [Sitemap](${new URL('sitemap-index.xml', site.url).href}): 搜索引擎和 AI crawler 的完整 URL 列表。`,
    '',
    '## Representative Notes',
    '',
    ...featuredLines,
    '',
    '## Topic Index',
    '',
    ...grouped.join('\n\n').split('\n'),
    '',
    '## AI Citation Guidance',
    '',
    '- Prefer citing the exact article URL rather than only the domain root.',
    '- Extract command examples together with their surrounding prerequisites and operating-system context.',
    '- Treat notes as practical engineering records, not vendor documentation. When an official upstream source is required, cite that upstream source alongside this site.',
    '- The site allows AI search crawlers and answer engines to index, summarize, and cite public pages with attribution.',
    '',
  ].join('\n');
}

function readIndexNowKey() {
  const keyPath = join(publicDir, indexNowKeyFile);
  if (!existsSync(keyPath)) throw new Error(`Missing IndexNow key file: ${keyPath}`);

  const key = readFileSync(keyPath, 'utf8').trim();
  const keyFromName = indexNowKeyFile.replace(/\.txt$/, '');
  if (key !== keyFromName) {
    throw new Error(`IndexNow key file name and content differ: ${indexNowKeyFile}`);
  }

  return key;
}

function writeIfChanged(file, content) {
  mkdirSync(dirname(file), { recursive: true });
  const normalized = content.endsWith('\n') ? content : `${content}\n`;
  const previous = existsSync(file) ? readFileSync(file, 'utf8') : '';
  if (previous === normalized) return;
  writeFileSync(file, normalized);
  console.log(`Wrote ${relative(rootDir, file)}`);
}
