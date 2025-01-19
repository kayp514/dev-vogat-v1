---
"dev-vogat-v1": patch
---

chore: Update version command in package.json and enhance GitHub Actions release workflow

- Changed the "version-packages" script to "version" in package.json for clarity.
- Modified the GitHub Actions workflow to trigger releases on both push and closed pull request events.
- Improved the release creation step to use the latest tag and include changelog notes.