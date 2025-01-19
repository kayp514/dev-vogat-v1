---
"@your-package-name": patch
---

fix(call): Handle undefined calleeInfo in CallUI component

- Add null checks for calleeInfo properties
- Implement fallback values for name and avatar
- Fix TypeError related to toUpperCase() on undefined name
- Improve type safety for UserInfo interface
- Add graceful degradation for missing user data