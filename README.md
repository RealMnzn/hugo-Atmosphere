# Atmosphere

[English](#english) | [中文](#中文)

---

<h2 id="english">English</h2>

A dual-scene Hugo theme with dynamic atmospheric effects. Switch between a warm **Sunny** scene with animated light beams and drifting leaves, and a moody **Rainy** scene with layered rainfall, thunder, and fog — all rendered in real-time on canvas with synthesized audio.

### Features

**Scene System**
- Two atmospheric scenes: Sunny (light) and Rainy (dark)
- Smooth CSS custom property transitions between scenes
- Canvas-based visual effects (light beams, rain, leaves, fog)
- Web Audio API synthesized ambient sound (wind, rain, thunder)
- Scene and audio preferences persist via localStorage

**Reading Experience**
- Clean, typography-focused layout (720px max-width)
- Auto-generated Table of Contents
- Reading time estimation
- Syntax highlighting with scene-aware color schemes

**Navigation & Search**
- SPA-style page transitions (PJAX) with content caching
- Full-text search (`Cmd/Ctrl+K`) powered by Hugo's JSON output
- Active nav link highlighting

**Pages**
- Home — profile section with recent posts
- Archive — posts grouped by year with pagination
- Tags — tag cloud and per-tag post lists
- Friends — grouped link cards driven by a TOML data file
- About — standalone page
- 404 — minimal error page

**Technical**
- Zero external dependencies — system fonts, native Web APIs only
- Responsive design
- RSS and JSON output
- Hugo Pipes for CSS/JS bundling

### Quick Start

**Requirements:** [Hugo](https://gohugo.io/) v0.120.0+ (extended edition recommended)

```bash
# Create a new Hugo site
hugo new site my-blog
cd my-blog

# Add the theme
git submodule add https://github.com/realmnzn/hugo-Atmosphere.git themes/atmosphere

# Copy example config
cp themes/atmosphere/hugo.example.toml hugo.toml

# Run dev server
hugo server -D
```

Or clone directly:

```bash
git clone https://github.com/realmnzn/hugo-Atmosphere.git themes/atmosphere
```

### Configuration

Minimal `hugo.toml`:

```toml
baseURL = 'https://yoursite.com/'
languageCode = 'zh-cn'
title = "My Blog"
theme = 'atmosphere'

[taxonomies]
  tag = 'tags'

[markup]
  [markup.highlight]
    noClasses = false
    guessSyntax = true
    tabWidth = 4
  [markup.goldmark.renderer]
    unsafe = true
  [markup.tableOfContents]
    startLevel = 2
    endLevel = 4

[pagination]
  pagerSize = 10

[outputs]
  home = ['HTML', 'RSS', 'JSON']   # JSON is required for search
  section = ['HTML', 'RSS']

[params]
  author = 'Your Name'
  description = 'A personal blog.'
  github = 'yourusername'
  x = 'yourusername'
  email = 'you@example.com'
```

### Content Structure

```
content/
├── _index.md              # Home page content
├── about.md               # About page
├── friends.md             # Friends page (requires type = "friends")
└── posts/
    ├── _index.md          # Archive page heading
    └── my-post/
        ├── index.md       # Post content
        └── cover.jpg      # Post assets (optional)
```

**Post frontmatter:**

```yaml
---
title: "Post Title"
date: 2025-01-01
draft: false
tags: ["hugo", "theme"]
---
```

### Friends Page

Create `content/friends.md`:

```yaml
---
title: "Friends"
layout: "single"
type: "friends"
---
```

Define friend links in `data/friends.toml`:

```toml
[[list]]
group = "Friends"

  [[list.items]]
  name = "Alice"
  url = "https://alice.dev"
  desc = "Frontend developer"

  [[list.items]]
  name = "Bob"
  url = "https://bob.dev"
  desc = "Security researcher"

[[list]]
group = "Projects"

  [[list.items]]
  name = "Cool Tool"
  url = "https://github.com/example/cool-tool"
  desc = "A cool open-source tool"
```

### Theming

The color system is driven by five CSS custom properties, registered with `@property` for smooth animated transitions:

| Variable    | Sunny (light)  | Rainy (dark)   | Usage                    |
|-------------|----------------|----------------|--------------------------|
| `--bg`      | `#f5f4f0`      | `#0a0e14`      | Background               |
| `--text`    | `#1a1a18`      | `#b4b4b4`      | Primary text             |
| `--mid`     | `#5a554d`      | `#505862`      | Secondary text, borders  |
| `--line`    | `#c8c4ba`      | `#1c2028`      | Dividers, code blocks    |
| `--accent`  | `#8a8580`      | `#7a8fa6`      | Links, highlights        |

Override these in your site-level CSS to customize the palette.

### Keyboard Shortcuts

| Key             | Action         |
|-----------------|----------------|
| `Cmd/Ctrl + K`  | Toggle search  |
| `Escape`        | Close search   |

### Browser Support

Requires modern browsers with support for CSS `@property`, Canvas 2D, Web Audio API, and ES6+.

### Credits

Scene effects inspired by:
- [Cozy Window Shade](https://gist.github.com/masonwang025/49edffdff399175af2262e921eaae50b) by [@masonwang025](https://x.com/masonwang025)
- [Theme Switch](https://theme-switch.pages.dev/) by [@dingyi](https://x.com/AnyWayDingYi)

---

<h2 id="中文">中文</h2>

一个具有动态氛围效果的双场景 Hugo 主题。在温暖的**晴天**场景（动态光束、飘落的树叶）和沉静的**雨天**场景（多层雨幕、雷声、雾气）之间自由切换 — 所有视觉效果均通过 Canvas 实时渲染，环境音效由 Web Audio API 合成。

### 特性

**场景系统**
- 双大气场景：晴天（亮色）与雨天（暗色）
- 基于 CSS 自定义属性的平滑场景过渡
- Canvas 动态视觉效果（光束、雨滴、树叶、雾气）
- Web Audio API 合成环境音效（风声、雨声、雷声）
- 场景与音频偏好通过 localStorage 持久化

**阅读体验**
- 简洁的排版优先布局（最大宽度 720px）
- 自动生成目录
- 阅读时间估算
- 随场景切换的代码高亮配色

**导航与搜索**
- SPA 式页面过渡（PJAX），带页面缓存
- 全文搜索（`Cmd/Ctrl+K`），基于 Hugo JSON 输出
- 导航链接自动高亮

**页面**
- 首页 — 个人简介 + 最近文章
- 归档 — 按年份分组，支持分页
- 标签 — 标签云与按标签筛选
- 友链 — 分组展示，数据来自 TOML 文件
- 关于 — 独立页面
- 404 — 简约错误页

**技术**
- 零外部依赖 — 系统字体，仅使用原生 Web API
- 响应式设计
- RSS 与 JSON 输出
- Hugo Pipes 打包 CSS/JS

### 快速开始

**环境要求：** [Hugo](https://gohugo.io/) v0.120.0+（推荐 extended 版本）

```bash
# 创建新站点
hugo new site my-blog
cd my-blog

# 添加主题
git submodule add https://github.com/realmnzn/hugo-Atmosphere.git themes/atmosphere

# 复制示例配置
cp themes/atmosphere/hugo.example.toml hugo.toml

# 启动开发服务器
hugo server -D
```

也可以直接克隆：

```bash
git clone https://github.com/realmnzn/hugo-Atmosphere.git themes/atmosphere
```

### 配置

最小 `hugo.toml` 配置：

```toml
baseURL = 'https://yoursite.com/'
languageCode = 'zh-cn'
title = "My Blog"
theme = 'atmosphere'

[taxonomies]
  tag = 'tags'

[markup]
  [markup.highlight]
    noClasses = false
    guessSyntax = true
    tabWidth = 4
  [markup.goldmark.renderer]
    unsafe = true
  [markup.tableOfContents]
    startLevel = 2
    endLevel = 4

[pagination]
  pagerSize = 10

[outputs]
  home = ['HTML', 'RSS', 'JSON']   # 搜索功能需要 JSON 输出
  section = ['HTML', 'RSS']

[params]
  author = '你的名字'
  description = '一个个人博客。'
  github = 'yourusername'
  x = 'yourusername'
  email = 'you@example.com'
```

### 内容结构

```
content/
├── _index.md              # 首页内容
├── about.md               # 关于页面
├── friends.md             # 友链页面（需设置 type = "friends"）
└── posts/
    ├── _index.md          # 归档页标题
    └── my-post/
        ├── index.md       # 文章内容
        └── cover.jpg      # 文章资源（可选）
```

**文章 frontmatter：**

```yaml
---
title: "文章标题"
date: 2025-01-01
draft: false
tags: ["hugo", "主题"]
---
```

### 友链页面

创建 `content/friends.md`：

```yaml
---
title: "友链"
layout: "single"
type: "friends"
---
```

在 `data/friends.toml` 中定义友链数据：

```toml
[[list]]
group = "朋友们"

  [[list.items]]
  name = "Alice"
  url = "https://alice.dev"
  desc = "前端开发者"

  [[list.items]]
  name = "Bob"
  url = "https://bob.dev"
  desc = "安全研究员"

[[list]]
group = "项目"

  [[list.items]]
  name = "Cool Tool"
  url = "https://github.com/example/cool-tool"
  desc = "一个很酷的开源工具"
```

### 主题定制

整套配色由五个 CSS 自定义属性驱动，通过 `@property` 注册以实现平滑动画过渡：

| 变量        | 晴天（亮色）    | 雨天（暗色）    | 用途              |
|-------------|----------------|----------------|-------------------|
| `--bg`      | `#f5f4f0`      | `#0a0e14`      | 背景色            |
| `--text`    | `#1a1a18`      | `#b4b4b4`      | 主要文字          |
| `--mid`     | `#5a554d`      | `#505862`      | 次要文字、边框    |
| `--line`    | `#c8c4ba`      | `#1c2028`      | 分割线、代码块    |
| `--accent`  | `#8a8580`      | `#7a8fa6`      | 链接、高亮        |

在站点级 CSS 中覆盖这些变量即可自定义配色。

### 快捷键

| 按键            | 功能         |
|-----------------|-------------|
| `Cmd/Ctrl + K`  | 打开搜索    |
| `Escape`        | 关闭搜索    |

### 浏览器支持

需要支持 CSS `@property`、Canvas 2D、Web Audio API 和 ES6+ 的现代浏览器。

### 致谢

场景效果灵感来源：
- [Cozy Window Shade](https://gist.github.com/masonwang025/49edffdff399175af2262e921eaae50b) — [@masonwang025](https://x.com/masonwang025)
- [Theme Switch](https://theme-switch.pages.dev/) — [@dingyi](https://x.com/AnyWayDingYi)

---

## License

[MIT](LICENSE)
