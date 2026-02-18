# Transactional Email Best Practices: State of the Art (2025-2026)

A comprehensive research document covering design, content, deliverability, technical implementation, timing, and legal compliance for transactional emails -- with a focus on Australian business requirements.

---

## 1. Types of Transactional Emails

Transactional emails are automated, non-promotional messages sent in direct response to a user action or system event. They are distinct from marketing/promotional emails and enjoy different legal treatment under most jurisdictions. The key categories are:

### Account Lifecycle
- **Account verification / Double opt-in** -- Confirms email ownership, activates account. Typically contains a single verification link/button.
- **Welcome email** -- Sent immediately after registration. Orients the user, sets expectations, may include getting-started steps.
- **Password reset** -- Security-critical. Contains a time-limited reset link. Must arrive within seconds.
- **Two-factor authentication codes** -- OTP delivery. Absolute fastest delivery requirement of any email type.
- **Account change notifications** -- Email changed, password changed, new login detected. Security-focused.

### Commerce & Payments
- **Order confirmation** -- Confirms a purchase was received. Includes order number, items, totals, estimated delivery.
- **Payment receipt / Invoice** -- Digital receipt confirming payment processed. Includes amount, payment method (last 4 digits), date.
- **Subscription renewal / billing** -- Upcoming charge notification, failed payment alerts, plan changes.
- **Refund confirmation** -- Confirms refund processed, expected timeline for funds to appear.

### Fulfillment & Delivery
- **Shipping notification** -- Package dispatched with tracking number and carrier link.
- **Delivery confirmation** -- Package delivered.
- **Digital delivery** -- E-ticket, download link, license key, access credentials.

### Engagement & Re-engagement
- **Booking/reservation confirmation** -- Event details, date/time, venue, QR code or ticket.
- **Appointment reminders** -- Upcoming event/appointment with "Add to Calendar" link.
- **Abandoned cart** (borderline transactional/marketing -- treat as marketing for legal safety).
- **Feedback/review request** (borderline -- treat as marketing under Australian law).

### Administrative
- **Legal/policy updates** -- Terms of service changes, privacy policy updates.
- **Security alerts** -- Suspicious activity, breach notifications.
- **Export/report ready** -- Data export completed, report generated.

Sources: [Mailgun](https://www.mailgun.com/blog/email/what-is-transactional-email-basics/), [Klaviyo](https://www.klaviyo.com/blog/transactional-email), [Pushwoosh](https://www.pushwoosh.com/blog/transactional-emails/)

---

## 2. Design Best Practices

### Layout Principles

**Single-column layout is the standard.** A single column adapts to all screen sizes, reduces cognitive load, and forces a clear visual hierarchy. Multi-column layouts break on Outlook and older clients.

**Information hierarchy (top to bottom):**
1. Brand mark (small logo, not a hero banner)
2. Primary message (what happened)
3. Key details (order number, amount, date, items)
4. Call-to-action (if applicable)
5. Supporting details (shipping address, payment method)
6. Footer (contact info, legal, social links)

**Above-the-fold content** -- The most critical information (confirmation status + order/booking number) must be visible without scrolling. On mobile, "above the fold" is roughly 300-400px.

### Mobile Responsiveness

With ~46% of emails opened on mobile (and Apple Mail commanding 58% of email client market share as of 2025), mobile-first design is non-negotiable:

- **Minimum touch target**: 44x44px for buttons (Apple HIG standard)
- **Minimum font size**: 14px body text, 22px+ headings
- **Max email width**: 600px (industry standard), scales down to 320px viewport
- **Padding**: Generous whitespace -- at least 16px gutters on mobile
- **Buttons over links**: Large, tappable buttons rather than inline text links for primary CTAs

### CTA Placement

- **One primary CTA per email** -- "View Order", "Reset Password", "Track Package"
- Place it **above the fold** and optionally repeat it at the bottom for long emails
- Use **high-contrast, brand-colored buttons** (not links)
- Button text should be action-oriented and specific: "Track Your Package" not "Click Here"
- Minimum button dimensions: 44px height, full-width on mobile

### What Great Companies Do

**Stripe** is widely considered the gold standard for transactional email design. Their receipts use:
- Clean, minimal layout with generous whitespace
- Strong typographic hierarchy -- monospace fonts for numerical/financial data
- No decorative images -- pure information architecture
- Clear itemization of charges with perfect alignment
- Subtle brand presence (small logo, brand colors in accents only)

**Linear** uses:
- Ultra-minimal notifications that feel like part of the product
- Dark/light mode awareness
- System font stack for native feel
- Notification content front-and-center with zero chrome

**Notion** uses:
- Simple, clean templates with their signature serif headings
- Contextual previews of the content being shared
- Minimal branding -- just enough to be recognizable

**Postmark** (who literally wrote the book on transactional email) recommends:
- Remove heavy branding from high-frequency notifications
- For users receiving dozens of notifications daily, strip away unnecessary visual elements
- Treat each email type differently -- a password reset needs different weight than a weekly digest

Sources: [Really Good Emails](https://reallygoodemails.com/emails/transactional-email-design-from-stripe), [Postmark](https://postmarkapp.com/guides/transactional-email-best-practices), [Brevo](https://www.brevo.com/blog/transactional-email-design-examples/), [Chamaileon](https://chamaileon.io/resources/transactional-emails/)

---

## 3. Content Best Practices

### Subject Lines

**Keep them under 50 characters** for full mobile visibility. Transactional subject lines must communicate exactly what happened -- no cleverness, no ambiguity.

Effective patterns:
- `Your order #12345 is confirmed` (order confirmation)
- `Reset your password` (password reset)
- `Your booking for [Event] on [Date]` (booking confirmation)
- `Payment received - $35.00` (receipt)
- `Your package has shipped` (shipping notification)
- `[App Name] - Verify your email` (account verification)

Avoid:
- Vague subject lines like "Important update" or "Action required"
- Exclamation marks or ALL CAPS (spam trigger)
- Emoji in transactional emails (they reduce perceived seriousness for financial/security emails)

### Preheader Text

The preheader (preview text shown after the subject line in inbox view) should extend the subject line, not repeat it:
- Subject: `Your order #12345 is confirmed`
- Preheader: `2 items totaling $70.00 - arriving by March 5`

If you don't set preheader text explicitly, email clients will pull the first line of body text, which is often "View in browser" or navigation text -- a wasted opportunity.

### Personalization

At minimum:
- Recipient's first name in greeting
- Specific transaction details (order number, item names, amounts)
- Contextual timing ("Your event is tomorrow")

Advanced:
- Location-aware content (venue directions with local map links)
- Device-aware content (mobile ticket vs. printable PDF)
- Past behavior context ("Your 3rd booking with us")

### Clear Action Items

Every transactional email should answer three questions:
1. **What happened?** (Your order was confirmed)
2. **What do you need to do?** (Nothing / Click to verify / Review your receipt)
3. **Where do you get help?** (Reply to this email / Contact support link)

### Tone and Voice

Transactional does not mean robotic. The tone should be:
- **Calm and reliable** for financial emails (Stripe-style)
- **Warm and welcoming** for onboarding emails
- **Urgent but not alarming** for security alerts
- **Helpful and specific** for fulfillment emails

Sources: [Zoho Zeptomail](https://www.zoho.com/zeptomail/articles/transactional-email-subject-lines.html), [Postmark](https://postmarkapp.com/guides/transactional-email-best-practices), [Moosend](https://moosend.com/blog/email-subject-line-best-practices/)

---

## 4. Deliverability

### Authentication: SPF, DKIM, DMARC

As of 2024-2025, email authentication is **mandatory** -- Google, Yahoo, and Microsoft all enforce it for bulk senders (5,000+ emails/day), and it materially helps all senders. Authenticated senders are up to **2.7x more likely to reach the inbox**.

**SPF (Sender Policy Framework)**
- Publishes which IP addresses may send on behalf of your domain
- Keep records concise: **under 10 DNS lookups** (hard limit)
- Include all third-party senders (your ESP, Supabase edge functions, etc.)

**DKIM (DomainKeys Identified Mail)**
- Cryptographic signature proving the email was not tampered with
- Use **2048-bit keys** as the default (1024-bit is deprecated by best practice)
- Organize selectors for easy key rotation without breaking outbound mail

**DMARC (Domain-based Message Authentication, Reporting & Conformance)**
- Tells receivers what to do when SPF/DKIM alignment fails
- **Safe rollout sequence**: `p=none` (monitoring) -> `p=quarantine` -> `p=reject`
- Never jump straight to `p=reject` before inventorying all senders
- Only ~18% of top domains have valid DMARC; only 7-8% enforce quarantine/reject
- Set up DMARC reporting (`rua` tag) to monitor who is sending as your domain

### Sender Reputation

- **Spam complaint rate must stay below 0.3%** (Google's enforcement threshold). Google recommends **below 0.1%** for reliable inbox placement.
- Transactional emails typically have much higher engagement than marketing (38% median open rate vs. 17%), which helps reputation.
- Use a **branded sender address** (e.g., `bookings@standupsydney.com`), never a free webmail address.
- Monitor bounce rates and remove invalid addresses promptly.

### Dedicated IP vs. Shared IP

| Factor | Dedicated IP | Shared IP |
|--------|-------------|-----------|
| **Control** | Full control over reputation | Reputation shared with other senders |
| **Volume requirement** | Need consistent volume to maintain warm IP | Provider manages warmup |
| **Cost** | Higher | Included in most plans |
| **Best for** | High-volume senders (50k+/month) | Low-to-medium volume |
| **Risk** | Must warm up yourself; cold IP = poor delivery | Bad neighbors can hurt you |

**For most small-to-medium businesses**, a shared IP from a reputable transactional email provider (Postmark, Resend, AWS SES) is the right choice. The provider's overall reputation carries you.

### Transactional vs. Marketing Separation

**This is the single most important deliverability decision.** The overwhelming consensus among email experts:

- **Use separate subdomains**: `mail.standupsydney.com` for transactional, `news.standupsydney.com` for marketing
- **Use separate ESP accounts or message streams** (Postmark enforces this by design)
- **Separate IP addresses** if volume justifies it
- **Never mix** promotional content into transactional emails -- if you add a marketing banner to a receipt, ISPs may treat the entire stream as marketing
- The local part of the email address (e.g., `bookings@` vs `hello@`) does NOT provide reputation separation -- ISPs judge at the domain/subdomain level

### Google/Yahoo 2024-2025 Bulk Sender Requirements

Enforced since February 2024, with full enforcement (including rejections) as of November 2025:

1. **SPF and DKIM authentication** required for all senders
2. **DMARC** required (at minimum `p=none`)
3. **One-click unsubscribe** (List-Unsubscribe header) required for marketing emails. **Not required for transactional emails.**
4. **Spam complaint rate** below 0.3%
5. **Valid forward and reverse DNS** for sending IPs
6. **TLS encryption** for email transmission

**Microsoft (Outlook.com)** added similar requirements effective May 2025 for senders of 5,000+ daily emails to Outlook.com addresses.

Sources: [SalesHive](https://saleshive.com/blog/dkim-dmarc-spf-best-practices-email-security-deliverability/), [Mailgun](https://www.mailgun.com/state-of-email-deliverability/chapter/email-authentication-requirements/), [Suped](https://www.suped.com/knowledge/email-deliverability/sender-reputation/should-transactional-and-marketing-emails-be-sent-from-separate-domains-or-subdomains), [Email Warmup](https://emailwarmup.com/blog/gmail-and-yahoo-bulk-sender-requirements/), [Proofpoint](https://www.proofpoint.com/us/blog/email-and-cloud-threats/clock-ticking-stricter-email-authentication-enforcements-google-start)

---

## 5. Technical Best Practices

### HTML Email Compatibility

Email HTML is **not web HTML**. Email clients use wildly different rendering engines:

| Client | Rendering Engine | Market Share (2025) |
|--------|-----------------|-------------------|
| Apple Mail | WebKit | ~58% |
| Gmail | WebKit (with heavy CSS stripping) | ~30% |
| Outlook (desktop) | **Microsoft Word** | ~4% |
| Outlook (web) | Browser engine | ~3% |
| Yahoo Mail | Browser engine | ~2% |

**Coding rules:**
- **Use table-based layouts** -- Outlook's Word rendering engine does not support CSS flexbox, grid, float, or positioning
- **Inline all CSS** -- Gmail strips `<style>` tags in many contexts. Inline styles are the only guaranteed method
- **Max width 600px** with a fluid inner container
- **Use `<table>`, `<tr>`, `<td>`** for structure, not `<div>` (for Outlook compatibility)
- **Avoid CSS shorthand** -- `padding: 10px 20px` may break; use `padding-top`, `padding-right`, etc.
- **Use `border` attribute on tables**, not CSS borders (Outlook)
- **Always set `width` and `height` on images** to prevent layout shifts
- **Use absolute URLs** for all images and links
- **Include `role="presentation"` on layout tables** for accessibility

### Dark Mode Support

Dark mode is used by the majority of mobile users. Email clients handle dark mode in three ways:

1. **No change** -- email renders as-is
2. **Partial inversion** -- light backgrounds become dark; dark backgrounds left alone
3. **Full inversion** -- both light and dark colors are inverted

**Best practices:**
- Add the `color-scheme` meta tag and CSS property:
  ```html
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  ```
  ```css
  :root { color-scheme: light dark; }
  ```
- Use `@media (prefers-color-scheme: dark)` for dark-mode-specific styles
- **Avoid pure white (#FFFFFF) and pure black (#000000)** -- use off-white (#F7F7F7) and dark grey (#1A1A1A) to reduce aggressive inversion
- **Use transparent PNGs** for logos, or provide a logo version with padding/background that works on dark backgrounds
- **Test in Outlook** specifically -- it uses `[data-ogsc]` attribute selectors for dark mode targeting
- Consider dark mode from the start of your design process, not as an afterthought

### Image Handling

- **Gmail blocks images by default** -- users must enable them manually
- **Always include descriptive `alt` text** -- it's the only thing visible when images are blocked
- **Style your alt text** with `font-size`, `color`, and `font-family` so it looks intentional when images don't load
- **Host images on a reliable CDN** with HTTPS URLs
- **Don't use images for critical content** -- key information should be in live text
- **Optimize image file size** -- compress PNGs and JPEGs; consider using the smallest acceptable dimensions
- **Avoid background images** -- Outlook does not support CSS `background-image` (use VML fallbacks if absolutely necessary)

### Plain Text Alternatives

Every HTML email **must** include a `text/plain` MIME part:
- Some users explicitly prefer plain text
- Spam filters score emails with both HTML and plain text more favorably
- Screen readers may use the plain text version
- The plain text version should contain the same essential information, not just "View this email in your browser"

### Modern Tooling: React Email + Resend

The state-of-the-art developer experience for transactional email in 2025-2026 is **React Email** (open-source component library) paired with **Resend** (sending API):

- Write email templates as React components with full TypeScript support
- Components like `<Html>`, `<Head>`, `<Body>`, `<Container>`, `<Section>`, `<Row>`, `<Column>`, `<Button>`, `<Img>`, `<Text>`, `<Link>`, `<Hr>`, `<Preview>` (preheader)
- Compiles to battle-tested HTML with inline styles
- React Email v5.0 (2025) added dark mode preview support and Tailwind 4 compatibility
- Hot-reload preview server for development
- Handles the table-layout / inline-CSS complexity so you write modern React

**Alternatives**: MJML (markup language that compiles to responsive email HTML), Maizzle (Tailwind CSS for email), Postmark Templates (pre-built responsive templates on GitHub).

Sources: [Email Dev](https://email-dev.com/the-complete-guide-to-email-client-compatibility-in-2025/), [Litmus](https://www.litmus.com/blog/the-ultimate-guide-to-dark-mode-for-email-marketers), [Enchant Agency](https://www.enchantagency.com/blog/dark-mode-email-design-best-practices-css-guide-2026), [React Email](https://github.com/resend/react-email), [Resend](https://resend.com/blog/new-features-in-2025)

---

## 6. Timing

### Expected Delivery Times by Email Type

| Email Type | User Expectation | Target SLA |
|-----------|-----------------|------------|
| Password reset / OTP | Immediate | < 5 seconds |
| Account verification | Immediate | < 10 seconds |
| Order/booking confirmation | Immediate | < 30 seconds |
| Payment receipt | Immediate | < 30 seconds |
| Shipping notification | Near-immediate | < 2 minutes |
| Invoice/billing reminder | Same day | < 1 hour |
| Appointment reminder | Hours before event | Scheduled delivery |
| Feedback request | After interaction | 1-24 hours post-event |

**The industry benchmark**: Postmark delivers most transactional emails in **under 5 seconds**. Users have been conditioned to expect password resets and OTPs within seconds -- any delay beyond 30 seconds causes support tickets and abandoned flows.

### API Response Time

Your sending API call should complete in **under 100ms** (queue insertion + acknowledgment). The email should hit the recipient's inbox within seconds after that.

### Provider SLA Standards

- **99.9% uptime** = ~8.76 hours downtime per year (minimum acceptable)
- **99.99% uptime** = ~52.56 minutes downtime per year (premium tier)
- MailerSend commits to 99.5% monthly uptime
- Most premium providers (Postmark, Resend, AWS SES) target 99.99%

### Timing Strategies for Non-Immediate Emails

- **Appointment reminders**: Send 24 hours before AND 2 hours before the event
- **Feedback requests**: Send 1-2 hours after the event/interaction (while the experience is fresh)
- **Billing reminders**: Send 7 days before, 3 days before, and on the day of charge
- **Expiring content**: Send when there's still time to act (not after expiry)

Sources: [MailDiver](https://maildiver.com/blog/transactional-email-reliability-guide/), [Postmark](https://postmarkapp.com/guides/transactional-email-best-practices), [MailerSend](https://www.mailersend.com/legal/service-level-agreement)

---

## 7. Legal Requirements

### Australian Spam Act 2003

This is the primary legislation for an Australian business. Key points for transactional emails:

**Transactional emails are classified as "Designated Commercial Electronic Messages" (DCEMs)** and enjoy significant exemptions:

- **No consent required** -- Unlike marketing emails, DCEMs do not require opt-in consent
- **No unsubscribe facility required** -- DCEMs are not required to include a functional unsubscribe mechanism
- **Sender identification IS required** -- Even DCEMs must include accurate sender details:
  - Legal business name or your name + ABN (Australian Business Number)
  - Contact information
  - This information must remain **correct for at least 30 days** after sending

**Critical restriction -- no promotional content:**
- A DCEM must contain **only factual information**
- The moment you add a marketing banner, cross-sell recommendation, promotional offer, or upsell to a transactional email, the **entire message** becomes a commercial electronic message subject to full Spam Act requirements (consent + identification + unsubscribe)
- This is strictly enforced -- ACMA has increased enforcement actions in recent years

**What constitutes "factual information" for DCEMs:**
- Transaction details (order number, items, amounts)
- Business name, logo, and contact details
- Information directly related to the transaction
- Security-related information

**What would disqualify a DCEM:**
- "You might also like..." product recommendations
- Discount codes for future purchases
- Marketing banners or promotional graphics
- Social media follow prompts (borderline -- keep minimal if included)

### CAN-SPAM Act (United States)

Relevant if you have US customers:

- Transactional emails are **largely exempt** from CAN-SPAM if their **primary purpose** is transactional
- The one requirement that still applies: **no false or misleading routing information** (From address, reply-to, originating domain must be accurate)
- No unsubscribe requirement for purely transactional emails
- If an email mixes transactional and commercial content, the "primary purpose" test applies -- if the commercial content predominates, full CAN-SPAM compliance is required

### GDPR (European Union / UK)

Relevant if you have EU/UK customers:

- Transactional emails are permitted **without consent** under the "legitimate interest" or "contractual necessity" legal bases
- The email must be **necessary** to fulfill the transaction or communicate important information
- Data minimization applies -- only include personal data that's necessary
- Recipients retain rights to access, rectification, and erasure of their data
- Include a link to your privacy policy
- If you add marketing content to a transactional email, you need separate consent for the marketing portion

### Key Compliance Checklist for an Australian Business

For **pure transactional emails** (booking confirmations, receipts, password resets):

- [x] Include legal business name or name + ABN
- [x] Include accurate contact information (valid for 30+ days)
- [x] Keep content strictly factual -- no promotions
- [x] Accurate From address and routing information
- [x] Include privacy policy link (GDPR best practice, good practice generally)
- [ ] Unsubscribe link -- NOT required but consider including for non-critical emails
- [ ] Consent -- NOT required

For **emails that mix transactional + promotional content**:

- [x] All of the above, PLUS:
- [x] Prior consent from recipient (opt-in)
- [x] Functional unsubscribe mechanism
- [x] Honor unsubscribe requests within 5 business days (Spam Act) / 2 days (Google/Yahoo requirement)

**Recommendation**: Keep transactional emails purely transactional. If you want to cross-sell or promote, send a **separate** marketing email from a separate subdomain/stream. This protects your transactional deliverability, keeps you legally clean, and respects user expectations.

Sources: [ACMA](https://www.acma.gov.au/avoid-sending-spam), [LegalVision](https://legalvision.com.au/spam-act-exemptions/), [Sprintlaw](https://sprintlaw.com.au/articles/spam-act-2003-australia-compliance-guide-ecommerce-businesses/), [AJ Buckingham](https://www.ajbuckingham.com.au/understanding-the-spam-act-compliance-and-exemptions-for-businesses/), [FTC](https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business), [Infobip](https://www.infobip.com/blog/transactional-email-gdpr)

---

## 8. Recommended Architecture for a Modern Transactional Email System

### Sending Infrastructure

```
standupsydney.com              (website / primary domain)
  mail.standupsydney.com       (transactional emails -- booking confirmations, receipts, password resets)
  news.standupsydney.com       (marketing emails -- newsletters, promotions)
```

Each subdomain gets its own:
- SPF record
- DKIM key (2048-bit, unique selector)
- DMARC record (inherit from parent or set independently)
- Separate message stream / ESP account

### Recommended Technology Stack

| Layer | Recommendation | Rationale |
|-------|---------------|-----------|
| **Template authoring** | React Email | TypeScript components, dark mode support, compiles to compatible HTML |
| **Sending API** | Resend or Postmark | Purpose-built for transactional; both enforce stream separation |
| **Fallback/high-volume** | AWS SES | Cost-effective at scale, good Supabase integration |
| **Template testing** | Litmus or Email on Acid | Cross-client rendering previews |
| **Monitoring** | Provider analytics + DMARC reports | Track delivery, opens, bounces, complaints |

### Email Template Checklist

For every transactional email template, verify:

- [ ] **Subject line**: Clear, under 50 characters, describes the action
- [ ] **Preheader text**: Set explicitly, extends subject line
- [ ] **HTML version**: Table-based layout, inline CSS, 600px max width
- [ ] **Plain text version**: Contains all essential information
- [ ] **Dark mode**: Tested with `prefers-color-scheme` media query; no pure white/black
- [ ] **Images**: Alt text on all images; styled alt text; no critical info in images only
- [ ] **Mobile**: Responsive; min 44px touch targets; 14px+ body text
- [ ] **CTA**: One primary CTA, above the fold, high contrast button
- [ ] **Sender ID**: Business name + contact info in footer
- [ ] **No promotional content**: Strictly factual (Australian Spam Act compliance)
- [ ] **Cross-client tested**: Gmail, Apple Mail, Outlook desktop, Outlook web, mobile
- [ ] **Authentication**: SPF, DKIM, DMARC passing for sending subdomain

### Performance Targets

| Metric | Target |
|--------|--------|
| Delivery rate | > 99% |
| Open rate | > 80% (transactional benchmark) |
| Spam complaint rate | < 0.1% |
| Time to inbox (password reset/OTP) | < 5 seconds |
| Time to inbox (confirmations/receipts) | < 30 seconds |
| Bounce rate | < 2% |

---

## Summary of Key Takeaways

1. **Separate transactional from marketing** -- different subdomains, different streams, different ESPs if needed. This is the single highest-impact deliverability decision.

2. **Authentication is mandatory** -- SPF + DKIM + DMARC are table stakes as of 2024. Google, Yahoo, and Microsoft all enforce this. Roll out DMARC carefully: none -> quarantine -> reject.

3. **Keep transactional emails purely transactional** -- Under the Australian Spam Act 2003, adding any promotional content to a transactional email subjects the entire message to full commercial email requirements (consent + unsubscribe). Do not add marketing banners, cross-sells, or promotional offers.

4. **Design for mobile first, Outlook second** -- Single-column, table-based HTML, inline CSS, 600px max width. Test dark mode. Include styled alt text for images.

5. **Speed matters** -- Password resets and OTPs must arrive in under 5 seconds. Booking confirmations within 30 seconds. Use a purpose-built transactional email provider, not a general marketing platform.

6. **Use modern tooling** -- React Email + Resend (or Postmark) represents the current state of the art for developer experience without sacrificing email client compatibility.

7. **Subject lines: clarity over creativity** -- Transactional subject lines should tell the recipient exactly what happened in under 50 characters. Save the personality for the email body.

8. **Always include plain text** -- It improves deliverability, accessibility, and spam filter scoring.
