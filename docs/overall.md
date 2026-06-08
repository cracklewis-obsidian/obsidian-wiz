## 项目设计草案

核心定位：一个静态的、可部署到GitHub Pages的Obsidian仓库预览系统，可以对笔记页面渲染其内的Wiki链接、图片、附件等资源，并且支持Obsidian的Markdown语法

### 核心需求

静态指定如下变量：
- Obsidian仓库路径：要求允许本地和GitHub仓库两种路径格式
  - 目前本地的Obsidian仓库地址：`C:\Users\DELL\Desktop\Workbench\obsidian`
  - 目前的GitHub仓库地址：`https://github.com/CrackLewis/obsidian`
- Cloudflare R2存储桶路径：`https://obimg.cracklewis.site/`
  - 访问`附件/xxx.png`：`https://obimg.cracklewis.site/附件/xxx.png`

出于减轻GitHub Pages的负载考虑，仓库配置了R2存储同步，仓库子目录`附件`及其内的所有内容都存储在R2存储桶中

仓库内部分wiki链接会指向`附件/xxx.png`，需要将其转换为`https://obimg.cracklewis.site/附件/xxx.png`以便正确显示

### 界面需求

采用类似readthedocs/gitbook的界面设计，左侧为目录树，右侧为内容展示区，目录树支持折叠和展开，内容展示区支持Markdown渲染，并且能够正确显示图片、附件等资源

