import { writable } from 'svelte/store';

export const sourceCodeStore = writable<string>(`package main

import "fmt"

func main() {
\tfmt.Println("Hello, World!")
}
`);
