#!/bin/bash
set -e

VERSION=$(jq -r '.version' package.json)

if [ -z "$VERSION" ]; then
    echo "Error: Could not read version from package.json" >&2
    exit 1
fi

sed -i "s/const VERSION = '[^']*'/const VERSION = '$VERSION'/" src/components/HeaderBar.svelte

sed -i "s/toContainText('v[0-9]*\.[0-9]*\.[0-9]*')/toContainText('v$VERSION')/" e2e/basic.spec.ts

npm install --package-lock-only

echo "Updated version to $VERSION"
