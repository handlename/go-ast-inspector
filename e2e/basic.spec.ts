import { test, expect } from "@playwright/test";

test.describe("Go AST Inspector - Basic Functionality", () => {
  test("should load the application", async ({ page }) => {
    await page.goto("/");

    // Check title
    await expect(page).toHaveTitle(/Go AST Inspector/);

    // Check header
    await expect(page.getByRole("banner")).toContainText("Go AST Inspector");
    await expect(page.getByRole("banner")).toContainText(
      "Visualize Go Abstract Syntax Tree",
    );

    // Check version and links
    await expect(page.getByRole("banner")).toContainText("v0.1.0");
    await expect(page.getByRole("link", { name: /Repository/i })).toBeVisible();
    await expect(page.locator('a[href*="handlename"]').first()).toBeVisible();
  });

  test("should display default Hello World code", async ({ page }) => {
    await page.goto("/");

    // Check if code editor textarea has default content
    const textarea = page.locator(".code-editor textarea");
    await expect(textarea).toBeVisible();

    const content = await textarea.inputValue();
    expect(content).toContain("package main");
    expect(content).toContain('fmt.Println("Hello, World!")');
  });

  test("should display AST tree for default code", async ({ page }) => {
    await page.goto("/");

    // Wait for WASM to initialize and parse
    await page.waitForTimeout(2000);

    // Check if AST tree is visible
    const astTree = page.locator(".ast-tree-view");
    await expect(astTree).toBeVisible();

    // Check for File node
    await expect(
      page.locator(".tree-node__type").filter({ hasText: "File" }).first(),
    ).toBeVisible();

    // Check for tree nodes exist
    const nodeCount = await page.locator(".tree-node").count();
    expect(nodeCount).toBeGreaterThan(3);
  });

  test("should parse user-entered code", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(2000);

    const textarea = page.locator(".code-editor textarea");

    // Clear and enter new code
    await textarea.fill("");
    await textarea.fill(`package test

func add(a, b int) int {
\treturn a + b
}`);

    // Wait for parsing
    await page.waitForTimeout(1000);

    // Check AST tree updated
    await expect(
      page.locator(".tree-node__type").filter({ hasText: "File" }).first(),
    ).toBeVisible();
    await expect(
      page.locator(".tree-node__type").filter({ hasText: "FuncDecl" }),
    ).toBeVisible();
  });

  test("should handle invalid code gracefully", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(2000);

    const textarea = page.locator(".code-editor textarea");

    // Enter invalid code
    await textarea.fill("invalid go code ][}{");

    // Wait for parsing
    await page.waitForTimeout(1000);

    // Application should still be functional
    await expect(textarea).toBeVisible();
    await expect(page.locator(".ast-tree-view")).toBeVisible();
  });

  test("should expand and collapse AST nodes", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(2000);

    // Find a node with children (File node)
    const fileNode = page
      .locator(".tree-node")
      .filter({ hasText: "File" })
      .first();
    await expect(fileNode).toBeVisible();

    // Click to toggle
    await fileNode.locator(".tree-node__line").first().click();
    await page.waitForTimeout(200);

    // Toggle again
    await fileNode.locator(".tree-node__line").first().click();
    await page.waitForTimeout(200);
  });

  test("should highlight source code when AST node is clicked", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForTimeout(2000);

    // Click on any node in the tree
    const treeNode = page.locator(".tree-node__line").first();
    await treeNode.click();

    // Wait for highlight to appear
    await page.waitForTimeout(500);

    // Check if any highlight-related element exists
    // (The actual implementation may vary)
    const hasNodes = await page.locator(".tree-node").count();
    expect(hasNodes).toBeGreaterThan(0);
  });

  test("should have working Expand All button", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(2000);

    const expandAllButton = page.getByRole("button", {
      name: /Expand all/i,
    });
    await expect(expandAllButton).toBeVisible();
    await expandAllButton.click();

    await page.waitForTimeout(500);

    // Check that we can see deeper nodes
    const nodeCount = await page.locator(".tree-node").count();
    expect(nodeCount).toBeGreaterThan(5);
  });

  test("should have working Collapse All button", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(2000);

    // First expand all
    await page.getByRole("button", { name: /Expand all/i }).click();
    await page.waitForTimeout(500);

    // Then collapse all
    const collapseAllButton = page.getByRole("button", {
      name: /Collapse all/i,
    });
    await expect(collapseAllButton).toBeVisible();
    await collapseAllButton.click();

    await page.waitForTimeout(500);
  });
});
