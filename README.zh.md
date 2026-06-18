# notmyidea-vine

基于 Pelican 默认主题 `notmyidea` 衍生的个人博客主题，支持归档、分类视图、多语言过滤器、媒体布局、评论、统计分析，以及一组静态浏览器工具页面。

[English](README.md)

## 功能特性

- 响应式 Pelican 模板，覆盖文章、页面、归档、标签、作者、分类及按时间归档等视图。
- 可选媒体布局辅助功能，支持画廊、轮播图、图片网格、单图布局和竖版图片行。
- 懒加载 Giscus 评论，同时支持旧版 Disqus、畅言（Changyan）和多说（Duoshuo）。
- 可选统计集成：Google Analytics、VerCount、Umami、GoatCounter。
- 可选页脚徽章：RSS 订阅、网站状态、Not By AI。
- 通过 Babel/gettext 实现国际化（i18n），内置英文、法文、日文翻译。

## 安装

将本仓库克隆到 Pelican 主题目录：

```bash
git clone https://github.com/your-org/notmyidea-vine.git themes/notmyidea-vine
```

然后在 `pelicanconf.py` 中启用：

```python
THEME = "themes/notmyidea-vine"
CSS_FILE = "main.css"
```

## 常用配置

```python
SITENAME = "示例博客"
SITE_DESCRIPTION = "笔记、随笔与实验。"
SITESUBTITLE = "可选副标题"

THEME_STATIC_DIR = "theme"
THEME_ENABLE_IMAGE_HINTS = True
THEME_ENABLE_IMAGE_SKELETON = True
THEME_ENABLE_LAZY_COMMENTS = True

GISCUS_REPO = ""
GISCUS_REPO_ID = ""
GISCUS_CATEGORY = ""
GISCUS_CATEGORY_ID = ""
GISCUS_MAPPING = "pathname"
GISCUS_LANG = "zh-CN"

GOOGLE_ADSENSE = False
GOOGLE_ADSENSE_CLIENT = ""

FOOTER_NOT_BY_AI = True
FOOTER_STATUS_URL = ""

READING_NOTICE_HTML = ""
MORE_PAGE_SECTIONS = []
```

## 关于页面配置

以下配置项由 `page_about` 模板使用：

```python
AUTHOR_AVATAR = "/path/to/avatar.jpg"   # 头像图片的 URL 或路径
THEME_CONTACT_EMAIL = ""                # 设置后，关于页面会显示联系按钮
THEME_ABOUT_MORE_LINKS = [              # "更多"区域显示的卡片链接
    {"title": "博客", "url": "/", "css_class": ""},
]
```

`THEME_ABOUT_MORE_LINKS` 的每个条目支持 `title`、`url` 以及可选的 `css_class` 字段。

## 首页图片配置

首页横幅图片通过 `template_filters.py` 插件配置（参见[插件配置](#插件配置)）：

```python
INDEX_IMAGE = "/theme/images/banner.jpg"

# 按日历日期覆盖图片（MM-DD 格式）
INDEX_IMAGE_DAYS = {
    "01-01": "/theme/images/new-year.jpg",
    "12-25": "/theme/images/christmas.jpg",
}
```

计算结果以 `INDEX_IMAGE_BY_DATE` 变量暴露给模板。也可以设置首页图片的宽高比：

```python
THEME_HOMEPAGE_IMAGE_RATIO = "1600 / 520"   # 默认值
```

## 插件配置

`template_filters.py` 是一个小型 Pelican 插件，用于解析按日期变化的首页图片。将其复制或软链接到插件目录，然后在 `pelicanconf.py` 中加载：

```python
PLUGINS = ["template_filters"]
```

或者使用绝对路径方式：

```python
import sys
sys.path.insert(0, "themes/notmyidea-vine")
PLUGINS = ["template_filters"]
```

## 测试

项目使用 Node.js 内置测试运行器：

```bash
npm test
```

保留的测试无需任何 npm 运行时依赖。

## 第三方资源

以下文件以 vendored 方式收录于 `static/js/`：

| 文件 | 库 | 许可证 |
|------|-----|--------|
| `glightbox.min.js` | [GLightbox](https://biati-digital.github.io/glightbox/) | MIT |

## 常见问题

**主题静态文件找不到** — 确认 `THEME_STATIC_DIR` 与 Pelican 生成的目录名一致（默认为 `theme`）。

**评论不加载** — Giscus 需要公开的 GitHub 仓库，确认已设置全部四个 `GISCUS_*` 配置项，并在仓库中安装了 Giscus App。

**模板中 `INDEX_IMAGE_BY_DATE` 不可用** — `template_filters` 插件未加载，参见[插件配置](#插件配置)。

## 许可证

GPL-3.0，详见 [LICENSE](LICENSE)。
