import { get } from "svelte/store";
import { describe, it, expect, beforeEach } from "vitest";
import {
  astStore,
  parseErrorStore,
  selectedNodeStore,
  expandedNodesStore,
  highlightedRangeStore,
} from "./ast-store";
import type { ASTNode, ParseError } from "$lib/core/types";

describe("ast-store", () => {
  beforeEach(() => {
    // Reset stores before each test
    astStore.set(null);
    parseErrorStore.set(null);
    selectedNodeStore.set(null);
    expandedNodesStore.set(new Set());
    highlightedRangeStore.set(null);
  });

  describe("astStore", () => {
    it("should initialize with null", () => {
      expect(get(astStore)).toBe(null);
    });

    it("should update AST node", () => {
      const mockAst: ASTNode = {
        id: "test-1",
        type: "File",
        pos: 1,
        end: 100,
        children: [],
      };

      astStore.set(mockAst);
      expect(get(astStore)).toEqual(mockAst);
    });

    it("should clear AST node", () => {
      const mockAst: ASTNode = {
        id: "test-1",
        type: "File",
        pos: 1,
        end: 100,
        children: [],
      };

      astStore.set(mockAst);
      astStore.set(null);
      expect(get(astStore)).toBe(null);
    });
  });

  describe("parseErrorStore", () => {
    it("should initialize with null", () => {
      expect(get(parseErrorStore)).toBe(null);
    });

    it("should update parse error", () => {
      const mockError: ParseError = {
        message: "syntax error",
        line: 5,
        column: 10,
      };

      parseErrorStore.set(mockError);
      expect(get(parseErrorStore)).toEqual(mockError);
    });

    it("should clear parse error", () => {
      const mockError: ParseError = {
        message: "syntax error",
        line: 5,
        column: 10,
      };

      parseErrorStore.set(mockError);
      parseErrorStore.set(null);
      expect(get(parseErrorStore)).toBe(null);
    });
  });

  describe("selectedNodeStore", () => {
    it("should initialize with null", () => {
      expect(get(selectedNodeStore)).toBe(null);
    });

    it("should update selected node", () => {
      const mockNode: ASTNode = {
        id: "test-node-1",
        type: "Ident",
        pos: 10,
        end: 15,
        value: "main",
      };

      selectedNodeStore.set(mockNode);
      expect(get(selectedNodeStore)).toEqual(mockNode);
    });

    it("should clear selected node", () => {
      const mockNode: ASTNode = {
        id: "test-node-1",
        type: "Ident",
        pos: 10,
        end: 15,
        value: "main",
      };

      selectedNodeStore.set(mockNode);
      selectedNodeStore.set(null);
      expect(get(selectedNodeStore)).toBe(null);
    });
  });

  describe("expandedNodesStore", () => {
    it("should initialize with empty Set", () => {
      expect(get(expandedNodesStore)).toEqual(new Set());
    });

    it("should add node IDs to expanded set", () => {
      const nodeIds = new Set(["node-1", "node-2", "node-3"]);
      expandedNodesStore.set(nodeIds);
      expect(get(expandedNodesStore)).toEqual(nodeIds);
    });

    it("should update expanded nodes set", () => {
      const initialSet = new Set(["node-1"]);
      expandedNodesStore.set(initialSet);

      const updatedSet = new Set(["node-1", "node-2"]);
      expandedNodesStore.set(updatedSet);

      expect(get(expandedNodesStore)).toEqual(updatedSet);
    });

    it("should clear expanded nodes", () => {
      const nodeIds = new Set(["node-1", "node-2"]);
      expandedNodesStore.set(nodeIds);

      expandedNodesStore.set(new Set());
      expect(get(expandedNodesStore)).toEqual(new Set());
    });
  });

  describe("highlightedRangeStore", () => {
    it("should initialize with null", () => {
      expect(get(highlightedRangeStore)).toBe(null);
    });

    it("should update highlighted range", () => {
      const range = { start: 10, end: 50 };
      highlightedRangeStore.set(range);
      expect(get(highlightedRangeStore)).toEqual(range);
    });

    it("should clear highlighted range", () => {
      const range = { start: 10, end: 50 };
      highlightedRangeStore.set(range);

      highlightedRangeStore.set(null);
      expect(get(highlightedRangeStore)).toBe(null);
    });
  });
});
