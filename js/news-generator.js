/**
 * ニュースデータからHTMLを生成するモジュール
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class NewsGenerator {
  /**
   * ニュースデータを読み込む
   * @param {string} filePath - JSONファイルのパス
   * @returns {Array} ニュースデータの配列
   */
  loadNewsData(filePath) {
    const absolutePath = path.resolve(__dirname, '..', filePath);
    const data = fs.readFileSync(absolutePath, 'utf8');
    return JSON.parse(data);
  }

  /**
   * ニュース項目をHTMLリストとして生成
   * @param {Array} newsItems - ニュースデータの配列
   * @returns {string} HTML文字列
   */
  generateNewsList(newsItems) {
    return newsItems.map(item => {
      return `  <li class="list-group-item">
    <h5>${item.title}</h5>
    <small>投稿日: ${item.date}</small>
    <p>${item.content}</p>
  </li>`;
    }).join('\n');
  }

  /**
   * ニュースページのコンテンツを生成
   * @param {Array} newsData - ニュースデータの配列
   * @returns {string} HTML文字列
   */
  generateNewsPage(newsData) {
    return `<h2>ニュース</h2>
<ul class="list-group">
${this.generateNewsList(newsData)}
</ul>`;
  }

  /**
   * トップページ用のニュースセクションを生成（最新N件）
   * @param {Array} newsData - ニュースデータの配列
   * @param {number} count - 表示する件数（デフォルト: 3）
   * @returns {string} HTML文字列
   */
  generateIndexNewsSection(newsData, count = 3) {
    const latestNews = newsData.slice(0, Math.min(count, newsData.length));
    return `<h2>最新のニュース</h2>
<ul class="list-group">
${this.generateNewsList(latestNews)}
</ul>
<a href="news.html" class="btn btn-secondary mt-3">すべてのニュースを見る</a>`;
  }
}

export default NewsGenerator;

