---
"dev-vogat-v1": patch
---

fix(participant): Safeguard against undefined participant name in AvatarFallback

- Add null checks for participant properties
- Add fallback value 'U' for undefined names
- Add proper alt text for avatar images
- Improve type safety for Participant interface
- Add safe access to name characters with optional chaining
- Ensure proper initialization of participant data
- Fix TypeError related to toUpperCase() on undefined name