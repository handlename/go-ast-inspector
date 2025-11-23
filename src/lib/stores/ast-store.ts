import type { ASTNode, ParseError } from '$lib/core/types';
import { writable } from 'svelte/store';

export const astStore = writable<ASTNode | null>(null);
export const parseErrorStore = writable<ParseError | null>(null);
export const selectedNodeStore = writable<ASTNode | null>(null);
export const expandedNodesStore = writable<Set<string>>(new Set());
