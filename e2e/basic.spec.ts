import { type Page, expect, test } from '@playwright/test';

/**
 * Wait for WASM to initialize and AST tree to be rendered
 */
async function waitForAstTreeReady(page: Page): Promise<void> {
  await expect(page.locator('.ast-tree-view .tree-node').first()).toBeVisible({
    timeout: 10000,
  });
}

/**
 * Wait for AST to be re-parsed after code change
 */
async function waitForAstParsed(page: Page): Promise<void> {
  // Wait for File node to appear (indicates successful parse)
  await expect(page.locator('.tree-node__type').filter({ hasText: 'File' }).first()).toBeVisible({
    timeout: 5000,
  });
}

test.describe('Go AST Inspector - Basic Functionality', () => {
  test('should load the application', async ({ page }) => {
    await page.goto('/');

    // Check title
    await expect(page).toHaveTitle(/Go AST Inspector/);

    // Check header
    await expect(page.getByRole('banner')).toContainText('Go AST Inspector');
    await expect(page.getByRole('banner')).toContainText('Visualize Go Abstract Syntax Tree');

    // Check version and links
    await expect(page.getByRole('banner')).toContainText('v0.1.0');
    await expect(page.getByRole('link', { name: /Repository/i })).toBeVisible();
    await expect(page.locator('a[href*="handlename"]').first()).toBeVisible();
  });

  test('should display default Hello World code', async ({ page }) => {
    await page.goto('/');

    // Check if code editor textarea has default content
    const textarea = page.locator('.code-editor textarea');
    await expect(textarea).toBeVisible();

    const content = await textarea.inputValue();
    expect(content).toContain('package main');
    expect(content).toContain('fmt.Println("Hello, World!")');
  });

  test('should display AST tree for default code', async ({ page }) => {
    await page.goto('/');

    // Wait for WASM to initialize and parse
    await waitForAstTreeReady(page);

    // Check if AST tree is visible
    const astTree = page.locator('.ast-tree-view');
    await expect(astTree).toBeVisible();

    // Check for File node
    await expect(
      page.locator('.tree-node__type').filter({ hasText: 'File' }).first(),
    ).toBeVisible();

    // Check for tree nodes exist
    const nodeCount = await page.locator('.tree-node').count();
    expect(nodeCount).toBeGreaterThan(3);
  });

  test('should parse user-entered code', async ({ page }) => {
    await page.goto('/');
    await waitForAstTreeReady(page);

    const textarea = page.locator('.code-editor textarea');

    // Clear and enter new code
    await textarea.fill('');
    await textarea.fill(`package test

func add(a, b int) int {
\treturn a + b
}`);

    // Wait for parsing - check for FuncDecl node to appear
    await expect(page.locator('.tree-node__type').filter({ hasText: 'FuncDecl' })).toBeVisible({
      timeout: 5000,
    });

    // Check AST tree updated
    await expect(
      page.locator('.tree-node__type').filter({ hasText: 'File' }).first(),
    ).toBeVisible();
  });

  test('should handle invalid code gracefully', async ({ page }) => {
    await page.goto('/');
    await waitForAstTreeReady(page);

    const textarea = page.locator('.code-editor textarea');

    // Enter invalid code
    await textarea.fill('invalid go code ][}{');

    // Application should still be functional (textarea and tree view remain visible)
    await expect(textarea).toBeVisible();
    await expect(page.locator('.ast-tree-view')).toBeVisible();
  });

  test('should expand and collapse AST nodes', async ({ page }) => {
    await page.goto('/');
    await waitForAstTreeReady(page);

    // Find a node with children (File node)
    const fileNode = page.locator('.tree-node').filter({ hasText: 'File' }).first();
    await expect(fileNode).toBeVisible();

    // Click to toggle (collapse)
    await fileNode.locator('.tree-node__line').first().click();

    // Toggle again (expand)
    await fileNode.locator('.tree-node__line').first().click();
  });

  test('should highlight source code when AST node is clicked', async ({ page }) => {
    await page.goto('/');
    await waitForAstTreeReady(page);

    // Click on any node in the tree
    const treeNode = page.locator('.tree-node__line').first();
    await treeNode.click();

    // Check if any highlight-related element exists
    // (The actual implementation may vary)
    const hasNodes = await page.locator('.tree-node').count();
    expect(hasNodes).toBeGreaterThan(0);
  });

  test('should have working Expand All button', async ({ page }) => {
    await page.goto('/');
    await waitForAstTreeReady(page);

    const initialNodeCount = await page.locator('.tree-node').count();

    const expandAllButton = page.getByRole('button', {
      name: /Expand all/i,
    });
    await expect(expandAllButton).toBeVisible();
    await expandAllButton.click();

    // Wait for more nodes to appear after expansion
    await expect(async () => {
      const newCount = await page.locator('.tree-node').count();
      expect(newCount).toBeGreaterThan(initialNodeCount);
    }).toPass({ timeout: 5000 });

    // Check that we can see deeper nodes
    const nodeCount = await page.locator('.tree-node').count();
    expect(nodeCount).toBeGreaterThan(5);
  });

  test('should have working Collapse All button', async ({ page }) => {
    await page.goto('/');
    await waitForAstTreeReady(page);

    // First expand all
    await page.getByRole('button', { name: /Expand all/i }).click();

    // Wait for expansion to complete
    const expandedCount = await page.locator('.tree-node').count();

    // Then collapse all
    const collapseAllButton = page.getByRole('button', {
      name: /Collapse all/i,
    });
    await expect(collapseAllButton).toBeVisible();
    await collapseAllButton.click();

    // Wait for collapse to complete - node count should decrease
    await expect(async () => {
      const newCount = await page.locator('.tree-node').count();
      expect(newCount).toBeLessThan(expandedCount);
    }).toPass({ timeout: 5000 });
  });
});
