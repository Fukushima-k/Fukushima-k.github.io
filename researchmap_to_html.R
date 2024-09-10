# 必要なライブラリをインストール
install.packages("openssl")
install.packages("httr")

# ライブラリの読み込み
library(openssl)
library(httr)


library(jsonlite)
library(tidyverse)



convert_name <- function(name) {
  # 名前がすでにFamily name + イニシャル形式の場合
  if (grepl("^[A-Za-z]+, [A-Za-z]\\.*$", name)) {
    if (grepl("^[A-Za-z]+, [A-Za-z]\\.$", name)) 
      return(name)
    else
      return(paste0(name, "."))
  }
  
  # First name + Family nameの場合、Family name + イニシャルに変換
  parts <- strsplit(name, " ")[[1]]
  if (length(parts) == 2) {
    family_name <- parts[2]
    initial <- substr(parts[1], 1, 1)
    return(paste(family_name, ", ", initial, ".", sep = ""))
  }
  
  # 想定外の入力の場合は元の名前をそのまま返す
  return(name)
}


make_html <- function(json_parsed_list){
  gyoseki = list(paper = NULL, presentation = NULL)
  for(i in 1:length(json_parsed_list)){
    
    type = json_parsed_list[[i]]$insert$type 
    
    if(type ==  "presentations"){
      gyoseki$presentation <- c(gyoseki$presentation, make_record(json_parsed_list[[i]]))
    }
    if(type ==  "published_papers"){
      gyoseki$paper <- c(gyoseki$paper, make_record(json_parsed_list[[i]]))
    }
  }
  # return(gyoseki)
  
  html <- NULL
  for(j in 1:length(gyoseki)){
    html = paste0(html, sprintf("業績%s \n<ol>\n<li>%s</li>\n</ol>\n",j , gyoseki[[j]] %>% paste(collapse = "</li>\n<li>")))
  }
 html
}


make_record <- function(json_parsed){
  if(json_parsed$insert$type == "presentations"){
    
    # json_parsed$merge %>% str
    list_names <- c("lang", "author", "year","title", "journal", "location", "doi", "invited_char", "type")
    dat = vector("list", length(list_names)) %>% 
      `names<-`(list_names)
    
    dat$lang <- json_parsed$merge$presentation_title %>% names()
    
    # lang = "ja"
    
    
    author_vec = unlist(json_parsed$merge$presenters[[dat$lang]])
    if(dat$lang == "ja"){
      dat$author <- paste0(author_vec, collapse = "・")  
    }else{
      author_vec_red <- author_vec %>% sapply(convert_name)
      if(length(author_vec) > 2){
        dat$author <- 
          sprintf("%s, & %s", 
                  paste0(author_vec_red[-length(author_vec_red)], collapse=", "),
                  author_vec_red[length(author_vec_red)]
          )
      }else{
        dat$author <-
        paste(author_vec_red, collapse=" & ")
      }
    }
    
    
    
    
    dat$year  = json_parsed$merge$publication_date
    dat$title = json_parsed$merge$presentation_title[[dat$lang]]
    dat$journal= json_parsed$merge$event[[dat$lang]]
    dat$location = json_parsed$merge$location[[dat$lang]]
    # dat$journal = json_parsed$merge$publication_name
    dat$volumepages = sprintf("%s(%s), %s-%s", json_parsed$merge$volume, json_parsed$merge$number, json_parsed$merge$starting_page, json_parsed$merge$ending_page)
    # dat$pages = sprintf("%s-%s", json_parsed$merge$starting_page, json_parsed$merge$ending_page)
    dat$doi = json_parsed$merge$identifiers$doi[[1]]
    
    if(is.null(json_parsed$merge$volume)){
      dat$volumepages = "no_volume"
    }else if(json_parsed$merge$volume == "OnlineFirst"){
      dat$volumepages = json_parsed$merge$volume
    }
    
    
    if(json_parsed$merge$invited){
      dat$invited_char <- ifelse(dat$lang == "ja", "[招待]", "[invited]")
    }else{
      dat$invited_char <- ""
    }
    
    
    if(grepl("oral_presentation", json_parsed$merge$presentation_type)){
      dat$type = ifelse(dat$lang == "ja", "口頭", "Oral")
    }else if(json_parsed$merge$presentation_type == "poster_presentation"){
      dat$type = ifelse(dat$lang == "ja", "ポスター", "Poster")
    }
    
    
    # return(sapply(dat, is.null) )
    
      # return(unlist(dat)) # dat
    # sprintf("%s (%s). %s, %s, %s, %s, [DOI: %s]", author, year, title, journal, volume, pages, doi)
    
    text <- sprintf("[%s] %s %s, %s, %s %s", 
                    dat$type, 
                    dat$author, 
                    dat$title,
                    dat$journal,
                    dat$year, 
                    dat$location)
    text <- paste0(dat$invited_char, text)
    
    # text %>% print
    return(text)
    
    
    
    
    # <ol>
    #   <li>Fukushima, K., Uchida, N., & Okada, K. (2024). Modeling Partial Knowledge in Multiple-Choice Cognitive Diagnostic Assessment. Journal of Educational and Behavioral Statistics, Online First. [DOI: https://doi.org/10.3102/10769986241245707][Preprint][OSF]</li>
    #   <li>福島健太郎・内田奈緒・岡田謙介 (2021). Q行列を付与した多枝選択形式テストの開発―認知診断モデルのための英語の空所補充問題の作成―, 日本テスト学会誌, 17(1), 45-59.[DOI: https://doi.org/10.24690/jart.17.1_45][OSF]</li>
    #   </ol>
  }else if(json_parsed$insert$type == "published_papers"){
    
    # json_parsed$merge %>% str
    # json_parsed$merge$
    
    
    list_names <- c("lang", "author", "year","title", "journal", "volumepages", "doi")
    dat = vector("list", length(list_names)) %>% 
      `names<-`(list_names)
    
    # dat <- NULL
    
    dat$lang =  json_parsed$merge$paper_title%>% names()
    # lang = "ja"
    author_vec = unlist(json_parsed$merge$authors[[dat$lang]])
    if(dat$lang == "ja"){
      dat$author <- paste0(author_vec, collapse = "・")  
    }else{
      author_vec_red <- author_vec %>% sapply(convert_name)
      if(length(author_vec) > 2){
        dat$author <- 
          sprintf("%s, & %s", 
                  paste0(author_vec_red[-length(author_vec_red)], collapse=", "),
                  author_vec_red[length(author_vec_red)]
          )
      }
    }
    
    dat$year  = json_parsed$merge$publication_date
    dat$title = json_parsed$merge$paper_title[[dat$lang]]
    dat$journal = json_parsed$merge$publication_name
    dat$volumepages = sprintf("%s(%s), %s-%s", json_parsed$merge$volume, json_parsed$merge$number, json_parsed$merge$starting_page, json_parsed$merge$ending_page)
    # dat$pages = sprintf("%s-%s", json_parsed$merge$starting_page, json_parsed$merge$ending_page)
    dat$doi = json_parsed$merge$identifiers$doi[[1]]
    
    if(is.null(json_parsed$merge$volume)){
      dat$volumepages = "no_volume"
    }else if(json_parsed$merge$volume == "OnlineFirst"){
      dat$volumepages = json_parsed$merge$volume
    }
    
    dat # dat
    # sprintf("%s (%s). %s, %s, %s, %s, [DOI: %s]", author, year, title, journal, volume, pages, doi)
    
    text <- sprintf("%s (%s). %s, %s, %s, [DOI: %s]", 
                   dat$author, 
                   dat$year, 
                   dat$title,
                   dat$journal,
                   dat$volumepages,
                   dat$doi)
    # text %>% print
    return(text)
  }else{
    return(NA)
  }
}

json_parsed_list <- 
  # readLines("C:/Users/muphy/Downloads/rm_researchers20240909/rm_researchers20240909.jsonl")[14] %>% 
  # readLines("C:/Users/muphy/Downloads/rm_researchers20240909-1/rm_researchers20240909-1.jsonl")[12] %>% 
  readLines("C:/Users/muphy/Downloads/rm_researchers20240910/rm_researchers20240910.jsonl") %>% 
  lapply(jsonlite::parse_json)  




text = paste(readLines("C:/Users/muphy/マイドライブ/012myhomepage_github/publication_base.html"), collapse = "\n")
text = sprintf(text, make_html(json_parsed_list))

write(text, "C:/Users/muphy/マイドライブ/012myhomepage_github/publication.html")

