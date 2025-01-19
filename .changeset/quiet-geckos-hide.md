---
"dev-vogat-v1": patch
---

chore: Enhance GitHub Actions workflow to create releases

- Added a step to create GitHub releases upon successful publication of changesets.
- Configured the workflow to use the GITHUB_TOKEN for authentication.
- Updated the release job to include release notes from CHANGELOG.md.