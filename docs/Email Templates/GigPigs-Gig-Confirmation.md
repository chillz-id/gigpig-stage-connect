# GigPigs: Gig Confirmation

**Subject:** You're confirmed for {{event_name}}! 🎤

## Variables
| Variable | Description |
|----------|-------------|
| `{{first_name}}` | Comedian's first name |
| `{{event_name}}` | Show name |
| `{{venue_name}}` | Venue |
| `{{date}}` | Show date (formatted) |
| `{{time}}` | Door/start time |
| `{{role}}` | Their role (Headliner, Feature, Open Spot, etc.) |
| `{{notes}}` | Any special notes (optional) |
| `{{my_gigs_url}}` | https://gigpigs.app/my-gigs |

## Content

### HEADER
- GigPigs logo
- "Gig Confirmed!"

### BODY

```
Hi {{first_name}},

Great news – you're confirmed for {{event_name}}!

GIG DETAILS:

Event:    {{event_name}}
Venue:    {{venue_name}}
Date:     {{date}}
Time:     {{time}}
Role:     {{role}}

{{#if notes}}
Notes: {{notes}}
{{/if}}

[View My Gigs → https://gigpigs.app/my-gigs]

REMINDERS:
• Arrive at least 15 minutes early
• Bring your A-game material
• Stick to your allocated time

Questions? Reply to this email.

Break a leg!
The GigPigs Team
```

### FOOTER
- Social links
- Unsubscribe
