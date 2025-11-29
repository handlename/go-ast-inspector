import { describe, expect, it } from 'vitest';
import { PositionMapper } from './position-mapper';
import type { ASTNode } from './types';

describe('PositionMapper', () => {
  const sourceCode = `package main

import "fmt"

func main() {
\tfmt.Println("Hello, World!")
}`;

  const mockAst: ASTNode = {
    type: 'File',
    pos: 1,
    end: sourceCode.length + 1,
    children: [
      {
        type: 'Ident',
        pos: 9,
        end: 13,
        children: [],
        metadata: { name: 'main' },
      },
      {
        type: 'ImportSpec',
        pos: 22,
        end: 27,
        children: [],
        metadata: { path: '"fmt"' },
      },
      {
        type: 'FuncDecl',
        pos: 29,
        end: sourceCode.length + 1,
        children: [
          {
            type: 'Ident',
            pos: 34,
            end: 38,
            children: [],
            metadata: { name: 'main' },
          },
        ],
        metadata: {},
      },
    ],
    metadata: {},
  };

  describe('findNodeAtOffset', () => {
    it('should find node at given offset', () => {
      const mapper = new PositionMapper(sourceCode);
      const node = mapper.findNodeAtOffset(mockAst, 10);

      expect(node).not.toBe(null);
      expect(node?.type).toBe('Ident');
      expect(node?.metadata.name).toBe('main');
    });

    it('should return null for offset outside AST', () => {
      const mapper = new PositionMapper(sourceCode);
      const node = mapper.findNodeAtOffset(mockAst, 1000);

      expect(node).toBe(null);
    });

    it('should return null for negative offset', () => {
      const mapper = new PositionMapper(sourceCode);
      const node = mapper.findNodeAtOffset(mockAst, -1);

      expect(node).toBe(null);
    });

    it('should find deepest matching node', () => {
      const mapper = new PositionMapper(sourceCode);
      const node = mapper.findNodeAtOffset(mockAst, 35);

      // Should find the Ident "main" inside FuncDecl, not FuncDecl itself
      expect(node?.type).toBe('Ident');
      expect(node?.metadata.name).toBe('main');
    });

    it('should handle null AST', () => {
      const mapper = new PositionMapper(sourceCode);
      const node = mapper.findNodeAtOffset(null, 10);

      expect(node).toBe(null);
    });

    it('should find node at exact start position', () => {
      const mapper = new PositionMapper(sourceCode);
      const node = mapper.findNodeAtOffset(mockAst, 9);

      expect(node?.type).toBe('Ident');
      expect(node?.metadata.name).toBe('main');
    });

    it('should find node at exact end position', () => {
      const mapper = new PositionMapper(sourceCode);
      const node = mapper.findNodeAtOffset(mockAst, 13);

      expect(node?.type).toBe('Ident');
      expect(node?.metadata.name).toBe('main');
    });

    it('should find import node', () => {
      const mapper = new PositionMapper(sourceCode);
      const node = mapper.findNodeAtOffset(mockAst, 24);

      expect(node?.type).toBe('ImportSpec');
      expect(node?.metadata.path).toBe('"fmt"');
    });
  });

  describe('edge cases', () => {
    it('should handle empty source code', () => {
      const mapper = new PositionMapper('');
      const emptyAst: ASTNode = {
        type: 'File',
        pos: 1,
        end: 1,
        children: [],
        metadata: {},
      };

      const node = mapper.findNodeAtOffset(emptyAst, 1);
      expect(node).not.toBe(null);
    });

    it('should handle AST with no children', () => {
      const mapper = new PositionMapper(sourceCode);
      const leafNode: ASTNode = {
        type: 'Ident',
        pos: 1,
        end: 10,
        children: [],
        metadata: { name: 'test' },
      };

      const node = mapper.findNodeAtOffset(leafNode, 5);
      expect(node?.type).toBe('Ident');
    });

    it('should handle offset at boundary between nodes', () => {
      const mapper = new PositionMapper(sourceCode);
      // Offset 14 is right after "main" package declaration ends
      const node = mapper.findNodeAtOffset(mockAst, 14);

      // Should return File node since we're between package and import
      expect(node?.type).toBe('File');
    });
  });
});
