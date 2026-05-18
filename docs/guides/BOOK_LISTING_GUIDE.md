# Book Listing Guide

This guide explains how to create a book listing on BookVerse, how the ISBN lookup feature works, and what makes a listing attractive to potential trading partners.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Using ISBN Lookup](#using-isbn-lookup)
3. [Filling in the Listing Form](#filling-in-the-listing-form)
4. [Adding Photos](#adding-photos)
5. [Saving a Draft](#saving-a-draft)
6. [Tips for Great Listings](#tips-for-great-listings)
7. [Troubleshooting](#troubleshooting)

---

## Getting Started

1. Log in to your BookVerse account
2. Click **My Books** in the navigation bar
3. Click **Add Book** (or the **+** floating action button)

The listing form opens with a **completion progress bar** at the top. It tracks how many fields you have filled in — required and optional. Aim for 100% to make your listing as discoverable as possible.

```
┌──────────────────────────────────────────────┐
│  Add a Book                                  │
│  ████████████████████░░░░░░  78% complete    │
├──────────────────────────────────────────────┤
│  ISBN Lookup  │  Book Details  │  Photos     │
└──────────────────────────────────────────────┘
```

---

## Using ISBN Lookup

The fastest way to create an accurate listing is to enter the book's ISBN. BookVerse will automatically fill in the title, author, publisher, publication year, description, and cover image.

### What is an ISBN?

An ISBN (International Standard Book Number) is a unique identifier printed on the back cover or copyright page of most books published after 1970.

```
Back cover of a book:
┌──────────────────────┐
│                      │
│  ISBN 978-0-06-112008│  ← ISBN-13 (13 digits)
│  ▌▌▌ ▌ ▌▌▌▌ ▌▌▌▌▌   │
│  9 780061 120084      │
└──────────────────────┘
```

BookVerse accepts both formats:

| Format | Length | Example |
|--------|--------|---------|
| ISBN-10 | 10 characters | `0-06-112008-1` |
| ISBN-13 | 13 digits | `978-0-06-112008-4` |

Hyphens and spaces are stripped automatically — you can enter the ISBN with or without them.

### How to Use ISBN Lookup

**Step 1** — Enter the ISBN in the lookup field:

```
┌─────────────────────────────────────────────┐
│  ISBN Lookup                                │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ 9780061120084                       │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  [ Look Up Book ]                           │
└─────────────────────────────────────────────┘
```

**Step 2** — Click **Look Up Book**. The button shows a loading state while the lookup runs.

**Step 3** — On success, the form fills in automatically:

```
┌─────────────────────────────────────────────┐
│  ✓ Book information retrieved with cover    │
│    image from Open Library!                 │
├─────────────────────────────────────────────┤
│  Title:            To Kill a Mockingbird    │
│  Author:           Harper Lee               │
│  Publisher:        J. B. Lippincott & Co.   │
│  Publication Year: 1960                     │
│  Description:      [filled automatically]   │
│  Cover:            [preview shown]          │
└─────────────────────────────────────────────┘
```

Review the auto-filled fields and correct anything that does not match your specific edition before submitting.

### Where Does the Data Come From?

BookVerse queries two sources:

1. **Open Library** (primary) — provides title, author, publisher, publication year, and cover image. Open Library is a free, open database with millions of books.
2. **Google Books** (fallback) — used only for the description if Open Library does not have one.

Covers are always sourced from Open Library when available, because they are high-quality and reliably accessible.

### What If My Book Is Not Found?

Not all books are in the database, especially older, regional, or self-published titles. If the lookup returns "Book not found":

- Double-check the ISBN digits against the barcode on the book
- Try the alternative format (ISBN-10 vs ISBN-13) if your copy shows both
- Fill in the form fields manually (see [Filling in the Listing Form](#filling-in-the-listing-form))

### ISBN Lookup Benefits

| Without ISBN lookup | With ISBN lookup |
|---------------------|-----------------|
| Type all details by hand | Most fields filled automatically |
| Risk of typos in title/author | Accurate data from a verified database |
| No cover unless you photograph it | Cover image retrieved automatically |
| No description unless you write one | Description pulled from the database |
| Longer time to create a listing | Listing ready in seconds |

---

## Filling in the Listing Form

### Required Fields

These four fields plus at least one image must be completed before you can submit.

#### Title

The full title of the book, including subtitle if relevant (e.g., `The Lord of the Rings: The Fellowship of the Ring`).

#### Author

The author's name as it appears on the cover. For multiple authors, separate them with commas.

#### Condition

Select one of four condition grades:

```
┌────────────────────────────────────────────┐
│  Select Condition                          │
│                                            │
│  ⭐ Like New   Minimal wear, excellent     │
│               condition                   │
│                                            │
│  👍 Good       Some wear, fully readable  │
│                                            │
│  📖 Fair       Noticeable wear,           │
│               still usable               │
│                                            │
│  ⚠️  Poor       Heavy wear, may have      │
│               damage                     │
└────────────────────────────────────────────┘
```

| Grade | Description | Typical signs |
|-------|-------------|---------------|
| **Like New** | Minimal wear, excellent condition | Unread or barely read, no marks, tight spine |
| **Good** | Some wear, fully readable | Light scuffs, small crease, no writing |
| **Fair** | Noticeable wear, still usable | Worn spine, yellowed pages, minor writing |
| **Poor** | Heavy wear, may have damage | Torn pages, heavy markings, broken spine |

Be honest about condition — misrepresented listings lead to disputes and negative ratings.

#### Genre

Select at least one genre using the genre selector. You can pick multiple genres if the book spans categories (e.g., both **Science Fiction** and **Classic Literature**).

---

### Optional Fields

Not required, but each one improves discoverability and trader confidence.

#### ISBN

The book's ISBN. Even if you filled in all other fields manually, adding the ISBN helps other users confirm they are looking at the correct edition.

#### Description

A short summary of the book. If you used ISBN lookup, this is filled automatically. You can edit the auto-filled text or add your own notes about the copy (e.g., "First edition hardcover" or "Signed by the author").

#### Publication Year

The year the book was published (between 1000 and next year). Useful for distinguishing editions.

#### Publisher

The publisher's name (e.g., `Penguin Books`). Helps identify specific editions and printings.

---

## Adding Photos

Good photos are the single most effective way to attract trade offers.

### Upload Methods

**Method 1 — File picker:** Click the upload area and select images from your device.

**Method 2 — Drag and drop:** Drag image files from your file manager onto the upload area.

```
┌──────────────────────────────────────┐
│                                      │
│      📷  Drop photos here            │
│         or click to browse           │
│                                      │
│      JPEG, PNG, WebP · Max 10 MB     │
│                                      │
└──────────────────────────────────────┘
```

**Method 3 — ISBN cover (automatic):** If ISBN lookup retrieved a cover image, it is used automatically. No upload needed unless you want to add your own shots alongside it.

### Photo Rules

- Maximum **10 MB** per image
- Common image formats accepted (JPEG, PNG, WebP)
- The **first image** is shown as the **front cover**
- The **second image** is shown as the **back cover**
- Additional images are shown in the listing gallery

### Reordering Photos

After uploading, drag and drop thumbnails to rearrange the order. The first image in the list becomes the primary photo shown in search results.

---

## Saving a Draft

Click **Save Draft** at any point to save your progress locally. Drafts are stored for up to **24 hours**.

```
┌───────────────────────────────────────┐
│  ✓ Draft saved!                       │
└───────────────────────────────────────┘
```

When you return to the Add Book page within 24 hours, the draft loads automatically. After 24 hours the draft expires and is cleared.

> **Note:** Drafts are stored in your browser only. Clearing browser data or switching to a different device will lose the draft.

---

## Tips for Great Listings

### Use ISBN Lookup First

Always try the ISBN lookup before typing anything manually. Even a partial result saves time and reduces errors in the title and author fields.

### Be Honest About Condition

Traders make decisions based on your condition rating. An honest **Fair** rating builds trust; an inflated **Like New** rating leads to disputes. If in doubt, rate one level lower rather than higher.

### Photograph Your Actual Copy

Even when ISBN lookup provides a cover image, adding real photos of your copy lets traders see the true state of the book.

```
Photo checklist:
  ☐ Bright, even lighting — no heavy shadows
  ☐ Book fills most of the frame
  ☐ Cover text is legible
  ☐ Notable wear or marks are visible
  ☐ Plain background (white, wood, neutral surface)
```

Photograph the front cover, back cover, and spine. If there are highlights, annotations, or damage, show those too — transparency builds trust and avoids disputes.

### Write a Useful Description

The auto-filled description is a generic plot summary. Add a line about your specific copy:

```
Example:
  "Classic dystopian novel by George Orwell.
   This is the 2003 Penguin Classics paperback edition.
   Pages are lightly yellowed but fully legible.
   No writing or highlights inside."
```

Useful things to mention:
- Edition or printing (first edition, special edition, etc.)
- Language, if not English
- Any inscriptions, highlights, or annotations
- Whether it includes extras such as maps, appendices, or a study guide

### Select All Relevant Genres

Books that appear in more genre searches get more views. A fantasy novel set in historical times can be tagged as both **Fantasy** and **Historical Fiction**.

### Fill the Progress Bar to 100%

The completion bar tracks both required and optional fields. A fully complete listing ranks higher in search results and signals to traders that you are a careful, detailed lister.

### Fill In Publication Year and Publisher

These help traders who want a specific edition and improve how BookVerse's recommendation engine matches your book to other users' wishlists.

---

## Troubleshooting

### "Book not found" after ISBN lookup

- Check each digit carefully — one wrong digit returns no result or the wrong book
- Enter the ISBN without hyphens or spaces and try again
- If your copy shows both ISBN-10 and ISBN-13, try the other format
- Some recent, regional, or self-published books are not yet indexed — fill in the form manually

### "Invalid ISBN format"

- **ISBN-10**: 9 digits followed by a digit or the letter X (e.g., `0451526538` or `080701429X`)
- **ISBN-13**: exactly 13 digits, usually starting with 978 or 979 (e.g., `9780451526533`)

Make sure you are reading the ISBN barcode and not a different barcode such as an EAN or UPC.

### Cover image from lookup does not display

Open Library cover images load from `covers.openlibrary.org`. If the image is missing:

- Check your internet connection
- Run the lookup again — the external service may have been briefly unavailable
- Upload your own photo as an alternative

### "At least one image is required"

You must provide either a photo you upload yourself or a cover image retrieved via ISBN lookup. If the lookup ran but found no cover image, upload at least one photo of the book.

### Draft pre-fills the form unexpectedly

A draft from a previous session was loaded automatically. Review the pre-filled fields and continue from where you left off, or clear the fields manually to start a fresh listing.

---

## Related Documentation

- [User Registration Guide](USER_REGISTRATION_GUIDE.md) — Creating your account and profile
- [API Documentation](API_DOCUMENTATION.md) — Technical reference for the books API
- [Help Center](/help) — FAQs and feature guides

---

**Last Updated**: May 2026
**BookVerse Version**: 1.0.0
