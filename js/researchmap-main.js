/**
 * ResearchMapデータ処理メインスクリプト
 * JSONLファイルを読み込んでHTMLを生成します
 */

// モジュールの読み込み（Node.js環境の場合）
let ResearchMapProcessor, ResearchMapFetcher;
if (typeof require !== 'undefined') {
  ResearchMapProcessor = require('./researchmap-processor.js');
  ResearchMapFetcher = require('./researchmap-fetcher.js');
} else {
  // ブラウザ環境の場合は、HTMLでscriptタグで読み込む必要があります
  // <script src="js/researchmap-processor.js"></script>
  // <script src="js/researchmap-fetcher.js"></script>
}

/**
 * メイン処理関数
 * @param {Object} options - オプション
 * @param {string} options.inputFile - 入力JSONLファイルのパス
 * @param {string} options.outputFile - 出力HTMLファイルのパス（Node.js環境のみ）
 * @param {string} options.researcherId - ResearchMapの研究者ID（オプション）
 * @param {boolean} options.useResearchMap - ResearchMapから直接取得するかどうか
 */
async function main(options = {}) {
  const {
    inputFile = 'inputjson/rm_researchers20250916.jsonl',
    outputFile = 'contents/publications_content.html',
    researcherId = 'Kentaro_Fukushima',
    useResearchMap = false
  } = options;

  const processor = new ResearchMapProcessor();
  let jsonParsedList = [];

  try {
    if (useResearchMap) {
      // ResearchMapから直接取得を試みる
      const fetcher = new ResearchMapFetcher();
      
      // Node.js環境かどうかを判定
      if (typeof require !== 'undefined') {
        console.log('ResearchMapからデータを取得中...');
        jsonParsedList = await fetcher.fetchFromResearchMapNode(researcherId);
      } else {
        console.log('ブラウザ環境では、プロキシサーバーまたはローカルファイルを使用してください。');
        // フォールバック: ローカルファイルを使用
        jsonParsedList = await processor.loadJSONL(inputFile);
      }
    } else {
      // ローカルファイルから読み込む
      console.log(`JSONLファイルを読み込み中: ${inputFile}`);
      jsonParsedList = await processor.loadJSONL(inputFile);
    }

    console.log(`${jsonParsedList.length}件のデータを読み込みました。`);

    // HTMLを生成
    console.log('HTMLを生成中...');
    const html = processor.makeHTML(jsonParsedList);

    // 出力
    if (typeof require !== 'undefined') {
      // Node.js環境: ファイルに書き込み
      const fs = require('fs');
      fs.writeFileSync(outputFile, html, 'utf8');
      console.log(`HTMLファイルを出力しました: ${outputFile}`);
    } else {
      // ブラウザ環境: コンソールに出力またはDOMに挿入
      console.log('生成されたHTML:');
      console.log(html);
      
      // DOMに挿入する場合の例
      const outputElement = document.getElementById('publications-content');
      if (outputElement) {
        outputElement.innerHTML = html;
      }
    }

    return html;
  } catch (error) {
    console.error('エラーが発生しました:', error);
    throw error;
  }
}

// Node.js環境で直接実行された場合
if (typeof require !== 'undefined' && require.main === module) {
  // コマンドライン引数の処理
  const args = process.argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    const value = args[i + 1];
    options[key] = value;
  }

  // ブール値の変換
  if (options.useResearchMap === 'true') {
    options.useResearchMap = true;
  }

  main(options).catch(error => {
    console.error('実行エラー:', error);
    process.exit(1);
  });
}

// ブラウザ環境で使用する場合のエクスポート
if (typeof window !== 'undefined') {
  window.ResearchMapMain = { main };
}

// Node.js環境でのエクスポート
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { main };
}

