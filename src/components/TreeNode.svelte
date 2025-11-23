<script lang="ts">
import type { ASTNode } from '$lib/core/types';
import { expandedNodesStore, selectedNodeStore } from '$lib/stores/ast-store';

interface Props {
  node: ASTNode;
  level: number;
  nodeId: string;
  defaultExpandLevel: number;
}

const { node, level, nodeId, defaultExpandLevel }: Props = $props();

const isExpanded = $derived($expandedNodesStore.has(nodeId));
const isSelected = $derived(
  $selectedNodeStore?.pos === node.pos && $selectedNodeStore?.end === node.end,
);
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

$effect(() => {
  if (level < defaultExpandLevel && hasChildren && !isExpanded) {
    expandedNodesStore.update((nodes) => {
      const newNodes = new Set(nodes);
      newNodes.add(nodeId);
      return newNodes;
    });
  }
});
</script>

<div class="tree-node" class:tree-node--selected={isSelected}>
    <div
        class="tree-node__line"
        style="padding-left: {level * 1.5}rem"
        onclick={handleClick}
        role="button"
        tabindex="0"
        onkeydown={(e) => e.key === "Enter" && handleClick()}
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

    .tree-node--selected .tree-node__line {
        background-color: #d4e9f7;
        font-weight: 600;
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
