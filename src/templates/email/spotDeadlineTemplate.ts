// Email template for spot confirmation deadline reminder
export interface SpotDeadlineEmailData {
  comedianName: string;
  comedianEmail: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  venue: string;
  address: string;
  spotType: string;
  hoursRemaining: number;
  confirmationUrl: string;
  eventUrl: string;
  promoterName: string;
  promoterEmail: string;
}

export function generateSpotDeadlineEmailHtml(data: SpotDeadlineEmailData): string {
  const formattedDate = new Date(data.eventDate).toLocaleDateString('en-AU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const formattedTime = new Date(data.eventDate).toLocaleTimeString('en-AU', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const isUrgent = data.hoursRemaining <= 2;
  const urgencyColor = isUrgent ? '#dc3545' : '#ffc107';
  const urgencyText = isUrgent ? 'URGENT' : 'REMINDER';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${urgencyText}: Spot Confirmation Required</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                margin: 0;
                padding: 0;
                background-color: #f4f4f4;
                color: #333;
            }
            .container {
                max-width: 600px;
                margin: 20px auto;
                background: white;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                overflow: hidden;
            }
            .header {
                background: linear-gradient(135deg, ${urgencyColor} 0%, ${isUrgent ? '#c82333' : '#e0a800'} 100%);
                color: white;
                padding: 30px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: 600;
            }
            .header p {
                margin: 10px 0 0;
                font-size: 16px;
                opacity: 0.9;
            }
            .content {
                padding: 30px;
            }
            .countdown-box {
                background: ${isUrgent ? '#f8d7da' : '#fff3cd'};
                border: 2px solid ${urgencyColor};
                border-radius: 8px;
                padding: 25px;
                margin: 20px 0;
                text-align: center;
                font-size: 18px;
                font-weight: 600;
                color: ${isUrgent ? '#721c24' : '#856404'};
            }
            .countdown-number {
                font-size: 48px;
                font-weight: 700;
                color: ${urgencyColor};
                display: block;
                margin: 10px 0;
            }
            .event-summary {
                background: #f8f9fa;
                border-left: 4px solid ${urgencyColor};
                padding: 20px;
                margin: 20px 0;
                border-radius: 4px;
            }
            .event-summary h3 {
                color: ${urgencyColor};
                margin-top: 0;
                font-size: 18px;
            }
            .cta-button {
                display: inline-block;
                background: ${isUrgent ? '#dc3545' : '#28a745'};
                color: white;
                padding: 18px 40px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 700;
                text-align: center;
                margin: 20px 0;
                transition: background 0.3s;
                font-size: 18px;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            .cta-button:hover {
                background: ${isUrgent ? '#c82333' : '#218838'};
            }
            .secondary-button {
                display: inline-block;
                background: #6c757d;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 500;
                text-align: center;
                margin: 10px 10px 10px 0;
                transition: background 0.3s;
            }
            .secondary-button:hover {
                background: #5a6268;
            }
            .warning-box {
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 6px;
                padding: 15px;
                margin: 20px 0;
                color: #856404;
            }
            .footer {
                background: #f8f9fa;
                padding: 20px;
                text-align: center;
                color: #6c757d;
                font-size: 14px;
            }
            .footer a {
                color: #667eea;
                text-decoration: none;
            }
            @media (max-width: 600px) {
                .container {
                    margin: 10px;
                }
                .header, .content {
                    padding: 20px;
                }
                .countdown-number {
                    font-size: 36px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>⏰ ${urgencyText}</h1>
                <p>Spot Confirmation Required</p>
            </div>
            
            <div class="content">
                <div class="countdown-box">
                    <span class="countdown-number">${data.hoursRemaining}</span>
                    HOUR${data.hoursRemaining !== 1 ? 'S' : ''} REMAINING
                </div>

                <div class="event-summary">
                    <h3>📅 Event Summary</h3>
                    <p><strong>${data.eventTitle}</strong></p>
                    <p>📍 ${data.venue}</p>
                    <p>🗓️ ${formattedDate} at ${formattedTime}</p>
                    <p>🎤 ${data.spotType} spot</p>
                </div>

                <p>Hi ${data.comedianName},</p>
                <p>This is a ${isUrgent ? 'urgent' : ''} reminder that your spot confirmation for <strong>${data.eventTitle}</strong> is required <strong>within ${data.hoursRemaining} hour${data.hoursRemaining !== 1 ? 's' : ''}</strong>.</p>

                ${isUrgent ? `
                <div class="warning-box">
                    <strong>⚠️ URGENT:</strong> If you don't confirm within the next ${data.hoursRemaining} hour${data.hoursRemaining !== 1 ? 's' : ''}, your spot may be offered to another comedian.
                </div>
                ` : ''}

                <div style="text-align: center; margin: 30px 0;">
                    <a href="${data.confirmationUrl}" class="cta-button">
                        ${isUrgent ? '🚨 Confirm Now' : '✅ Confirm Spot'}
                    </a>
                    <br>
                    <a href="${data.eventUrl}" class="secondary-button">
                        📝 View Event Details
                    </a>
                </div>

                <div class="event-summary">
                    <h3>❓ Questions?</h3>
                    <p>If you have any questions, please contact:</p>
                    <p><strong>${data.promoterName}</strong><br>
                    <a href="mailto:${data.promoterEmail}">${data.promoterEmail}</a></p>
                </div>
            </div>

            <div class="footer">
                <p>This email was sent by Stand Up Sydney</p>
                <p>
                    <a href="${data.eventUrl}">View Event</a> | 
                    <a href="${data.confirmationUrl}">Confirm Spot</a>
                </p>
            </div>
        </div>
    </body>
    </html>
  `;
}

export function generateSpotDeadlineEmailText(data: SpotDeadlineEmailData): string {
  const formattedDate = new Date(data.eventDate).toLocaleDateString('en-AU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const formattedTime = new Date(data.eventDate).toLocaleTimeString('en-AU', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const isUrgent = data.hoursRemaining <= 2;
  const urgencyText = isUrgent ? 'URGENT' : 'REMINDER';

  return `
⏰ ${urgencyText}: SPOT CONFIRMATION REQUIRED

Hi ${data.comedianName}!

This is a ${isUrgent ? 'urgent' : ''} reminder that your spot confirmation for ${data.eventTitle} is required within ${data.hoursRemaining} hour${data.hoursRemaining !== 1 ? 's' : ''}.

EVENT DETAILS:
- Event: ${data.eventTitle}
- Date: ${formattedDate}
- Time: ${formattedTime}
- Venue: ${data.venue}
- Address: ${data.address}
- Spot Type: ${data.spotType}

${isUrgent ? `⚠️ URGENT: If you don't confirm within the next ${data.hoursRemaining} hour${data.hoursRemaining !== 1 ? 's' : ''}, your spot may be offered to another comedian.

` : ''}CONFIRM YOUR SPOT NOW:
${data.confirmationUrl}

VIEW EVENT DETAILS:
${data.eventUrl}

QUESTIONS?
If you have any questions, please contact:
${data.promoterName}
${data.promoterEmail}

---
This email was sent by Stand Up Sydney
  `;
}