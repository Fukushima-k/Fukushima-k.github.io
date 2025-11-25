/**
 * GitHub Actionsワークフローをローカルでテストするスクリプト
 * コミット・プッシュは実行せず、ビルド部分のみをテストします
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('========================================');
console.log('GitHub Actionsワークフローテスト（ローカル）');
console.log('========================================');
console.log('');

// テスト用の一時ディレクトリ
const testDir = path.join(__dirname, '.test-workflow');
const originalDir = __dirname;

try {
  // 1. Checkout repository（現在のディレクトリを使用）
  console.log('[1/4] リポジトリの確認...');
  if (!fs.existsSync(path.join(originalDir, 'package.json'))) {
    throw new Error('package.jsonが見つかりません。正しいディレクトリで実行してください。');
  }
  console.log('✓ リポジトリを確認しました');

  // 2. Setup Node.js（既にNode.jsがインストールされていることを確認）
  console.log('');
  console.log('[2/4] Node.jsの確認...');
  const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
  console.log(`✓ Node.js ${nodeVersion} が使用可能です`);

  // 3. Install Node.js dependencies
  console.log('');
  console.log('[3/4] Node.js依存関係のインストール...');
  execSync('npm install', { 
    cwd: originalDir,
    stdio: 'inherit'
  });
  console.log('✓ 依存関係のインストールが完了しました');

  // 4. Build all pages (JavaScript only)
  console.log('');
  console.log('[4/4] 全ページのビルド...');
  execSync('npm run build:all', { 
    cwd: originalDir,
    stdio: 'inherit'
  });
  console.log('✓ ビルドが完了しました');

  // 5. 生成されたファイルを確認
  console.log('');
  console.log('========================================');
  console.log('ビルド結果の確認');
  console.log('========================================');
  
  const expectedFiles = [
    'index.html',
    'about.html',
    'research.html',
    'publications.html',
    'news.html',
    'contact.html',
    'index_en.html',
    'contents/publications_content.html',
    'contents/news_content.html',
    'contents/index_content_news_plus_written.html'
  ];

  let allFilesExist = true;
  for (const file of expectedFiles) {
    const filePath = path.join(originalDir, file);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      console.log(`✓ ${file} (${stats.size} bytes)`);
    } else {
      console.log(`✗ ${file} が見つかりません`);
      allFilesExist = false;
    }
  }

  console.log('');
  if (allFilesExist) {
    console.log('========================================');
    console.log('✅ すべてのテストが成功しました！');
    console.log('========================================');
    console.log('');
    console.log('注意: このスクリプトはビルドのみをテストします。');
    console.log('コミット・プッシュは実行されません。');
    console.log('');
    console.log('実際のGitHub Actionsでの動作を確認するには、');
    console.log('この変更をコミット・プッシュしてください。');
  } else {
    console.log('========================================');
    console.log('❌ 一部のファイルが生成されていません');
    console.log('========================================');
    process.exit(1);
  }

} catch (error) {
  console.error('');
  console.error('========================================');
  console.error('❌ エラーが発生しました');
  console.error('========================================');
  console.error(error.message);
  if (error.stdout) {
    console.error('標準出力:', error.stdout);
  }
  if (error.stderr) {
    console.error('標準エラー:', error.stderr);
  }
  process.exit(1);
}


