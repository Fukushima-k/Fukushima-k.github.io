/**
 * publications.htmlに自動でResearchMapデータを読み込むスクリプト
 * ページ読み込み時に自動実行されます
 */

(function() {
  'use strict';

  // 設定
  const CONFIG = {
    jsonlFile: 'inputjson/rm_researchers20250916.jsonl',
    targetContainer: '.container.my-5', // コンテンツを挿入するコンテナ
    autoLoad: true // ページ読み込み時に自動実行するか
  };

  /**
   * ページ読み込み時に自動実行
   */
  async function init() {
    // ResearchMapProcessorが読み込まれているか確認
    if (typeof ResearchMapProcessor === 'undefined') {
      console.error('ResearchMapProcessorが読み込まれていません。');
      return;
    }

    const processor = new ResearchMapProcessor();
    const container = document.querySelector(CONFIG.targetContainer);

    if (!container) {
      console.error('コンテナが見つかりません:', CONFIG.targetContainer);
      return;
    }

    try {
      // ローディング表示
      container.innerHTML = '<p>データを読み込み中...</p>';

      // JSONLファイルからHTMLを生成
      const html = await processor.processJSONLToHTML(CONFIG.jsonlFile);

      // コンテナに挿入
      container.innerHTML = html;

      console.log('ResearchMapデータの読み込みが完了しました。');
    } catch (error) {
      console.error('データの読み込みエラー:', error);
      
      // CORSエラーの場合の特別なメッセージ
      let errorMessage = error.message;
      let solutionMessage = '';
      
      if (error.message.includes('CORS') || error.message.includes('Failed to fetch') || 
          window.location.protocol === 'file:') {
        errorMessage = 'CORSエラー: ローカルファイルシステムから直接ファイルを読み込むことはできません。';
        solutionMessage = `
          <h5>解決方法:</h5>
          <ol>
            <li><strong>ローカルサーバーを起動する（推奨）:</strong><br>
              <code>python -m http.server 8000</code> または <code>npx http-server</code><br>
              その後、<code>http://localhost:8000/publications.html</code> にアクセスしてください。
            </li>
            <li><strong>ビルド時にHTMLを生成する:</strong><br>
              <code>npm run build:publications</code> を実行して、静的HTMLファイルを生成してください。
            </li>
          </ol>
        `;
      }
      
      container.innerHTML = `
        <div class="alert alert-warning" role="alert">
          <h4>データの読み込みに失敗しました</h4>
          <p><strong>エラー:</strong> ${errorMessage}</p>
          <p><strong>ファイルパス:</strong> ${CONFIG.jsonlFile}</p>
          ${solutionMessage}
          <hr>
          <p><small>詳細はブラウザのコンソール（F12キー）を確認してください。</small></p>
        </div>
      `;
    }
  }

  // ページ読み込み時に自動実行
  if (CONFIG.autoLoad) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      // すでに読み込み済みの場合
      init();
    }
  }

  // グローバルに公開（手動実行用）
  window.ResearchMapLoader = {
    init: init,
    config: CONFIG
  };
})();

