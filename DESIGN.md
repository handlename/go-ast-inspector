# Go AST Viewer - 技術設計書

## 文書情報

**バージョン**: 1.2  
**作成日**: 2025-11-23  
**最終更新日**: 2025-11-24  
**関連文書**: [REQUIREMENTS.md](./REQUIREMENTS.md)  
**更新履歴**:
- v1.2: 双方向ハイライト機能追加（ソースコード↔ASTツリー連動）、highlightedRangeStore追加
- v1.1: UIフレームワークをSvelte 5.xに変更、コンポーネント設計を全面改訂
- v1.0: 初版作成（Vanilla TypeScript版）

---

## 目次

1. [概要](#概要)
2. [技術スタック](#技術スタック)
3. [アーキテクチャ設計](#アーキテクチャ設計)
4. [モジュール設計](#モジュール設計)
5. [データフロー設計](#データフロー設計)
6. [UIコンポーネント設計](#uiコンポーネント設計)
7. [ビルド設定](#ビルド設定)
8. [デプロイメント設計](#デプロイメント設計)
9. [開発環境セットアップ](#開発環境セットアップ)

---

## 概要

本設計書は、Go AST Viewerプロジェクトの技術的な実装方針を定義する。REQUIREMENTS.mdで定義された要件を満たすため、WebAssembly技術とモダンなフロントエンド技術を組み合わせた設計を採用する。

### 設計方針

1. **スタンドアローン性の徹底**: すべてのリソースを単一HTMLファイルに埋め込み、完全なオフライン動作を実現
2. **型安全性の重視**: TypeScriptとSvelteを組み合わせ、実行時エラーを最小化
3. **保守性の確保**: Svelteのコンポーネントベース設計により、将来的な拡張・修正を容易にする
4. **パフォーマンス最適化**: WebAssemblyによる高速なAST解析とSvelteの効率的なレンダリング
5. **開発効率**: Svelteのリアクティブシステムにより、状態管理とUI更新を簡潔に実装

---

## 技術スタック

### 採用技術

| カテゴリ | 技術 | バージョン | 選定理由 |
|---------|------|-----------|---------|
| **言語** | TypeScript | 5.x | 型安全性、開発効率、保守性の向上 |
| **UIフレームワーク** | Svelte | 5.x | 軽量、高速、リアクティブな状態管理、小さなバンドルサイズ |
| **ビルドツール** | Vite | 5.x | 高速な開発体験、Svelte統合、単一HTMLファイル生成 |
| **Linter/Formatter** | Biome | 1.x | 高速、all-in-one、TypeScript/Svelte対応 |
| **ASTパーサー** | Go WebAssembly | Go 1.21+ | 標準ライブラリ(go/ast, go/parser)の利用 |
| **UI言語** | 英語 | - | 国際的な利用を想定 |

### 不採用技術と理由

| 技術 | 不採用理由 |
|------|-----------|
| **Vanilla JavaScript/TypeScript** | コンポーネント管理と状態管理の複雑化を避けるため、Svelteを採用 |
| **React** | バンドルサイズが大きく、スタンドアローン性に不向き |
| **Vue** | Svelteと比較してバンドルサイズが大きい |
| **ESLint + Prettier** | Biomeが高速でall-in-oneのため、複数ツールの組み合わせは不要 |
| **Webpack/Parcel** | Viteの方が高速で、単一HTMLファイル生成のプラグインエコシステムが充実 |
| **JavaScript実装のGoパーサー** | 正確性と標準準拠性を重視し、Go公式のgo/parserをWebAssemblyで使用 |

---

## アーキテクチャ設計

### 全体構成

```
┌─────────────────────────────────────────────────────────┐
│                    Browser Runtime                       │
│  ┌────────────────────────────────────────────────────┐ │
│  │              Single HTML File (index.html)         │ │
│  │  ┌──────────────────────────────────────────────┐  │ │
│  │  │  Inline CSS (styles)                         │  │ │
│  │  └──────────────────────────────────────────────┘  │ │
│  │  ┌──────────────────────────────────────────────┐  │ │
│  │  │  Inline JavaScript (bundled Svelte + TS)     │  │ │
│  │  │  ┌────────────────────────────────────────┐  │  │ │
│  │  │  │  UI Layer (Svelte Components)          │  │  │ │
│  │  │  │  ├─ App.svelte (Root)                  │  │  │ │
│  │  │  │  ├─ CodeEditor.svelte                  │  │  │ │
│  │  │  │  ├─ ASTTreeView.svelte                 │  │  │ │
│  │  │  │  ├─ TreeNode.svelte (recursive)        │  │  │ │
│  │  │  │  ├─ HoverTooltip.svelte                │  │  │ │
│  │  │  │  └─ ErrorDisplay.svelte                │  │  │ │
│  │  │  └────────────────────────────────────────┘  │  │ │
│  │  │  ┌────────────────────────────────────────┐  │  │ │
│  │  │  │  Application Logic Layer               │  │  │ │
│  │  │  │  ├─ ASTManager (state management)      │  │  │ │
│  │  │  │  ├─ Parser (WASM bridge)               │  │  │ │
│  │  │  │  └─ Position Mapper (code ↔ AST)       │  │  │ │
│  │  │  └────────────────────────────────────────┘  │  │ │
│  │  │  ┌────────────────────────────────────────┐  │  │ │
│  │  │  │  WebAssembly Layer                     │  │  │ │
│  │  │  │  └─ Go Parser (go/ast, go/parser)      │  │  │ │
│  │  │  └────────────────────────────────────────┘  │  │ │
│  │  └──────────────────────────────────────────────┘  │ │
│  │  ┌──────────────────────────────────────────────┐  │ │
│  │  │  Inline WebAssembly Binary (base64)         │  │ │
│  │  └──────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### レイヤー構成

#### 1. WebAssembly Layer
- **責務**: Go言語のソースコードをASTに変換
- **技術**: Go 1.21+、go/parser、go/ast、go/token
- **インターフェース**: JavaScript ↔ WebAssembly間のメッセージング

#### 2. Application Logic Layer
- **責務**: ビジネスロジック、状態管理、データ変換
- **コンポーネント**:
  - `ASTManager`: AST状態の管理
  - `Parser`: WASM呼び出しのラッパー
  - `PositionMapper`: ソースコード位置とASTノードのマッピング

#### 3. UI Layer (Svelte Components)
- **責務**: ユーザーインターフェースの表示と操作
- **Svelteコンポーネント**:
  - `App.svelte`: ルートコンポーネント、レイアウト管理
  - `CodeEditor.svelte`: ソースコード入力エディタ
  - `ASTTreeView.svelte`: AST木構造表示のコンテナ
  - `TreeNode.svelte`: ツリーノード（再帰的コンポーネント）
  - `HoverTooltip.svelte`: ホバー時の情報表示
  - `ErrorDisplay.svelte`: エラーメッセージ表示

---

## モジュール設計

### ディレクトリ構成

```
go-ast-viewer/
├── src/
│   ├── main.ts                 # エントリーポイント
│   ├── App.svelte              # ルートコンポーネント
│   ├── wasm/
│   │   ├── parser.go           # Go AST パーサー実装
│   │   ├── main.go             # WASM エントリーポイント
│   │   └── build.sh            # WASM ビルドスクリプト
│   ├── lib/
│   │   ├── stores/
│   │   │   ├── ast-store.ts    # AST状態管理（Svelte Store）
│   │   │   └── editor-store.ts # エディタ状態管理（Svelte Store）
│   │   ├── core/
│   │   │   ├── parser-bridge.ts    # WASM ブリッジ
│   │   │   ├── position-mapper.ts  # 位置マッピング
│   │   │   └── types.ts            # 共通型定義
│   │   └── utils/
│   │       └── constants.ts        # 定数定義
│   ├── components/
│   │   ├── CodeEditor.svelte       # コードエディタコンポーネント
│   │   ├── ASTTreeView.svelte      # ASTツリービューコンポーネント
│   │   ├── TreeNode.svelte         # ツリーノード（再帰）
│   │   ├── HoverTooltip.svelte     # ホバーツールチップ
│   │   ├── ErrorDisplay.svelte     # エラー表示
│   │   └── HeaderBar.svelte        # ヘッダーバー
│   └── styles/
│       └── global.css              # グローバルスタイル
├── public/
│   └── index.html              # HTMLテンプレート
├── dist/                       # ビルド出力（単一HTMLファイル）
├── vite.config.ts              # Vite設定
├── svelte.config.js            # Svelte設定
├── biome.json                  # Biome設定
├── tsconfig.json               # TypeScript設定
├── package.json                # npm設定
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Pages デプロイワークフロー
├── REQUIREMENTS.md             # 要件定義書
├── DESIGN.md                   # 技術設計書（本文書）
└── README.md                   # プロジェクト説明
```

### 主要モジュール詳細

#### src/lib/stores/ast-store.ts

```typescript
// Svelte Writable Storeを使用した状態管理
import { writable, derived } from 'svelte/store';

export interface ASTNode {
  type: string;           // ノードタイプ (e.g., "FuncDecl", "Ident")
  pos: number;            // 開始位置
  end: number;            // 終了位置
  children: ASTNode[];    // 子ノード
  metadata: Record<string, unknown>; // メタデータ
}

// AST状態を保持するStore
export const astStore = writable<ASTNode | null>(null);

// エラー状態を保持するStore
export const parseErrorStore = writable<{
  message: string;
  line: number;
  column: number;
} | null>(null);

// 展開されたノードIDを保持するStore
export const expandedNodesStore = writable<Set<string>>(new Set());

// 選択されたノードを保持するStore
export const selectedNodeStore = writable<ASTNode | null>(null);

// ソースコードのハイライト範囲を保持するStore
export const highlightedRangeStore = writable<{
  start: number;  // 開始位置（バイトオフセット）
  end: number;    // 終了位置（バイトオフセット）
} | null>(null);

// ソースコードを保持するStore
export const sourceCodeStore = writable<string>("");
```

#### src/core/parser-bridge.ts

```typescript
interface ParseResult {
  success: boolean;
  ast?: ASTNode;
  error?: {
    message: string;
    line: number;
    column: number;
  };
}

class ParserBridge {
  private wasmInstance: WebAssembly.Instance | null = null;

  // WASM初期化
  async initialize(): Promise<void>;
  
  // コードパース
  async parse(sourceCode: string): Promise<ParseResult>;
  
  // WASM準備確認
  isReady(): boolean;
}
```

#### src/core/position-mapper.ts

```typescript
interface PositionRange {
  start: { line: number; column: number };
  end: { line: number; column: number };
}

class PositionMapper {
  private sourceCode: string = '';
  private astNodes: Map<string, ASTNode> = new Map();

  // ソースコード設定
  setSourceCode(code: string): void;
  
  // AST設定
  setAST(ast: ASTNode): void;
  
  // バイト位置から行・列を取得
  getPositionFromOffset(offset: number): { line: number; column: number };
  
  // 行・列からバイト位置を取得
  getOffsetFromPosition(line: number, column: number): number;
  
  // 指定位置のASTノードを取得
  getNodeAtPosition(line: number, column: number): ASTNode | null;
}
```

#### src/components/ASTTreeView.svelte

```svelte
<script lang="ts">
  import { astStore, expandedNodesStore } from '$lib/stores/ast-store';
  import TreeNode from './TreeNode.svelte';
  
  export let defaultExpandLevel = 2;
  
  function expandAll() {
    // すべてのノードIDをexpandedNodesStoreに追加
    expandedNodesStore.update(nodes => {
      // AST全体を走査してすべてのノードIDを収集
      return new Set(/* all node IDs */);
    });
  }
  
  function collapseAll() {
    expandedNodesStore.set(new Set());
  }
</script>

<div class="ast-tree-view">
  <div class="controls">
    <button on:click={expandAll}>Expand All</button>
    <button on:click={collapseAll}>Collapse All</button>
  </div>
  
  {#if $astStore}
    <TreeNode node={$astStore} level={0} {defaultExpandLevel} />
  {:else}
    <p class="empty-state">No AST available</p>
  {/if}
</div>
```

#### src/components/CodeEditor.svelte

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { parseCode } from '$lib/core/parser-bridge';
  import { 
    astStore, 
    parseErrorStore, 
    selectedNodeStore,
    highlightedRangeStore,
    sourceCodeStore 
  } from '$lib/stores/ast-store';
  import { PositionMapper } from '$lib/core/position-mapper';
  
  export let defaultCode = `package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
}`;
  
  let code = $state(defaultCode);
  let textareaElement: HTMLTextAreaElement | undefined = $state();
  
  const positionMapper = $derived(new PositionMapper(code));
  
  async function handleInput() {
    const result = await parseCode(code);
    sourceCodeStore.set(code);
    
    if (result.success && result.ast) {
      astStore.set(result.ast);
      parseErrorStore.set(null);
    } else if (result.error) {
      parseErrorStore.set(result.error);
      astStore.set(null);
    }
  }
  
  function handleClick(event: MouseEvent) {
    if (!textareaElement) return;
    
    setTimeout(() => {
      const cursorPos = textareaElement.selectionStart;
      const node = positionMapper.findNodeAtOffset($astStore, cursorPos + 1);
      selectedNodeStore.set(node);
      
      if (node) {
        highlightedRangeStore.set({ start: node.pos, end: node.end });
      } else {
        highlightedRangeStore.set(null);
      }
    }, 0);
  }
  
  function handleSelectionChange() {
    if (!textareaElement) return;
    const cursorPos = textareaElement.selectionStart;
    const node = positionMapper.findNodeAtOffset($astStore, cursorPos + 1);
    selectedNodeStore.set(node);
    
    if (node) {
      highlightedRangeStore.set({ start: node.pos, end: node.end });
    } else {
      highlightedRangeStore.set(null);
    }
  }
  
  // ASTツリーからの選択を監視してハイライト表示
  $effect(() => {
    if ($selectedNodeStore) {
      highlightedRangeStore.set({
        start: $selectedNodeStore.pos,
        end: $selectedNodeStore.end
      });
    }
  });
  
  onMount(() => {
    handleInput();
  });
</script>

<div class="code-editor">
  <textarea
    bind:value={code}
    bind:this={textareaElement}
    oninput={handleInput}
    onclick={handleClick}
    onkeyup={handleSelectionChange}
    spellcheck="false"
    placeholder="Enter Go code here..."
  />
  <!-- ハイライト表示レイヤー（背景） -->
  {#if $highlightedRangeStore}
    <div class="highlight-overlay" style="..."></div>
  {/if}
</div>
```

---

## データフロー設計

### 1. 初期化フロー

```
ページロード
    ↓
main.ts 実行
    ↓
WASM初期化 (ParserBridge.initialize())
    ↓
UI初期化 (各コンポーネント生成)
    ↓
デフォルトコード設定 ("Hello World" サンプル)
    ↓
初回パース実行
    ↓
AST表示
```

### 2. コード編集フロー

```
ユーザーがコード編集
    ↓
CodeEditor.onChange イベント発火
    ↓
ParserBridge.parse(sourceCode)
    ↓
WASM でパース実行
    ↓
ParseResult 取得
    ├─ 成功
    │   ↓
    │   ASTManager.updateAST(ast)
    │   ↓
    │   各リスナーに通知
    │   ↓
    │   ASTTreeView.updateAST(ast)
    │   ↓
    │   ツリー再描画
    │
    └─ 失敗
        ↓
        ErrorDisplay.show(error)
        ↓
        エラー行をハイライト
```

### 3. 双方向ハイライトフロー

#### 3-1. ソースコード → ASTツリー連動

```
ユーザーがコード上でクリック/カーソル移動
    ↓
CodeEditor.onClick/onKeyUp イベント発火
    ↓
カーソル位置(offset)を取得
    ↓
PositionMapper.findNodeAtOffset(offset)
    ↓
対応するASTノードを取得
    ↓
selectedNodeStore.set(node)
    ↓
TreeNode が selectedNode を監視
    ↓
該当ノードまでの枝を自動展開
    ↓
該当ノードをハイライト表示
    ↓
該当ノードまで自動スクロール
```

#### 3-2. ASTツリー → ソースコード連動

```
ユーザーがTreeNode上でクリック
    ↓
TreeNode.onClick イベント発火
    ↓
selectedNodeStore.set(node)
    ↓
CodeEditor が selectedNode を監視
    ↓
ノードのpos/endから該当範囲を計算
    ↓
highlightedRangeStore.set({start: pos, end: end})
    ↓
CodeEditor内の該当範囲をハイライト表示
    ↓
該当範囲まで自動スクロール（推奨）
```

### 4. ツリー操作フロー

```
ユーザーがノードをクリック
    ↓
ASTTreeView.toggleNode(nodeId)
    ↓
展開状態を更新
    ↓
該当ノードのみ再描画（部分更新）
```

---

## UIコンポーネント設計

### レイアウト構成

```
┌────────────────────────────────────────────────────────┐
│                     Header Bar                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│  │ Parse    │ │ Expand   │ │ Collapse │               │
│  │ Button   │ │ All      │ │ All      │               │
│  └──────────┘ └──────────┘ └──────────┘               │
└────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────┐
│                     Main Content                       │
│  ┌──────────────────────┐ ┌─────────────────────────┐ │
│  │                      │ │                         │ │
│  │   Code Editor        │ │   AST Tree View         │ │
│  │   (Left Panel)       │ │   (Right Panel)         │ │
│  │                      │ │                         │ │
│  │  - Syntax Highlight  │ │  - Tree Structure       │ │
│  │  - Line Numbers      │ │  - Expand/Collapse      │ │
│  │  - Hover Support     │ │  - Node Selection       │ │
│  │                      │ │                         │ │
│  └──────────────────────┘ └─────────────────────────┘ │
└────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────┐
│                     Status Bar                         │
│  Ready | 15 nodes | No errors                          │
└────────────────────────────────────────────────────────┘
```

### UIコンポーネント仕様

#### 1. Header Bar
- **Parse Button**: 手動パース実行（自動パース無効時）
- **Expand All**: すべてのノードを展開
- **Collapse All**: すべてのノードを折りたたみ

#### 2. Code Editor
- **機能**:
  - シンタックスハイライト（Go言語、推奨）
  - 行番号表示（推奨）
  - クリック/カーソル移動時のASTノード選択
  - 選択されたASTノードに対応するコード範囲のハイライト表示
  - エラー行のマーキング
- **使用技術**: `<textarea>` + カスタムハイライト実装
- **ハイライト表示**: 選択されたASTノードの範囲を背景色で強調表示

#### 3. AST Tree View
- **機能**:
  - 階層的なツリー表示
  - ノードクリックで展開/折りたたみ
  - ノードタイプの視覚的区別（色分け）
  - 選択ノードのハイライト
  - コードエディタでの選択位置に応じた自動展開・ハイライト
- **使用技術**: 仮想DOM不使用、効率的なDOM操作

#### 4. Error Display
- **表示内容**:
  - エラーメッセージ
  - エラー発生位置（行・列）
  - 該当行のハイライト
- **表示位置**: Status Bar またはインラインメッセージ

---

## ビルド設定

### Vite設定 (vite.config.ts)

```typescript
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [
    svelte({
      compilerOptions: {
        // Svelte 5のルーンモードを有効化
        runes: true,
      },
    }),
    viteSingleFile({
      removeViteModuleLoader: true, // Viteモジュールローダーを削除
    }),
  ],
  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsInlineLimit: 100000000, // すべてのアセットをインライン化
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true, // 動的インポートもインライン化
      },
    },
  },
  base: './', // 相対パス対応
  resolve: {
    alias: {
      '$lib': '/src/lib',
    },
  },
});
```

### TypeScript設定 (tsconfig.json)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "allowSyntheticDefaultImports": true,
    "types": []
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "src/wasm"]
}
```

### Biome設定 (biome.json)

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "style": {
        "noVar": "error",
        "useConst": "warn"
      },
      "correctness": {
        "noUnusedVariables": "error"
      }
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "trailingCommas": "all"
    }
  },
  "files": {
    "ignore": ["node_modules", "dist", "src/wasm/*.go"]
  }
}
```

### Svelte設定 (svelte.config.js)

```javascript
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  preprocess: vitePreprocess(),
  compilerOptions: {
    runes: true, // Svelte 5のルーンモードを有効化
  },
};
```

### package.json スクリプトと依存関係

```json
{
  "scripts": {
    "dev": "vite",
    "build": "npm run build:wasm && vite build",
    "build:wasm": "cd src/wasm && ./build.sh",
    "preview": "vite preview",
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "format": "biome format --write .",
    "type-check": "svelte-check --tsconfig ./tsconfig.json && tsc --noEmit"
  },
  "dependencies": {
    "svelte": "^5.0.0"
  },
  "devDependencies": {
    "@sveltejs/vite-plugin-svelte": "^4.0.0",
    "@biomejs/biome": "^1.9.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0",
    "vite-plugin-singlefile": "^2.0.0",
    "svelte-check": "^4.0.0"
  }
}
```

### WASM ビルドスクリプト (src/wasm/build.sh)

```bash
#!/bin/bash
set -e

echo "Building Go WebAssembly..."

GOOS=js GOARCH=wasm go build -o ../../public/parser.wasm main.go parser.go

echo "Copying wasm_exec.js..."
cp "$(go env GOROOT)/misc/wasm/wasm_exec.js" ../../public/

echo "WASM build complete!"
```

---

## デプロイメント設計

### GitHub Pages デプロイ

#### GitHub Actions ワークフロー (.github/workflows/deploy.yml)

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Setup Go
        uses: actions/setup-go@v5
        with:
          go-version: '1.21'

      - name: Install dependencies
        run: npm ci

      - name: Build WASM
        run: npm run build:wasm

      - name: Build project
        run: npm run build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### ビルド成果物

- **出力ファイル**: `dist/index.html`
- **ファイルサイズ目標**: 5MB以下
- **含まれるもの**:
  - すべてのHTML
  - インライン化されたCSS
  - インライン化されたJavaScript（TypeScriptコンパイル済み）
  - Base64エンコードされたWASMバイナリ

---

## 開発環境セットアップ

### 前提条件

- Node.js 20.x 以上
- Go 1.21 以上
- npm または yarn

### セットアップ手順

```bash
# 1. リポジトリクローン
git clone https://github.com/handlename/go-ast-viewer.git
cd go-ast-viewer

# 2. 依存関係インストール
npm install

# 3. WASM ビルド
npm run build:wasm

# 4. 開発サーバー起動
npm run dev

# 5. ブラウザで開く
# http://localhost:5173
```

### 開発ワークフロー

```bash
# コード変更監視 + ホットリロード
npm run dev

# Lintチェック
npm run lint

# フォーマット修正
npm run format

# 型チェック
npm run type-check

# 本番ビルド
npm run build

# ビルド結果プレビュー
npm run preview
```

---

## パフォーマンス最適化

### 1. WASM最適化

- **最小化ビルド**: `-ldflags="-s -w"` フラグでバイナリサイズ削減
- **gzip圧縮**: WASMバイナリをgzip圧縮してBase64エンコード

### 2. UI最適化

- **Svelteの効率的なレンダリング**: リアクティブな更新により必要な部分のみ再描画
- **仮想スクロール**: 大きなASTツリーの表示時に仮想スクロール適用（svelte-virtual使用検討）
- **遅延レンダリング**: 折りたたまれたノードは描画をスキップ（Svelte条件分岐で実装）
- **デバウンス**: コード変更時のパース実行を300ms遅延

### 3. メモリ最適化

- **Svelteの効率的なDOM管理**: Svelteコンパイラによる最適化されたDOM操作
- **イベントリスナー最小化**: Svelteのイベントハンドリングによる効率的な管理
- **ストアの最適化**: derived storeを活用した不要な計算の回避

---

## セキュリティ考慮事項

### 1. データ保護

- **ローカルストレージ不使用**: 入力コードを一切保存しない
- **ネットワーク通信なし**: すべての処理をクライアントサイドで完結
- **XSS対策**: ユーザー入力のエスケープ処理を徹底

### 2. Content Security Policy (CSP)

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'wasm-unsafe-eval'; 
               style-src 'self' 'unsafe-inline'; 
               img-src 'self' data:; 
               connect-src 'none';">
```

---

## テスト戦略

### 1. 単体テスト（推奨）

- **対象**: 
  - Svelte Stores（ast-store, editor-storeなど）
  - コアロジック（ParserBridge, PositionMapperなど）
  - ユーティリティ関数
- **ツール**: Vitest（Vite統合テストフレームワーク） + @testing-library/svelte
- **カバレッジ目標**: 70%以上

### 2. 統合テスト（推奨）

- **対象**: Svelteコンポーネント間の連携
- **ツール**: @testing-library/svelte
- **シナリオ**:
  - コード入力 → パース → AST表示（CodeEditor + ASTTreeView）
  - ホバー → ツールチップ表示（CodeEditor + HoverTooltip）
  - ノードクリック → 展開/折りたたみ（TreeNode + expandedNodesStore）

### 3. E2Eテスト（推奨）

- **ツール**: Playwright
- **シナリオ**:
  - ページロード → デフォルトコード表示 → パース成功
  - エラーコード入力 → エラー表示確認
  - ブラウザ互換性テスト（Chrome, Firefox, Safari, Edge）

---

## 将来的な拡張性

### Phase 2 機能（オプション）

1. **複数言語対応**: JavaScript/TypeScript AST解析の追加
2. **エクスポート機能**: JSON/YAML形式でのAST出力
3. **カスタムテーマ**: ダークモード、カラースキーム変更
4. **コード整形**: AST情報を利用したコードフォーマッタ
5. **差分表示**: 2つのASTの比較表示

### 拡張のための設計配慮

- **プラグインアーキテクチャ**: パーサーの差し替えを容易にする
- **設定ファイル**: ユーザー設定の外部化（localStorage使用時）
- **モジュール独立性**: 各コンポーネントの疎結合を維持

---

## 付録

### A. 参考資料

- [Svelte Documentation](https://svelte.dev/)
- [Svelte 5 Runes](https://svelte.dev/docs/svelte/what-are-runes)
- [Vite Documentation](https://vitejs.dev/)
- [Biome Documentation](https://biomejs.dev/)
- [Go WebAssembly Documentation](https://github.com/golang/go/wiki/WebAssembly)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### B. 用語集

| 用語 | 説明 |
|------|------|
| AST | Abstract Syntax Tree（抽象構文木） |
| WASM | WebAssembly |
| CSP | Content Security Policy |
| HMR | Hot Module Replacement |
| MVP | Minimum Viable Product |

---

**文書終了**
