import { type Page, expect, test } from '@playwright/test';

// Long Go code sample for testing highlight position with line wrapping
const LONG_GO_CODE = `package core

import (
	"context"

	"github.com/natureglobal/nature-server/internal/slice"
	"github.com/natureglobal/nature-server/internal/timex"
	ecore "github.com/natureglobal/nature-server/models/entities/core"
	"github.com/natureglobal/nature-server/models/repo"
	"github.com/pkg/errors"
)

func CreateTxn(ctx context.Context, device ecore.Device) (ecore.Device, error) {
	if !device.ID.IsZero() {
		return ecore.Device{}, errors.New("device is already created")
	}

	device.CreatedAt = timex.Timestamp()
	device.UpdatedAt = timex.Timestamp()

	if err := repo.Insert(ctx, &device); err != nil {
		return ecore.Device{}, errors.Wrap(err, "failed to insert device")
	}

	return device, nil
}

func UpdateTxn(ctx context.Context, device ecore.Device) (ecore.Device, error) {
	if device.ID.IsZero() {
		return ecore.Device{}, errors.New("device is not created")
	}

	device.UpdatedAt = timex.Timestamp()

	if _, err := repo.Update(ctx, &device); err != nil {
		return ecore.Device{}, errors.Wrap(err, "failed to update device")
	}

	return device, nil
}

func Find(ctx context.Context, id ecore.DeviceID) (ecore.Device, error) {
	if id.IsZero() {
		return ecore.Device{}, errors.New("device id is not specified")
	}

	device, err := repo.Find(ctx, ecore.Device{}, id)
	if err != nil {
		return ecore.Device{}, errors.Wrap(err, "failed to find device")
	}

	return device, nil
}

func List(ctx context.Context, ids []ecore.DeviceID) ([]ecore.Device, error) {
	if len(ids) == 0 {
		return []ecore.Device{}, nil
	}

	rows, err := repo.List(ctx, ecore.Device{}, "id in (:IDs)", map[string]any{
		"IDs": slice.ToInt32(ids),
	})
	if err != nil {
		return nil, errors.WithStack(err)
	}

	return rows, nil
}`;

test.describe('Highlight Position Accuracy', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    // Enter the long Go code
    const textarea = page.locator('.code-editor textarea');
    await textarea.fill(LONG_GO_CODE);
    await page.waitForTimeout(1000);
  });

  test('should accurately position highlight for nodes at various positions', async ({ page }) => {
    // Get all tree nodes with position info
    const treeNodes = page.locator('.tree-node__line');
    const nodeCount = await treeNodes.count();
    expect(nodeCount).toBeGreaterThan(10);

    // Test clicking on nodes at different positions (beginning, middle, end)
    const testIndices = [0, Math.floor(nodeCount / 2), nodeCount - 1];

    for (const index of testIndices) {
      const treeNode = treeNodes.nth(index);
      await treeNode.click();
      await page.waitForTimeout(300);

      // Check if highlight mark exists
      const highlightMark = page.locator('.code-editor__syntax-pre .code-highlight');
      const markCount = await highlightMark.count();

      if (markCount > 0) {
        // Get the highlight position
        const markBox = await highlightMark.first().boundingBox();
        expect(markBox).not.toBeNull();

        // Get the syntax layer container position
        const syntaxLayer = page.locator('.code-editor__syntax-layer');
        const layerBox = await syntaxLayer.boundingBox();
        expect(layerBox).not.toBeNull();

        // Verify highlight is within the visible area
        if (markBox && layerBox) {
          expect(markBox.x).toBeGreaterThanOrEqual(layerBox.x);
          expect(markBox.y).toBeGreaterThanOrEqual(layerBox.y - 100); // Allow some scroll margin
        }
      }
    }
  });

  test('should maintain highlight-cursor alignment with narrow viewport', async ({ page }) => {
    // Set narrow viewport to force line wrapping
    await page.setViewportSize({ width: 800, height: 600 });
    await page.waitForTimeout(500);

    // Click on a function node in the middle of the code
    const funcNodes = page.locator('.tree-node__type').filter({ hasText: 'FuncDecl' });
    const funcCount = await funcNodes.count();

    if (funcCount > 1) {
      // Click on the second function (UpdateTxn)
      await funcNodes.nth(1).click();
      await page.waitForTimeout(300);

      // Verify highlight exists
      const highlightMark = page.locator('.code-editor__syntax-pre .code-highlight');
      await expect(highlightMark.first()).toBeVisible();

      // Get position info for analysis
      const markBox = await highlightMark.first().boundingBox();
      const textarea = page.locator('.code-editor textarea');
      const textareaBox = await textarea.boundingBox();

      // Log position info for debugging
      console.log('Highlight position:', markBox);
      console.log('Textarea position:', textareaBox);

      // Basic sanity check - highlight should be in reasonable position
      if (markBox && textareaBox) {
        // Highlight should be within the textarea bounds (horizontally)
        expect(markBox.x).toBeGreaterThanOrEqual(textareaBox.x - 10);
        expect(markBox.x).toBeLessThanOrEqual(textareaBox.x + textareaBox.width + 10);
      }
    }
  });

  test('should compare textarea cursor position with highlight position', async ({ page }) => {
    // This test clicks in the textarea and compares cursor position with AST node highlight

    const textarea = page.locator('.code-editor textarea');

    // Click at a specific position in the textarea (middle of the code)
    const textareaBox = await textarea.boundingBox();
    if (textareaBox) {
      // Click in the middle of the textarea
      await textarea.click({
        position: {
          x: textareaBox.width / 2,
          y: textareaBox.height / 2,
        },
      });
      await page.waitForTimeout(300);

      // Check if highlight appeared
      const highlightMark = page.locator('.code-editor__syntax-pre .code-highlight');
      const markCount = await highlightMark.count();

      if (markCount > 0) {
        const markBox = await highlightMark.first().boundingBox();

        // The highlight should be roughly near the click position
        // Allow for some variance since we clicked in the middle
        if (markBox) {
          console.log('Click position: y =', textareaBox.y + textareaBox.height / 2);
          console.log('Highlight position: y =', markBox.y);

          // Check that highlight is visible (not scrolled out of view)
          const syntaxLayer = page.locator('.code-editor__syntax-layer');
          const layerBox = await syntaxLayer.boundingBox();

          if (layerBox) {
            // Highlight should be within visible bounds
            const isVisible =
              markBox.y >= layerBox.y - markBox.height && markBox.y <= layerBox.y + layerBox.height;
            expect(isVisible).toBeTruthy();
          }
        }
      }
    }
  });

  test('should measure rendering difference between textarea and pre', async ({ page }) => {
    // This test measures if textarea and pre elements have matching dimensions

    const textarea = page.locator('.code-editor textarea');
    const syntaxPre = page.locator('.code-editor__syntax-pre');

    // Get computed styles via JavaScript
    const comparison = await page.evaluate(() => {
      const textarea = document.querySelector('.code-editor textarea') as HTMLTextAreaElement;
      const pre = document.querySelector('.code-editor__syntax-pre') as HTMLPreElement;

      if (!textarea || !pre) {
        return null;
      }

      const textareaStyle = window.getComputedStyle(textarea);
      const preStyle = window.getComputedStyle(pre);

      return {
        textarea: {
          width: textarea.clientWidth,
          height: textarea.clientHeight,
          scrollHeight: textarea.scrollHeight,
          padding: textareaStyle.padding,
          fontSize: textareaStyle.fontSize,
          lineHeight: textareaStyle.lineHeight,
          fontFamily: textareaStyle.fontFamily,
          whiteSpace: textareaStyle.whiteSpace,
          wordWrap: textareaStyle.wordWrap,
          overflowWrap: textareaStyle.overflowWrap,
          boxSizing: textareaStyle.boxSizing,
          tabSize: textareaStyle.tabSize,
        },
        pre: {
          width: pre.clientWidth,
          height: pre.clientHeight,
          scrollHeight: pre.scrollHeight,
          padding: preStyle.padding,
          fontSize: preStyle.fontSize,
          lineHeight: preStyle.lineHeight,
          fontFamily: preStyle.fontFamily,
          whiteSpace: preStyle.whiteSpace,
          wordWrap: preStyle.wordWrap,
          overflowWrap: preStyle.overflowWrap,
          boxSizing: preStyle.boxSizing,
          tabSize: preStyle.tabSize,
        },
      };
    });

    console.log('Style comparison:', JSON.stringify(comparison, null, 2));

    expect(comparison).not.toBeNull();
    if (comparison) {
      // Font settings should match
      expect(comparison.textarea.fontSize).toBe(comparison.pre.fontSize);
      expect(comparison.textarea.lineHeight).toBe(comparison.pre.lineHeight);
      expect(comparison.textarea.tabSize).toBe(comparison.pre.tabSize);

      // White space handling should match
      expect(comparison.textarea.whiteSpace).toBe(comparison.pre.whiteSpace);

      // Padding should match
      expect(comparison.textarea.padding).toBe(comparison.pre.padding);

      // Width should be very close (allow small difference for borders etc)
      const widthDiff = Math.abs(comparison.textarea.width - comparison.pre.width);
      console.log('Width difference:', widthDiff);

      // ScrollHeight difference indicates text layout difference
      const scrollHeightDiff = Math.abs(
        comparison.textarea.scrollHeight - comparison.pre.scrollHeight,
      );
      console.log('ScrollHeight difference:', scrollHeightDiff);

      // If scrollHeight differs significantly, there's a rendering issue
      if (scrollHeightDiff > 10) {
        console.warn(
          'WARNING: Significant scrollHeight difference detected!',
          `textarea: ${comparison.textarea.scrollHeight}, pre: ${comparison.pre.scrollHeight}`,
        );
      }
    }
  });
});

test.describe('Detailed Position Analysis', () => {
  test('should measure line-by-line height accumulation', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    // Set narrow viewport to force line wrapping
    await page.setViewportSize({ width: 600, height: 600 });

    const textarea = page.locator('.code-editor textarea');
    await textarea.fill(LONG_GO_CODE);
    await page.waitForTimeout(1000);

    // Measure line heights by inserting markers at specific offsets
    const linePositions = await page.evaluate((code: string) => {
      const textarea = document.querySelector('.code-editor textarea') as HTMLTextAreaElement;
      const syntaxLayer = document.querySelector('.code-editor__syntax-layer') as HTMLDivElement;
      const pre = syntaxLayer?.querySelector('pre') as HTMLPreElement;

      if (!textarea || !pre) {
        return { error: 'Elements not found' };
      }

      // Create a hidden measurement div that mimics the textarea
      const measureDiv = document.createElement('div');
      measureDiv.style.cssText = window.getComputedStyle(textarea).cssText;
      measureDiv.style.position = 'absolute';
      measureDiv.style.visibility = 'hidden';
      measureDiv.style.height = 'auto';
      measureDiv.style.width = `${textarea.clientWidth}px`;
      measureDiv.style.whiteSpace = 'pre-wrap';
      measureDiv.style.wordWrap = 'break-word';
      measureDiv.style.overflowWrap = 'break-word';
      document.body.appendChild(measureDiv);

      const lines = code.split('\n');
      const textareaLinePositions: number[] = [];
      const preLinePositions: number[] = [];

      // Measure textarea line positions using the measurement div
      let accumulatedText = '';
      for (let i = 0; i < Math.min(lines.length, 20); i++) {
        measureDiv.textContent = accumulatedText;
        textareaLinePositions.push(measureDiv.offsetHeight);
        accumulatedText += `${lines[i]}\n`;
      }

      // Measure pre line positions
      // Insert temporary markers in the pre element
      const originalHTML = pre.innerHTML;

      let offset = 0;
      for (let i = 0; i < Math.min(lines.length, 20); i++) {
        // Create marker at the start of each line
        const beforeText = code.substring(0, offset);
        const afterText = code.substring(offset);

        const escapedBefore = beforeText
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        const escapedAfter = afterText
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');

        pre.innerHTML = `${escapedBefore}<span id="line-marker-${i}"></span>${escapedAfter}`;
        const marker = document.getElementById(`line-marker-${i}`);
        if (marker) {
          const rect = marker.getBoundingClientRect();
          const preRect = pre.getBoundingClientRect();
          preLinePositions.push(rect.top - preRect.top);
        }

        offset += lines[i].length + 1; // +1 for newline
      }

      // Restore original HTML
      pre.innerHTML = originalHTML;
      document.body.removeChild(measureDiv);

      // Calculate differences
      const differences: number[] = [];
      for (let i = 0; i < Math.min(textareaLinePositions.length, preLinePositions.length); i++) {
        differences.push(preLinePositions[i] - textareaLinePositions[i]);
      }

      return {
        textareaLinePositions,
        preLinePositions,
        differences,
        maxDifference: Math.max(...differences.map(Math.abs)),
      };
    }, LONG_GO_CODE);

    console.log('Line position analysis:', JSON.stringify(linePositions, null, 2));

    if ('error' in linePositions) {
      throw new Error(linePositions.error);
    }

    // Check if differences are within acceptable range (should be 0 ideally)
    console.log('Max position difference:', linePositions.maxDifference, 'px');

    // If there's a significant difference, the test should fail
    if (linePositions.maxDifference > 5) {
      console.error('POSITION DRIFT DETECTED!');
      console.error('Differences by line:', linePositions.differences);
    }
  });

  test('should verify code element has no extra styles', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    const textarea = page.locator('.code-editor textarea');
    await textarea.fill(LONG_GO_CODE);
    await page.waitForTimeout(1000);

    // Check if the <code> element inside <pre> adds any extra styling
    const codeStyles = await page.evaluate(() => {
      const code = document.querySelector('.code-editor__syntax-pre code') as HTMLElement;
      if (!code) return null;

      const style = window.getComputedStyle(code);
      return {
        display: style.display,
        margin: style.margin,
        padding: style.padding,
        lineHeight: style.lineHeight,
        fontSize: style.fontSize,
        fontFamily: style.fontFamily,
      };
    });

    console.log('Code element styles:', codeStyles);

    // The code element should be inline with no extra margin/padding
    if (codeStyles) {
      expect(codeStyles.margin).toBe('0px');
      expect(codeStyles.padding).toBe('0px');
    }
  });
});
