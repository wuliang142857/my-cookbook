const fs = require('fs');
const xml2js = require('xml2js');
const path = require('path');

const root_dir = path.join(__dirname, '..');
const dist_dir = path.join(root_dir, 'dist');
const sitemap_file = path.join(dist_dir, 'sitemap.xml');

// 读取 sitemap.xml 文件
fs.readFile(sitemap_file, (err, data) => {
    if (err) {
        console.error('Error reading the file:', err);
        return;
    }

    // 解析 XML
    xml2js.parseString(data, (err, result) => {
        if (err) {
            console.error('Error parsing XML:', err);
            return;
        }

        // 提取每个 <loc> 标签中的 URL
        const urls = result.urlset.url.map(item => item.loc[0]);

        // 输出每行一个 URL
        urls.forEach(url => console.log(url));
    });
});
