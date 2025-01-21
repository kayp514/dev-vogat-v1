---
"dev-vogat-v1": patch
---

chore: Update GitHub Actions workflow for release process

- Renamed the step for creating a release pull request to "Apply changesets" for clarity.
- Added debugging steps to output changeset and version information during the release process.
- Updated the method of passing the version to the GitHub release step to use environment variables instead of outputs.
