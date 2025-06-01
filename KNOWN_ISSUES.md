# Known Issues

## Avatar Upload Visibility Bug 🐛

**Status**: In Progress  
**Priority**: Medium  
**Affects**: User profile avatar display

### Description

Avatar uploads are successful (files are stored in Supabase Storage and database is updated), but the uploaded image doesn't immediately become visible in the UI. Users see fallback initials instead of their uploaded avatar until hard refresh.

### Current Behavior

- ✅ File upload to Supabase Storage works
- ✅ Database `avatar_url` field is updated correctly
- ✅ Public URLs are accessible and return 200 OK
- ❌ Avatar image doesn't display in UI after upload
- ❌ Manual page refresh required to see new avatar

### Investigation Results

- Database contains correct URLs with cache-busting parameters
- Supabase Storage RLS policies are properly configured
- Event system and state management implemented
- Custom Avatar component with key-based re-rendering
- URL accessibility confirmed via curl

### Potential Causes

- React component lifecycle issues
- Next.js image caching/optimization conflicts
- Browser-specific caching behavior
- Timing issues between state updates and DOM rendering

### Workarounds

- Manual page refresh shows uploaded avatar correctly
- Avatar functionality works for subsequent sessions

### Next Steps

- Investigate Next.js Image component usage
- Test different browsers and devices
- Consider server-side rendering vs client-side rendering differences
- Implement more aggressive cache invalidation strategies

---

## Other Issues

_Document additional issues here as they arise_
