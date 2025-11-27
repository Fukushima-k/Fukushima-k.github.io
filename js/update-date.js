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
    // contents/publications_content.htmlの最終更新日を取得
    // HEADリクエストを使用してファイルのメタデータのみを取得
    fetch('contents/publications_content.html', { method: 'HEAD' })
        .then(response => {
            if (response.ok) {
                // Last-Modifiedヘッダーから日付を取得
                const lastModifiedHeader = response.headers.get('Last-Modified');
                if (lastModifiedHeader) {
                    const lastModified = new Date(lastModifiedHeader);
                    const formattedDate = formatDate(lastModified);
                    insertPublicationsDate(formattedDate);
                } else {
                    // Last-Modifiedヘッダーが取得できない場合は、ページの最終更新日を使用
                    fallbackToPageDate();
                }
            } else {
                fallbackToPageDate();
            }
        })
        .catch(error => {
            console.log('業績ファイルの最終更新日を取得できませんでした:', error);
            // エラーが発生した場合は、ページの最終更新日を使用
            fallbackToPageDate();
        });
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

