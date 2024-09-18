# generate_html.R

# 必要なパッケージをロード
# install.packages("stringr") # 未インストールの場合はコメントを外す
library(stringr)

# setwd("C:/Users/muphy/マイドライブ/012myhomepage_github/新しい頁/new/R")
setwd("C:/Users/muphy/マイドライブ/012myhomepage_github/")
# ヘッダーとフッターを読み込み
header_template <- readLines("templete/header.html", encoding = "UTF-8")
footer_template <- readLines("templete/footer.html", encoding = "UTF-8")

html_url <- function(url, text, doi = FALSE){
  if(doi) url <- sprintf("https://doi.org/%s", url)
  if(missing(text)){
    text <- url
  }
  sprintf('<a href="%s">%s</a>', url, text)
} 

# news の管理
# ニュースデータ
news_data <- list(
  list(
    title = "新しいホームページを公開します。",
    date = "2024-07",
    content = paste0("新しいホームページを公開します。内容は順次更新予定です。", html_url("https://fukushima-k.github.io/"))
  ),
  list(
    title = "共同研究を開始しました。",
    date = "2024-06",
    content = "外部機関との共同研究を開始しました。今後、公開予定です。"
  ),
  list(
    title = "論文が採択されました。",
    date = "2024-05",
    content = 
      paste0("<i>Journal of Educational and Behavioral Statistics</i>誌に採択された論文がOnlineFirstで公開されました。", html_url("https://doi.org/10.3102/10769986241245707"))
      
  ),
  list(
    title = "賞を受賞しました。",
    date = "2023-11",
    content = "日本計算機統計学会 第37回シンポジウムにて「一般化多枝選択型認知診断モデルの提案」の題目で学生研究発表賞をいただきました。ありがとうございます。"
  ),
  list(
    title = "preprintを公開しました。",
    date = "2023-07",
    content = paste0("Open Science Frameworkにて、preprint \"<i>Modeling Partial Knowledge in Multiple-Choice Cognitive Diagnostic Assessment.</i>\" を公開しました。", html_url("https://doi.org/10.31234/osf.io/wefb7"))
  )
  # 他のニュース項目を追加
)



# ニュース項目をHTMLリストとして生成
generate_news_list <- function(news_items) {
  unlist(lapply(news_items, function(item) {
    paste0(
      '<li class="list-group-item">',
      '<h5>', item$title, '</h5>',
      '<small>投稿日: ', item$date, '</small>',
      '<p>', item$content, '</p>',
      '</li>'
    )
  }))
}

# ニュースページのコンテンツ
news_page_content <- c(
  '<h2>ニュース</h2>',
  '<ul class="list-group">',
  generate_news_list(news_data),
  '</ul>'
)

# ニュースページのコンテンツファイルに書き込み
writeLines(news_page_content, "contents/news_content.html")


# 最新の3件を取得
latest_news <- news_data[1:min(3, length(news_data))]

# トップページのニュースセクション
index_news_content <- c(
  '<h2>最新のニュース</h2>',
  '<ul class="list-group">',
  generate_news_list(latest_news),
  '</ul>',
  '<a href="news.html" class="btn btn-secondary mt-3">すべてのニュースを見る</a>'
)

# トップページのコンテンツファイル（例: contents/index_content.html）に埋め込む
# プレースホルダーを使用して、ニュースセクションを挿入
index_content <- readLines("contents/index_content_news_plus.html", encoding = "UTF-8")
index_content <- str_replace(index_content, fixed("{{news_section}}"), paste(index_news_content, collapse = "\n"))
writeLines(index_content, "contents/index_content_news_plus_written.html", useBytes = TRUE)



# ページ情報のリストを作成
pages <- list(
  list(
    filename = "index.html",
    title = "心理統計学者のホームページ - ホーム",
    # content_file = "contents/index_content.html",
    content_file = "contents/index_content_news_plus_written.html",
    active_menu = "home"
  ),
  list(
    filename = "about.html",
    title = "心理統計学者のホームページ - 自己紹介",
    content_file = "contents/about_content.html",
    active_menu = "about"
  ),
  list(
    filename = "research.html",
    title = "心理統計学者のホームページ - 研究内容",
    content_file = "contents/research_content.html",
    active_menu = "research"
  ),
  list(
    filename = "publications.html",
    title = "心理統計学者のホームページ - 業績一覧",
    content_file = "contents/publications_content.html",
    active_menu = "publications"
  ),
  list(
    filename = "news.html",
    title = "心理統計学者のホームページ - ニュース",
    content_file = "contents/news_content.html",
    active_menu = "news"
  ),
  # list(
  #   filename = "blog.html",
  #   title = "心理統計学者のホームページ - ブログ",
  #   content_file = "contents/blog_content.html",
  #   active_menu = "blog"
  # ),
  list(
    filename = "index_en.html",
    title = "English Version - Coming Soon",
    content_file = "contents/index_en_content.html",
    active_menu = ""  # ヘッダーにリンクを追加しないため、active_menu は空にします
  ),
  list(
    filename = "contact.html",
    title = "心理統計学者のホームページ - お問い合わせ",
    content_file = "contents/contact_content.html",
    active_menu = "contact"
  )
)

# 各ページのHTMLを生成
for (page in pages) {
  # ヘッダーのテンプレートにタイトルを挿入
  header <- str_replace_all(header_template, fixed("{{title}}"), page$title)
  
  # アクティブなメニューを設定
  menu_items <- c("home", "about", "research", "publications", "blog", "contact")
  for (item in menu_items) {
    if (item == page$active_menu) {
      header <- str_replace_all(header, fixed(paste0("{{active_", item, "}}")), "active")
    } else {
      header <- str_replace_all(header, fixed(paste0("{{active_", item, "}}")), "")
    }
  }
  
  # コンテンツを読み込み
  content <- readLines(page$content_file, encoding = "UTF-8")
  
  # フッターをそのまま使用
  footer <- footer_template
  
  # 最終的なHTMLを組み立て
  html <- c(header, content, footer)
  
  # ファイルに書き込み
  writeLines(html, page$filename, useBytes = TRUE)
  
  cat("Generated:", page$filename, "\n")
}
