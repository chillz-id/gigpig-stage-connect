# Stand Up Sydney: Post-Show Thank You

**Subject:** Thanks for coming to {{event_name}}! 🎤

## Variables
| Variable | Description |
|----------|-------------|
| `{{first_name}}` | Attendee's first name |
| `{{event_name}}` | Show name |
| `{{event_date}}` | Show date |
| `{{venue_name}}` | Venue |
| `{{lineup}}` | Array of comedians (see below) |
| `{{google_review_url}}` | Google review link |

### Lineup Array
Each comedian in `{{lineup}}`:
| Variable | Description |
|----------|-------------|
| `{{comedian_name}}` | Stage name |
| `{{comedian_image}}` | Headshot |
| `{{comedian_instagram}}` | Instagram handle |
| `{{comedian_instagram_url}}` | Instagram profile URL |

## Content

### HEADER
- Stand Up Sydney logo
- "Thanks for the laughs!"

### BODY

```
Hi {{first_name}},

Thanks for joining us at {{event_name}}!

We hope you had a great night. Here's the lineup from the show:

THE LINEUP:

{{#each lineup}}
[Comedian Photo]
{{comedian_name}}
[Follow on Instagram → {{comedian_instagram_url}}]
@{{comedian_instagram}}
{{/each}}

---

ENJOYED THE SHOW?

We'd love to hear from you! Leave us a Google review:

[Leave a Review → {{google_review_url}}]

---

UPCOMING SHOWS:

[Next event card]

See you at the next one!
Stand Up Sydney
```

### FOOTER
- Stand Up Sydney logo
- Social links
- Unsubscribe link
