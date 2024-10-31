# 必要なライブラリをインストール
# install.packages("openssl")
# install.packages("httr")

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
  # 
  # gyoseki_name <- list(paper = "論文",presentation = "学会発表" )
  # gyoseki = list(paper = NULL, presentation = NULL)
  gyoseki_name <- list("査読論文", 
                       "preprint",
                       "国際学会における発表 (査読あり)",
                       "招待セッショントーク（Invited Session Talk）",
                       "国内学会・シンポジウム等における発表"
                       )
  
  split_list <- function(json_parsed){
    index = 0
    if(json_parsed$insert$type == "presentations"){
      lang <- json_parsed$merge$presentation_title %>% names()
      
      if(lang == "en"){
        if(json_parsed$merge$invited){
          index = 4
        }else if(lang == "en" & !json_parsed$merge$invited){
          index = 3
        }
      }else if(lang == "ja"){
          index = 5
      }
    }else if(json_parsed$insert$type ==  "published_papers"){
      if(unlist(json_parsed$merge$publication_name) %in% c("Open Science Framework")){
        index = 2
      }else{
        index = 1 
      }
    }
    return(index)
  }
  
  json_index_vec <- json_parsed_list %>% sapply(split_list)
  
  gyoseki <- NULL
  
  for(j in 1:length(gyoseki_name)){
    json_pared_list_tmp <- json_parsed_list[json_index_vec == j]
    if(is.null(json_pared_list_tmp %>% unlist)){
      
    }else{
      gyoseki[[j]] <- json_pared_list_tmp %>% sapply(make_record)
    }
  }
  
  html_top <- "<h2>業績一覧</h2>\n\n"
  html_parts <- list()
  for(j in 1:length(gyoseki)){
    gyoseki_tmp <- gyoseki[[j]] %>% sapply(function(x) sprintf("<li>\n%s\n</li>\n", x))
    html_parts[[j]] <- sprintf("<h3>%s</h3>\n<ol>\n%s</ol>",gyoseki_name[[j]],
                               gyoseki_tmp %>% paste0(collapse="")
                               )  
  }
  c(html_top, html_parts) %>% 
    paste0(collapse="\n\n") %>% return()
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
    
    
    text <- sprintf("[%s] %s <i>%s</i>, %s, %s, %s.", 
                    dat$type, 
                    dat$author, 
                    dat$title,
                    dat$journal,
                    dat$year, 
                    dat$location)
    text <- paste0(dat$invited_char, text)
    
    # text %>% print
    return(text)
  }else if(json_parsed$insert$type == "published_papers"){
    
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
      if(length(author_vec) > 1){
      # print("baibai")
        dat$author <- 
          sprintf("%s, & %s", 
                  paste0(author_vec_red[-length(author_vec_red)], collapse=", "),
                  author_vec_red[length(author_vec_red)]
          )
      }else{
        dat$author <- author_vec_red
      }
    }
    
    dat$year  = json_parsed$merge$publication_date
    dat$title = json_parsed$merge$paper_title[[dat$lang]]
    dat$journal = json_parsed$merge$publication_name
    dat$volumepages = sprintf("%s(%s), %s-%s", json_parsed$merge$volume, json_parsed$merge$number, json_parsed$merge$starting_page, json_parsed$merge$ending_page)
    # dat$pages = sprintf("%s-%s", json_parsed$merge$starting_page, json_parsed$merge$ending_page)
    
    
    dat$doi = json_parsed$merge$identifiers$doi[[1]]
    if(1){
      parse_see_also <- function(x){
        # x$label == "doi"
        
        
        doi <- x$`@id` %>% str_detect("doi")
        osf <- x$`@id` %>% str_detect("osf")
        preprint <- x$`@id` %>% str_detect("preprint")
        
        if(preprint){
          text = "preprint"
        }else if(osf){
          text = "osf"
        }else if(doi){
          # text = "doi"
          return("")
        }
        sprintf("[%s]", html_url(url = x$`@id`, text = text))
      }
      urls <- 
      json_parsed$merge$see_also %>% sapply(parse_see_also)
      
      dat$urls <- paste0(urls, collapse="")
    }
    
    
    
    if(is.null(json_parsed$merge$volume)){
      dat$volumepages = "no_volume"
    }else if(json_parsed$merge$volume == "OnlineFirst"){
      dat$volumepages = json_parsed$merge$volume
    }
    
    dat 
    
    text <- sprintf("%s (%s). %s, <i>%s</i>, %s, %s. %s", 
                   dat$author, 
                   dat$year, 
                   dat$title,
                   dat$journal,
                   dat$volumepages,
                   html_url(dat$doi, doi =T), 
                   dat$urls)
    # text %>% print
    return(text)
  }else{
    return(NA)
  }
}


make_tex <- function(json_parsed_list){
  gyoseki_name <- list(
    "査読論文", 
    "preprint",
    "国際学会における発表（査読あり）",
    "招待セッショントーク（Invited Session Talk）",
    "国内学会・シンポジウム等における発表"
  )
  
  split_list <- function(json_parsed){
    index = 0
    if(json_parsed$insert$type == "presentations"){
      lang <- names(json_parsed$merge$presentation_title)
      
      if(lang == "en"){
        if(json_parsed$merge$invited){
          index = 4
        } else {
          index = 3
        }
      } else if(lang == "ja"){
        index = 5
      }
    } else if(json_parsed$insert$type == "published_papers"){
      if(unlist(json_parsed$merge$publication_name) %in% c("Open Science Framework")){
        index = 2
      } else {
        index = 1 
      }
    }
    return(index)
  }
  
  json_index_vec <- sapply(json_parsed_list, split_list)
  
  gyoseki <- list()
  
  for(j in seq_along(gyoseki_name)){
    json_parsed_list_tmp <- json_parsed_list[json_index_vec == j]
    if(length(json_parsed_list_tmp) > 0){
      gyoseki[[j]] <- sapply(json_parsed_list_tmp, make_record_tex)
    }
  }
  
  tex_output <- "\\section*{業績一覧}\n\n"
  for(j in seq_along(gyoseki)){
    if(!is.null(gyoseki[[j]])){
      records <- paste0("\\item ", gyoseki[[j]], collapse = "\n")
      tex_output <- paste0(
        tex_output, 
        "\\subsection*{", gyoseki_name[[j]], "}\n\\begin{enumerate}\n", 
        records, 
        "\n\\end{enumerate}\n\n"
      )
    }
  }
  return(tex_output)
}

make_record_tex <- function(json_parsed){
  if(json_parsed$insert$type == "presentations"){
    list_names <- c("lang", "author", "year", "title", "event", "location", "doi", "invited_char", "type")
    dat <- setNames(vector("list", length(list_names)), list_names)
    
    dat$lang <- names(json_parsed$merge$presentation_title)
    author_vec <- unlist(json_parsed$merge$presenters[[dat$lang]])
    
    if(dat$lang == "ja"){
      dat$author <- paste(author_vec, collapse = "・")
    } else {
      author_vec_red <- sapply(author_vec, convert_name)
      if(length(author_vec_red) > 2){
        dat$author <- sprintf("%s, and %s", 
                              paste(author_vec_red[-length(author_vec_red)], collapse = ", "), 
                              author_vec_red[length(author_vec_red)])
      } else {
        dat$author <- paste(author_vec_red, collapse = " and ")
      }
    }
    
    dat$year <- json_parsed$merge$publication_date
    dat$title <- json_parsed$merge$presentation_title[[dat$lang]]
    dat$event <- json_parsed$merge$event[[dat$lang]]
    dat$location <- json_parsed$merge$location[[dat$lang]]
    dat$doi <- json_parsed$merge$identifiers$doi[[1]]
    
    if(json_parsed$merge$invited){
      dat$invited_char <- ifelse(dat$lang == "ja", "[招待]", "[Invited]")
    } else {
      dat$invited_char <- ""
    }
    
    if(grepl("oral_presentation", json_parsed$merge$presentation_type)){
      dat$type <- ifelse(dat$lang == "ja", "口頭", "Oral")
    } else if(json_parsed$merge$presentation_type == "poster_presentation"){
      dat$type <- ifelse(dat$lang == "ja", "ポスター", "Poster")
    }
    
    text <- sprintf("%s %s %s. \\textit{%s}, %s, %s.", 
                    dat$invited_char, dat$type, dat$author, dat$title, dat$event, dat$location)
    return(text)
    
  } else if(json_parsed$insert$type == "published_papers"){
    list_names <- c("lang", "author", "year", "title", "journal", "volumepages", "doi")
    dat <- setNames(vector("list", length(list_names)), list_names)
    
    dat$lang <- names(json_parsed$merge$paper_title)
    author_vec <- unlist(json_parsed$merge$authors[[dat$lang]])
    
    if(dat$lang == "ja"){
      dat$author <- paste(author_vec, collapse = "・")
    } else {
      author_vec_red <- sapply(author_vec, convert_name)
      if(length(author_vec_red) > 2){
        dat$author <- sprintf("%s, and %s", 
                              paste(author_vec_red[-length(author_vec_red)], collapse = ", "), 
                              author_vec_red[length(author_vec_red)])
      } else {
        dat$author <- paste(author_vec_red, collapse = " and ")
      }
    }
    
    dat$year <- json_parsed$merge$publication_date
    dat$title <- json_parsed$merge$paper_title[[dat$lang]]
    dat$journal <- json_parsed$merge$publication_name
    dat$volumepages <- sprintf("%s(%s), %s--%s", 
                               json_parsed$merge$volume, 
                               json_parsed$merge$number, 
                               json_parsed$merge$starting_page, 
                               json_parsed$merge$ending_page)
    dat$doi <- json_parsed$merge$identifiers$doi[[1]]
    
    if(is.null(json_parsed$merge$volume)){
      dat$volumepages <- ""
    } else if(json_parsed$merge$volume == "OnlineFirst"){
      dat$volumepages <- json_parsed$merge$volume
    }
    
    
    dat$author <- escape_tex(dat$author)
    dat$title <- escape_tex(dat$title)
    dat$journal <- escape_tex(dat$journal)
    dat$event <- escape_tex(dat$event)
    dat$location <- escape_tex(dat$location)
    
    text <- sprintf("%s (%s). %s. \\textit{%s}, %s. DOI: \\href{https://doi.org/%s}{%s}", 
                    dat$author, dat$year, dat$title, dat$journal, dat$volumepages, dat$doi, dat$doi)
    return(text)
  } else {
    return("")
  }
}
escape_tex <- function(text){
  special_chars <- c("\\", "{", "}", "$", "&", "#", "_", "%", "~", "^")
  replacements <- c("\\textbackslash{}", "\\{", "\\}", "\\$", "\\&", "\\#", "\\_", "\\%", "\\textasciitilde{}", "\\textasciicircum{}")
  for(i in seq_along(special_chars)){
    text <- gsub(special_chars[i], replacements[i], text, fixed = TRUE)
  }
  return(text)
}









json_parsed_list <- 
  # readLines("C:/Users/muphy/Downloads/rm_researchers20240909/rm_researchers20240909.jsonl")[14] %>% 
  # readLines("C:/Users/muphy/Downloads/rm_researchers20240909-1/rm_researchers20240909-1.jsonl")[12] %>% 
  # readLines("C:/Users/muphy/Downloads/rm_researchers20240910/rm_researchers20240910.jsonl") %>% 
  # readLines("C:/Users/muphy/Downloads/rm_researchers20240918/rm_researchers20240918.jsonl") %>% 
  # readLines("C:/Users/muphy/Downloads/rm_researchers20240918-1/rm_researchers20240918-1.jsonl") %>% 
  readLines("C:/Users/muphy/Downloads/rm_researchers20241031/rm_researchers20241031.jsonl") %>% 
  lapply(jsonlite::parse_json)
rm_researchers20241031/rm_researchers20241031.jsonl

json_parsed_list %>% make_tex() %>% write("contents/publications_content.tex")




# text = paste(readLines("C:/Users/muphy/マイドライブ/012myhomepage_github/publication_base.html"), collapse = "/n")
# text = sprintf(text, make_html(json_parsed_list))
# 
# write(text, "C:/Users/muphy/マイドライブ/012myhomepage_github/publication.html")



write(make_html(json_parsed_list), "contents/publications_content.html")





if(0){
  
  
  json_parsed_list %>% lapply(function(json_parsed){
    json_parsed %>% unlist %>% bind_rows
  })
  
  
  
  json_parsed_list %>% sapply(function(json_parsed){
    
    
    json_parsed %>% unlist %>% bind_rows
    
    list_names <- c("lang", "author", "year","title", "journal", "location", "doi", "invited_char", "type")
    
    dat <- setNames(vector("list", length(list_names)), list_names)
    # dat = NULL
    
    dat$type = json_parsed$insert$type
    
    dat$title = c(json_parsed$merge$paper_title, json_parsed$merge$presentation_title) %>% unlist
    dat$lang = names(dat$title) 
    
    
    
    dat$year  = json_parsed$merge$publication_date
    
    
    dat$journal = c(json_parsed$merge$event,  json_parsed$merge$publication_name) %>% unlist
    
    
    dat$location = json_parsed$merge$location %>% unlist
    
    
    dat$volumepages = sprintf("%s(%s), %s-%s", json_parsed$merge$volume, json_parsed$merge$number, json_parsed$merge$starting_page, json_parsed$merge$ending_page)
    
        # dat$lang = names(json_parsed$merge$paper_title)
    author_vec = unlist(json_parsed$merge$authors[[dat$lang]])
    
    if(is.null(dat$lang)){
      
    }else if(dat$lang == "ja"){
      dat$author <- paste0(author_vec, collapse = "・")  
    }else{
      author_vec_red <- author_vec %>% sapply(convert_name)
      if(length(author_vec) > 1){
        # print("baibai")
        dat$author <- 
          sprintf("%s, & %s", 
                  paste0(author_vec_red[-length(author_vec_red)], collapse=", "),
                  author_vec_red[length(author_vec_red)]
          )
      }else{
        dat$author <- author_vec_red
      }
    }
    
    dat %>% as_tibble
    
    
    
    my_list_na <- lapply(dat, function(x) if (is.null(x)) NA else x) %>% as_tibble
    
    
    
    tibble(type = json_parsed$insert$type,
           lang = names(json_parsed$merge$paper_title))
           # author = paste0(unlist(json_parsed$merge$authors[[lang]]), collapse = "・"),
           # year = json_parsed$merge$publication_date,
           # title = json_parsed$merge$paper_title[[lang]],
           # journal = json_parsed$merge$publication_name,
           # volumepages = sprintf("%s(%s), %s-%s", json_parsed$merge$volume, json_parsed$merge$number, json_parsed$merge$starting_page, json_parsed$merge$ending_page),
           # doi = json_parsed$merge$identifiers$doi[[1]])
    
    
    
    
    
    
    
    
    
    
    
    
    
    
  }) %>% bind_rows()
}
