# Email Template Systems, Frameworks, and Design Patterns (2025-2026)

Comprehensive research document covering email development frameworks, design systems, compatibility, and recommendations for a React/TypeScript + Supabase + Mautic stack.

---

## Table of Contents

1. [Email Template Frameworks](#1-email-template-frameworks)
2. [Template Design Systems](#2-template-design-systems)
3. [Responsive Email Techniques](#3-responsive-email-techniques)
4. [Email Client Compatibility](#4-email-client-compatibility)
5. [Image Handling](#5-image-handling)
6. [Fonts and Typography](#6-fonts-and-typography)
7. [Interactive Email](#7-interactive-email)
8. [Template Management](#8-template-management)
9. [React Email Deep Dive](#9-react-email-deep-dive)
10. [Recommendations for Our Stack](#10-recommendations-for-our-stack)

---

## 1. Email Template Frameworks

### Framework Comparison Matrix

| Feature | MJML | React Email | Maizzle | Foundation for Emails | Cerberus | Email on Acid Tools |
|---|---|---|---|---|---|---|
| **Approach** | Custom markup language | React/JSX components | Tailwind CSS utility classes | Inky templating | Raw HTML patterns | Testing platform |
| **Language** | MJML markup | TypeScript/JSX | HTML + Tailwind | Inky/HTML | HTML/CSS | N/A |
| **Output** | Compiled responsive HTML | Rendered HTML string | Compiled inlined HTML | Compiled HTML tables | Ready-to-use HTML | N/A |
| **NPM Downloads/wk** | ~700,000 | ~270,000 | ~31,500 | ~6,000 (declining) | N/A (static files) | N/A |
| **GitHub Stars** | 17,400+ | 15,000+ | 5,600+ | 11,700 (archived) | 5,000+ | N/A |
| **Active Maintenance** | Yes | Yes (very active) | Yes | Effectively abandoned | Minimal updates | N/A |
| **Learning Curve** | Low | Low (if you know React) | Medium | Medium | Low | N/A |
| **Customization** | Constrained | High | Very high | Medium | Full control | N/A |
| **Responsive** | Built-in | Built-in components | Developer-controlled | Built-in | Manual patterns | N/A |
| **Dark Mode** | Manual CSS | Built-in support | Developer-controlled | No built-in support | Manual CSS | N/A |

### MJML (Mailjet Markup Language)

**What it is:** An open-source markup language that compiles to responsive, email-client-compatible HTML. You write semantic tags like `<mj-section>`, `<mj-column>`, and `<mj-button>`, and MJML generates the table-based, inline-styled HTML that email clients require.

**Pros:**
- Largest community and most documentation of any email framework
- Abstracts away all table-based layout complexity
- Guaranteed responsive output across major email clients
- Rich ecosystem: `mjml-react` for React integration, CLI tools, VS Code plugins
- Mautic natively supports MJML templates (`email.mjml.twig` files)
- Battle-tested at scale (used by Mailjet, many enterprises)

**Cons:**
- Opinionated: only supports fixed-width layouts (600px default)
- Custom designs can feel constrained by MJML's predefined structure
- Not every complex design maps cleanly to MJML's component model
- Adding custom components requires understanding the MJML API
- `mjml-react` wrapper is a community project, not officially maintained by MJML team

**Best for:** Teams wanting maximum reliability with minimal cross-client debugging. Transactional emails where consistency matters more than pixel-perfect custom design.

### React Email

**What it is:** A collection of unstyled React components (`@react-email/components`) that render to email-compatible HTML via a `render()` function. Built by the Resend team.

**Pros:**
- Native React/TypeScript experience: JSX, component composition, props, conditional rendering
- Built-in Tailwind CSS support via `<Tailwind>` wrapper component
- Local dev server with hot-reload preview (desktop + mobile toggle)
- Async render function compatible with React 19
- 54+ pre-built components (Body, Button, Container, Head, Heading, Html, Img, Preview, Section, Row, Column, Text, Link, Hr, CodeBlock, CodeInline, Font, Markdown, Tailwind)
- Very active development: version 5.2.8 as of Feb 2026, 136% download growth
- 23x faster Tailwind rendering since v3.0
- TypeScript-first with excellent type safety

**Cons:**
- Younger project; some edge cases may not be covered vs MJML
- Primarily designed to pair with Resend for sending (though HTML output works anywhere)
- JSX rendering in Deno/Supabase Edge Functions has compatibility friction
- No built-in MJML output (generates its own table-based HTML)
- Component library is unstyled by default (you build the design system)

**Best for:** React/TypeScript teams who want to keep email templates in the same codebase and tech stack as their application.

### Maizzle

**What it is:** A Node.js framework that brings Tailwind CSS to email development. You write standard HTML with Tailwind utility classes, and Maizzle compiles it into inlined, email-compatible HTML.

**Pros:**
- Full power of Tailwind CSS for email styling
- Maximum flexibility: no opinionated component structure
- Automatic CSS inlining, URL parameter injection, image base URL, widow prevention
- Excellent for teams already comfortable with Tailwind
- Build pipeline integrates well with CI/CD
- Supports multiple template environments (production, staging, etc.)

**Cons:**
- Steeper learning curve: requires understanding email HTML quirks
- No abstraction over table-based layouts (you write the tables)
- Smaller community than MJML or React Email
- Templates are HTML files, not components (less reusability out of the box)

**Best for:** Teams wanting maximum control over email HTML while using Tailwind. Large-scale email operations with many template variants.

### Foundation for Emails (Inky)

**What it is:** ZURB's email framework using the Inky templating language to convert simple HTML tags into email-compatible table layouts.

**Pros:**
- Mature framework with good documentation
- Simple Inky syntax (`<container>`, `<row>`, `<columns>`)
- Grid-based responsive system

**Cons:**
- Effectively abandoned (last meaningful update was years ago, GitHub issue #884 asking "Has foundation-emails been abandoned?")
- Declining npm downloads
- No active maintenance for modern email client changes
- Dependencies are outdated

**Verdict:** Do not use for new projects. Listed here for historical context only.

### Cerberus

**What it is:** Not a framework per se, but a collection of battle-tested HTML/CSS patterns for responsive email templates.

**Pros:**
- Three ready-to-use templates: fluid (single column), responsive (media query-based), and hybrid (works without media query support)
- Zero dependencies: pure HTML/CSS
- Excellent learning resource for understanding email HTML fundamentals
- Hybrid template approach works in clients that strip media queries

**Cons:**
- Not a build tool: no compilation, inlining, or automation
- No component system or reusability features
- Requires manual work for every new template
- Pattern library, not a development framework

**Best for:** Learning email development fundamentals. Starting point for custom email systems where you want full control.

### Email on Acid

**What it is:** A testing and previewing platform, not a template framework. Provides rendering previews across 90+ email clients.

**Key features:**
- Campaign Precheck: comprehensive pre-send analysis
- Rendering previews across clients and devices
- Accessibility checking
- Spam testing
- Code analysis
- More affordable than Litmus in 2025 (Litmus raised prices to $500/month minimum after Validity acquisition)

---

## 2. Template Design Systems

### What is an Email Design System?

An email design system is a collection of reusable components, design tokens, and guidelines that teams use to create on-brand emails consistently and efficiently. Unlike web design systems (which benefit from mature component libraries), email design systems must work within the severe constraints of email client rendering engines.

### Core Components of an Email Design System

**Layout Components:**
- **Header**: Brand logo, optional navigation links, preheader text
- **Hero Banner**: Full-width image or gradient with headline overlay
- **Content Section**: Text + image combinations (1-column, 2-column, 3-column)
- **Card**: Bordered/shadowed content block with heading, text, optional image, and CTA
- **Divider**: Horizontal rule or spacer
- **Footer**: Contact info, social links, unsubscribe link, legal text

**Interactive Components:**
- **Button**: Primary, secondary, ghost variants with consistent padding and border-radius
- **Link**: Styled anchor tags with underline and color
- **Social Icons**: Platform icon set with links

**Content Components:**
- **Heading**: H1-H4 with consistent font sizing and spacing
- **Body Text**: Paragraph styling with line-height and color
- **List**: Bulleted or numbered (using table-based faux lists for Outlook)
- **Blockquote**: Styled quote block
- **Code Block**: Monospaced text block for transactional/developer emails

### Design System Architecture Pattern

```
email-templates/
  components/           # Reusable pieces
    Header.tsx          # Brand header with logo
    Footer.tsx          # Footer with unsub link
    Button.tsx          # CTA button component
    Card.tsx            # Content card
    HeroImage.tsx       # Hero banner
    SocialIcons.tsx     # Social media icons
  layouts/              # Page-level layouts
    TransactionalLayout.tsx   # Minimal: header + content + footer
    MarketingLayout.tsx       # Full: header + hero + content + CTA + footer
    NotificationLayout.tsx    # Alert-style: icon + message + action
  templates/            # Specific email templates
    WelcomeEmail.tsx
    PasswordReset.tsx
    OrderConfirmation.tsx
    EventReminder.tsx
    NewsletterWeekly.tsx
  styles/               # Design tokens
    colors.ts           # Brand colors, dark mode variants
    typography.ts       # Font stacks, sizes, line-heights
    spacing.ts          # Consistent padding/margin values
```

### 2025 Trends in Email Design Systems

**Dynamic Modules:** Instead of creating multiple versions of a component (e.g., card with image, card without image, card with button), modern systems use a single flexible module with boolean properties and variables that toggle features on/off. This reduces the component library size significantly.

**Figma-to-Code Pipelines:** Teams design email components in Figma with variables for light/dark mode and boolean properties for optional elements, then export to code. Tools like Parcel, Litmus, and custom pipelines bridge design and development.

**Shared Design Tokens:** Colors, spacing, and typography values are defined once and shared between web application components and email template components, ensuring brand consistency.

---

## 3. Responsive Email Techniques

### Three Approaches to Responsive Email

#### 1. Fluid Layout
Uses percentage-based widths to scale naturally without media queries.

```html
<table width="100%" style="max-width: 600px;">
  <tr>
    <td style="padding: 20px; width: 100%;">
      Content scales with viewport
    </td>
  </tr>
</table>
```

**Pros:** Works everywhere, including clients that strip media queries (Gmail app, some Outlook versions).
**Cons:** Limited control over layout changes at breakpoints; single-column only.

#### 2. Responsive Layout (Media Queries)
Uses `@media` queries to reflow layouts at breakpoints.

```css
@media screen and (max-width: 600px) {
  .column { width: 100% !important; display: block !important; }
  .hide-mobile { display: none !important; }
}
```

**Pros:** Full control over mobile vs desktop layout.
**Cons:** Not supported in all clients. Gmail app, some Outlook versions, and older Android clients strip `<style>` blocks and media queries.

#### 3. Hybrid/Spongy Layout (Recommended)
Combines `max-width` constraints with MSO (Microsoft Office) conditional comments. Content is fluid by default, constrained by `max-width`, with Outlook getting a fixed width via conditional comments.

```html
<!--[if mso]>
<table width="600" cellpadding="0" cellspacing="0"><tr><td>
<![endif]-->
<div style="max-width: 600px; margin: 0 auto;">
  <!-- Content here -->
</div>
<!--[if mso]>
</td></tr></table>
<![endif]-->
```

**Pros:** Works across all clients. Graceful degradation without media queries. Media queries can progressively enhance where supported.
**Cons:** More verbose HTML. Requires understanding of MSO conditionals.

### Media Query Support by Client

| Client | `@media` Support | `<style>` Block | Notes |
|---|---|---|---|
| Apple Mail (all) | Full | Yes | Best CSS support overall |
| Gmail (web) | Partial | Yes (limited) | Supports embedded `<style>`, not all properties |
| Gmail (mobile app) | No | Stripped | Must rely on inline styles and fluid layout |
| Outlook.com (web) | Partial | Yes | Decent support, some quirks |
| Outlook (Windows desktop) | No | Yes (limited) | Word rendering engine; MSO conditionals needed |
| Outlook (Mac) | Full | Yes | Uses WebKit, good support |
| Yahoo Mail | Full | Yes | Good modern CSS support |
| Samsung Mail | Partial | Yes | Growing market share on Android |

### Dark Mode CSS

Dark mode in email operates in three tiers:

**Tier 1: No change** - Email renders as-is (client does not apply dark mode to emails).

**Tier 2: Partial inversion** - Client auto-inverts light backgrounds to dark and adjusts text colors. No developer control. Gmail Android/iOS does this.

**Tier 3: Full `prefers-color-scheme` support** - Developer can write custom dark mode styles.

```css
:root {
  color-scheme: light dark;
  supported-color-schemes: light dark;
}

@media (prefers-color-scheme: dark) {
  .dark-bg { background-color: #1a1a2e !important; }
  .dark-text { color: #e0e0e0 !important; }
  .dark-img { display: block !important; }
  .light-img { display: none !important; }
}
```

**Dark Mode Support Matrix:**

| Client | Behavior | `prefers-color-scheme` |
|---|---|---|
| Apple Mail (macOS) | Tier 3 | Yes |
| Apple Mail (iOS) | Tier 3 | Yes |
| Outlook (Mac) | Tier 3 | Yes |
| Outlook.com (web) | Tier 2-3 | Partial (uses `[data-ogsc]` attribute) |
| Outlook (Windows) | Tier 2 | No |
| Gmail (web) | Tier 2 | No |
| Gmail (Android) | Tier 2 | No (full auto-inversion) |
| Gmail (iOS) | Tier 2 | No |
| Yahoo Mail | Tier 3 | Yes |

**Key Dark Mode Rules:**
- Never use pure white (`#FFFFFF`) or pure black (`#000000`) as they trigger aggressive auto-inversion
- Use off-whites (`#F5F5F5`) and near-blacks (`#1A1A1A`) instead
- Provide dark-mode-specific logo variants (light logo on dark background)
- Test with both light and dark modes on every target client
- For Outlook.com, target with `[data-ogsc] .your-class` selector

---

## 4. Email Client Compatibility

### Market Share (September 2025)

| Client | Market Share | Rendering Engine |
|---|---|---|
| Apple Mail (all platforms) | 58.07% | WebKit |
| Gmail (all platforms) | 29.67% | Custom (WebKit-based, heavy sanitization) |
| Outlook (all variants) | 4.30% | Word (Windows), WebKit (Mac), Custom (Web) |
| Yahoo Mail | 2.5% | Custom |
| Samsung Mail | 1.5% | WebKit-based |
| Others | ~4% | Various |

### Known Rendering Issues by Client

#### Gmail
- Strips `<style>` blocks in non-Google-account views and mobile apps
- No support for `@media` queries in mobile apps
- No `prefers-color-scheme` support
- Aggressive auto-dark-mode with full color inversion
- Clips emails larger than 102KB
- Removes `position`, `float`, and `display: flex`
- Class names must not start with a number
- Default font: Arial

#### Apple Mail (iOS/macOS)
- Best CSS support among all email clients
- Full `@media` query support including `prefers-color-scheme`
- Supports `<style>` blocks, embedded CSS, and most modern CSS
- Auto-scales text on iOS (can be overridden with `-webkit-text-size-adjust: 100%`)
- Different rendering quirks between iOS, iPadOS, and macOS versions
- Default font: Helvetica

#### Outlook (Windows Desktop - 2016, 2019, 2021, 365)
- Uses Microsoft Word rendering engine (not a browser engine)
- No support for: `background-image` (CSS), `border-radius`, `box-shadow`, `float`, `position`, CSS animations, `max-width`, `min-height`, `padding` on block elements
- Requires VML (Vector Markup Language) for background images
- Images need explicit `width` and `height` attributes
- Must use `<!--[if mso]>` conditional comments for Outlook-specific fixes
- Table-based layouts are mandatory
- Adds default spacing around images (fix: `display: block`)
- Default font: Times New Roman (if no font specified)
- DPI scaling can break layouts (fix: use `mso-dpi-group` CSS)

#### Outlook.com (Web)
- Better CSS support than desktop Outlook
- Supports `<style>` blocks
- Dark mode uses `[data-ogsc]` attribute selector instead of `prefers-color-scheme`
- Strips `position` and `float`

#### Outlook (Mac)
- Uses WebKit rendering engine (far better than Windows)
- Supports most modern CSS including `border-radius`, `box-shadow`, `@media`
- Close to Apple Mail in capability

#### Yahoo Mail
- Good CSS support including `@media` queries and `prefers-color-scheme`
- Supports `display: flex` (one of the few email clients that does)
- Prefixes class names and IDs, so avoid CSS selectors that depend on specific class names

#### Samsung Mail
- WebKit-based with decent CSS support
- Growing market share on Android devices
- Supports `@media` queries
- Some inconsistencies with `background-image`

### The "Safe Baseline" CSS Properties

Properties that work across all major email clients:

```
background-color, border, color, font-family, font-size, font-style,
font-weight, line-height, margin (with caveats), padding (on <td> only),
text-align, text-decoration, vertical-align, width (fixed px on tables)
```

### Reference Resource

[Can I Email](https://www.caniemail.com/) - The definitive compatibility reference for HTML and CSS features in email clients. Tracks 302+ features across all major clients with a scoreboard ranking system.

---

## 5. Image Handling

### Retina/HiDPI Images

Most modern devices have 2x or 3x pixel density displays. Strategies:

**Strategy 1: 2x Images with HTML Size Constraints (Recommended)**
```html
<img src="hero-1200x600.jpg" width="600" height="300"
     style="width: 100%; max-width: 600px; height: auto;"
     alt="Hero image description" />
```
Serve an image at 2x the display size and constrain with `width`/`height` attributes. This ensures sharp rendering on retina screens while maintaining correct sizing on standard displays.

**Strategy 2: srcset (Progressive Enhancement)**
```html
<img src="image-600.jpg"
     srcset="image-1200.jpg 2x"
     width="600" height="300"
     alt="Description" />
```
Works in Apple Mail and some other WebKit clients. Gmail and Outlook ignore `srcset`, falling back to `src`.

**Strategy 3: Background Image with Media Query**
```css
@media (-webkit-min-device-pixel-ratio: 2) {
  .hero { background-image: url('hero@2x.jpg'); }
}
```
Limited support; only useful for clients that support `<style>` blocks and `@media`.

### Image Blocking

Many email clients block images by default until the user opts in:
- **Outlook (desktop)**: Blocks external images by default
- **Gmail**: Generally shows images but may block for unknown senders
- **Apple Mail**: Shows images by default

**Best practices:**
- Always include descriptive `alt` text on every image
- Style `alt` text: `style="font-family: Arial, sans-serif; font-size: 14px; color: #333333;"`
- Never use images for critical content (CTAs, key information)
- Use HTML/CSS for buttons rather than image buttons
- Keep image-to-text ratio balanced (avoid image-only emails: spam filter trigger)
- Include `width` and `height` attributes so layout is preserved when images are blocked

### Background Images

**CSS `background-image`**: Not supported in Outlook desktop (Word engine).

**VML Workaround for Outlook:**
```html
<!--[if mso]>
<v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:600px;height:300px;">
<v:fill type="frame" src="https://example.com/bg.jpg" />
<v:textbox style="mso-fit-shape-to-text:true" inset="0,0,0,0">
<![endif]-->
<div style="background-image: url('https://example.com/bg.jpg'); background-size: cover; width: 600px; height: 300px;">
  Content over background
</div>
<!--[if mso]>
</v:textbox></v:rect>
<![endif]-->
```

**Buttons.cm** (buttons.cm) is a free tool that generates bulletproof VML background image code for Outlook.

### SVG Support

**Status: Very limited, do not rely on SVG in email.**

| Client | `<img src="file.svg">` | Inline `<svg>` |
|---|---|---|
| Apple Mail | Yes | Yes |
| Gmail | No | No |
| Outlook (Windows) | No | Retiring support Sept 2025 |
| Outlook (Mac) | Yes | Yes |
| Yahoo Mail | Partial | No |

**Microsoft announced retirement of inline SVG support in Outlook** starting September 2025, citing security risks from embedded code in SVG files.

**Recommendation:** Convert all SVGs to PNG for email. If you want SVG for supported clients, use progressive enhancement:
```html
<img src="logo.png" srcset="logo.svg" alt="Logo" width="200" />
```
This shows SVG where `srcset` is supported and falls back to PNG everywhere else.

### Image Format Recommendations

| Format | Use Case | Support |
|---|---|---|
| PNG | Logos, icons, graphics with transparency | Universal |
| JPEG | Photos, hero images | Universal |
| GIF | Simple animations, small icons | Universal (animated GIF supported widely) |
| WebP | Not recommended for email | Very limited support |
| SVG | Not recommended for email | See table above |
| AVIF | Not recommended for email | Almost no support |

---

## 6. Fonts and Typography

### Web Font Support in Email

| Client | `@font-face` / `@import` | Google Fonts `<link>` |
|---|---|---|
| Apple Mail (iOS) | Yes | Yes |
| Apple Mail (macOS) | Yes | Yes |
| Outlook (Mac) | Yes | Yes |
| Outlook (Windows) | No | No |
| Outlook.com | No | No |
| Gmail (web) | No | No |
| Gmail (mobile) | No | No |
| Yahoo Mail | No | No |
| Samsung Mail | Partial | Partial |

**Summary:** Only Apple Mail and Outlook for Mac reliably support custom web fonts. That is approximately 58% of the market (Apple Mail's share), which is significant but not universal.

### Recommended Font Stack Strategy

**Hybrid Approach (Best Practice):**
- Use web fonts for headlines (where visual impact matters most, and Apple Mail's 58% share makes it worthwhile)
- Use system/web-safe fonts for body text (where readability and consistency matter most)

```css
/* Headline font stack */
font-family: 'Brand Font', 'Helvetica Neue', Helvetica, Arial, sans-serif;

/* Body font stack */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;

/* Monospace (for transactional/code) */
font-family: 'SF Mono', 'Menlo', 'Monaco', 'Courier New', monospace;
```

### Web-Safe Font Options

**Sans-Serif (Modern, Clean):**
- Arial / Helvetica - Universal, neutral
- Verdana - Wide, readable at small sizes
- Trebuchet MS - Slightly more personality
- Tahoma - Compact, clean

**Serif (Traditional, Formal):**
- Georgia - Designed for screens, excellent readability
- Times New Roman - Universal but dated
- Palatino Linotype - Elegant alternative

**System Font Stack (Modern Default):**
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
             'Helvetica Neue', Arial, 'Noto Sans', sans-serif,
             'Apple Color Emoji', 'Segoe UI Emoji';
```

### Typography Best Practices for Email

- **Minimum body size:** 14px (some mobile clients enforce minimum anyway)
- **Minimum CTA button text:** 16px
- **Line height:** 1.5 for body text, 1.2-1.3 for headlines
- **Maximum line length:** 600px container, ~70 characters per line
- **Outlook default:** Times New Roman if no font specified -- always declare font-family
- **Gmail default:** Arial -- your fallback stack will rarely be seen by Gmail users

---

## 7. Interactive Email

### AMP for Email

**What it is:** Google's framework for dynamic, interactive email content. Enables forms, carousels, accordions, live data, and real-time updates directly in the inbox.

**Current Support (2025):**

| Client | AMP Support |
|---|---|
| Gmail (web + mobile) | Yes |
| Yahoo Mail | Yes |
| Mail.ru | Yes |
| FairEmail | Yes |
| Apple Mail | No |
| Outlook (all) | No |
| Samsung Mail | No |

**Requirements:**
- Sender must register with Google and be approved
- Email must include both AMP MIME part and HTML fallback
- AMP content expires after 30 days (falls back to HTML)
- SPF, DKIM, and DMARC must be configured

**Verdict:** AMP remains a niche technology. With no Apple Mail or Outlook support, it reaches ~30% of inboxes (Gmail). The registration requirement adds friction. Unless your audience is heavily Gmail-based and you have specific interactive use cases (live polls, in-email forms, dynamic product feeds), the complexity is not justified.

### CSS Animations

```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
.animated { animation: fadeIn 0.5s ease-in; }
```

**Support:** Apple Mail, Outlook (Mac), some Yahoo Mail versions. Not supported in Gmail, Outlook (Windows), or most Android clients.

**Recommendation:** Use as progressive enhancement only. The email must be fully functional without animations. Good use cases: subtle CTA button hover effects, loading transitions for Apple Mail users.

### Hover Effects

```css
.button:hover {
  background-color: #0056b3 !important;
}
```

**Support:** Desktop clients only (Apple Mail, Outlook Mac, Yahoo web, Outlook.com). No hover on mobile (touch interfaces).

**Recommendation:** Safe to use as enhancement for desktop users. Never rely on hover for critical functionality or content reveal.

### CSS `:checked` Hack (Interactive Without JS)

Using hidden radio buttons/checkboxes with CSS `:checked` selectors to create tabs, accordions, and carousels.

**Support:** Apple Mail, some Yahoo versions. Not Gmail, not Outlook.

**Verdict:** Creative but not production-reliable for most audiences.

### What Actually Works Everywhere

| Technique | Universal? | Notes |
|---|---|---|
| Animated GIF | Yes | Outlook shows first frame only |
| HTML/CSS buttons | Yes | Use table-cell or padding-based approach |
| Alt text styling | Yes | Works when images are blocked |
| Preheader text | Yes | Hidden preview text |
| Hover effects | Desktop only | Progressive enhancement |
| CSS animations | ~60% | Apple Mail + Mac Outlook |
| AMP interactivity | ~30% | Gmail + Yahoo only |
| Video embed | No | Use GIF or linked thumbnail |

---

## 8. Template Management

### Version Control Strategies

**Code-in-Repo Approach (Recommended for dev teams):**
```
/emails
  /components      # Shared components (header, footer, button)
  /templates       # Individual email templates
  /previews        # Preview/story files for each template
  /styles          # Shared design tokens
  package.json     # Build scripts for rendering to HTML
  tsconfig.json    # TypeScript config
```

Benefits: Full git history, PR reviews for template changes, CI/CD integration, consistent with application development workflow.

**Platform-Based Approach:**
Templates stored and versioned in the email platform (Mautic, Mailchimp, etc.). Typically managed through a web UI with limited version history.

### Template Variables and Merge Tags

**Mautic Tokens:**
```
{contactfield=firstname}     # Contact field
{contactfield=email}         # Contact email
{unsubscribe_url}            # Unsubscribe link
{webview_url}                # View in browser link
{tracking_pixel}             # Open tracking
{ownerfield=signature}       # Owner fields
```

**Mautic + Twig (with Advanced Templates plugin):**
```twig
{% if lead.city == 'Sydney' %}
  <p>Join us at our Sydney venue!</p>
{% else %}
  <p>Find an event near you.</p>
{% endif %}

{% for event in events %}
  <div>{{ event.name }} - {{ event.date }}</div>
{% endfor %}
```

**React Email Variables (Props):**
```tsx
interface WelcomeEmailProps {
  firstName: string;
  eventName: string;
  ticketUrl: string;
}

export const WelcomeEmail = ({ firstName, eventName, ticketUrl }: WelcomeEmailProps) => (
  <Html>
    <Text>Hi {firstName},</Text>
    <Text>Your ticket for {eventName} is confirmed.</Text>
    <Button href={ticketUrl}>View Ticket</Button>
  </Html>
);
```

### Preview and Testing Tools

#### Litmus
- Previews across 90+ email clients and devices
- Code analysis and accessibility checking
- Spam testing (checks against major spam filters)
- Analytics (open tracking, engagement)
- Team review workflows
- **Pricing:** $500/month minimum (2025 price increase after Validity acquisition)
- **Best for:** Enterprise teams with budget

#### Email on Acid
- Campaign Precheck (comprehensive pre-send analysis)
- Rendering previews across clients
- Code analysis
- Accessibility checking
- Spam testing
- **Pricing:** More affordable than Litmus (~$74-$134/month)
- **Best for:** Small-to-mid teams wanting solid testing without enterprise pricing

#### Mailtrap
- Email testing and preview platform
- Sandbox SMTP for development (catches test emails)
- Rendering previews
- Spam analysis
- API for automated testing
- **Pricing:** Free tier available, paid from $15/month
- **Best for:** Developers wanting testing in CI/CD pipelines

#### React Email Dev Server
- Free, local development preview
- Desktop and mobile preview toggle
- Hot reload on file changes
- Source code view
- **Pricing:** Free (open source)
- **Best for:** Development workflow (not a substitute for cross-client testing)

---

## 9. React Email Deep Dive

### Architecture

React Email works by providing React components that map to email-safe HTML patterns. The rendering pipeline is:

```
JSX Component --> React Element Tree --> render() --> HTML String --> Email Client
```

**Core Packages:**
- `react-email` - CLI and dev server (v5.2.8)
- `@react-email/components` - All UI components
- `@react-email/render` - Converts React to HTML string
- `@react-email/tailwind` - Tailwind CSS support for email

### Installation and Setup

```bash
npm install react-email @react-email/components @react-email/render
```

### Component Example

```tsx
import {
  Html, Head, Preview, Body, Container, Section,
  Row, Column, Heading, Text, Button, Img, Hr, Link,
  Tailwind
} from '@react-email/components';
import { render } from '@react-email/render';

interface EventReminderProps {
  firstName: string;
  eventName: string;
  eventDate: string;
  venueName: string;
  ticketUrl: string;
}

export const EventReminder = ({
  firstName,
  eventName,
  eventDate,
  venueName,
  ticketUrl,
}: EventReminderProps) => (
  <Html>
    <Head />
    <Preview>Reminder: {eventName} is coming up!</Preview>
    <Tailwind>
      <Body className="bg-gray-100 font-sans">
        <Container className="mx-auto max-w-[600px] bg-white rounded">
          {/* Header */}
          <Section className="px-6 py-4 bg-indigo-600 rounded-t">
            <Img src="https://example.com/logo-white.png"
                 width="150" height="40" alt="Stand Up Sydney" />
          </Section>

          {/* Content */}
          <Section className="px-6 py-8">
            <Heading className="text-2xl font-bold text-gray-900">
              Hey {firstName}, your show is coming up!
            </Heading>
            <Text className="text-gray-600 text-base leading-6">
              Just a friendly reminder that <strong>{eventName}</strong> is
              happening on {eventDate} at {venueName}.
            </Text>
            <Button
              href={ticketUrl}
              className="bg-indigo-600 text-white px-6 py-3 rounded text-base font-semibold"
            >
              View Your Ticket
            </Button>
          </Section>

          {/* Footer */}
          <Hr className="border-gray-200" />
          <Section className="px-6 py-4">
            <Text className="text-gray-400 text-xs">
              Stand Up Sydney | <Link href="https://standupsydney.com">standupsydney.com</Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Tailwind>
  </Html>
);

// Render to HTML string
const html = await render(<EventReminder
  firstName="Alex"
  eventName="Friday Night Comedy"
  eventDate="March 7, 2026"
  venueName="ID Comedy Club"
  ticketUrl="https://standupsydney.com/tickets/abc123"
/>);
```

### Key Components Available

| Component | Purpose | Outlook Safe |
|---|---|---|
| `<Html>` | Root element with `<!DOCTYPE>` | Yes |
| `<Head>` | `<head>` tag with meta tags | Yes |
| `<Preview>` | Hidden preheader text | Yes |
| `<Body>` | `<body>` wrapper | Yes |
| `<Container>` | Centered max-width wrapper | Yes |
| `<Section>` | Rendered as `<table>` row | Yes |
| `<Row>` | Table row for columns | Yes |
| `<Column>` | Table cell in a row | Yes |
| `<Heading>` | `<h1>`-`<h6>` | Yes |
| `<Text>` | `<p>` tag | Yes |
| `<Button>` | `<a>` styled as button | Yes |
| `<Link>` | `<a>` tag | Yes |
| `<Img>` | `<img>` with defaults | Yes |
| `<Hr>` | Horizontal rule | Yes |
| `<Tailwind>` | Tailwind CSS processor | Yes (inlines CSS) |
| `<Font>` | `@font-face` declaration | Partial |
| `<Markdown>` | Renders markdown to HTML | Yes |
| `<CodeBlock>` | Syntax-highlighted code | Yes |
| `<CodeInline>` | Inline code | Yes |

### Rendering to HTML

```tsx
import { render } from '@react-email/render';

// Async render (default in v3+)
const html = await render(<MyEmail {...props} />);

// Plain text version
const text = await render(<MyEmail {...props} />, { plainText: true });

// Pretty-printed HTML (for debugging)
const html = await render(<MyEmail {...props} />, { pretty: true });
```

### Integration with Supabase + Mautic

#### Option A: Build-Time Rendering (Recommended)

Use React Email to develop and preview templates during development, then render the final HTML and feed it into Mautic as a theme/template.

```
Development:
  React Email components --> npm run build:emails --> Static HTML templates

Deployment:
  Static HTML templates --> Mautic theme directory --> Mautic sends via SMTP
```

**Workflow:**
1. Develop email templates as React components in the `/emails` directory
2. Use React Email dev server for local preview
3. Build script renders each template to static HTML with Mautic merge tags (`{contactfield=firstname}`)
4. Deploy HTML files as Mautic email themes
5. Mautic handles personalization, sending, tracking

```tsx
// Template with Mautic merge tags as literal strings
export const WelcomeEmail = () => (
  <Html>
    <Text>Hi {'{contactfield=firstname}'},</Text>
    <Text>Welcome to Stand Up Sydney!</Text>
    <Link href={'{unsubscribe_url}'}>Unsubscribe</Link>
  </Html>
);
```

#### Option B: Runtime Rendering via Supabase Edge Function

Render emails on-demand in a Supabase Edge Function, then send via an SMTP service.

```
Request --> Supabase Edge Function --> React Email render() --> HTML --> SMTP send
```

**Challenges:**
- JSX/TSX support in Deno (Supabase Edge Functions runtime) has friction
- React Email's `render()` function needs a Node.js-compatible environment
- Edge Function cold starts add latency to email sending

**Workaround:** Use a Node.js-based API route or a separate rendering microservice instead of Supabase Edge Functions for email rendering.

#### Option C: Hybrid (Recommended for this stack)

- Use React Email for development, preview, and template design
- Pre-render templates to HTML at build time
- Store rendered HTML templates in Mautic
- Use Mautic for personalization (merge tags), scheduling, automation, and sending
- Use Supabase Edge Functions only for transactional email triggers (password reset, order confirmation) where you call an SMTP API directly

### Fit Assessment: React Email + Supabase + Mautic

| Aspect | Assessment | Notes |
|---|---|---|
| Developer experience | Excellent | Same React/TS stack as the app |
| Template development | Excellent | Local preview, hot reload, Tailwind |
| Type safety | Excellent | TypeScript props for template variables |
| Supabase integration | Good (with caveats) | Edge Function JSX support is limited |
| Mautic integration | Good (build-time) | Pre-render HTML, deploy as Mautic theme |
| Mautic integration | Poor (runtime) | No native integration; manual HTML handoff |
| Cross-client rendering | Very good | Components tested across major clients |
| Dark mode | Good | Tailwind + custom styles |
| Long-term viability | Strong | Active project, 136% download growth, backed by Resend |

---

## 10. Recommendations for Our Stack

### Recommended Architecture

```
React Email (Development)
    |
    v
Build Script (render to HTML)
    |
    +--> Mautic Themes (marketing, newsletter, automation emails)
    |       Mautic handles: personalization, scheduling, tracking, sending
    |
    +--> Supabase Edge Functions (transactional emails)
            Direct SMTP API call (Resend, Postmark, or AWS SES)
            For: password reset, ticket confirmation, order receipt
```

### Framework Choice: React Email

**Why React Email over MJML:**
- Your team already works in React + TypeScript + Tailwind (the entire application stack)
- React Email uses the exact same patterns: JSX components, props, Tailwind classes
- No new markup language to learn (MJML requires learning `mj-*` tags)
- Component composition and TypeScript type safety for template variables
- Active development trajectory (270K+ weekly downloads, frequent releases)
- Tailwind rendering is now 23x faster since v3.0

**Why not MJML:**
- MJML is the safer, more battle-tested choice, and Mautic natively supports it
- If you find React Email's output has rendering issues in specific clients, MJML is the fallback
- Consider MJML if you need non-developers (marketers) to edit templates directly

**Why not Maizzle:**
- Maizzle is powerful but requires writing raw table HTML with Tailwind classes
- React Email provides the same Tailwind experience with component abstraction
- Maizzle's advantage (flexibility) is less relevant when React Email's components cover your use cases

### Template Design System

Build a small, focused component library:

```
emails/
  components/
    BrandHeader.tsx      # Logo + optional nav
    BrandFooter.tsx      # Unsub link, social, legal
    PrimaryButton.tsx    # CTA button (indigo/brand color)
    SecondaryButton.tsx  # Ghost/outline CTA
    ContentCard.tsx      # Bordered content block
    EventCard.tsx        # Event name, date, venue, CTA
    TicketSummary.tsx    # Ticket type, qty, price, total
    Divider.tsx          # Styled <Hr>
  layouts/
    TransactionalLayout.tsx   # Header + content + footer
    MarketingLayout.tsx       # Header + hero + content + CTA + footer
  templates/
    TicketConfirmation.tsx
    EventReminder.tsx
    PasswordReset.tsx
    WelcomeEmail.tsx
    WeeklyNewsletter.tsx
  styles/
    tokens.ts            # Colors, spacing (shared with app)
  build.ts               # Script to render all templates to HTML
```

### Testing Strategy

1. **Development:** React Email dev server (free, instant feedback)
2. **Cross-client testing:** Email on Acid ($74-134/month, better value than Litmus post-2025 pricing)
3. **Automated testing:** Mailtrap for CI/CD email testing (free tier for dev)
4. **Dark mode:** Manual testing on Apple Mail (dark mode) + Gmail (auto-inversion)

### Key Technical Decisions

| Decision | Recommendation | Rationale |
|---|---|---|
| Framework | React Email | Matches existing React/TS/Tailwind stack |
| Responsive approach | Hybrid/spongy | Works everywhere, media queries enhance |
| Image format | PNG/JPEG (2x for retina) | Universal support |
| Font strategy | System font stack for body, web font for headers | 58% of readers (Apple Mail) see custom fonts |
| Dark mode | `prefers-color-scheme` + safe color choices | Cover ~60% with custom styles, safe defaults for the rest |
| Interactivity | Animated GIFs only | AMP/CSS animations have insufficient reach |
| Mautic integration | Build-time HTML rendering | Pre-render React Email to HTML Mautic themes |
| Transactional emails | Supabase Edge Function + SMTP API | Direct rendering for immediate delivery |
| Testing | Email on Acid + React Email dev server | Cost-effective cross-client testing |

---

## Sources

### Email Frameworks
- [Best HTML Email Builders for Developers in 2026 - Sequenzy](https://www.sequenzy.com/blog/best-html-email-builders-for-developers)
- [Email Frameworks Comparison - Blocks](https://useblocks.io/blog/frameworks-comparison/)
- [Top 10 Best Responsive Email Frameworks 2025 - XHTML Team](https://www.xhtmlteam.com/blog/top-10-best-responsive-email-frameworks-2025/)
- [Email Markup Development in React 2025 - Voskoboinyk](https://voskoboinyk.com/posts/2025-01-29-state-of-email-markup)
- [The Top Email Frameworks for DIY Development - Email on Acid](https://www.emailonacid.com/blog/article/email-development/best-email-frameworks/)
- [MJML & Maizzle vs Raw HTML - Email Mavlers](https://www.emailmavlers.com/blog/mjml-maizzle-vs-raw-html/)
- [react-email vs mjml-react - npm-compare](https://npm-compare.com/mjml-react,react-email)

### React Email
- [React Email Official Site](https://react.email)
- [React Email 3.0 Release - Resend](https://resend.com/blog/react-email-3)
- [React Email 5.0 Release - Resend](https://resend.com/blog/react-email-5)
- [React Email GitHub - Resend](https://github.com/resend/react-email)
- [Custom Auth Emails with React Email and Resend - Supabase Docs](https://supabase.com/docs/guides/functions/examples/auth-send-email-hook-react-email-resend)
- [Send emails with Supabase - Resend](https://resend.com/supabase)
- [@react-email/render - npm](https://www.npmjs.com/package/@react-email/render)
- [@react-email/components - npm](https://www.npmjs.com/package/@react-email/components)

### Responsive and Dark Mode
- [Understanding Hybrid and Responsive Email Design - Litmus](https://www.litmus.com/blog/understanding-responsive-and-hybrid-email-design)
- [Responsive Email Design Tutorial 2026 - Mailtrap](https://mailtrap.io/blog/responsive-email-design/)
- [Ultimate Guide to Dark Mode - Litmus](https://www.litmus.com/blog/the-ultimate-guide-to-dark-mode-for-email-marketers)
- [Dark Mode for Email - Email on Acid](https://www.emailonacid.com/blog/article/email-development/dark-mode-for-email/)
- [Dark Mode CSS Guide - Jeffrey Overmeer](https://www.jeffreyovermeer.com/how-to-code-dark-mode-email-seamless-css-guide)
- [Dark Mode Email Optimization - Designmodo](https://help.designmodo.com/article/476-dark-mode-email-design)

### Email Client Compatibility
- [Complete Guide to Email Client Compatibility 2025 - Email Developer](https://email-dev.com/the-complete-guide-to-email-client-compatibility-in-2025/)
- [Outlook HTML Email Rendering Issues 2025 - Mailsoftly](https://mailsoftly.com/blog/why-does-my-outlook-look-different/)
- [Outlook Rendering Issues and Solutions - Litmus](https://www.litmus.com/blog/a-guide-to-rendering-differences-in-microsoft-outlook-clients)
- [How to Code Emails for Outlook - Email on Acid](https://www.emailonacid.com/blog/article/email-development/how-to-code-emails-for-outlook/)
- [Can I Email - Support Tables](https://www.caniemail.com/)
- [HTML and CSS in Emails 2026 - Designmodo](https://designmodo.com/html-css-emails/)

### Images and SVG
- [Understanding Retina Images in HTML Email - Litmus](https://www.litmus.com/blog/understanding-retina-images-in-html-email)
- [SVG Support in Email - CSS-Tricks](https://css-tricks.com/a-guide-on-svg-support-in-email/)
- [SVG Image Format - Can I Email](https://www.caniemail.com/features/image-svg/)
- [Microsoft Retiring Inline SVG in Outlook - Topedia](https://blog-en.topedia.com/2025/08/microsoft-is-retiring-support-for-inline-svg-images-in-outlook/)

### Fonts and Typography
- [Ultimate Guide to Web Fonts - Litmus](https://www.litmus.com/blog/the-ultimate-guide-to-web-fonts)
- [Email Safe Fonts vs Custom Fonts - Email on Acid](https://www.emailonacid.com/blog/article/email-development/best-font-for-email-everything-you-need-to-know-about-email-safe-fonts/)
- [Best Email Fonts 2025 - Moosend](https://moosend.com/blog/best-email-fonts/)
- [Typography - Mailchimp Email Design Reference](https://templates.mailchimp.com/design/typography/)
- [Email-Safe Fonts vs Custom Fonts 2026 - Omnisend](https://www.omnisend.com/blog/email-safe-fonts-vs-custom-fonts/)

### Interactive Email
- [10 Email Animation Techniques 2026 - Mailmodo](https://www.mailmodo.com/guides/email-animation/)
- [AMP Email Support 2025 - Mailmodo](https://www.mailmodo.com/guides/amp-email-support/)
- [CSS Animation in Email - Campaign Monitor](https://www.campaignmonitor.com/resources/guides/css-animation-in-email-keyframes-transitions-and-sample-code/)
- [AMP for Gmail - Google](https://developers.google.com/workspace/gmail/ampemail)
- [CSS Animations in Email - Litmus](https://www.litmus.com/blog/understanding-css-animations-in-email-transitions-and-keyframe-animations)

### Template Management and Testing
- [Email Template Testing Workflow - Email Mavlers](https://www.emailmavlers.com/blog/email-template-testing-workflow/)
- [Email on Acid vs Litmus - Email Warmup](https://emailwarmup.com/blog/email-testing/email-on-acid-vs-litmus/)
- [Email Testing Tools 2025 - Testrigor](https://testrigor.com/blog/email-testing-tools/)
- [Email Preview Tools 2026 - Mailtrap](https://mailtrap.io/blog/email-preview/)

### Design Systems
- [Scaling Email Design System 2025 - Mailjet](https://www.mailjet.com/blog/email-best-practices/email-design-system/)
- [Guide to Email Design System - Parcel](https://parcel.io/guides/email-design-system)
- [Email Design System - Litmus](https://www.litmus.com/blog/email-design-system)
- [Email Design System Template - Litmus](https://www.litmus.com/email-templates/email-design-system)

### Mautic
- [Mautic Theme Development - Mautic Developer Docs](https://devdocs.mautic.org/en/5.x/themes/getting_started.html)
- [Mautic Advanced Templates Plugin - GitHub](https://github.com/Logicify/mautic-advanced-templates-bundle)
- [Mautic Creating Themes - Mautic Docs](https://docs.mautic.org/en/5.x/builders/creating_themes.html)
- [Mautic Emails - Developer Docs](https://devdocs.mautic.org/en/latest/components/emails.html)

### Cerberus and Foundation
- [Cerberus Email Templates](https://www.cerberusemail.com/templates)
- [Cerberus GitHub - emailmonday](https://github.com/emailmonday/Cerberus)
- [Foundation for Emails](https://get.foundation/emails.html)
- [Foundation Emails Abandoned? - GitHub Issue](https://github.com/foundation/foundation-emails/issues/884)
