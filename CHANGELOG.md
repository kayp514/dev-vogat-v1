# dev-vogat-v1

## 1.3.0

### Minor Changes

- cc28ee8: feat: Add call maximization state and remove unused ChatUser component

  - Introduced a new state variable `isMaximized` in `AppLayout` to manage call maximization.
  - Updated layout classes to utilize the new `isMaximized` state for dynamic styling.
  - Removed the unused `ChatUser` component to clean up the codebase.

## 1.2.2

### Patch Changes

- 76e6b03: chore: Remove NODE_AUTH_TOKEN from GitHub Actions workfloww

  - Removed NODE_AUTH_TOKEN from the release workflow to streamline environment variables and enhance security.

## 1.2.1

### Patch Changes

- 45b54d1: chore: Update changeset configuration and enhance GitHub Actions workflow

  - Changed access level in changeset config from 'restricted' to 'public'.
  - Added experimental option for updating internal dependents in changeset config.
  - Removed obsolete flat-shoes-join changeset markdown file.
  - Enhanced GitHub Actions workflow to include token for npm registry and retrieve version dynamically for GitHub releases.

## 1.2.0

### Minor Changes

- b53aa35: Feat(callui): Refactor Call and Participant Components for Improved UI and Functionality

  - Removed userData and onCall props from the Page component, simplifying its structure.
  - Enhanced CallUI with new state management for grid view and self-view minimization.
  - Updated layout and styling for better responsiveness and user experience.
  - Improved ParticipantScreen to handle fullscreen toggling and video display more effectively.
  - Standardized component imports and cleaned up unused code for better maintainability.

## 1.1.4

### Patch Changes

- 99f9d0d: chore: Correct comment formatting for reconnection attempts

  Correct comment formatting for reconnection attempt

## 1.1.3

### Patch Changes

- 99f9d0d: chore: Update version command in package.json and enhance GitHub Actions release workflow

  - Changed the "version-packages" script to "version" in package.json for clarity.
  - Modified the GitHub Actions workflow to trigger releases on both push and closed pull request events.
  - Improved the release creation step to use the latest tag and include changelog notes.

## 1.1.2

### Patch Changes

- 99f9d0d: chore: Enhance GitHub Actions workflow to create releases

  - Added a step to create GitHub releases upon successful publication of changesets.
  - Configured the workflow to use the GITHUB_TOKEN for authentication.
  - Updated the release job to include release notes from CHANGELOG.md.

## 1.1.1

### Patch Changes

- 99f9d0d: fix(participant): Safeguard against undefined participant name in AvatarFallback

  - Add null checks for participant properties
  - Add fallback value 'U' for undefined names
  - Add proper alt text for avatar images
  - Improve type safety for Participant interface
  - Add safe access to name characters with optional chaining
  - Ensure proper initialization of participant data
  - Fix TypeError related to toUpperCase() on undefined name

## 1.1.0

### Minor Changes

- 8e5f55f: feat(call): Redesign call UI and enhance participant management

  - Redesign call interface with full-screen callee and floating caller window
  - Implement new participant layout with improved visual hierarchy
  - Add smooth transitions and hover effects for better user experience
  - Enhance call controls accessibility and visibility
  - Optimize scroll behavior for better performance
  - Add responsive design for various screen sizes

  BREAKING CHANGE: Previous grid-based participant layout has been replaced with a new full-screen + overlay design

### Patch Changes

- 99f9d0d: feat(config): Configure changesets for automated versioning

  - Set up automated version management with changesets
  - Configure changelog generation
  - Enable automated PR creation for version updates
  - Set baseBranch to 'main' for release workflow
  - Configure internal dependency updates to use patch versioning
