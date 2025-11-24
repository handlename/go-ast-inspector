import { describe, it, expect } from 'vitest';
import { PositionMapper } from './position-mapper';
import type { ASTNode } from './types';

describe('PositionMapper', () => {
  const sourceCode = `package main

import "fmt"

func main() {
\tfmt.Println("Hello, World!")
}`;

  const mockAst: ASTNode = {
    id: 'file-1',
    type: 'File',
    pos: 1,
    end: sourceCode.length + 1,
    children: [
      {
        id: 'package-1',
        type: 'Ident',
        pos: 9,
        end: 13,
        value: 'main',
      },
      {
        id: 'import-1',
        type: 'ImportSpec',
        pos: 22,
        end: 27,
        value: '"fmt"',
      },
      {
        id: 'func-1',
        type: 'FuncDecl',
        pos: 29,
        end: sourceCode.length + 1,
        children: [
          {
            id: 'func-name',
            type: 'Ident',
            pos: 34,
            end: 38,
            value: 'main',
          },
        ],
      },
    ],
  };

  describe('findNodeAtOffset', () => {
    it('should find node at given offset', () => {
      const mapper = new PositionMapper(sourceCode);
      const node = mapper.findNodeAtOffset(mockAst, 10);

      expect(node).not.toBe(null);
      expect(node?.type).toBe('Ident');
      expect(node?.value).toBe('main');
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
      expect(node?.id).toBe('func-name');
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
      expect(node?.value).toBe('main');
    });

    it('should find node at exact end position', () => {
      const mapper = new PositionMapper(sourceCode);
      const node = mapper.findNodeAtOffset(mockAst, 13);

      expect(node?.type).toBe('Ident');
      expect(node?.value).toBe('main');
    });

    it('should find import node', () => {
      const mapper = new PositionMapper(sourceCode);
      const node = mapper.findNodeAtOffset(mockAst, 24);

      expect(node?.type).toBe('ImportSpec');
      expect(node?.value).toBe('"fmt"');
    });
  });

  describe('edge cases', () => {
    it('should handle empty source code', () => {
      const mapper = new PositionMapper('');
      const emptyAst: ASTNode = {
        id: 'empty',
        type: 'File',
        pos: 1,
        end: 1,
      };

      const node = mapper.findNodeAtOffset(emptyAst, 1);
      expect(node).not.toBe(null);
    });

    it('should handle AST with no children', () => {
      const mapper = new PositionMapper(sourceCode);
      const leafNode: ASTNode = {
        id: 'leaf',
        type: 'Ident',
        pos: 1,
        end: 10,
        value: 'test',
      };

      const node = mapper.findNodeAtOffset(leafNode, 5);
      expect(node?.id).toBe('leaf');
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
