# Troubleshooting Guide

## Common Problems & Solutions

### 🔴 Login/Authentication Issues

#### Problem: "User not found" error
**Symptoms**: Entered correct email but getting "User not found"
**Causes**:
- Email not registered yet
- Typo in email address
- Wrong case sensitivity

**Solutions**:
1. Double-check email spelling
2. Go to Sign Up page and create account with that email
3. Check DevTools → Local Storage → `sbf_users` to see registered emails
4. Email comparison is case-sensitive (alice@example.com ≠ Alice@example.com)

---

#### Problem: "Incorrect password" error
**Symptoms**: Email found but password rejected
**Causes**:
- Wrong password entered
- Caps Lock on
- Spaces in password field
- Password was changed

**Solutions**:
1. Check Caps Lock state
2. Verify no extra spaces in password field
3. Re-type password carefully
4. If forgotten, clear localStorage and sign up with new account

---

#### Problem: Stuck on login page after signup
**Symptoms**: Signed up successfully but redirected to login instead of home
**Causes**:
- Browser's back button cached the page
- JavaScript error in signup process
- localStorage quota exceeded

**Solutions**:
1. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
2. Clear browser cache
3. Check DevTools Console for errors (F12)
4. Check DevTools → Local Storage → Verify `sbf_current_user` exists

---

### 📄 Listing/Data Issues

#### Problem: Created listing but don't see it on Home page
**Symptoms**: Form submitted, got success message, but "Find Groups" shows nothing
**Causes**:
- Didn't click "Find Groups" button yet
- Listings not loading properly
- JavaScript error

**Solutions**:
1. Click "Find Groups" button in right card
2. Check DevTools → Local Storage → `sbf_listings` key
3. Open Console (F12) → check for errors in red
4. Refresh page (F5)
5. Clear cache and try again

---

#### Problem: Can't edit own listings
**Symptoms**: "Edit" button does nothing or form doesn't appear
**Causes**:
- JavaScript error
- Browser compatibility issue
- Listing data corrupted

**Solutions**:
1. Check DevTools Console for errors
2. Try different browser
3. Check DevTools → Local Storage → view listing data
4. Delete and recreate listing
5. Hard refresh (Ctrl+Shift+R)

---

#### Problem: Can see other users' listings but can't see own
**Symptoms**: Home page shows all groups, but Profile shows "No listings"
**Causes**:
- Listings created before profile page updated
- user_id mismatch in localStorage
- Browser localStorage desynchronized

**Solutions**:
1. Go to Home page and create a new listing
2. Go back to Profile → should appear now
3. Check DevTools → Local Storage → verify user_id matches in `sbf_current_user` and listings
4. Clear all localStorage and start fresh

---

#### Problem: Deleted listing but it's still showing
**Symptoms**: Confirmed deletion, but listing still appears
**Causes**:
- Page not refreshed after deletion
- Cache not cleared
- JavaScript error during deletion

**Solutions**:
1. Refresh page (F5)
2. Hard refresh (Ctrl+Shift+R)
3. Go to Home page → Find Groups → refresh
4. Check DevTools → Local Storage → verify listing gone from `sbf_listings`

---

### 💾 localStorage Issues

#### Problem: "localStorage is full" or quota exceeded
**Symptoms**: Can't save listings or profile
**Causes**:
- Browser localStorage is full (5-10MB limit)
- Too many old browser tabs with same data
- Browser storage permissions

**Solutions**:
1. Open DevTools → Application → Local Storage
2. Delete old unused keys
3. Clear entire storage (right-click → Clear)
4. Close other tabs using same site
5. Check browser storage permissions
6. Try Private/Incognito mode (has isolated storage)

---

#### Problem: Data not persisting after refresh
**Symptoms**: Created listing, refreshed page, data is gone
**Causes**:
- Private/Incognito mode doesn't persist
- Browser is in strict privacy mode
- localStorage disabled

**Solutions**:
1. Use normal (non-private) browser window
2. Check browser privacy settings
3. Check if localStorage is enabled (DevTools → Application → Local Storage)
4. Check browser permissions for the site
5. Try different browser

---

#### Problem: Different data in different tabs
**Symptoms**: Logged in as User A in Tab 1, User B in Tab 2, but seeing wrong data
**Causes**:
- This is EXPECTED! Each tab shares the same localStorage
- Last logged-in user overrides all tabs
- Need to use separate browser windows for different users

**Solutions**:
1. Use Private/Incognito window for different user (has separate storage)
2. Or use different browser entirely
3. Or close one tab and log in fresh
4. Remember: localStorage is shared across ALL tabs of same origin

---

### 🎨 Display/UI Issues

#### Problem: Page layout broken, buttons misaligned
**Symptoms**: Elements overlapping, text cut off, weird spacing
**Causes**:
- CSS not loaded
- Browser cache issue
- JavaScript not loaded
- Incompatible browser

**Solutions**:
1. Hard refresh (Ctrl+Shift+R)
2. Clear browser cache
3. Check DevTools → Network → All files loaded (green checkmarks)
4. Try different browser
5. Check DevTools → Console for CSS errors

---

#### Problem: Buttons don't respond to clicks
**Symptoms**: Click button, nothing happens
**Causes**:
- JavaScript not loaded
- JavaScript error
- Form validation failing silently

**Solutions**:
1. Check DevTools → Console for errors
2. Hard refresh page
3. Check all form fields are filled
4. Try right-click → Inspect → check element (should say `<button>`)
5. Restart browser

---

#### Problem: Message doesn't appear after form submit
**Symptoms**: Clicked button, form cleared, but no "success" message
**Causes**:
- Message appears and auto-hides quickly (3 seconds)
- JavaScript error
- Message styling hidden

**Solutions**:
1. Watch carefully after clicking - may disappear quickly
2. Check DevTools → Console for errors
3. Create fresh account and try again
4. Check localStorage to verify data was saved (success didn't show message, but data saved)

---

### 👥 Multi-User Issues

#### Problem: Can't test multiple users
**Symptoms**: Signed up User A, want to test User B, but can't
**Causes**:
- Don't know how to isolate users
- Shared localStorage between tabs confuses testing

**Solutions**:
1. Use Private/Incognito window:
   - User A: Normal window
   - User B: Private window (Ctrl+Shift+N or Cmd+Shift+N)
   - Each has separate localStorage
2. Or use different browsers:
   - User A: Chrome
   - User B: Firefox
   - Each has separate storage
3. Manual testing in DevTools:
   - Create user in localStorage
   - Change `sbf_current_user` to test as different user

---

#### Problem: Both users seeing same data
**Symptoms**: User A and User B see identical listings
**Causes**:
- This is CORRECT! All users should see all listings
- But should only be able to edit own listings

**Solutions**:
1. This is the intended behavior
2. Check that only each user's own listings have Edit/Delete buttons
3. Try to edit other user's listing - should not have those buttons
4. If you can edit other user's listing, that's a bug

---

### 🔐 Security/Validation Issues

#### Problem: Can sign up with invalid email
**Symptoms**: "notanemail" accepted as valid email
**Causes**:
- Browser input validation not strict enough
- No server-side validation (expected for demo)

**Solutions**:
1. This is demo/test mode - not validating like production
2. For testing: use real-looking emails (email@domain.com)
3. Will be fixed in production with server validation

---

#### Problem: Can sign up with password less than 6 characters
**Symptoms**: Accepted "123" as password
**Causes**:
- JavaScript validation not working
- Client-side only (no server check)

**Solutions**:
1. Check DevTools → Console for JavaScript errors
2. Hard refresh page
3. Password should show error: "Password must be at least 6 characters"
4. Try again with 6+ character password

---

### 🔗 Navigation Issues

#### Problem: Logout doesn't work, still logged in
**Symptoms**: Clicked Logout, redirected to login, but back button shows you're still logged in
**Causes**:
- Browser back button shows cached page
- Session not properly cleared
- localStorage not cleared

**Solutions**:
1. Hard refresh (Ctrl+Shift+R) after logout
2. Check DevTools → Local Storage → `sbf_current_user` should be gone
3. Clear browser cache
4. Manually delete `sbf_current_user` in DevTools
5. Restart browser

---

#### Problem: Clicking Profile/Home buttons in navigation doesn't work
**Symptoms**: Buttons exist but clicking does nothing
**Causes**:
- onclick attribute not working
- JavaScript error
- Link issue

**Solutions**:
1. Right-click button → Inspect → check onclick attribute exists
2. Check DevTools → Console for errors
3. Hard refresh page
4. Check if button is actually clickable (test other buttons first)

---

### 🐛 Browser-Specific Issues

#### Chrome Issues
**Problem**: Works in Firefox but not Chrome
**Solutions**:
1. Clear Chrome cache (Ctrl+Shift+Delete)
2. Disable Chrome extensions
3. Try Incognito mode
4. Update Chrome

#### Firefox Issues
**Problem**: Works in Chrome but not Firefox
**Solutions**:
1. Check Firefox privacy settings
2. Enable localStorage if disabled
3. Clear Firefox cache
4. Try Private Browsing mode

#### Safari Issues
**Problem**: Works on PC but not Mac Safari
**Solutions**:
1. Enable localStorage in Safari Preferences
2. Allow local file access
3. Try Private Browsing
4. Update Safari

---

## How to Debug

### Step 1: Open Developer Tools
- **Windows/Linux**: Press F12
- **Mac**: Press Cmd+Option+I
- **Or**: Right-click page → Inspect

### Step 2: Check Console Tab
- Look for red error messages
- Read the error carefully
- Note line numbers where errors occur

### Step 3: Check Local Storage
- Go to **Application** tab (or **Storage** in Firefox)
- Click **Local Storage**
- Select your site
- You'll see:
  - `sbf_users` - All users array
  - `sbf_current_user` - Logged-in user
  - `sbf_listings` - All listings
- Click on values to see full content
- You can edit/delete directly here!

### Step 4: Check Network Tab
- Reload page
- Should see:
  - index.html
  - home.html / profile.html
  - home.js / profile.js
  - style.css
  - font file
- All should be ✅ (green) with status 200
- No 404 or 500 errors

### Step 5: Check Elements Tab
- Right-click on element → Inspect
- Check if HTML structure looks right
- Check if CSS is applied
- Look for visibility: hidden or display: none

---

## Getting Help

### Checklist Before Reporting Issue:
- [ ] Hard refresh (Ctrl+Shift+R)
- [ ] Clear browser cache
- [ ] Check DevTools Console for errors
- [ ] Check DevTools Local Storage
- [ ] Try different browser
- [ ] Try in Private/Incognito window
- [ ] Try in different window/tab
- [ ] Restart browser
- [ ] Restart computer
- [ ] Check all required form fields filled
- [ ] Check spelling in email/password

### When Reporting Issue, Include:
1. Steps to reproduce
2. What you expected to happen
3. What actually happened
4. Browser type and version
5. Error messages from Console
6. Screenshot of issue
7. LocalStorage data (if relevant)

---

## Reset Everything

If everything is broken and you want to start fresh:

### Option 1: Clear LocalStorage Only
1. Open DevTools (F12)
2. Go to Application → Local Storage
3. Right-click your site → Clear
4. Refresh page
5. App resets - sign up fresh

### Option 2: Clear Everything
1. Open DevTools
2. Go to Application
3. Click **Storage** section
4. Bottom left: **Clear site data**
5. Check all boxes
6. Click **Clear**
7. Restart browser
8. Start fresh

### Option 3: Nuclear Option
1. Completely uninstall browser
2. Restart computer
3. Reinstall browser
4. Open app fresh
5. (This is overkill but guaranteed to work!)

---

## Performance Issues

#### Problem: App is slow, lagging
**Causes**:
- Too many listings (1000+)
- Browser running slowly
- Other CPU-intensive apps

**Solutions**:
1. Close other browser tabs
2. Restart browser
3. Delete some old listings to reduce data size
4. Try different browser
5. Check if other apps using 100% CPU

---

## Still Having Issues?

1. **Re-read** this troubleshooting guide
2. **Check** all files are modified correctly
3. **Review** TESTING_GUIDE.md for expected behavior
4. **Compare** your setup with QUICK_REFERENCE.md
5. **Study** ARCHITECTURE.md to understand data flow
6. **Check** browser console for specific error messages
7. **Try** all solutions above systematically
8. **Ask** for help with specific error message

---

Remember: This is a demo/test app using localStorage. It's not meant for production. Focus on learning how it works rather than treating it as production-ready!
