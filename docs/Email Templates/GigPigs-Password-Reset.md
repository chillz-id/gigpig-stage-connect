# GigPigs: Password Reset

**Subject:** Reset your GigPigs password

## Variables
| Variable | Description |
|----------|-------------|
| `{{first_name}}` | User's first name (optional) |
| `{{reset_url}}` | Password reset link |

## Content

### HEADER
- GigPigs logo

### BODY

```
Hi {{first_name}},

We received a request to reset your password.

[Reset Password → {{reset_url}}]

This link expires in 24 hours.

If you didn't request this, you can safely ignore this email. Your password won't change.

The GigPigs Team
```

### FOOTER
- Minimal footer
- No unsubscribe (transactional)
