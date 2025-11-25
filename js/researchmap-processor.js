/**
 * ResearchMapデータ処理モジュール
 * JSONLファイルを読み込んでHTMLを生成する機能を提供
 */

class ResearchMapProcessor {
  constructor() {
    this.gyosekiNames = [
      "査読論文",
      "preprint",
      "国際学会における発表 (査読あり)",
      "招待セッショントーク（Invited Session Talk）",
      "国内学会・シンポジウム等における発表"
    ];
  }

  /**
   * JSONLファイルを読み込んでパースする
   * @param {string} filePath - JSONLファイルのパス
   * @returns {Promise<Array>} パースされたJSONオブジェクトの配列
   */
  async loadJSONL(filePath) {
    try {
      let text;
      
      // Node.js環境かどうかを判定（import.meta.urlが存在し、windowが存在しない場合）
      const isNodeEnv = typeof import.meta !== 'undefined' && 
                        import.meta.url && 
                        typeof window === 'undefined';
      
      if (isNodeEnv) {
        // Node.js環境: fsモジュールを使用
        const fs = await import('fs');
        const path = await import('path');
        const { fileURLToPath } = await import('url');
        
        // 相対パスを絶対パスに変換
        let absolutePath;
        if (path.isAbsolute(filePath)) {
          absolutePath = filePath;
        } else {
          // 現在のモジュールのディレクトリを基準にする
          const currentDir = path.dirname(fileURLToPath(import.meta.url));
          absolutePath = path.resolve(currentDir, '..', filePath);
        }
        
        text = fs.readFileSync(absolutePath, 'utf8');
      } else {
        // ブラウザ環境: fetchを使用
        const response = await fetch(filePath);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
        }
        
        text = await response.text();
      }
      
      if (!text || text.trim().length === 0) {
        throw new Error('JSONLファイルが空です');
      }
      
      const lines = text.trim().split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        throw new Error('JSONLファイルに有効なデータがありません');
      }
      
      return lines.map(line => {
        try {
          return JSON.parse(line);
        } catch (parseError) {
          console.warn('JSONパースエラー:', parseError, 'Line:', line);
          throw new Error(`JSONパースエラー: ${parseError.message}`);
        }
      });
    } catch (error) {
      console.error('JSONLファイルの読み込みエラー:', error);
      
      // CORSエラーの場合の詳細情報（ブラウザ環境のみ）
      if (typeof window !== 'undefined' && 
          (error.message.includes('Failed to fetch') || 
           error.message.includes('NetworkError') ||
           error.name === 'TypeError')) {
        const corsError = new Error('CORSエラー: ローカルファイルシステムから直接ファイルを読み込むことはできません。ローカルサーバーを使用するか、ビルド時にHTMLを生成してください。');
        corsError.originalError = error;
        throw corsError;
      }
      
      throw error;
    }
  }

  /**
   * 名前をFamily name + イニシャル形式に変換
   * @param {string} name - 変換する名前
   * @returns {string} 変換後の名前
   */
  convertName(name) {
    // すでにFamily name + イニシャル形式の場合
    if (/^[A-Za-z]+, [A-Za-z]\.*$/.test(name)) {
      if (/^[A-Za-z]+, [A-Za-z]\.$/.test(name)) {
        return name;
      } else {
        return name + ".";
      }
    }

    // First name + Family nameの場合、Family name + イニシャルに変換
    const parts = name.split(" ");
    if (parts.length === 2) {
      const familyName = parts[1];
      const initial = parts[0].substring(0, 1);
      return `${familyName}, ${initial}.`;
    }

    return name;
  }

  /**
   * HTML URLを生成
   * @param {string} url - URL
   * @param {string} text - 表示テキスト
   * @param {boolean} doi - DOIかどうか
   * @returns {string} HTMLリンク
   */
  htmlUrl(url, text = url, doi = false) {
    if (!url) return "";
    if (doi) {
      return `<a href="https://doi.org/${url}">${url}</a>`;
    } else {
      return `<a href="${url}">${text}</a>`;
    }
  }

  /**
   * データを分類するインデックスを取得
   * @param {Object} jsonParsed - パースされたJSONオブジェクト
   * @returns {number} 分類インデックス
   */
  splitList(jsonParsed) {
    let index = 0;
    
    if (jsonParsed.insert.type === "presentations") {
      const lang = Object.keys(jsonParsed.merge.presentation_title || {})[0];
      
      if (lang === "en") {
        if (jsonParsed.merge.invited) {
          index = 4;
        } else {
          index = 3;
        }
      } else if (lang === "ja") {
        index = 5;
      }
    } else if (jsonParsed.insert.type === "published_papers") {
      const publicationName = jsonParsed.merge.publication_name;
      const pubName = typeof publicationName === 'object' 
        ? Object.values(publicationName)[0] 
        : publicationName;
      
      if (pubName === "Open Science Framework") {
        index = 2;
      } else {
        index = 1;
      }
    }
    
    return index;
  }

  /**
   * 発表データからレコード文字列を生成
   * @param {Object} jsonParsed - パースされたJSONオブジェクト
   * @returns {string} レコード文字列
   */
  makeRecordPresentation(jsonParsed) {
    const merge = jsonParsed.merge;
    const lang = Object.keys(merge.presentation_title || {})[0];
    
    // 著者名の処理
    let authorStr = "";
    const presenters = merge.presenters?.[lang] || [];
    const authorVec = presenters.map(p => p.name);
    
    if (lang === "ja") {
      authorStr = authorVec.join("・");
    } else {
      const authorVecRed = authorVec.map(name => this.convertName(name));
      if (authorVecRed.length > 2) {
        authorStr = `${authorVecRed.slice(0, -1).join(", ")}, & ${authorVecRed[authorVecRed.length - 1]}`;
      } else {
        authorStr = authorVecRed.join(" & ");
      }
    }
    
    const year = merge.publication_date || "";
    const title = merge.presentation_title?.[lang] || "";
    const journal = merge.event?.[lang] || "";
    const location = merge.location?.[lang] || "";
    
    let invitedChar = "";
    if (merge.invited) {
      invitedChar = lang === "ja" ? "[招待]" : "[invited]";
    }
    
    let type = "";
    if (merge.presentation_type) {
      // presentation_typeが配列の場合と文字列の場合の両方に対応
      const presentationType = Array.isArray(merge.presentation_type) 
        ? merge.presentation_type.join(" ") 
        : merge.presentation_type;
      
      // oral_presentationを含む場合（oral_presentation, invited_oral_presentationなど）
      if (presentationType.includes("oral_presentation")) {
        type = lang === "ja" ? "口頭" : "Oral";
      } else if (presentationType.includes("poster_presentation")) {
        type = lang === "ja" ? "ポスター" : "Poster";
      } else if (presentationType === "public_discourse") {
        // public_discourseは口頭発表として扱う
        type = lang === "ja" ? "口頭" : "Oral";
      }
    } else {
      // presentation_typeが存在しない場合、デフォルトで口頭発表として扱う
      // （国内学会の発表の多くは口頭発表である可能性が高い）
      type = lang === "ja" ? "口頭" : "Oral";
    }
    
    const text = `[${type}] ${authorStr} <i>${title}</i>, ${journal}, ${year}, ${location}.`;
    return invitedChar + text;
  }

  /**
   * 論文データからレコード文字列を生成
   * @param {Object} jsonParsed - パースされたJSONオブジェクト
   * @returns {string} レコード文字列
   */
  makeRecordPaper(jsonParsed) {
    const merge = jsonParsed.merge;
    const lang = Object.keys(merge.paper_title || {})[0];
    
    // 著者名の処理
    let authorStr = "";
    const authors = merge.authors?.[lang] || [];
    const authorVec = authors.map(a => a.name);
    
    if (lang === "ja") {
      authorStr = authorVec.join("・");
    } else {
      const authorVecRed = authorVec.map(name => this.convertName(name));
      if (authorVecRed.length > 1) {
        authorStr = `${authorVecRed.slice(0, -1).join(", ")}, & ${authorVecRed[authorVecRed.length - 1]}`;
      } else {
        authorStr = authorVecRed[0] || "";
      }
    }
    
    const year = merge.publication_date || "";
    const title = merge.paper_title?.[lang] || "";
    const journal = typeof merge.publication_name === 'object' 
      ? Object.values(merge.publication_name)[0] 
      : merge.publication_name || "";
    
    let volumepages = "";
    if (merge.volume && merge.number && merge.starting_page && merge.ending_page) {
      volumepages = `${merge.volume}(${merge.number}), ${merge.starting_page}-${merge.ending_page}`;
    } else if (merge.volume === "OnlineFirst") {
      volumepages = merge.volume;
    } else {
      volumepages = "no_volume";
    }
    
    const doi = merge.identifiers?.doi?.[0] || "";
    const doiLink = this.htmlUrl(doi, doi, true);
    
    // see_alsoの処理
    let urls = "";
    if (merge.see_also && Array.isArray(merge.see_also)) {
      const urlParts = merge.see_also
        .map(item => {
          const url = item['@id'] || "";
          if (!url) return "";
          
          const isPreprint = url.includes("preprint");
          const isOSF = url.includes("osf.io") && !isPreprint;
          const isDOI = url.includes("doi");
          
          if (isPreprint) {
            return `[${this.htmlUrl(url, "preprint")}]`;
          } else if (isOSF) {
            return `[${this.htmlUrl(url, "OSF")}]`;
          } else if (isDOI) {
            return "";
          }
          return "";
        })
        .filter(part => part !== "");
      
      urls = urlParts.join(", ");
    }
    
    const text = `${authorStr} (${year}). ${title}, <i>${journal}</i>, ${volumepages}, ${doiLink}. ${urls}`;
    return text;
  }

  /**
   * 単一レコードを生成
   * @param {Object} jsonParsed - パースされたJSONオブジェクト
   * @returns {string} レコード文字列
   */
  makeRecord(jsonParsed) {
    if (jsonParsed.insert.type === "presentations") {
      return this.makeRecordPresentation(jsonParsed);
    } else if (jsonParsed.insert.type === "published_papers") {
      return this.makeRecordPaper(jsonParsed);
    }
    return "";
  }

  /**
   * HTMLを生成
   * @param {Array} jsonParsedList - パースされたJSONオブジェクトの配列
   * @returns {string} HTML文字列
   */
  makeHTML(jsonParsedList) {
    // 論文と発表のみをフィルタリング（display: "closed"は除外）
    const filteredList = jsonParsedList.filter(item => {
      if (item.insert.type !== "published_papers" && item.insert.type !== "presentations") {
        return false;
      }
      // display: "closed"のデータは除外
      if (item.merge.display === "closed") {
        return false;
      }
      return true;
    });
    
    // データを分類
    const jsonIndexVec = filteredList.map(item => this.splitList(item));
    
    // 分類ごとにデータを整理
    const gyoseki = {};
    for (let j = 0; j < this.gyosekiNames.length; j++) {
      const index = j + 1;
      const filtered = filteredList.filter((_, idx) => jsonIndexVec[idx] === index);
      if (filtered.length > 0) {
        gyoseki[index] = filtered.map(item => this.makeRecord(item));
      }
    }
    
    // HTMLを生成
    let html = "<h2>業績一覧</h2>\n\n";
    const htmlParts = [];
    
    for (let j = 0; j < this.gyosekiNames.length; j++) {
      const index = j + 1;
      if (gyoseki[index]) {
        const items = gyoseki[index]
          .map(record => `  <li>\n${record}\n  </li>\n`)
          .join("");
        htmlParts.push(`<h3>${this.gyosekiNames[j]}</h3>\n<ol>\n${items}</ol>`);
      }
    }
    
    html += htmlParts.join("\n\n");
    return html;
  }

  /**
   * JSONLファイルからHTMLを生成
   * @param {string} filePath - JSONLファイルのパス
   * @returns {Promise<string>} HTML文字列
   */
  async processJSONLToHTML(filePath) {
    const jsonParsedList = await this.loadJSONL(filePath);
    return this.makeHTML(jsonParsedList);
  }
}

// Node.js環境とブラウザ環境の両方に対応
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ResearchMapProcessor;
}

// ES modules形式のエクスポート
export default ResearchMapProcessor;

