/**
 * publications.htmlをビルド時に生成するスクリプト
 * Node.js環境で実行します（ES modules形式）
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ResearchMapProcessorを読み込み
import ResearchMapProcessor from './researchmap-processor.js';

/**
 * HTMLテンプレートを読み込む
 */
function loadTemplate() {
  const templatePath = path.join(__dirname, '..', 'publications.html');
  return fs.readFileSync(templatePath, 'utf8');
}

/**
 * ヘッダーとフッターを抽出して、コンテンツ部分を置き換える
 */
function replaceContent(html, newContent) {
  // コンテンツ部分を置き換え
  const contentRegex = /<div class="container my-5"[^>]*>[\s\S]*?<\/div>\s*<!-- footer.html -->/;
  const replacement = `<div class="container my-5">\n${newContent}\n<!-- footer.html -->`;
  return html.replace(contentRegex, replacement);
}

/**
 * メイン処理
 */
async function build() {
  const processor = new ResearchMapProcessor();
  const inputFile = process.argv[2] || 'inputjson/rm_researchers20250916.jsonl';
  const outputFile = process.argv[3] || 'publications.html';

  try {
    console.log(`JSONLファイルを読み込み中: ${inputFile}`);
    const jsonParsedList = await processor.loadJSONL(inputFile);
    console.log(`${jsonParsedList.length}件のデータを読み込みました。`);

    console.log('HTMLを生成中...');
    const htmlContent = processor.makeHTML(jsonParsedList);

    console.log('テンプレートを読み込み中...');
    let template = loadTemplate();

    // JavaScriptの自動読み込み部分を削除（静的HTMLとして生成するため）
    template = template.replace(
      /<script src="js\/researchmap-processor\.js"><\/script>\s*<script src="js\/publications-loader\.js"><\/script>/g,
      ''
    );

    // コンテンツを置き換え
    template = replaceContent(template, htmlContent);

    // ファイルに書き込み
    fs.writeFileSync(outputFile, template, 'utf8');
    console.log(`HTMLファイルを出力しました: ${outputFile}`);
  } catch (error) {
    console.error('エラーが発生しました:', error);
    process.exit(1);
  }
}

// 実行
build();

export { build };

