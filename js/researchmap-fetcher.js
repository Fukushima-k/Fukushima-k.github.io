/**
 * ResearchMapデータ取得モジュール
 * ResearchMapの公開ページからデータを取得する機能を提供
 */

class ResearchMapFetcher {
  constructor() {
    this.baseUrl = "https://researchmap.jp";
  }

  /**
   * ResearchMapの研究者IDからJSONLデータを取得
   * 注意: CORSの問題があるため、Node.js環境またはプロキシサーバーが必要です
   * @param {string} researcherId - ResearchMapの研究者ID（例: "Kentaro_Fukushima"）
   * @returns {Promise<Array>} パースされたJSONオブジェクトの配列
   */
  async fetchFromResearchMap(researcherId) {
    // ResearchMapのエクスポート機能を使用する場合のURL
    // 実際のエンドポイントはResearchMapの仕様に依存します
    const url = `${this.baseUrl}/${researcherId}/export.jsonl`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        mode: 'cors'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      const lines = text.trim().split('\n').filter(line => line.trim());
      return lines.map(line => JSON.parse(line));
    } catch (error) {
      console.error('ResearchMapからのデータ取得エラー:', error);
      console.warn('CORSエラーの可能性があります。Node.js環境またはプロキシサーバーを使用してください。');
      throw error;
    }
  }

  /**
   * Node.js環境でResearchMapからデータを取得（CORS回避）
   * @param {string} researcherId - ResearchMapの研究者ID
   * @returns {Promise<Array>} パースされたJSONオブジェクトの配列
   */
  async fetchFromResearchMapNode(researcherId) {
    // Node.js環境でのみ動作
    if (typeof require === 'undefined') {
      throw new Error('この関数はNode.js環境でのみ動作します。');
    }

    const https = require('https');
    const http = require('http');
    const { URL } = require('url');

    const url = `${this.baseUrl}/${researcherId}/export.jsonl`;
    const urlObj = new URL(url);

    return new Promise((resolve, reject) => {
      const client = urlObj.protocol === 'https:' ? https : http;
      
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        }
      };

      const req = client.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const lines = data.trim().split('\n').filter(line => line.trim());
            const parsed = lines.map(line => JSON.parse(line));
            resolve(parsed);
          } catch (error) {
            reject(new Error(`JSONパースエラー: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.end();
    });
  }

  /**
   * プロキシサーバー経由でResearchMapからデータを取得
   * @param {string} researcherId - ResearchMapの研究者ID
   * @param {string} proxyUrl - プロキシサーバーのURL（オプション）
   * @returns {Promise<Array>} パースされたJSONオブジェクトの配列
   */
  async fetchViaProxy(researcherId, proxyUrl = null) {
    const targetUrl = `${this.baseUrl}/${researcherId}/export.jsonl`;
    const url = proxyUrl || `/api/proxy?url=${encodeURIComponent(targetUrl)}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      const lines = text.trim().split('\n').filter(line => line.trim());
      return lines.map(line => JSON.parse(line));
    } catch (error) {
      console.error('プロキシ経由でのデータ取得エラー:', error);
      throw error;
    }
  }

  /**
   * ResearchMapの公開ページからHTMLをパースしてデータを抽出
   * 注意: この方法はResearchMapのHTML構造に依存します
   * @param {string} researcherId - ResearchMapの研究者ID
   * @returns {Promise<Array>} 抽出されたデータの配列
   */
  async fetchFromPublicPage(researcherId) {
    const url = `${this.baseUrl}/${researcherId}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();
      // HTMLパーサーを使用してデータを抽出
      // 実際の実装はResearchMapのHTML構造に依存します
      // ここでは簡易的な実装例を示します
      
      // DOMParserを使用（ブラウザ環境）
      if (typeof DOMParser !== 'undefined') {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        // 実際のデータ抽出ロジックを実装
        return this.extractDataFromHTML(doc);
      } else {
        throw new Error('DOMParserが利用できません。ブラウザ環境で実行してください。');
      }
    } catch (error) {
      console.error('公開ページからのデータ取得エラー:', error);
      throw error;
    }
  }

  /**
   * HTMLドキュメントからデータを抽出
   * @param {Document} doc - パースされたHTMLドキュメント
   * @returns {Array} 抽出されたデータの配列
   */
  extractDataFromHTML(doc) {
    // 実際の実装はResearchMapのHTML構造に依存します
    // ここではプレースホルダーとして空配列を返します
    const data = [];
    
    // 例: 論文データの抽出
    const paperElements = doc.querySelectorAll('.published-paper, .paper-item');
    paperElements.forEach(element => {
      // データ抽出ロジックを実装
    });
    
    return data;
  }
}

// Node.js環境とブラウザ環境の両方に対応
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ResearchMapFetcher;
}

