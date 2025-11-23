import { test, expect } from "@playwright/test";

test.describe("Go AST Viewer - Basic Functionality", () => {
  test("should load the application", async ({ page }) => {
    await page.goto("/");

    // Check title
    await expect(page).toHaveTitle(/Go AST Viewer/);

    // Check header
    await expect(page.getByRole("banner")).toContainText("Go AST Viewer");
    await expect(page.getByRole("banner")).toContainText(
      "Visualize Go Abstract Syntax Tree",
    );

    // Check version, repository, and author links
    await expect(page.getByRole("banner")).toContainText("v0.1.0");
    await expect(
      page.getByRole("link", { name: "Repository" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "@handlename" }),
    ).toBeVisible();
  });

  test("should display default Hello World code", async ({ page }) => {
    await page.goto("/");

    // Check if code editor has default content
    const textarea = page.getByRole("textbox", {
      name: /Go source code editor/i,
    });
    await expect(textarea).toBeVisible();

    const content = await textarea.inputValue();
    expect(content).toContain("package main");
    expect(content).toContain('fmt.Println("Hello, World!")');
  });

  test("should display AST tree for default code", async ({ page }) => {
    await page.goto("/");

    // Wait for WASM to initialize and parse
    await page.waitForTimeout(1000);

    // Check if AST tree is visible
    const astTree = page.getByRole("tree");
    await expect(astTree).toBeVisible();

    // Check for File node
    await expect(page.getByText("File", { exact: true })).toBeVisible();

    // Check for package declaration
    await expect(page.getByText(/Ident.*main/)).toBeVisible();
  });

  test("should parse user-entered code", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(1000);

    const textarea = page.getByRole("textbox", {
      name: /Go source code editor/i,
    });

    // Clear and enter new code
    await textarea.fill("");
    await textarea.fill(`package test

func add(a, b int) int {
\treturn a + b
}`);

    // Wait for parsing
    await page.waitForTimeout(500);

    // Check AST tree updated
    await expect(page.getByText("File", { exact: true })).toBeVisible();
    await expect(page.getByText(/FuncDecl/)).toBeVisible();
  });

  test("should show error for invalid code", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(1000);

    const textarea = page.getByRole("textbox", {
      name: /Go source code editor/i,
    });

    // Enter invalid code
    await textarea.fill("invalid go code ][}{");

    // Wait for parsing
    await page.waitForTimeout(500);

    // Check for error display
    const errorDisplay = page.locator(".error-display");
    await expect(errorDisplay).toBeVisible();
  });

  test("should expand and collapse AST nodes", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(1000);

    // Find a node with children (File node)
    const fileNode = page
      .getByRole("treeitem")
      .filter({ hasText: "File" })
      .first();
    await expect(fileNode).toBeVisible();

    // Initially should be collapsed or expanded - just toggle it
    await fileNode.click();
    await page.waitForTimeout(200);

    // Toggle again
    await fileNode.click();
    await page.waitForTimeout(200);
  });

  test("should highlight source code when AST node is clicked", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForTimeout(1000);

    // Click on an Ident node in the tree
    const identNode = page
      .getByRole("treeitem")
      .filter({ hasText: /Ident.*main/ })
      .first();
    await identNode.click();

    // Check if highlight is visible
    const highlight = page.locator(".highlight-line");
    await expect(highlight).toBeVisible();
  });

  test("should have working Expand All button", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(1000);

    const expandAllButton = page.getByRole("button", {
      name: /Expand all/i,
    });
    await expect(expandAllButton).toBeVisible();
    await expandAllButton.click();

    await page.waitForTimeout(200);

    // Check that nodes are expanded (aria-expanded should be true)
    const expandedNodes = page.locator('[aria-expanded="true"]');
    await expect(expandedNodes.first()).toBeVisible();
  });

  test("should have working Collapse All button", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(1000);

    // First expand all
    await page.getByRole("button", { name: /Expand all/i }).click();
    await page.waitForTimeout(200);

    // Then collapse all
    const collapseAllButton = page.getByRole("button", {
      name: /Collapse all/i,
    });
    await expect(collapseAllButton).toBeVisible();
    await collapseAllButton.click();

    await page.waitForTimeout(200);
  });
});
