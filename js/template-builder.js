/**
 * EJSテンプレートエンジンを使用したHTMLビルダー
 * よりモダンで保守しやすい実装
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import ejs from 'ejs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class TemplateBuilder {
  constructor() {
    this.templateDir = path.resolve(__dirname, '..', 'templates');
    this.layoutPath = path.join(this.templateDir, 'layout.ejs');
  }

  /**
   * コンテンツファイルを読み込む
   * @param {string} contentPath - コンテンツファイルのパス
   * @returns {string} コンテンツ文字列
   */
  loadContent(contentPath) {
    const absolutePath = path.resolve(__dirname, '..', contentPath);
    return fs.readFileSync(absolutePath, 'utf8');
  }

  /**
   * EJSテンプレートを使用してHTMLページを生成
   * @param {Object} pageConfig - ページ設定
   * @param {string} pageConfig.filename - 出力ファイル名
   * @param {string} pageConfig.title - ページタイトル
   * @param {string} pageConfig.contentFile - コンテンツファイルのパス
   * @param {string} pageConfig.activeMenu - アクティブなメニュー項目
   * @param {Object} pageConfig.data - 追加データ（オプション）
   * @returns {string} 生成されたHTML
   */
  buildPage(pageConfig) {
    // レイアウトテンプレートを読み込み
    const layoutTemplate = fs.readFileSync(this.layoutPath, 'utf8');
    
    // コンテンツを読み込み
    const content = this.loadContent(pageConfig.contentFile);
    
    // EJSでレンダリング
    const html = ejs.render(layoutTemplate, {
      title: pageConfig.title,
      activeMenu: pageConfig.activeMenu || '',
      content: content,
      ...(pageConfig.data || {})
    });
    
    return html;
  }

  /**
   * HTMLファイルを書き込む
   * @param {string} filename - 出力ファイル名
   * @param {string} html - HTML文字列
   */
  writeFile(filename, html) {
    const outputPath = path.resolve(__dirname, '..', filename);
    fs.writeFileSync(outputPath, html, 'utf8');
    console.log(`Generated: ${filename}`);
  }

  /**
   * 複数のページを生成
   * @param {Array} pages - ページ設定の配列
   */
  buildPages(pages) {
    pages.forEach(page => {
      const html = this.buildPage(page);
      this.writeFile(page.filename, html);
    });
  }
}

export default TemplateBuilder;

