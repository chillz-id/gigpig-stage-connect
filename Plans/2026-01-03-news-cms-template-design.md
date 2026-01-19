# News CMS Template Design

**Date:** 2026-01-03
**Status:** Approved
**Purpose:** SEO-optimized news template for Stand Up Sydney comedy news

---

## Overview

Build a highly SEO-optimized News CMS template in Framer for publishing comedy industry updates from Australia and internationally. Content types include comedy special reviews, tour announcements, top 5/10 lists, interviews, and general news.

Optimized for both traditional search engines (Google) and AI crawlers/LLMs.

---

## CMS Field Structure

### Core Fields

| Field | Type | Required | Field ID | Purpose |
|-------|------|----------|----------|---------|
| Title | String | Yes | (existing) | Article headline, H1 |
| Slug | String | Yes | (auto) | URL identifier |
| Featured Image | Image | Yes | TBD | Hero image, social sharing, schema |
| Excerpt | String | No | TBD | Manual summary (150-160 chars ideal) |
| Content | FormattedText | Yes | (existing) | Article body with media embeds |

### Taxonomy

| Field | Type | Required | Options | Purpose |
|-------|------|----------|---------|---------|
| Category | Enum | Yes | Reviews, News, Lists, Interviews | Primary classification, affects schema |
| Tags | String | No | Comma-separated | Secondary classification (Sydney, MICF, Netflix, etc.) |

### Review-specific

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| Rating | Number | No | 0.5-5 in 0.5 increments, only for Reviews |

### Author

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| Author Name | String | Yes | Byline display |
| Author Bio | String | No | Short bio (1-2 sentences) |
| Author Image | Image | No | Headshot for author box |
| Author URL | Link | No | Profile or social link |

### Dates

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| Publish Date | Date | Yes | Original publication date |
| Updated Date | Date | No | Last significant update (display only when different) |

---

## URL Structure

```
/news/                          → All articles listing
/news/:slug                     → Individual article
/news/reviews/                  → Category archive (Phase 2)
/news/tag/:tag/                 → Tag archive (Phase 2)
```

---

## Article Template Layout

```
┌─────────────────────────────────────────────┐
│  Navigation (existing)                      │
├─────────────────────────────────────────────┤
│  Breadcrumb: Home > News > [Category]       │
├─────────────────────────────────────────────┤
│  Category Badge    •    Publish Date        │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │         Featured Image              │    │
│  │         (16:9 aspect ratio)         │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  H1: Article Title                          │
│  ★★★★☆ (4/5) - only for Reviews            │
│                                             │
│  ┌──────────┐                               │
│  │ Author   │  Author Name                  │
│  │  Image   │  "Updated Jan 3, 2026"        │
│  └──────────┘                               │
├─────────────────────────────────────────────┤
│                                             │
│  Article Content                            │
│  (prose, images, YouTube embeds, etc.)      │
│                                             │
├─────────────────────────────────────────────┤
│  Tags: Sydney, MICF, Stand-up (clickable)   │
├─────────────────────────────────────────────┤
│  Author Box (expanded bio, image, links)    │
├─────────────────────────────────────────────┤
│  Related Articles (same category/tags)      │
├─────────────────────────────────────────────┤
│  Footer (existing)                          │
└─────────────────────────────────────────────┘
```

---

## SEO & Schema Strategy

### Schema.org Markup (JSON-LD)

Dynamic schema based on article category:

| Category | Primary Schema | Additional Properties |
|----------|----------------|----------------------|
| Reviews | `Review` + `Rating` | `itemReviewed`, `reviewRating` |
| News | `NewsArticle` | `dateModified`, `author`, `publisher` |
| Lists | `Article` + `ItemList` | `itemListElement` for each item |
| Interviews | `Article` | `mentions` (Person interviewed) |

**All articles include:**
- `BreadcrumbList` schema
- `Organization` schema (Stand Up Sydney as publisher)
- `Person` schema (author)
- `ImageObject` schema (featured image)

### Meta Tags

```html
<!-- Primary -->
<title>{Title} | Stand Up Sydney News</title>
<meta name="description" content="{Excerpt or auto-generated}">
<meta name="author" content="{Author Name}">
<link rel="canonical" href="https://standupsydney.com/news/{slug}">

<!-- Open Graph -->
<meta property="og:type" content="article">
<meta property="og:title" content="{Title}">
<meta property="og:description" content="{Excerpt}">
<meta property="og:image" content="{Featured Image URL}">
<meta property="og:url" content="https://standupsydney.com/news/{slug}">
<meta property="og:site_name" content="Stand Up Sydney">
<meta property="article:published_time" content="{Publish Date ISO}">
<meta property="article:modified_time" content="{Updated Date ISO}">
<meta property="article:section" content="{Category}">
<meta property="article:tag" content="{Tag1}">
<meta property="article:tag" content="{Tag2}">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{Title}">
<meta name="twitter:description" content="{Excerpt}">
<meta name="twitter:image" content="{Featured Image URL}">
```

### AI Crawler Optimization

- Semantic HTML structure (`<article>`, `<header>`, `<main>`, `<aside>`, `<footer>`)
- Clear heading hierarchy (single H1, logical H2/H3 nesting)
- Descriptive `alt` text for all images
- Structured data for content understanding
- Fast page load (optimized images, minimal JS)

---

## Implementation Plan

### Phase 1: Core Template (This Sprint)

1. **CMS Fields** (Manual - User)
   - Add all fields to News collection in Framer UI
   - Configure enum options for Category

2. **ArticleSchema Component** (Code)
   - React component generating JSON-LD
   - Dynamic schema based on category
   - Injects into document head

3. **ArticleMeta Component** (Code)
   - Generates all meta tags
   - Open Graph + Twitter Card
   - Canonical URL

4. **Article Template Page**
   - Create `/news/:slug` page
   - Build layout per wireframe
   - Connect CMS fields
   - Conditional rating display

5. **Testing**
   - Create sample articles (one per category)
   - Validate schema with Google Rich Results Test
   - Test social sharing previews

### Phase 2: Archive Pages (Future)

- `/news/` listing page with pagination
- `/news/reviews/` category archive
- `/news/tag/:tag/` tag archives
- Related articles component

---

## CMS Fields to Add (User Action)

Add these fields to the **News** collection in Framer:

1. **Featured Image** - Type: Image
2. **Excerpt** - Type: String (plain text)
3. **Category** - Type: Enum
   - Options: Reviews, News, Lists, Interviews
4. **Tags** - Type: String (plain text, comma-separated)
5. **Rating** - Type: Number (min: 0, max: 5, step: 0.5)
6. **Author Name** - Type: String
7. **Author Bio** - Type: String
8. **Author Image** - Type: Image
9. **Author URL** - Type: Link
10. **Publish Date** - Type: Date
11. **Updated Date** - Type: Date

---

## Success Metrics

- Schema validation passes Google Rich Results Test
- Review articles show star ratings in search results
- Social shares display correct image/title/description
- Page load time < 3 seconds
- Core Web Vitals pass

---

## Notes

- Framer CMS fields must be added manually via UI (API limitation)
- Tags use comma-separated string (no multi-select in Framer CMS)
- Archive pages deferred to Phase 2
- Consider RSS feed for news aggregators (Phase 2)
