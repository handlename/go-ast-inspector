# Go AST Inspector - AI Agent Instructions

このファイルは、AIエージェント（Claude Code等）がこのプロジェクトで作業する際に参照すべき重要な情報を記載しています。

---

## プロジェクト概要

**Go AST Inspector** は、Go言語のソースコードから抽象構文木(AST)を取得し、ブラウザ上で直感的に可視化するスタンドアローンツールです。

- **提供形態**: 単一HTMLファイルとして配布可能
- **主要技術**: TypeScript, Svelte 5.x, Go WebAssembly, Vite
- **対象ユーザー**: Go言語実務開発者

---

## 重要なドキュメント

プロジェクトの作業を行う前に、以下のドキュメントを必ず参照してください:

### 1. [REQUIREMENTS.md](./REQUIREMENTS.md)
- **内容**: プロジェクトの要件定義書
- **参照タイミング**: プロジェクト全体の理解が必要な時、機能要件を確認する時
- **重要セクション**:
  - 機能要件（FR-001〜FR-006）
  - 非機能要件（NFR-001〜NFR-006）
  - 技術選定決定事項
  - MVP範囲の定義

### 2. [DESIGN.md](./DESIGN.md)
- **内容**: 技術設計書
- **参照タイミング**: 実装を開始する前、アーキテクチャを理解する時
- **重要セクション**:
  - 技術スタック
  - アーキテクチャ設計（3層構造）
  - モジュール設計とディレクトリ構成
  - Svelteコンポーネント設計
  - ビルド設定（Vite, TypeScript, Biome, Svelte）
  - データフロー設計

### 3. [TASKS.md](./TASKS.md)
- **内容**: タスク定義書
- **参照タイミング**: 実装タスクを実行する時
- **重要セクション**:
  - フェーズ1〜8のタスク定義
  - 各タスクの目的・詳細・完了条件
  - タスク実行の推奨順序

---

## 作業を開始する前に

### 必須確認事項

1. **REQUIREMENTS.mdを読む**
   - プロジェクトの目的と要件を理解する
   - MVP範囲（FR-001〜FR-006）を確認する
   - 技術選定（Svelte 5.x, TypeScript, WebAssembly）を理解する

2. **DESIGN.mdを読む**
   - アーキテクチャ（WebAssembly Layer, Application Logic Layer, UI Layer）を理解する
   - ディレクトリ構成を確認する
   - Svelte Storeを使った状態管理設計を理解する

3. **TASKS.mdで現在のフェーズを確認する**
   - 実行すべきタスクを特定する
   - タスクの依存関係を確認する

### 推奨される作業フロー

```
1. REQUIREMENTS.md → プロジェクト理解
2. DESIGN.md → アーキテクチャ・技術仕様理解
3. TASKS.md → 実装タスクの確認
4. 実装 → 設計に従って実装
5. 完了条件の確認 → TASKS.mdの完了条件をチェック
```

---

## 技術スタックの要点

### フロントエンド
- **言語**: TypeScript 5.x (strict mode)
- **UIフレームワーク**: Svelte 5.x (runes mode有効)
- **ビルドツール**: Vite 5.x
- **Linter/Formatter**: Biome 1.x
- **UI言語**: 英語のみ

### バックエンド（WebAssembly）
- **言語**: Go 1.21+
- **パッケージ**: go/ast, go/parser, go/token

### 状態管理
- **方式**: Svelte Writable Store
- **主要Store**:
  - `astStore`: AST状態
  - `parseErrorStore`: パースエラー
  - `selectedNodeStore`: 選択されたノード
  - `expandedNodesStore`: 展開されたノード

---

## コーディング規約

### TypeScript
- strict modeを有効化
- 型定義を明示的に記述
- マジックナンバーを避け、定数を使用

### Svelte
- Svelte 5のrunes mode (`$state`, `$derived`, `$effect`) を使用
- コンポーネントは単一責任の原則に従う
- propsの型を明示

### スタイリング
- BEM命名規則を推奨
- グローバルスタイルは `src/styles/global.css`
- コンポーネント固有スタイルは `<style>` セクション

### コメント
- MUST規約: 冗長なコメントは禁止（単純な処理への説明不要）
- SHOULD規約: コードの意図が伝わりにくい箇所にはコメントを記述

### Commit
- MUST規約: すべてのcommitにGPGサインを付与
- MUST規約: Co-Author として Claude を追加:
  ```
  🤖 Generated with [Claude Code](https://claude.com/claude-code)
  
  Co-Authored-By: Claude <noreply@anthropic.com>
  ```

---

## よくある質問

### Q: Vanilla JavaScriptではなくSvelteを使う理由は？
A: バンドルサイズの最小化、リアクティブな状態管理、保守性の向上のため。DESIGN.mdの「不採用技術と理由」を参照。

### Q: WebAssemblyはどこで使われる？
A: Go言語のAST解析のみ。go/parserを使ってソースコードをASTに変換します。

### Q: 単一HTMLファイルにどうやって埋め込む？
A: Viteのvite-plugin-singlefileを使用。すべてのJS/CSS/WASMバイナリをインライン化します。

### Q: テストは必須？
A: TASKS.mdではフェーズ7（推奨）。MVPには含まれないが、品質保証のため推奨。

---

## トラブルシューティング

### ドキュメント間の矛盾を発見した場合
1. REQUIREMENTS.md > DESIGN.md > TASKS.md の順で優先度が高い
2. 矛盾をユーザーに報告し、確認を求める

### 不明な仕様がある場合
1. まずREQUIREMENTS.mdとDESIGN.mdを確認
2. 記載がない場合はユーザーに質問
3. 独自判断で実装しない

### ビルドエラーが発生した場合
1. DESIGN.mdのビルド設定を確認
2. package.jsonの依存関係を確認
3. エラーメッセージを詳細に分析

---

## 関連リンク

- [Svelte Documentation](https://svelte.dev/)
- [Svelte 5 Runes](https://svelte.dev/docs/svelte/what-are-runes)
- [Vite Documentation](https://vitejs.dev/)
- [Biome Documentation](https://biomejs.dev/)
- [Go WebAssembly](https://github.com/golang/go/wiki/WebAssembly)

---

**最終更新日**: 2025-11-23  
**バージョン**: 1.0
