<script lang="ts">
import type { ASTNode } from '$lib/core/types';
import {
  astStore,
  expandedNodesStore,
  focusedNodeIdStore,
  selectedNodeStore,
} from '$lib/stores/ast-store';
import { DEFAULT_EXPAND_LEVEL } from '$lib/utils/constants';
import {
  buildNodeMap,
  collectDescendantIds,
  flattenTree,
  getFirstChildNodeId,
  getFirstVisibleNodeId,
  getLastVisibleNodeId,
  getNextVisibleNodeId,
  getParentNodeId,
  getPreviousVisibleNodeId,
  getVisibleNodeIds,
} from '$lib/utils/tree-navigation';
import KeyboardShortcutHelp from './KeyboardShortcutHelp.svelte';
import TreeNode from './TreeNode.svelte';

// biome-ignore lint/style/useConst: Svelte 5 $state requires let for primitive reassignment
let isHelpOpen = $state(false);

const flatNodes = $derived($astStore ? flattenTree($astStore) : []);
const nodeMap = $derived(buildNodeMap(flatNodes));
const visibleNodeIds = $derived(getVisibleNodeIds(flatNodes, $expandedNodesStore));

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

function focusNode(nodeId: string, alsoSelect = true) {
  focusedNodeIdStore.set(nodeId);
  if (alsoSelect) {
    const flatNode = nodeMap.get(nodeId);
    if (flatNode) {
      selectedNodeStore.set(flatNode.node);
    }
  }
}

function expandSubtree(nodeId: string) {
  const descendantIds = collectDescendantIds(nodeId, nodeMap);
  expandedNodesStore.update((nodes) => {
    const newNodes = new Set(nodes);
    for (const id of descendantIds) {
      newNodes.add(id);
    }
    return newNodes;
  });
}

function handleTreeKeydown(e: KeyboardEvent) {
  const currentNodeId = $focusedNodeIdStore;
  if (!currentNodeId) {
    if (e.key === 'ArrowDown' || e.key === 'Home') {
      const firstId = getFirstVisibleNodeId(visibleNodeIds);
      if (firstId) {
        e.preventDefault();
        focusNode(firstId);
      }
    }
    return;
  }

  const flatNode = nodeMap.get(currentNodeId);
  if (!flatNode) return;

  const hasChildren = flatNode.childIds.length > 0;
  const isExpanded = $expandedNodesStore.has(currentNodeId);

  // Cmd+ArrowUp/Down as Mac alternative for Home/End
  if (e.metaKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
    e.preventDefault();
    if (e.key === 'ArrowUp') {
      const firstId = getFirstVisibleNodeId(visibleNodeIds);
      if (firstId) {
        focusNode(firstId);
      }
    } else {
      const lastId = getLastVisibleNodeId(visibleNodeIds);
      if (lastId) {
        focusNode(lastId);
      }
    }
    return;
  }

  switch (e.key) {
    case 'ArrowUp': {
      e.preventDefault();
      const prevId = getPreviousVisibleNodeId(currentNodeId, visibleNodeIds);
      if (prevId) {
        focusNode(prevId);
      }
      break;
    }

    case 'ArrowDown': {
      e.preventDefault();
      const nextId = getNextVisibleNodeId(currentNodeId, visibleNodeIds);
      if (nextId) {
        focusNode(nextId);
      }
      break;
    }

    case 'ArrowRight': {
      e.preventDefault();
      if (hasChildren) {
        if (!isExpanded) {
          expandedNodesStore.update((nodes) => {
            const newNodes = new Set(nodes);
            newNodes.add(currentNodeId);
            return newNodes;
          });
        } else {
          const firstChildId = getFirstChildNodeId(currentNodeId, nodeMap, $expandedNodesStore);
          if (firstChildId) {
            focusNode(firstChildId);
          }
        }
      }
      break;
    }

    case 'ArrowLeft': {
      e.preventDefault();
      if (hasChildren && isExpanded) {
        expandedNodesStore.update((nodes) => {
          const newNodes = new Set(nodes);
          newNodes.delete(currentNodeId);
          return newNodes;
        });
      } else {
        const parentId = getParentNodeId(currentNodeId);
        if (parentId) {
          focusNode(parentId);
        }
      }
      break;
    }

    case 'Home': {
      e.preventDefault();
      const firstId = getFirstVisibleNodeId(visibleNodeIds);
      if (firstId) {
        focusNode(firstId);
      }
      break;
    }

    case 'End': {
      e.preventDefault();
      const lastId = getLastVisibleNodeId(visibleNodeIds);
      if (lastId) {
        focusNode(lastId);
      }
      break;
    }

    case '*': {
      e.preventDefault();
      expandSubtree(currentNodeId);
      break;
    }
  }
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
            <button
                class="ast-tree-view__help-button"
                onclick={() => (isHelpOpen = true)}
                aria-label="Show keyboard shortcuts"
                title="Keyboard shortcuts"
            >
                ?
            </button>
        </div>
    </div>

    <div
        class="ast-tree-view__content"
        role="tree"
        aria-labelledby="ast-tree-title"
        tabindex="0"
        onkeydown={handleTreeKeydown}
        onblur={() => focusedNodeIdStore.set(null)}
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

<KeyboardShortcutHelp
    isOpen={isHelpOpen}
    onClose={() => (isHelpOpen = false)}
/>

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
        min-height: 3.25rem;
        padding: 0.75rem 1rem;
        box-sizing: border-box;
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

    .ast-tree-view__help-button {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 1.75rem;
        height: 1.75rem;
        padding: 0;
        font-size: 0.875rem;
        font-weight: 600;
        background-color: #95a5a6;
        color: white;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .ast-tree-view__help-button:hover {
        background-color: #7f8c8d;
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
