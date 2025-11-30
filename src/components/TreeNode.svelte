<script lang="ts">
import type { ASTNode } from '$lib/core/types';
import { expandedNodesStore, focusedNodeIdStore, selectedNodeStore } from '$lib/stores/ast-store';

interface Props {
  node: ASTNode;
  level: number;
  nodeId: string;
  defaultExpandLevel: number;
}

const { node, level, nodeId, defaultExpandLevel }: Props = $props();

// biome-ignore lint/style/useConst: Svelte $state() requires let for bind:this
let nodeElement: HTMLDivElement | undefined = $state();

const isExpanded = $derived($expandedNodesStore.has(nodeId));
const isSelected = $derived(
  $selectedNodeStore?.pos === node.pos && $selectedNodeStore?.end === node.end,
);
const isFocused = $derived($focusedNodeIdStore === nodeId);
const hasChildren = $derived(node.children && node.children.length > 0);

function toggleExpand() {
  expandedNodesStore.update((nodes) => {
    const newNodes = new Set(nodes);
    if (newNodes.has(nodeId)) {
      newNodes.delete(nodeId);
    } else {
      newNodes.add(nodeId);
    }
    return newNodes;
  });
}

function handleClick() {
  selectedNodeStore.set(node);
  focusedNodeIdStore.set(nodeId);
}

function formatMetadata(metadata: Record<string, unknown>): string {
  const entries = Object.entries(metadata);
  if (entries.length === 0) return '';

  return entries
    .map(([key, value]) => {
      if (value === null || value === undefined) return null;
      return `${key}=${JSON.stringify(value)}`;
    })
    .filter(Boolean)
    .join(', ');
}

const metadataStr = $derived(formatMetadata(node.metadata));

let initialExpandDone = false;

$effect(() => {
  // Default expand level - only on initial mount
  if (!initialExpandDone && level < defaultExpandLevel && hasChildren) {
    expandedNodesStore.update((nodes) => {
      const newNodes = new Set(nodes);
      newNodes.add(nodeId);
      return newNodes;
    });
    initialExpandDone = true;
  }
});

let previousSelectedNode: ASTNode | null = null;

$effect(() => {
  // Auto-expand to selected node only when selection changes
  // (e.g., clicking in the editor to select a position)
  const currentSelected = $selectedNodeStore;
  const selectionChanged = currentSelected !== previousSelectedNode;
  previousSelectedNode = currentSelected;

  if (
    selectionChanged &&
    currentSelected &&
    hasChildren &&
    !isExpanded &&
    isNodeOrAncestor(currentSelected, node) &&
    !isSelected
  ) {
    expandedNodesStore.update((nodes) => {
      const newNodes = new Set(nodes);
      newNodes.add(nodeId);
      return newNodes;
    });
  }
});

function isNodeOrAncestor(selected: ASTNode, current: ASTNode): boolean {
  // Check if selected node is current node
  if (selected.pos === current.pos && selected.end === current.end) {
    return true;
  }

  // Check if selected node is descendant of current node
  if (selected.pos >= current.pos && selected.end <= current.end) {
    return true;
  }

  return false;
}

$effect(() => {
  if (isSelected && nodeElement) {
    nodeElement.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    });
  }
});

$effect(() => {
  if (isFocused && nodeElement) {
    nodeElement.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    });
  }
});
</script>

<div
    class="tree-node"
    class:tree-node--selected={isSelected}
    class:tree-node--focused={isFocused}
    bind:this={nodeElement}
    role="treeitem"
    aria-expanded={hasChildren ? isExpanded : undefined}
    aria-selected={isSelected}
    aria-level={level + 1}
    data-node-id={nodeId}
>
    <!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
    <!-- Keyboard navigation is handled at the tree container level (ASTTreeView) -->
    <div
        class="tree-node__line"
        style="padding-left: {level * 1.5}rem"
        onclick={handleClick}
    >
        {#if hasChildren}
            <button
                class="tree-node__toggle"
                onclick={(e) => {
                    e.stopPropagation();
                    toggleExpand();
                }}
                aria-label={isExpanded ? "Collapse" : "Expand"}
            >
                {isExpanded ? "▼" : "▶"}
            </button>
        {:else}
            <span class="tree-node__spacer"></span>
        {/if}

        {#if node.fieldName}
            <span class="tree-node__field-name">{node.fieldName}</span>
        {/if}
        <span class="tree-node__type">{node.type}</span>

        {#if metadataStr}
            <span class="tree-node__metadata">({metadataStr})</span>
        {/if}

        <span class="tree-node__position">
            [{node.pos}:{node.end}]
        </span>
    </div>

    {#if isExpanded && hasChildren}
        <div class="tree-node__children">
            {#each node.children as child, index}
                <!-- svelte-ignore svelte_self_deprecated -->
                <svelte:self
                    node={child}
                    level={level + 1}
                    nodeId="{nodeId}-{index}"
                    {defaultExpandLevel}
                />
            {/each}
        </div>
    {/if}
</div>

<style>
    .tree-node {
        user-select: none;
    }

    .tree-node__line {
        display: flex;
        align-items: center;
        padding: 0.25rem 0.5rem;
        cursor: pointer;
        transition: background-color 0.1s;
    }

    .tree-node__line:hover {
        background-color: #e8f4f8;
    }

    .tree-node--selected > .tree-node__line {
        background-color: #d4e9f7;
        font-weight: 600;
    }

    .tree-node--focused > .tree-node__line {
        outline: 2px solid #3498db;
        outline-offset: -2px;
    }

    .tree-node--selected.tree-node--focused > .tree-node__line {
        outline-color: #2980b9;
    }

    .tree-node__toggle {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 1.25rem;
        height: 1.25rem;
        margin-right: 0.25rem;
        padding: 0;
        background: none;
        border: none;
        cursor: pointer;
        font-size: 0.75rem;
        color: #666;
    }

    .tree-node__toggle:hover {
        color: #333;
    }

    .tree-node__spacer {
        display: inline-block;
        width: 1.25rem;
        margin-right: 0.25rem;
    }

    .tree-node__field-name {
        color: #8e44ad;
        font-weight: 500;
        margin-right: 0.25rem;
    }

    .tree-node__field-name::after {
        content: ":";
    }

    .tree-node__type {
        color: #2c3e50;
        font-weight: 600;
    }

    .tree-node__metadata {
        margin-left: 0.5rem;
        color: #7f8c8d;
        font-size: 0.8125rem;
    }

    .tree-node__position {
        margin-left: 0.5rem;
        color: #95a5a6;
        font-size: 0.75rem;
    }

    .tree-node__children {
        margin-left: 0;
    }
</style>
