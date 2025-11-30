#!/bin/bash
set -e

VERSION=$(jq -r '.version' package.json)

if [ -z "$VERSION" ]; then
    echo "Error: Could not read version from package.json" >&2
    exit 1
fi

sed -i.bak "s/const VERSION = '[^']*'/const VERSION = '$VERSION'/" src/components/HeaderBar.svelte
rm -f src/components/HeaderBar.svelte.bak

sed -i.bak "s/toContainText('v[0-9]*\.[0-9]*\.[0-9]*')/toContainText('v$VERSION')/" e2e/basic.spec.ts
rm -f e2e/basic.spec.ts.bak

npm install --package-lock-only

echo "Updated version to $VERSION"
