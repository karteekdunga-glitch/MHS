## Packages
date-fns | For formatting dates nicely in announcements and events

## Notes
- Images are primarily handled via URL strings in the database. For the demo, Unsplash placeholders are used.
- The Admin panel is protected by Firebase-like session auth (implemented via Express sessions in the backend).
- The public site fetches only 'published' records by appending `?status=published` to list endpoints.
