# Search Engine Submission

This site is a static Astro/Starlight knowledge base. Search engine discovery should use the canonical sitemap first, plus IndexNow for engines that support push notifications.

## Canonical URLs

- Site: `https://www.wuliang142857.me/`
- Sitemap: `https://www.wuliang142857.me/sitemap-index.xml`
- RSS: `https://www.wuliang142857.me/rss.xml`
- Robots: `https://www.wuliang142857.me/robots.txt`
- llms.txt: `https://www.wuliang142857.me/llms.txt`
- IndexNow key: `https://www.wuliang142857.me/55fc09c95960efa836b09c545ae7c78d.txt`

## Automated Submission

IndexNow is configured for publish-time URL notification.

```bash
npm run build
npm run indexnow:dry-run
npm run indexnow:submit
```

The GitHub Actions deployment runs `npm run indexnow:submit` after Cloudflare Pages publish. The workflow marks this step as non-blocking so a transient search-engine API issue does not break deployment.

## Webmaster Platforms

| Platform | Status | Action |
| --- | --- | --- |
| Google Search Console | HTML verification file exists: `/google8f0eec9657b0e51b.html` | Add or confirm property, then submit `https://www.wuliang142857.me/sitemap-index.xml` in the Sitemaps report. |
| Bing Webmaster Tools | XML verification file exists: `/BingSiteAuth.xml`; `msvalidate.01` meta tag is configured | Add or confirm site, submit sitemap, and monitor IndexNow Insights. |
| Baidu 搜索资源平台 | HTML verification file exists and `baidu-site-verification` meta tag is configured | Add or confirm site, then submit sitemap or URL push in 百度搜索资源平台. |
| ByteDance / Toutiao Search | HTML verification file exists and ByteDance meta tag is configured | Add or confirm site, then submit sitemap in the platform. |
| Yandex Webmaster | IndexNow is automated | Add site manually if search analytics are needed; sitemap can also be submitted in Yandex Webmaster. |
| Naver Search Advisor | IndexNow is automated through participating engines | Add site manually if Korean search visibility needs reporting. |
| Seznam / Yep | IndexNow is automated through participating engines | No extra repository change required. |
| 360 搜索站长平台 | No verification token in this repository | Add site in `https://zhanzhang.so.com/`, get verification token/file, then commit that exact token or file. |
| 搜狗资源平台 | No verification token in this repository | Add site in `https://zhanzhang.sogou.com/`, get verification token/file, then commit that exact token or file. |
| 神马/夸克站长平台 | No verification token in this repository | Add site in `https://zhanzhang.sm.cn/`, get verification token/file, then commit that exact token or file. |

## Notes

- Google's old unauthenticated sitemap ping endpoint is deprecated. Use Search Console, the Search Console API, or the `Sitemap:` line in `robots.txt`.
- Google Indexing API is not a general blog indexing API; it is intended for supported structured content types such as JobPosting and BroadcastEvent/VideoObject.
- Sitemap and IndexNow submission are discovery signals, not indexing guarantees.
- Keep all webmaster verification files in `public/` so they are deployed at the site root.
