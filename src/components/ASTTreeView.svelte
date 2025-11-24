<script lang="ts">
import type { ASTNode } from '$lib/core/types';
import { astStore, expandedNodesStore } from '$lib/stores/ast-store';
import { DEFAULT_EXPAND_LEVEL } from '$lib/utils/constants';
import TreeNode from './TreeNode.svelte';

function expandAll() {
  if (!$astStore) return;

  const allNodeIds = new Set<string>();
  collectNodeIds($astStore, allNodeIds);
  expandedNodesStore.set(allNodeIds);
}

function collapseAll() {
  expandedNodesStore.set(new Set());
}

function collectNodeIds(node: ASTNode, ids: Set<string>, prefix = '0'): void {
  ids.add(prefix);
  node.children.forEach((child, index) => {
    collectNodeIds(child, ids, `${prefix}-${index}`);
  });
}
</script>

<div class="ast-tree-view">
    <div class="ast-tree-view__header">
        <h2 class="ast-tree-view__title" id="ast-tree-title">AST Tree</h2>
        <div class="ast-tree-view__controls">
            <button
                class="ast-tree-view__button"
                onclick={expandAll}
                aria-label="Expand all tree nodes"
            >
                Expand All
            </button>
            <button
                class="ast-tree-view__button"
                onclick={collapseAll}
                aria-label="Collapse all tree nodes"
            >
                Collapse All
            </button>
        </div>
    </div>

    <div
        class="ast-tree-view__content"
        role="tree"
        aria-labelledby="ast-tree-title"
    >
        {#if $astStore}
            <TreeNode
                node={$astStore}
                level={0}
                nodeId="0"
                defaultExpandLevel={DEFAULT_EXPAND_LEVEL}
            />
        {:else}
            <p class="ast-tree-view__empty" role="status">
                No AST available. Enter valid Go code to see the AST.
            </p>
        {/if}
    </div>
</div>

<style>
    .ast-tree-view {
        display: flex;
        flex-direction: column;
        height: 100%;
    }

    .ast-tree-view__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 1rem;
        background-color: #f5f5f5;
        border-bottom: 1px solid #e0e0e0;
    }

    .ast-tree-view__title {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: #333;
    }

    .ast-tree-view__controls {
        display: flex;
        gap: 0.5rem;
    }

    .ast-tree-view__button {
        padding: 0.375rem 0.75rem;
        font-size: 0.75rem;
        background-color: #3498db;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .ast-tree-view__button:hover {
        background-color: #2980b9;
    }

    .ast-tree-view__content {
        flex: 1;
        overflow: auto;
        padding: 1rem;
        font-family: "Monaco", "Menlo", "Ubuntu Mono", "Consolas", monospace;
        font-size: 0.875rem;
        background-color: #fafafa;
    }

    .ast-tree-view__empty {
        color: #999;
        text-align: center;
        padding: 2rem;
    }
</style>
