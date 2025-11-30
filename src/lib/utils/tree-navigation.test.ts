import type { ASTNode } from '$lib/core/types';
import { describe, expect, it } from 'vitest';
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
} from './tree-navigation';

const createMockNode = (
  type: string,
  pos: number,
  end: number,
  children: ASTNode[] = [],
): ASTNode => ({
  type,
  pos,
  end,
  children,
  metadata: {},
});

describe('tree-navigation', () => {
  const mockTree: ASTNode = createMockNode('File', 0, 100, [
    createMockNode('Package', 0, 10, []),
    createMockNode('FuncDecl', 11, 50, [
      createMockNode('Ident', 11, 15, []),
      createMockNode('BlockStmt', 16, 50, [createMockNode('ReturnStmt', 20, 30, [])]),
    ]),
    createMockNode('FuncDecl', 51, 100, []),
  ]);

  describe('flattenTree', () => {
    it('should flatten tree into a list of nodes', () => {
      const flat = flattenTree(mockTree);
      expect(flat).toHaveLength(7);
      expect(flat[0].nodeId).toBe('0');
      expect(flat[0].node.type).toBe('File');
      expect(flat[1].nodeId).toBe('0-0');
      expect(flat[1].node.type).toBe('Package');
    });

    it('should correctly set parent IDs', () => {
      const flat = flattenTree(mockTree);
      expect(flat[0].parentId).toBe(null);
      expect(flat[1].parentId).toBe('0');
      expect(flat[3].parentId).toBe('0-1');
    });

    it('should correctly set child IDs', () => {
      const flat = flattenTree(mockTree);
      expect(flat[0].childIds).toEqual(['0-0', '0-1', '0-2']);
      expect(flat[1].childIds).toEqual([]);
      expect(flat[2].childIds).toEqual(['0-1-0', '0-1-1']);
    });
  });

  describe('buildNodeMap', () => {
    it('should build a map from nodeId to FlattenedNode', () => {
      const flat = flattenTree(mockTree);
      const map = buildNodeMap(flat);
      expect(map.size).toBe(7);
      expect(map.get('0')?.node.type).toBe('File');
      expect(map.get('0-1-1')?.node.type).toBe('BlockStmt');
    });
  });

  describe('getVisibleNodeIds', () => {
    it('should return all node IDs when all are expanded', () => {
      const flat = flattenTree(mockTree);
      const expanded = new Set(['0', '0-1', '0-1-1']);
      const visible = getVisibleNodeIds(flat, expanded);
      expect(visible).toHaveLength(7);
    });

    it('should hide children of collapsed nodes', () => {
      const flat = flattenTree(mockTree);
      const expanded = new Set(['0']);
      const visible = getVisibleNodeIds(flat, expanded);
      expect(visible).toEqual(['0', '0-0', '0-1', '0-2']);
    });

    it('should only show root when nothing is expanded', () => {
      const flat = flattenTree(mockTree);
      const expanded = new Set<string>();
      const visible = getVisibleNodeIds(flat, expanded);
      expect(visible).toEqual(['0']);
    });
  });

  describe('getPreviousVisibleNodeId', () => {
    it('should return null for first node', () => {
      const visible = ['0', '0-0', '0-1'];
      expect(getPreviousVisibleNodeId('0', visible)).toBe(null);
    });

    it('should return previous node ID', () => {
      const visible = ['0', '0-0', '0-1'];
      expect(getPreviousVisibleNodeId('0-0', visible)).toBe('0');
      expect(getPreviousVisibleNodeId('0-1', visible)).toBe('0-0');
    });
  });

  describe('getNextVisibleNodeId', () => {
    it('should return null for last node', () => {
      const visible = ['0', '0-0', '0-1'];
      expect(getNextVisibleNodeId('0-1', visible)).toBe(null);
    });

    it('should return next node ID', () => {
      const visible = ['0', '0-0', '0-1'];
      expect(getNextVisibleNodeId('0', visible)).toBe('0-0');
      expect(getNextVisibleNodeId('0-0', visible)).toBe('0-1');
    });
  });

  describe('getFirstVisibleNodeId', () => {
    it('should return first node ID', () => {
      expect(getFirstVisibleNodeId(['0', '0-0', '0-1'])).toBe('0');
    });

    it('should return null for empty list', () => {
      expect(getFirstVisibleNodeId([])).toBe(null);
    });
  });

  describe('getLastVisibleNodeId', () => {
    it('should return last node ID', () => {
      expect(getLastVisibleNodeId(['0', '0-0', '0-1'])).toBe('0-1');
    });

    it('should return null for empty list', () => {
      expect(getLastVisibleNodeId([])).toBe(null);
    });
  });

  describe('getParentNodeId', () => {
    it('should return null for root node', () => {
      expect(getParentNodeId('0')).toBe(null);
    });

    it('should return parent node ID', () => {
      expect(getParentNodeId('0-1')).toBe('0');
      expect(getParentNodeId('0-1-2')).toBe('0-1');
    });
  });

  describe('getFirstChildNodeId', () => {
    it('should return null for node without children', () => {
      const flat = flattenTree(mockTree);
      const map = buildNodeMap(flat);
      const expanded = new Set(['0', '0-0']);
      expect(getFirstChildNodeId('0-0', map, expanded)).toBe(null);
    });

    it('should return null for collapsed node', () => {
      const flat = flattenTree(mockTree);
      const map = buildNodeMap(flat);
      const expanded = new Set(['0']);
      expect(getFirstChildNodeId('0-1', map, expanded)).toBe(null);
    });

    it('should return first child ID for expanded node', () => {
      const flat = flattenTree(mockTree);
      const map = buildNodeMap(flat);
      const expanded = new Set(['0', '0-1']);
      expect(getFirstChildNodeId('0-1', map, expanded)).toBe('0-1-0');
    });
  });

  describe('collectDescendantIds', () => {
    it('should return just the node ID for leaf nodes', () => {
      const flat = flattenTree(mockTree);
      const map = buildNodeMap(flat);
      expect(collectDescendantIds('0-0', map)).toEqual(['0-0']);
    });

    it('should collect all descendant IDs', () => {
      const flat = flattenTree(mockTree);
      const map = buildNodeMap(flat);
      const descendants = collectDescendantIds('0-1', map);
      expect(descendants).toContain('0-1');
      expect(descendants).toContain('0-1-0');
      expect(descendants).toContain('0-1-1');
      expect(descendants).toContain('0-1-1-0');
      expect(descendants).toHaveLength(4);
    });
  });
});
