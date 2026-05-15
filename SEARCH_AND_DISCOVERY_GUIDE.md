# Search and Discovery Guide

This guide explains how to find books on BookVerse using the Browse page, search filters, genre navigation, location-based discovery, recommendations, and wishlist matching.

## Table of Contents

1. [Browse Page Overview](#browse-page-overview)
2. [Searching for Books](#searching-for-books)
3. [Filtering by Genre](#filtering-by-genre)
4. [Combining Filters](#combining-filters)
5. [Location-Based Discovery](#location-based-discovery)
6. [Recommendations](#recommendations)
7. [Wishlist Matching](#wishlist-matching)
8. [Tips for Effective Searching](#tips-for-effective-searching)
9. [Troubleshooting](#troubleshooting)

---

## Browse Page Overview

Navigate to **Browse** in the navigation bar to see all books listed on BookVerse.

```
┌──────────────────────────────────────────────────────────┐
│  Browse Books                                            │
│                                                          │
│  ┌───────────────────────────┐  ┌──────────────────────┐ │
│  │ 🔍 Search title           │  │ 👤 Search author     │ │
│  └───────────────────────────┘  └──────────────────────┘ │
│  ┌───────────────────────────┐                           │
│  │ 📍 Filter by city         │   [ × Clear Filters ]    │
│  └───────────────────────────┘                           │
├─────────────────┬────────────────────────────────────────┤
│  Genre          │  Results                               │
│                 │                                        │
│  All Books      │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ │
│  Fiction        │  │      │ │      │ │      │ │      │ │
│  Fantasy        │  │      │ │      │ │      │ │      │ │
│  Science Fict.  │  └──────┘ └──────┘ └──────┘ └──────┘ │
│  Mystery        │                                        │
│  Thriller       │  Showing 25 of 142 books              │
│  Horror         │                                        │
│  Romance        │  [ ← Previous ]          [ Next → ]   │
│  Historical F.  │                                        │
│  Adventure      │                                        │
│  Young Adult    │                                        │
│  Biography      │                                        │
│  Memoir         │                                        │
│  Self-Help      │                                        │
│  History        │                                        │
│  Science        │                                        │
│  Philosophy     │                                        │
│  Business       │                                        │
│  Poetry         │                                        │
│  Graphic Novel  │                                        │
│  Cookbook       │                                        │
└─────────────────┴────────────────────────────────────────┘
```

### Key Behaviours

- **Page size**: 25 books per page.
- **Sort order**: Results are shuffled randomly each session to give every listing equal visibility regardless of when it was posted.
- **URL state**: Active filters and the current page are stored in the URL. You can bookmark or share a filtered search and it will open in the same state.

---

## Searching for Books

Three text search fields appear across the top of the Browse page.

### Title Search

Type any part of a book's title to find matching listings.

```
┌─────────────────────────────────┐
│ 🔍 Search title                 │
│ lord of                         │
└─────────────────────────────────┘
```

- Partial matches work — `lord of` matches *The Lord of the Rings*.
- Case-insensitive.
- Results update automatically after you stop typing (500 ms debounce).

### Author Search

Type any part of an author's name.

```
┌─────────────────────────────────┐
│ 👤 Search author                │
│ tolkien                         │
└─────────────────────────────────┘
```

- Partial matches work — `tolkien` matches *J.R.R. Tolkien*.
- Useful for finding all books by a specific author or series writer.

### City Search

Type a city name to find books listed by traders in that location.

```
┌─────────────────────────────────┐
│ 📍 Filter by city               │
│ Kathmandu                       │
└─────────────────────────────────┘
```

- Matches the city field on the listing owner's profile.
- Partial matches work — `Kath` matches *Kathmandu*.
- Leave this field empty to search across all locations.

### Clearing Filters

When any filter is active, a **× Clear Filters** button appears. Click it to reset all three text fields and the genre selection at once.

---

## Filtering by Genre

The genre sidebar on the left lets you narrow results to a specific category.

### Available Genres

| Genre | Genre | Genre | Genre |
|-------|-------|-------|-------|
| Fiction | Fantasy | Science Fiction | Mystery |
| Thriller | Horror | Romance | Historical Fiction |
| Adventure | Young Adult | Biography | Memoir |
| Self-Help | History | Science | Philosophy |
| Business | Poetry | Graphic Novel | Cookbook |

### How to Filter by Genre

Click a genre name in the sidebar. The selected genre is highlighted and results update immediately.

```
  Genre
  ────────────────
  All Books
▶ Fantasy           ← selected
  Science Fiction
  Mystery
```

Click **All Books** at the top of the sidebar to remove the genre filter and return to the full listing.

---

## Combining Filters

All filters work together. You can combine title search, author search, city search, and genre filter simultaneously.

### Example: Fantasy books by Tolkien in Kathmandu

| Field | Value |
|-------|-------|
| Title | *(empty)* |
| Author | `tolkien` |
| City | `kathmandu` |
| Genre | Fantasy |

The results show only Fantasy books by Tolkien listed by traders in Kathmandu.

### URL Sharing

Because filters are stored in the URL, you can share a filtered view with another user. Copy the URL from your browser's address bar while filters are active. The recipient will see exactly the same filtered results when they open the link.

Example URL structure:

```
/browse?title=&author=tolkien&city=kathmandu&genre=Fantasy&page=1
```

---

## Location-Based Discovery

### Browse by City

Use the **City** filter on the Browse page to find books available near you. Type your own city name to see what local traders have listed. Trading with someone in the same city makes meetups and hand-off simpler.

The city filter respects user privacy settings — only books from users who have enabled city visibility will appear in location-based searches.

To update your city, go to **Settings → Profile** and change the **City / Region** field.

---

## Recommendations

BookVerse suggests books you might enjoy on your Dashboard based on your activity — books you have listed, traded, or added to your wishlist.

```
┌────────────────────────────────────────┐
│  Recommended for You                   │
│                                        │
│  ┌──────┐  ┌──────┐  ┌──────┐         │
│  │      │  │      │  │      │  →      │
│  └──────┘  └──────┘  └──────┘         │
└────────────────────────────────────────┘
```

### Cold Start

If your account is new and BookVerse does not yet have enough data to personalise recommendations, the section shows popular or recently listed books instead. Recommendations improve as you list books and interact with the platform.

---

## Wishlist Matching

The Wishlist is a list of books you want to trade for. BookVerse monitors all active listings and alerts you when a match appears.

### Adding a Book to Your Wishlist

On any book detail page, click **Add to Wishlist**.

```
┌─────────────────────────────────────────┐
│  To Kill a Mockingbird                  │
│  Harper Lee                             │
│                                         │
│  [ Propose Trade ]  [ Add to Wishlist ] │
└─────────────────────────────────────────┘
```

### Viewing Your Wishlist Matches

On the Dashboard, a **Wishlist Matches** section shows books currently listed that match items on your wishlist.

```
┌────────────────────────────────────────┐
│  Wishlist Matches                      │
│  Books on your wishlist now available  │
│                                        │
│  ┌──────┐  ┌──────┐                   │
│  │      │  │      │                   │
│  └──────┘  └──────┘                   │
└────────────────────────────────────────┘
```

Click any match to view the full listing and propose a trade.

### Notifications

If you have **Wishlist Matches** email notifications enabled in **Settings → Notifications**, BookVerse will email you when a match becomes available. This lets you act quickly on a book you have been searching for.

---

## Tips for Effective Searching

### Start Broad, Then Narrow

Begin with a single filter and add more only if you get too many results. Starting with too many filters can accidentally exclude listings that would interest you.

### Use Partial Words

You do not need to type the full title or author name. `pride` finds *Pride and Prejudice*, and `orwell` finds all books by George Orwell.

### Search by Author to Find a Series

If you want the next book in a series, search by author name. All that author's listings will appear and you can scan for the title you need.

### Use Genre for Serendipity

Browse a genre without any text filters to discover books you did not know you were looking for. The random sort order means each visit shows a different selection of listings in that category.

### Bookmark Filtered Searches

Because filters are in the URL, you can save a bookmark in your browser for a search you run often — for example, Fantasy books in your city — and return to it with one click.

### Add Wanted Books to Your Wishlist

If a book you want is not currently listed, add it to your wishlist. You will be notified the moment another trader lists it, instead of having to search manually.

---

## Troubleshooting

### No results for a title or author search

- Check for typos — one wrong character in the search field can return no results.
- Try a shorter search term. `1984` works better than `nineteen eighty four` if the listing uses the numeric title.
- Remove the genre filter — the book may be listed under a different genre than expected.
- Clear all filters and browse the full catalogue to verify the book is listed at all.

### Genre filter shows fewer results than expected

A book appears in a genre filter only if the lister selected that genre. Some books may be listed under a related genre — for example, a mystery novel listed under **Thriller** rather than **Mystery**. Try both genres.

### City filter returns no results

- Confirm the spelling of the city name.
- Try a shorter partial match — `London` returns more results than `London, England`.
- Not all traders have set their city, so a city search may miss traders without a location.

### Recommendations section is empty

- Your account may be new. List a book or add items to your wishlist to give BookVerse enough data to personalise recommendations.
- If the section remains empty after activity, check back the next day — recommendations refresh periodically.

### Wishlist Matches section is empty

- No listed book currently matches any item on your wishlist. Check back later or enable wishlist email notifications so you are alerted when a match appears.
- Confirm your wishlist has items — go to **My Wishlist** to review what you have added.

---

## Related Documentation

- [Book Listing Guide](BOOK_LISTING_GUIDE.md) — How to list a book for trading
- [User Registration Guide](USER_REGISTRATION_GUIDE.md) — Creating your account and profile
- [API Documentation](API_DOCUMENTATION.md) — Technical reference for the search API
- [Help Center](/help) — FAQs and feature guides

---

**Last Updated**: May 2026
**BookVerse Version**: 1.0.0
