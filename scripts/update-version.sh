#!/bin/bash
set -e

# When run by tagpr, TAGPR_NEXT_VERSION contains the version to be released (e.g., "v0.2.1")
# When run manually, fall back to reading from package.json
if [ -n "$TAGPR_NEXT_VERSION" ]; then
    # Remove 'v' prefix if present (e.g., "v0.2.1" -> "0.2.1")
    VERSION="${TAGPR_NEXT_VERSION#v}"
else
    VERSION=$(jq -r '.version' package.json)
fi

if [ -z "$VERSION" ]; then
    echo "Error: Could not determine version" >&2
    exit 1
fi

sed -i.bak "s/const VERSION = '[^']*'/const VERSION = '$VERSION'/" src/components/HeaderBar.svelte
rm -f src/components/HeaderBar.svelte.bak

sed -i.bak "s/toContainText('v[0-9]*\.[0-9]*\.[0-9]*')/toContainText('v$VERSION')/" e2e/basic.spec.ts
rm -f e2e/basic.spec.ts.bak

npm install --package-lock-only

echo "Updated version to $VERSION"
