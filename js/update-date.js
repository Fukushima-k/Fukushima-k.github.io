// 最終更新日を表示する共通スクリプト

// 日付を日本語形式にフォーマットする関数
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}年${month}月${day}日`;
}

// ページ全体の最終更新日を表示
function displayPageLastUpdated() {
    const lastModified = new Date(document.lastModified);
    const formattedDate = formatDate(lastModified);
    
    // フッターに最終更新日を追加
    const footer = document.querySelector('footer .container');
    if (footer) {
        const lastUpdatedElement = document.createElement('p');
        lastUpdatedElement.className = 'mb-0 mt-2';
        lastUpdatedElement.style.fontSize = '0.9em';
        lastUpdatedElement.style.color = '#666';
        lastUpdatedElement.textContent = `最終更新日: ${formattedDate}`;
        
        // コピーライトの後に挿入
        const copyright = footer.querySelector('p');
        if (copyright) {
            copyright.insertAdjacentElement('afterend', lastUpdatedElement);
        } else {
            footer.insertBefore(lastUpdatedElement, footer.firstChild);
        }
    }
}

// 業績の最終更新日を表示（publications.html専用）
function displayPublicationsLastUpdated() {
    // inputjson/ディレクトリ内の最新のJSONLファイルの最終更新日を取得
    // ファイル名のパターン: rm_researchersYYYYMMDD.jsonl
    getLatestJSONLFileDate()
        .then(formattedDate => {
            if (formattedDate) {
                insertPublicationsDate(formattedDate);
            } else {
                fallbackToPageDate();
            }
        })
        .catch(error => {
            console.log('業績JSONLファイルの最終更新日を取得できませんでした:', error);
            fallbackToPageDate();
        });
}

// 最新のJSONLファイルの最終更新日を取得
async function getLatestJSONLFileDate() {
    // ビルド時に埋め込まれたメタデータを確認
    const metaElement = document.querySelector('meta[name="publications-jsonl-date"]');
    if (metaElement) {
        const dateStr = metaElement.getAttribute('content');
        if (dateStr) {
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
                return formatDate(date);
            }
        }
    }
    
    // メタデータが存在しない場合は、inputjson/ディレクトリ内のJSONLファイルを直接確認
    // ファイル名のパターン: rm_researchersYYYYMMDD.jsonl
    // 最新のファイルを特定するために、過去2年分の日付パターンを試す
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    // 試すファイル名のリスト（最新から順に）
    const candidates = [];
    
    // 現在から過去24ヶ月分のファイル名を生成（各月の1日、15日、月末を試す）
    for (let i = 0; i < 24; i++) {
        const date = new Date(currentYear, currentMonth - 1 - i, 1);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        
        // 1日、15日、月末を試す
        const days = [1, 15];
        // 月末を計算
        const lastDay = new Date(year, date.getMonth() + 1, 0).getDate();
        days.push(lastDay);
        
        for (const day of days) {
            const dayStr = String(day).padStart(2, '0');
            const dateStr = `${year}${month}${dayStr}`;
            candidates.push(`inputjson/rm_researchers${dateStr}.jsonl`);
        }
    }
    
    // 各候補ファイルの最終更新日を確認
    let latestDate = null;
    let latestFilePath = null;
    
    for (const filePath of candidates) {
        try {
            const response = await fetch(filePath, { method: 'HEAD' });
            if (response.ok) {
                const lastModifiedHeader = response.headers.get('Last-Modified');
                if (lastModifiedHeader) {
                    const lastModified = new Date(lastModifiedHeader);
                    if (!latestDate || lastModified > latestDate) {
                        latestDate = lastModified;
                        latestFilePath = filePath;
                    }
                }
            }
        } catch (error) {
            // ファイルが存在しない場合は次の候補を試す
            continue;
        }
    }
    
    if (latestDate) {
        return formatDate(latestDate);
    }
    
    // どのファイルも取得できない場合は、nullを返す
    return null;
}

// 業績の最終更新日を挿入するヘルパー関数
function insertPublicationsDate(formattedDate) {
    const container = document.querySelector('.container.my-5');
    if (container) {
        const h2 = container.querySelector('h2');
        if (h2 && h2.textContent === '業績一覧') {
            // 既に存在する場合は削除
            const existingDate = container.querySelector('.publications-last-updated');
            if (existingDate) {
                existingDate.remove();
            }
            
            const lastUpdatedElement = document.createElement('p');
            lastUpdatedElement.className = 'mb-3 publications-last-updated';
            lastUpdatedElement.style.fontSize = '0.95em';
            lastUpdatedElement.style.color = '#666';
            lastUpdatedElement.textContent = `業績の最終更新日: ${formattedDate}`;
            h2.insertAdjacentElement('afterend', lastUpdatedElement);
        }
    }
}

// フォールバック関数：ページの最終更新日を使用
function fallbackToPageDate() {
    const lastModified = new Date(document.lastModified);
    const formattedDate = formatDate(lastModified);
    insertPublicationsDate(formattedDate);
}

// ページ読み込み時に実行
document.addEventListener('DOMContentLoaded', function() {
    // すべてのページでページ全体の最終更新日を表示
    displayPageLastUpdated();
    
    // publications.htmlの場合のみ、業績の最終更新日も表示
    if (window.location.pathname.includes('publications.html')) {
        displayPublicationsLastUpdated();
    }
});

