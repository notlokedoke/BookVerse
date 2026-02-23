# Testing Google Books Image Integration

## Quick Test Guide

Follow these steps to verify the Google Books image integration is working correctly:

### Test 1: Create Book Listing with ISBN Lookup (No Manual Upload)

1. **Navigate to Create Book Listing**
   - Go to `/create-book` or click "List a Book" in the navigation

2. **Enter ISBN**
   - Enter a valid ISBN: `9780743273565` (The Great Gatsby)
   - Or try: `9780061120084` (To Kill a Mockingbird)
   - Or try: `9780451524935` (1984 by George Orwell)

3. **Click "Lookup" Button**
   - Wait for the API response
   - Verify that:
     - ✅ Title is filled: "The Great Gatsby"
     - ✅ Author is filled: "F. Scott Fitzgerald"
     - ✅ Publisher is filled
     - ✅ Publication year is filled
     - ✅ Description is filled
     - ✅ **Book cover image appears in the preview**
     - ✅ Message shows: "✓ Using cover image from Google Books"

4. **Fill Required Fields**
   - Select Condition (e.g., "Good")
   - Select Genre (e.g., "Fiction")

5. **Submit Form WITHOUT Uploading Image**
   - Click "Create Listing"
   - Verify:
     - ✅ Form submits successfully
     - ✅ No error about missing image
     - ✅ Success message appears
     - ✅ Redirects to profile page

6. **Check the Created Listing**
   - Go to your profile or "My Books"
   - Verify:
     - ✅ Book appears in your listings
     - ✅ **Google Books cover image is displayed**
     - ✅ All book details are correct

### Test 2: Override Google Books Image with Custom Upload

1. **Start New Listing**
   - Go to Create Book Listing page

2. **Use ISBN Lookup**
   - Enter ISBN: `9780743273565`
   - Click "Lookup"
   - Verify Google Books image loads

3. **Upload Custom Image**
   - Click "Choose File" in Book Photo section
   - Select your own image
   - Verify:
     - ✅ Preview changes to your uploaded image
     - ✅ Message changes to normal upload message

4. **Submit Form**
   - Fill required fields
   - Click "Create Listing"
   - Verify:
     - ✅ Your custom image is used (not Google Books image)

### Test 3: Create Listing Without ISBN (Manual Upload Required)

1. **Start New Listing**
   - Go to Create Book Listing page

2. **Fill Fields Manually**
   - Enter title, author, condition, genre
   - Do NOT enter ISBN
   - Do NOT upload image

3. **Try to Submit**
   - Click "Create Listing"
   - Verify:
     - ✅ Error appears: "Book photo is required. Upload an image or use ISBN lookup."
     - ✅ Form does not submit

4. **Upload Image**
   - Upload an image file
   - Submit form
   - Verify:
     - ✅ Form submits successfully

### Test 4: ISBN with No Image Available

Some ISBNs might not have images in Google Books:

1. **Try an Obscure ISBN**
   - Enter an ISBN that might not have an image
   - Click "Lookup"
   - If no image is returned:
     - ✅ Book details still fill in
     - ✅ No image preview appears
     - ✅ You must upload an image manually

### Expected Behavior Summary

| Scenario | ISBN Lookup | Image Upload | Result |
|----------|-------------|--------------|--------|
| ISBN with image | ✅ Yes | ❌ No | ✅ Uses Google Books image |
| ISBN with image | ✅ Yes | ✅ Yes | ✅ Uses uploaded image |
| ISBN without image | ✅ Yes | ❌ No | ❌ Error: Image required |
| No ISBN | ❌ No | ✅ Yes | ✅ Uses uploaded image |
| No ISBN | ❌ No | ❌ No | ❌ Error: Image required |

## Common Issues and Solutions

### Issue: "Image is required" error even after ISBN lookup

**Cause**: The ISBN might not have an image in Google Books database

**Solution**: 
- Try a different, more popular ISBN
- Or upload an image manually

### Issue: Image preview not showing after ISBN lookup

**Possible causes**:
1. Google Books API didn't return an image for that ISBN
2. Network error during API call
3. Image URL is invalid

**Check**:
- Open browser console (F12)
- Look for any error messages
- Check if the API response includes a `thumbnail` field

### Issue: Form still requires file upload

**Cause**: The validation logic might not be updated

**Solution**:
- Refresh the page
- Clear browser cache
- Check that `formData.googleBooksImage` is being set in the ISBN lookup handler

## Test ISBNs with Known Images

Use these ISBNs for reliable testing:

- `9780743273565` - The Great Gatsby
- `9780061120084` - To Kill a Mockingbird  
- `9780451524935` - 1984
- `9780316769174` - The Catcher in the Rye
- `9780141439518` - Pride and Prejudice
- `9780060935467` - To Kill a Mockingbird (alternate)
- `9780547928227` - The Hobbit
- `9780439708180` - Harry Potter and the Sorcerer's Stone

## Debugging

If something isn't working:

1. **Check Browser Console**
   ```
   F12 → Console tab
   Look for errors or API responses
   ```

2. **Check Network Tab**
   ```
   F12 → Network tab
   Look for the ISBN lookup request
   Check the response data
   ```

3. **Check Backend Logs**
   ```bash
   # In server terminal
   # Look for ISBN lookup logs
   ```

4. **Verify Environment Variables**
   ```bash
   # Check server/.env
   GOOGLE_BOOKS_API_KEY=your_api_key_here
   ```

## Success Criteria

✅ Can create book listings using only ISBN lookup (no manual image upload)
✅ Google Books cover images display correctly
✅ Can override Google Books images with custom uploads
✅ Clear UI feedback about which image source is being used
✅ Form validation works correctly for all scenarios
