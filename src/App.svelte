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
            await parserBridge.initialize("/parser.wasm");
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

    let editorWidth = $state(50);
    let isResizing = $state(false);

    function handleMouseDown() {
        isResizing = true;
    }

    function handleMouseMove(e: MouseEvent) {
        if (!isResizing) return;

        const container = document.querySelector(".main-content");
        if (!container) return;

        const containerRect = container.getBoundingClientRect();
        const percentage =
            ((e.clientX - containerRect.left) / containerRect.width) * 100;

        editorWidth = Math.max(20, Math.min(80, percentage));
    }

    function handleMouseUp() {
        isResizing = false;
    }

    onMount(() => {
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    });
</script>

<svelte:window onmousemove={handleMouseMove} onmouseup={handleMouseUp} />

<div class="app">
    <HeaderBar />

    {#if isInitializing}
        <div class="loading">
            <p>Initializing parser...</p>
        </div>
    {:else if initError}
        <ErrorDisplay message={initError} />
    {:else}
        <div class="main-content" role="main">
            <div class="editor-panel" style="width: {editorWidth}%">
                <CodeEditor />
            </div>
            <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
            <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
            <div
                class="splitter"
                onmousedown={handleMouseDown}
                role="separator"
                aria-label="Resize panels"
                aria-orientation="vertical"
                aria-valuenow={editorWidth}
                tabindex="0"
            ></div>
            <div class="ast-panel" style="width: {100 - editorWidth}%">
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
        min-width: 800px;
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
        position: relative;
    }

    .editor-panel,
    .ast-panel {
        overflow: auto;
        min-width: 300px;
    }

    .splitter {
        width: 4px;
        background-color: #e0e0e0;
        cursor: col-resize;
        flex-shrink: 0;
        transition: background-color 0.2s;
        user-select: none;
        border: none;
        padding: 0;
        margin: 0;
    }

    .splitter:hover {
        background-color: #2196f3;
    }

    .splitter:active {
        background-color: #1976d2;
    }

    @media (max-width: 800px) {
        .app {
            min-width: 100%;
        }

        .main-content {
            flex-direction: column;
        }

        .editor-panel,
        .ast-panel {
            width: 100% !important;
            min-width: 100%;
            min-height: 300px;
        }

        .splitter {
            display: none;
        }
    }
</style>
