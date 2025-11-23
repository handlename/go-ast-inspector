<script lang="ts">
    import { parserBridge } from "$lib/core/parser-bridge";
    import { astStore, parseErrorStore } from "$lib/stores/ast-store";
    import { sourceCodeStore } from "$lib/stores/editor-store";
    import { onMount } from "svelte";
    import ASTTreeView from "./components/ASTTreeView.svelte";
    import CodeEditor from "./components/CodeEditor.svelte";
    import ErrorDisplay from "./components/ErrorDisplay.svelte";
    import HeaderBar from "./components/HeaderBar.svelte";

    let isInitializing = $state(true);
    let initError = $state<string | null>(null);

    onMount(async () => {
        try {
            await parserBridge.initialize("/parser.wasm", "/wasm_exec.js");
            handleParse($sourceCodeStore);
        } catch (error) {
            initError =
                error instanceof Error
                    ? error.message
                    : "Failed to initialize parser";
        } finally {
            isInitializing = false;
        }
    });

    function handleParse(code: string) {
        const result = parserBridge.parse(code);

        if (result.error) {
            parseErrorStore.set({
                message: result.error,
                line: 0,
                column: 0,
            });
            astStore.set(null);
        } else if (result.ast) {
            astStore.set(result.ast);
            parseErrorStore.set(null);
        }
    }

    sourceCodeStore.subscribe((code) => {
        if (!isInitializing && !initError) {
            handleParse(code);
        }
    });
</script>

<div class="app">
    <HeaderBar />

    {#if isInitializing}
        <div class="loading">
            <p>Initializing parser...</p>
        </div>
    {:else if initError}
        <ErrorDisplay message={initError} />
    {:else}
        <div class="main-content">
            <div class="editor-panel">
                <CodeEditor />
            </div>
            <div class="ast-panel">
                <ASTTreeView />
            </div>
        </div>
    {/if}
</div>

<style>
    .app {
        display: flex;
        flex-direction: column;
        height: 100vh;
        width: 100%;
    }

    .loading {
        display: flex;
        justify-content: center;
        align-items: center;
        flex: 1;
    }

    .main-content {
        display: flex;
        flex: 1;
        overflow: hidden;
    }

    .editor-panel,
    .ast-panel {
        flex: 1;
        overflow: auto;
    }

    .editor-panel {
        border-right: 1px solid #e0e0e0;
    }
</style>
