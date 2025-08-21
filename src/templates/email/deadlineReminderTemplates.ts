export const deadline24HourTemplate = {
  subject: 'Action Required: Confirm Your Spot for {{event_name}}',
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmation Reminder</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #2563eb; color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; }
    .button { display: inline-block; background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .deadline-box { background-color: #fef3c7; border: 2px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .event-details { background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .footer { background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Confirmation Reminder</h1>
      <p style="margin: 0; font-size: 18px;">24 Hours Remaining</p>
    </div>
    
    <div class="content">
      <p>Hi {{comedian_name}},</p>
      
      <p>This is a reminder that you need to confirm your <strong>{{spot_type}}</strong> spot for the following event:</p>
      
      <div class="event-details">
        <h3 style="margin-top: 0;">{{event_name}}</h3>
        <p><strong>Date:</strong> {{event_date}}</p>
        <p><strong>Time:</strong> {{event_time}}</p>
        <p><strong>Venue:</strong> {{venue}}</p>
      </div>
      
      <div class="deadline-box">
        <h3 style="margin-top: 0; color: #f59e0b;">⏰ Confirmation Deadline</h3>
        <p style="font-size: 18px; margin: 5px 0;"><strong>{{deadline}}</strong></p>
        <p style="margin: 5px 0;">You have <strong>{{hours_remaining}} hours</strong> remaining to confirm.</p>
      </div>
      
      <p>Please confirm your availability as soon as possible to secure your spot.</p>
      
      <div style="text-align: center;">
        <a href="{{confirmation_url}}" class="button">Confirm Your Spot</a>
      </div>
      
      <p><strong>What happens if I don't confirm?</strong><br>
      If you don't confirm by the deadline, your spot will be automatically released and offered to another comedian.</p>
      
      <p>If you have any questions or need to discuss this booking, please contact the event organizer directly.</p>
      
      <p>Best regards,<br>
      Stand Up Sydney Team</p>
    </div>
    
    <div class="footer">
      <p>© 2024 Stand Up Sydney. All rights reserved.</p>
      <p>You're receiving this email because you've been assigned to perform at an event.</p>
    </div>
  </div>
</body>
</html>
  `,
  text: `
Hi {{comedian_name}},

This is a reminder that you need to confirm your {{spot_type}} spot for "{{event_name}}".

Event Details:
- Date: {{event_date}}
- Time: {{event_time}}
- Venue: {{venue}}

CONFIRMATION DEADLINE: {{deadline}}
Time Remaining: {{hours_remaining}} hours

Please confirm your availability: {{confirmation_url}}

If you don't confirm by the deadline, your spot will be automatically released.

Best regards,
Stand Up Sydney Team
  `
};

export const deadline6HourTemplate = {
  subject: 'URGENT: {{hours_remaining}} Hours to Confirm Your Spot',
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Urgent Confirmation Required</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #dc2626; color: white; padding: 30px; text-align: center; }
    .urgent-banner { background-color: #fef2f2; border: 2px solid #dc2626; padding: 15px; text-align: center; color: #dc2626; font-weight: bold; }
    .content { padding: 30px; }
    .button { display: inline-block; background-color: #dc2626; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-size: 18px; font-weight: bold; }
    .deadline-box { background-color: #fef2f2; border: 3px solid #dc2626; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
    .event-details { background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .footer { background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="urgent-banner">
      ⚠️ URGENT ACTION REQUIRED ⚠️
    </div>
    
    <div class="header">
      <h1>URGENT: Confirmation Required</h1>
      <p style="margin: 0; font-size: 24px;">Only {{hours_remaining}} Hours Remaining!</p>
    </div>
    
    <div class="content">
      <p>Hi {{comedian_name}},</p>
      
      <p><strong>URGENT:</strong> You have only <strong>{{hours_remaining}} hours</strong> left to confirm your <strong>{{spot_type}}</strong> spot!</p>
      
      <div class="deadline-box">
        <h2 style="margin: 0; color: #dc2626;">⏰ DEADLINE APPROACHING</h2>
        <p style="font-size: 24px; margin: 10px 0; color: #dc2626;"><strong>{{deadline}}</strong></p>
      </div>
      
      <div class="event-details">
        <h3 style="margin-top: 0;">Event: {{event_name}}</h3>
        <p><strong>Date:</strong> {{event_date}}</p>
        <p><strong>Time:</strong> {{event_time}}</p>
        <p><strong>Venue:</strong> {{venue}}</p>
      </div>
      
      <div style="text-align: center;">
        <a href="{{confirmation_url}}" class="button">CONFIRM NOW</a>
      </div>
      
      <p style="color: #dc2626; font-weight: bold;">⚠️ If you do not confirm within the next {{hours_remaining}} hours, your spot will be automatically released to another comedian.</p>
      
      <p>This is an automated reminder. If you've already confirmed or declined this spot, please disregard this email.</p>
      
      <p>Best regards,<br>
      Stand Up Sydney Team</p>
    </div>
    
    <div class="footer">
      <p>© 2024 Stand Up Sydney. All rights reserved.</p>
      <p>This is an urgent system notification.</p>
    </div>
  </div>
</body>
</html>
  `,
  text: `
URGENT: Confirmation Required

Hi {{comedian_name}},

URGENT: You have only {{hours_remaining}} hours left to confirm your {{spot_type}} spot!

Event: {{event_name}}
Date: {{event_date}}
Time: {{event_time}}
Venue: {{venue}}

DEADLINE: {{deadline}}

CONFIRM NOW: {{confirmation_url}}

WARNING: If you do not confirm within the next {{hours_remaining}} hours, your spot will be automatically released.

Best regards,
Stand Up Sydney Team
  `
};

export const deadline1HourTemplate = {
  subject: 'FINAL NOTICE: 1 Hour to Confirm Your Spot',
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Final Notice</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #991b1b; color: white; padding: 30px; text-align: center; }
    .urgent-banner { background-color: #7f1d1d; color: white; padding: 20px; text-align: center; font-size: 20px; font-weight: bold; animation: pulse 2s infinite; }
    @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.8; } 100% { opacity: 1; } }
    .content { padding: 30px; }
    .button { display: inline-block; background-color: #991b1b; color: white; padding: 20px 50px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-size: 20px; font-weight: bold; }
    .deadline-box { background-color: #991b1b; color: white; padding: 30px; border-radius: 8px; margin: 20px 0; text-align: center; }
    .event-details { background-color: #fef2f2; border: 2px solid #dc2626; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .footer { background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="urgent-banner">
      🚨 FINAL NOTICE - 1 HOUR REMAINING 🚨
    </div>
    
    <div class="header">
      <h1 style="margin: 0; font-size: 36px;">FINAL NOTICE</h1>
      <p style="margin: 10px 0; font-size: 24px;">Your Spot Expires in 1 HOUR!</p>
    </div>
    
    <div class="content">
      <p>Hi {{comedian_name}},</p>
      
      <div class="deadline-box">
        <h2 style="margin: 0; font-size: 28px;">⏰ 1 HOUR REMAINING</h2>
        <p style="font-size: 20px; margin: 10px 0;">This is your FINAL CHANCE to confirm</p>
      </div>
      
      <p style="font-size: 18px; color: #dc2626; font-weight: bold;">Your {{spot_type}} spot for "{{event_name}}" will expire in 1 HOUR!</p>
      
      <div class="event-details">
        <h3 style="margin-top: 0; color: #dc2626;">Event Details:</h3>
        <p><strong>{{event_name}}</strong></p>
        <p>Date: {{event_date}}</p>
        <p>Time: {{event_time}}</p>
        <p>Venue: {{venue}}</p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{confirmation_url}}" class="button">CONFIRM NOW - LAST CHANCE</a>
      </div>
      
      <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; font-weight: bold; color: #dc2626;">What happens next:</p>
        <ul style="margin: 10px 0; color: #dc2626;">
          <li>In 1 hour, this spot will be automatically released</li>
          <li>Another comedian will be offered your spot</li>
          <li>You will lose this performance opportunity</li>
        </ul>
      </div>
      
      <p>If you're unable to perform, please click the link above and decline the spot so we can offer it to someone else.</p>
      
      <p style="font-weight: bold;">This is an automated system message. No further reminders will be sent.</p>
      
      <p>Best regards,<br>
      Stand Up Sydney Team</p>
    </div>
    
    <div class="footer">
      <p>© 2024 Stand Up Sydney. All rights reserved.</p>
      <p style="color: #dc2626; font-weight: bold;">FINAL NOTICE - NO FURTHER REMINDERS</p>
    </div>
  </div>
</body>
</html>
  `,
  text: `
🚨 FINAL NOTICE - 1 HOUR REMAINING 🚨

Hi {{comedian_name}},

This is your FINAL CHANCE to confirm your {{spot_type}} spot!

Your spot for "{{event_name}}" will expire in 1 HOUR!

Event Details:
- {{event_name}}
- Date: {{event_date}}
- Time: {{event_time}}
- Venue: {{venue}}

CONFIRM NOW - LAST CHANCE: {{confirmation_url}}

What happens next:
- In 1 hour, this spot will be automatically released
- Another comedian will be offered your spot
- You will lose this performance opportunity

This is an automated system message. No further reminders will be sent.

Best regards,
Stand Up Sydney Team
  `
};

export const deadlineExtendedTemplate = {
  subject: 'Good News: Deadline Extended for {{event_name}}',
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Deadline Extended</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #10b981; color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; }
    .button { display: inline-block; background-color: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .deadline-box { background-color: #d1fae5; border: 2px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .event-details { background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .footer { background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Good News!</h1>
      <p style="margin: 0; font-size: 18px;">Your Confirmation Deadline Has Been Extended</p>
    </div>
    
    <div class="content">
      <p>Hi {{comedian_name}},</p>
      
      <p>Good news! The confirmation deadline for your <strong>{{spot_type}}</strong> spot has been extended.</p>
      
      <div class="deadline-box">
        <h3 style="margin-top: 0; color: #10b981;">✅ New Extended Deadline</h3>
        <p style="font-size: 18px; margin: 5px 0;"><strong>{{new_deadline}}</strong></p>
        {{#if reason}}
        <p style="margin: 10px 0;"><strong>Reason:</strong> {{reason}}</p>
        {{/if}}
      </div>
      
      <div class="event-details">
        <h3 style="margin-top: 0;">Event Details</h3>
        <p><strong>Event:</strong> {{event_name}}</p>
        <p><strong>Date:</strong> {{event_date}}</p>
        <p><strong>Time:</strong> {{event_time}}</p>
        <p><strong>Venue:</strong> {{venue}}</p>
        <p><strong>Your Spot:</strong> {{spot_type}}</p>
      </div>
      
      <p>You now have additional time to confirm your availability for this performance.</p>
      
      <div style="text-align: center;">
        <a href="{{confirmation_url}}" class="button">View Spot Details</a>
      </div>
      
      <p>Please make sure to confirm before the new deadline to secure your spot.</p>
      
      <p>If you have any questions, please contact the event organizer.</p>
      
      <p>Best regards,<br>
      Stand Up Sydney Team</p>
    </div>
    
    <div class="footer">
      <p>© 2024 Stand Up Sydney. All rights reserved.</p>
      <p>You're receiving this email because your confirmation deadline has been extended.</p>
    </div>
  </div>
</body>
</html>
  `,
  text: `
Good News: Deadline Extended

Hi {{comedian_name}},

Good news! The confirmation deadline for your {{spot_type}} spot has been extended.

New Deadline: {{new_deadline}}
{{#if reason}}Reason: {{reason}}{{/if}}

Event Details:
- Event: {{event_name}}
- Date: {{event_date}}
- Time: {{event_time}}
- Venue: {{venue}}
- Your Spot: {{spot_type}}

You now have additional time to confirm your availability.

View Details: {{confirmation_url}}

Best regards,
Stand Up Sydney Team
  `
};