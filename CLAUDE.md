# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目

Obsidian 插件，将 Markdown 标题渲染为交互式思维导图。单文件插件（`main.js`，约 2000 行纯 JS，无构建步骤）。发布文件：`main.js`、`manifest.json`、`styles.css`。

## 关键规则

- **禁止 AI 署名** — 提交、标签、发布中永远不要添加 `Co-Authored-By: Claude`
- **提交信息格式**：使用 conventional commits — `feat:`、`fix:`、`docs:`、`release:` 等前缀
- **版本标签**：`X.Y.Z` 格式，不加 `v` 前缀
- **manifest.json description**：除非明确要求，否则不要修改
- **README**：添加功能时必须同时更新英文和中文部分
- **发布资产**：必须包含恰好 5 项：`main.js`、`manifest.json`、`styles.css`、`Source code (zip)`、`Source code (tar.gz)`
- **发布说明**：保持简洁，聚焦用户可见的变更。必须包含英文和中文双语

## 发布流程

```bash
# 1. 更新 manifest.json 中的版本号
jq --arg v "$NEW_VERSION" '.version = $v' manifest.json > tmp.json && mv tmp.json manifest.json

# 2. 更新 README.md — 英文和中文部分都要更新

# 3. 提交、打标签、推送
git add main.js manifest.json styles.css README.md
git commit -m "Release X.Y.Z: <描述>"
git tag X.Y.Z
git push origin main && git push origin X.Y.Z

# 4. 创建 GitHub Release 并上传资产
gh release create X.Y.Z \
  main.js manifest.json styles.css \
  "Source code (zip)" "Source code (tar.gz)" \
  --title "X.Y.Z" \
  --notes "## What's New\n\n- <feature 1>\n- <feature 2>\n\n## 更新内容\n\n- <功能 1>\n- <功能 2>"
```

### 发布说明模板

```markdown
## What's New

- **Feature Name**: Description
- **Bug Fix**: Description

## Breaking Changes

- None (describe if any)

## 更新内容

- **功能名称**：描述
- **Bug 修复**：描述

## 破坏性变更

- 无（如有则在此描述）
```

## 注意事项

- 语言检测使用 `window.localStorage.getItem('language')`，不能用 `vault.getConfig('locale')`（该方法无效）。
- 折叠状态通过 Markdown 中的斜体标记编码：`## *节点文本*` = 已折叠。展开时必须在 `_serializeNode` 中从 `rawText` 剥离 `*...*`，否则节点会重新解析为折叠状态（死循环）。
- 当元素为 `display:none` 时，`getBoundingClientRect()` 返回 `{width:0, height:0}` — 使用脏标记 `_lmmNeedsRerender` 延迟渲染。
