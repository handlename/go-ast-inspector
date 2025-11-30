<script lang="ts">
interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const { isOpen, onClose }: Props = $props();

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    onClose();
  }
}

function handleBackdropClick(e: MouseEvent) {
  if (e.target === e.currentTarget) {
    onClose();
  }
}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
  <!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
  <div class="help-overlay" onclick={handleBackdropClick}>
    <div class="help-dialog" role="dialog" aria-labelledby="help-title" aria-modal="true">
      <div class="help-dialog__header">
        <h3 class="help-dialog__title" id="help-title">Keyboard Shortcuts</h3>
        <button class="help-dialog__close" onclick={onClose} aria-label="Close">
          ×
        </button>
      </div>
      <div class="help-dialog__content">
        <table class="help-table">
          <thead>
            <tr>
              <th>Key</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><kbd>↑</kbd> / <kbd>↓</kbd></td>
              <td>Move to previous / next visible node</td>
            </tr>
            <tr>
              <td><kbd>→</kbd></td>
              <td>Expand node, or move to first child</td>
            </tr>
            <tr>
              <td><kbd>←</kbd></td>
              <td>Collapse node, or move to parent</td>
            </tr>
            <tr>
              <td><kbd>Home</kbd> / <kbd>Cmd</kbd>+<kbd>↑</kbd></td>
              <td>Jump to first node</td>
            </tr>
            <tr>
              <td><kbd>End</kbd> / <kbd>Cmd</kbd>+<kbd>↓</kbd></td>
              <td>Jump to last visible node</td>
            </tr>
            <tr>
              <td><kbd>*</kbd></td>
              <td>Expand current node and all descendants</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
{/if}

<style>
  .help-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .help-dialog {
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    max-width: 450px;
    width: 90%;
    max-height: 80vh;
    overflow: auto;
  }

  .help-dialog__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.25rem;
    border-bottom: 1px solid #e0e0e0;
  }

  .help-dialog__title {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: #333;
  }

  .help-dialog__close {
    background: none;
    border: none;
    font-size: 1.5rem;
    color: #666;
    cursor: pointer;
    padding: 0;
    line-height: 1;
  }

  .help-dialog__close:hover {
    color: #333;
  }

  .help-dialog__content {
    padding: 1rem 1.25rem;
  }

  .help-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
  }

  .help-table th,
  .help-table td {
    padding: 0.5rem 0.75rem;
    text-align: left;
    border-bottom: 1px solid #eee;
  }

  .help-table th {
    font-weight: 600;
    color: #555;
    background-color: #f9f9f9;
  }

  .help-table tr:last-child td {
    border-bottom: none;
  }

  kbd {
    display: inline-block;
    padding: 0.15rem 0.4rem;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
    font-size: 0.75rem;
    color: #333;
    background-color: #f5f5f5;
    border: 1px solid #ccc;
    border-radius: 3px;
    box-shadow: 0 1px 1px rgba(0, 0, 0, 0.1);
  }
</style>
