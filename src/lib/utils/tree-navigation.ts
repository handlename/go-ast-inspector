import type { ASTNode } from '$lib/core/types';

export interface FlattenedNode {
  node: ASTNode;
  nodeId: string;
  level: number;
  parentId: string | null;
  childIds: string[];
}

/**
 * Flatten the AST tree into a list of nodes with navigation metadata.
 */
export function flattenTree(
  root: ASTNode,
  nodeId = '0',
  level = 0,
  parentId: string | null = null,
): FlattenedNode[] {
  const result: FlattenedNode[] = [];
  const childIds = root.children.map((_, index) => `${nodeId}-${index}`);

  result.push({
    node: root,
    nodeId,
    level,
    parentId,
    childIds,
  });

  root.children.forEach((child, index) => {
    const childNodeId = `${nodeId}-${index}`;
    result.push(...flattenTree(child, childNodeId, level + 1, nodeId));
  });

  return result;
}

/**
 * Build a map from nodeId to FlattenedNode for quick lookup.
 */
export function buildNodeMap(nodes: FlattenedNode[]): Map<string, FlattenedNode> {
  const map = new Map<string, FlattenedNode>();
  for (const node of nodes) {
    map.set(node.nodeId, node);
  }
  return map;
}

/**
 * Get the list of visible node IDs based on expanded state.
 */
export function getVisibleNodeIds(
  flatNodes: FlattenedNode[],
  expandedNodes: Set<string>,
): string[] {
  const visibleIds: string[] = [];
  const hiddenPrefixes = new Set<string>();

  for (const flatNode of flatNodes) {
    if (flatNode.parentId !== null && hiddenPrefixes.has(flatNode.parentId)) {
      hiddenPrefixes.add(flatNode.nodeId);
      continue;
    }

    visibleIds.push(flatNode.nodeId);

    if (flatNode.childIds.length > 0 && !expandedNodes.has(flatNode.nodeId)) {
      hiddenPrefixes.add(flatNode.nodeId);
    }
  }

  return visibleIds;
}

/**
 * Get the previous visible node ID.
 */
export function getPreviousVisibleNodeId(
  currentNodeId: string,
  visibleNodeIds: string[],
): string | null {
  const currentIndex = visibleNodeIds.indexOf(currentNodeId);
  if (currentIndex <= 0) return null;
  return visibleNodeIds[currentIndex - 1];
}

/**
 * Get the next visible node ID.
 */
export function getNextVisibleNodeId(
  currentNodeId: string,
  visibleNodeIds: string[],
): string | null {
  const currentIndex = visibleNodeIds.indexOf(currentNodeId);
  if (currentIndex === -1 || currentIndex >= visibleNodeIds.length - 1) return null;
  return visibleNodeIds[currentIndex + 1];
}

/**
 * Get the first visible node ID.
 */
export function getFirstVisibleNodeId(visibleNodeIds: string[]): string | null {
  return visibleNodeIds[0] ?? null;
}

/**
 * Get the last visible node ID.
 */
export function getLastVisibleNodeId(visibleNodeIds: string[]): string | null {
  return visibleNodeIds[visibleNodeIds.length - 1] ?? null;
}

/**
 * Get the parent node ID from a nodeId string.
 */
export function getParentNodeId(nodeId: string): string | null {
  const lastDashIndex = nodeId.lastIndexOf('-');
  if (lastDashIndex === -1) return null;
  return nodeId.substring(0, lastDashIndex);
}

/**
 * Get the first child node ID if the node has children and is expanded.
 */
export function getFirstChildNodeId(
  nodeId: string,
  nodeMap: Map<string, FlattenedNode>,
  expandedNodes: Set<string>,
): string | null {
  const flatNode = nodeMap.get(nodeId);
  if (!flatNode || flatNode.childIds.length === 0) return null;
  if (!expandedNodes.has(nodeId)) return null;
  return flatNode.childIds[0];
}

/**
 * Collect all descendant node IDs for subtree expansion.
 */
export function collectDescendantIds(
  nodeId: string,
  nodeMap: Map<string, FlattenedNode>,
): string[] {
  const result: string[] = [];
  const flatNode = nodeMap.get(nodeId);
  if (!flatNode) return result;

  result.push(nodeId);
  for (const childId of flatNode.childIds) {
    result.push(...collectDescendantIds(childId, nodeMap));
  }

  return result;
}
