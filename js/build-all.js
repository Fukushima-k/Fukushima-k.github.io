/**
 * ホームページ全体をビルドするスクリプト
 * JavaScriptのみで完結します（R不要）
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import ResearchMapProcessor from './researchmap-processor.js';
import NewsGenerator from './news-generator.js';
import TemplateBuilder from './template-builder.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 最新のJSONLファイルを取得
 */
function getLatestJSONLFile() {
  const inputDir = path.resolve(__dirname, '..', 'inputjson');
  const files = fs.readdirSync(inputDir)
    .filter(file => file.match(/^rm_researchers.*\.jsonl$/))
    .map(file => ({
      name: file,
      path: path.join(inputDir, file),
      time: fs.statSync(path.join(inputDir, file)).mtime
    }))
    .sort((a, b) => b.time - a.time);
  
  if (files.length === 0) {
    throw new Error('JSONLファイルが見つかりません: inputjson/');
  }
  
  return files[0].path;
}

/**
 * メイン処理
 */
async function build() {
  console.log('========================================');
  console.log('ホームページビルドスクリプト（JavaScript版）');
  console.log('========================================');
  console.log('');

  try {
    // 1. ResearchMapデータからpublications.htmlを生成
    console.log('[1/5] ResearchMapデータから業績ページ（publications.html）を生成中...');
    const processor = new ResearchMapProcessor();
    const jsonlFile = getLatestJSONLFile();
    console.log(`使用するJSONLファイル: ${path.basename(jsonlFile)}`);
    
    const jsonParsedList = await processor.loadJSONL(jsonlFile);
    console.log(`${jsonParsedList.length}件のデータを読み込みました。`);
    
    const publicationsHTML = processor.makeHTML(jsonParsedList);
    console.log('✓ publications_content.htmlの準備が完了しました');

    // 2. ResearchMapデータからpublications_content.htmlを生成
    console.log('');
    console.log('[2/5] ResearchMapデータからコンテンツファイル（publications_content.html）を生成中...');
    const contentDir = path.resolve(__dirname, '..', 'contents');
    fs.writeFileSync(
      path.join(contentDir, 'publications_content.html'),
      publicationsHTML,
      'utf8'
    );
    console.log('✓ publications_content.htmlを生成しました');

    // 3. ニュースデータからニュースページを生成
    console.log('');
    console.log('[3/5] ニュースページを生成中...');
    const newsGenerator = new NewsGenerator();
    const newsData = newsGenerator.loadNewsData('data/news.json');
    const newsPageContent = newsGenerator.generateNewsPage(newsData);
    
    const newsContentPath = path.resolve(__dirname, '..', 'contents', 'news_content.html');
    fs.writeFileSync(newsContentPath, newsPageContent, 'utf8');
    console.log('✓ news_content.htmlを生成しました');

    // 4. トップページのニュースセクションを生成
    console.log('');
    console.log('[4/5] トップページのニュースセクションを生成中...');
    const indexNewsSection = newsGenerator.generateIndexNewsSection(newsData, 3);
    
    // index_content_news_plus.htmlを読み込んでプレースホルダーを置換
    const indexTemplatePath = path.resolve(__dirname, '..', 'contents', 'index_content_news_plus.html');
    let indexContent = fs.readFileSync(indexTemplatePath, 'utf8');
    indexContent = indexContent.replace('{{news_section}}', indexNewsSection);
    
    const indexWrittenPath = path.resolve(__dirname, '..', 'contents', 'index_content_news_plus_written.html');
    fs.writeFileSync(indexWrittenPath, indexContent, 'utf8');
    console.log('✓ index_content_news_plus_written.htmlを生成しました');

    // 5. 全ページのHTMLを生成（EJSテンプレートを使用）
    console.log('');
    console.log('[5/5] 全ページのHTMLを生成中（EJSテンプレート使用）...');
    
    const templateBuilder = new TemplateBuilder();
    
    const pages = [
      {
        filename: 'index.html',
        title: '福島健太郎のホームページ - ホーム',
        contentFile: 'contents/index_content_news_plus_written.html',
        activeMenu: 'home'
      },
      {
        filename: 'about.html',
        title: '福島健太郎のホームページ - 自己紹介',
        contentFile: 'contents/about_content.html',
        activeMenu: 'about'
      },
      {
        filename: 'research.html',
        title: '福島健太郎のホームページ - 研究内容',
        contentFile: 'contents/research_content.html',
        activeMenu: 'research'
      },
      {
        filename: 'publications.html',
        title: '福島健太郎のホームページ - 業績一覧',
        contentFile: 'contents/publications_content.html',
        activeMenu: 'publications'
      },
      {
        filename: 'news.html',
        title: '福島健太郎のホームページ - ニュース',
        contentFile: 'contents/news_content.html',
        activeMenu: 'news'
      },
      {
        filename: 'contact.html',
        title: '福島健太郎のホームページ - お問い合わせ',
        contentFile: 'contents/contact_content.html',
        activeMenu: 'contact'
      },
      {
        filename: 'index_en.html',
        title: 'English Version - Coming Soon',
        contentFile: 'contents/index_en_content.html',
        activeMenu: ''
      }
    ];

    templateBuilder.buildPages(pages);
    
    console.log('');
    console.log('✓ EJSテンプレートエンジンを使用してHTMLを生成しました');

    console.log('');
    console.log('========================================');
    console.log('ビルド完了！');
    console.log('========================================');
    console.log('');
    console.log('生成されたファイル:');
    pages.forEach(page => {
      console.log(`  - ${page.filename}`);
    });
    console.log('');

  } catch (error) {
    console.error('エラーが発生しました:', error);
    process.exit(1);
  }
}

// 実行
build();

