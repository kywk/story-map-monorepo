# Handoff — Obsidian Plugin 本地功能驗證與調整

> **注意（milestone 已更新）**：本檔描述的是先前的 `registerMarkdownCodeBlockProcessor('storymap', ...)`
> 做法。目前契約以 `SPEC.md` 為準：StoryMap 文件改為 `story-map: true` frontmatter +
> `story-map` fenced block，Obsidian 端為 file-backed full-leaf `TextFileView`，並支援
> `noteFolder` 遞迴探索（`story-map-note: true`）、`order` / `dateField` 排序與
> `Open as Story Map` / `Open as Markdown` 指令。本檔僅保留為 Vault 驗證的歷史筆記。

> 給下一個 agent。先讀本檔，再讀 `SPEC.md` §7、`docs/implementation-plan.md` Track C、`AGENTS.md`。

## 0. 任務一句話

在真實 Vault `~/Work/obs-story-map`（kywk.me）中，把 `packages/obsidian-story-map` 這個社群外掛做**本地功能驗證**，只修實際發現的缺陷，不擴充功能、不改架構。

## 1. 目前狀態（已可開工）

- Monorepo：`/home/kywk/Work/story-map-monorepo`，branch `main`，remote `origin` = `https://github.com/kywk/story-map-monorepo`（public）。
- 最新 commit：`204a0ef docs: add npm publishConfig and RELEASING runbook`。
- npm 已首發（0.1.0）：
  - `@story-map/story-map-core`
  - `@story-map/react-story-map`
  - `@story-map/remark-story-map`
- `pnpm typecheck` / `pnpm test` / `pnpm build` 全綠。core 19 tests、remark 6 tests。
- 獨立 React 範例已驗證可用：`examples/react`（`pnpm --filter @story-map/example-react dev`，http://127.0.0.1:5173/）。
- **尚未執行**：`v0.1.0` git tag / GitHub Release、Obsidian plugin release、Docusaurus 端整合。
- `packages/obsidian-story-map/dist/` 已是最新 build，但驗證前請重跑建置。

## 2. 目標環境（Vault）

- 路徑：`/home/kywk/Work/obs-story-map`（`~/Work/obs-story-map`）；本身是 git repo，也是 Docusaurus 網站原始碼。
- **先讀** `~/Work/obs-story-map/AGENTS.md` 與 `docs/agents/tooling.md`；該 repo 要求繁中回覆、內容不可公開外洩、不得讀取私人目錄。
- 既有外掛（`.obsidian/plugins/`）：`obsidian-leaflet-plugin`、`obsidian42-brat`、`dataview`、`templater-obsidian` 等；**沒有** `story-map`。
- 已啟用列表：`.obsidian/plugins/community-plugins.json`（該檔被 git 忽略）。加入新外掛後需在 Obsidian 開啟。
- Docusaurus 端慣例：`plugins/remark-obsidian-leaflet/`（`leaflet` code block、`lat`/`long`/`defaultZoom`/`markerFolder`）。
- 標記檔慣例（可作為 `note:` 測試目標）：例如
  `backpacker/2509 Chile/Chile/托巴拉巴都市市場 Mercado Urbano Tobalaba.md`
  有 frontmatter `title`、`location: [-33.4167, -70.6]`、`mapmarker: restaurant`。
- 目前 vault 內**沒有任何 `storymap` code block**（已 grep 確認），需要自建測試筆記。
- 測試筆記請放在 **git-ignored** 目錄，例如 `_incoming/`（已在 `.gitignore`），避免污染公開網站內容；`assets/` 亦被忽略可放測試圖。離開前用
  `git -C ~/Work/obs-story-map status --short` 確認沒有不該追蹤的檔案。

## 3. Plugin 架構與現有行為

擁有者邊界：`packages/obsidian-story-map/**`。程式碼：

- `src/main.tsx`（36 行）
  - `registerMarkdownCodeBlockProcessor('storymap', ...)`。
  - 流程：`parseStoryMapYaml(source)` → `resolveObsidianStory(app, parsed, ctx.sourcePath)` → `createRoot(el).render(<StoryMap story={story} />)` → `ctx.addChild(new StoryMapRenderChild(el, root))`。
  - `StoryMapRenderChild.onunload()` 呼叫 `root.unmount()`（生命週期清理唯一入口）。
  - 解析/解析失敗：`el.addClass('story-map-host--error')` + `el.setText(...)`。
- `src/resolver.ts`（66 行）——核心邏輯，只做資料正規化，不碰 DOM：
  - `resolveObsidianStory`：對每個 slide 做 `resolveSlide`（`Promise.all`）。
  - `slide.note` → `app.metadataCache.getFirstLinkpathDest(parseWikiLinkRef(note), sourcePath)`。
  - frontmatter 繼承：`title`（fallback 檔名）、`description`/`summary` → `text`、`location`（含 `zoom`/`defaultZoom`）、`cover`/`image`/`media` → `media`、`mapmarker`（僅收集，未使用）。
  - `mergeResolvedSlide(slide, resolved)`：**顯式 slide 值優先於 note frontmatter**（core 提供）。
  - media URL 轉換 `resolveMedia`：`https:`/`data:`/`app:`/`blob:` 直接沿用；其餘用 `getFirstLinkpathDest` + `app.vault.getResourcePath`。**繼承的 cover 以 note 檔案為相對基準**（`resolver.ts:49`；這是先前修過的 bug，請重點驗證）。
- `src/obsidian.css`：`@import "leaflet/dist/leaflet.css"` + `@import "@story-map/react-story-map/styles.css"` + `.story-map-host--error` 樣式。
- `esbuild.config.mjs`：bundle `src/main.tsx` → `dist/main.js`（CJS、`obsidian` external）；`src/obsidian.css` → `dist/styles.css`；複製 `manifest.json`、`versions.json`。
- `manifest.json`：`id: story-map`、`minAppVersion: 1.8.0`、`isDesktopOnly: false`。
- `versions.json`：`{ "0.1.0": "1.8.0" }`。
- 渲染器為 `@story-map/react-story-map`（bundle 進來，leaflet 動態 import），**不得**依賴社群 `obsidian-leaflet-plugin` 的 runtime。

## 4. 建置與安裝流程

```bash
# 1) monorepo 建置（改過 core/react 一定要先重建）
cd /home/kywk/Work/story-map-monorepo
pnpm install
pnpm --filter @story-map/story-map-core build
pnpm --filter @story-map/react-story-map build
pnpm --filter @story-map/obsidian-story-map build
# 或：pnpm build（會連 example 一起 build）

# 2) 複製產物到 vault（複製，不要 symlink；vault .gitignore 會忽略 plugins/*/*）
VAULT=~/Work/obs-story-map
mkdir -p "$VAULT/.obsidian/plugins/story-map"
cp packages/obsidian-story-map/dist/{main.js,manifest.json,styles.css,versions.json} \
   "$VAULT/.obsidian/plugins/story-map/"

# 3) 開啟 Obsidian → Settings → Community plugins → 啟用「Story Map」
#    或在 .obsidian/plugins/community-plugins.json 加入 "story-map" 後重啟
```

注意：

- `pnpm dev:obsidian`（root script）會 build core + react 再跑 obsidian `dev`，但 **`esbuild.config.mjs` 用 `esbuild.build` 而非 `context().watch()`，所以 `dev` 其實是一次性 build，不會 watch**。若驗證需要快速迭代，可考慮改成 watch（見 §6-1）。
- 每次改 plugin 後要重新 build + 重新複製，並在 Obsidian 重新載入（用 BRAT/Hot Reload 外掛，或關閉再啟用外掛、重開筆記）。
- 測試筆記建議內容（放在 `_incoming/storymap-test.md`）：

  ````markdown
  ```storymap
  title: 智利測試
  map:
    center: [-33, -70]
    zoom: 5
    showPath: true
  slides:
    - note: "[[托巴拉巴都市市場 Mercado Urbano Tobalaba]]"
    - note: "[[巴塔哥尼亞 Patagonia]]"
  ```
  ````

## 5. 驗證清單（acceptance）

逐項記錄結果（含截圖/console 錯誤），不通過才修：

- [ ] Reading View 能渲染 `storymap` block：地圖、面板、標題、計數、上一站/下一站。
- [ ] `note: "[[Some Note]]"` 繼承 `title`、`location`、`description`、`cover`。
- [ ] 顯式 slide 屬性覆蓋 note frontmatter（例如同時給 `title`）。
- [ ] `[[note|alias]]`、`[[note#heading]]` 可解析。
- [ ] 本地 Vault media（cover、`media:`）轉成 resource URL；**繼承自 note 的 `./` 相對 cover 以 note 為基準**。
- [ ] 遠端圖片（`https:`，本 vault 多為 Google Photos）可正常顯示。
- [ ] 關閉筆記 / 停用外掛 / 切換檔案後，React root 與 Leaflet 實例有被清掉（無殘留地圖、無 console error、重開不重複掛載）。
- [ ] 一頁多個 `storymap` block 互不干擾。
- [ ] 無效 YAML / 找不到 note → 顯示 `.story-map-host--error`，不 crash。
- [ ] 鍵盤 ←/→ 切換；地圖 `flyTo` 且**不重建地圖**。
- [ ] 深色主題對比、行動裝置（`isDesktopOnly: false`）觸控可用。
- [ ] 切換 slide 時媒體/文字正確更新。

## 6. 已知問題 / 建議調整（依優先序，只修實際重現者）

1. **`dev` 不是 watch**：`esbuild.config.mjs` 用 `esbuild.build`。若要 watch，改用
   `esbuild.context({...}).then(ctx => ctx.watch())`，並讓 `dev` 不呼叫 `process.exit`。
2. **`mapmarker` 未使用**：`resolver.ts:43` 只收集。SPEC 允許 MVP 忽略；若要調整 marker 樣式（circle 半徑/顏色）再處理，否則不要動。
3. **`resolveObsidianStory` 無取消機制**：`main.tsx:22` 為 async；快速切換筆記時，晚到的 promise 可能在 `MarkdownRenderChild.onunload` 之後才 render。重現的話加 `cancelled` 旗標或檢查 `el.isConnected`。
4. **錯誤渲染**：`main.tsx:27` 用 `el.addClass` + `el.setText`；成功時未加 host class。若 Obsidian 的 DOM 擴充在型別/執行上有問題，改用原生 `el.classList.add` / `el.textContent`。
5. **note body 未載入**：只沿用 frontmatter `description`/`summary`。SPEC 最低要求即此，勿自作主張讀整篇 body。
6. **相對路徑覆蓋**：`resolveMedia` 一般用 `getFirstLinkpathDest`；`./` 相對在 Obsidian 的解析行為請用真實檔案驗證（`resolver.ts:49` 的 note-relative 是重點）。若 `./` 解析不到，改成 `app.vault.getAbstractFileByPath(normalizePath(dirname(notePath) + '/' + src))`。
7. **重複 basename**：`getFirstLinkpathDest` 取最短路徑，vault 若有同名檔需確認命中正確。
8. **CSS/圖磚深色對比**：`obsidian.css` 未覆寫 token，靠 renderer CSS 的 Obsidian 變數 fallback；截圖檢查可讀性。
9. **建議新增 resolver 單元測試**：`resolver.ts` 只 import `type`，執行期不載入 `obsidian`。可用假 `App`（`metadataCache.getFileCache`/`getFirstLinkpathDest`、`vault.getResourcePath`）做 vitest，測「顯式覆蓋」「note-relative media」「`[[alias]]`」。需在 `packages/obsidian-story-map/package.json` 加 `"test": "vitest run"` 並在 tsconfig `exclude` 測試檔。

## 7. 邊界與守則

- 只改 `packages/obsidian-story-map/**`（必要時 `packages/story-map-core/**` 的 helper，但需同步測試）。
- 不得讓 `react-story-map` / `story-map-core` 匯入 Obsidian 或 Node API。
- plugin 不得 import Node `fs`；不得依賴社群 `obsidian-leaflet-plugin` runtime。
- 不改 vault 公開內容、不 commit vault 測試檔；測試檔放 git-ignored 目錄。
- 不改 monorepo 的 npm 發佈設定與 example（除非是驗證副產品且範圍明確）。
- 依 `AGENTS.md`：先跑 `pnpm typecheck && pnpm test && pnpm build`，再回報。

## 8. 不在範圍 / deferred

- 視覺編輯器、scroll/scrollytelling、MapLibre、`CRS.Simple`、GeoJSON/GPX、進階 marker icon、story Markdown body 內 WikiLink 渲染、Vault 資產自動複製到 Docusaurus。
- npm 版號 bump / GitHub Release / CI（見 `RELEASING.md`，尚未執行）。
- Docusaurus/Remark 端整合（另一個 agent 的工作；npm 套件已可用）。

## 9. 指令速查與參考

```bash
# monorepo 驗證
cd /home/kywk/Work/story-map-monorepo && pnpm typecheck && pnpm test && pnpm build

# 只 build plugin
pnpm --filter @story-map/obsidian-story-map build

# 安裝到 vault（複製四個檔）
VAULT=~/Work/obs-story-map
mkdir -p "$VAULT/.obsidian/plugins/story-map"
cp packages/obsidian-story-map/dist/{main.js,manifest.json,styles.css,versions.json} \
   "$VAULT/.obsidian/plugins/story-map/"

# 確認 vault 沒被污染
git -C "$VAULT" status --short
```

參考檔案：

- `SPEC.md` §4 故事 schema、§5 note 解析優先序、§7 MVP acceptance
- `docs/implementation-plan.md` Track C
- `packages/obsidian-story-map/README.md`
- vault：`~/Work/obs-story-map/AGENTS.md`、`docs/agents/tooling.md`、`PLUGIN-INSTALL-GUIDE.md`、`plugins/remark-obsidian-leaflet/README.md`

## 10. 回報格式

- 通過的驗證項與證據（截圖/測試輸出）。
- 修正的缺陷、檔案與 commit。
- 重現得到但未修的項目與原因（含 deferred）。
- 指令與結果（`pnpm typecheck`/`test`/`build` 的 exit code）。
