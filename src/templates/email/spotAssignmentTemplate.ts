// Email template for spot assignment notification
export interface SpotAssignmentEmailData {
  comedianName: string;
  comedianEmail: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  venue: string;
  address: string;
  spotType: string;
  confirmationDeadline: string;
  confirmationUrl: string;
  eventUrl: string;
  promoterName: string;
  promoterEmail: string;
  performanceDuration?: string;
  specialInstructions?: string;
}

export function generateSpotAssignmentEmailHtml(data: SpotAssignmentEmailData): string {
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

  const deadlineDate = new Date(data.confirmationDeadline).toLocaleDateString('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit'
  });

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Spot Assignment - ${data.eventTitle}</title>
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
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: 300;
            }
            .header p {
                margin: 10px 0 0;
                font-size: 16px;
                opacity: 0.9;
            }
            .content {
                padding: 30px;
            }
            .highlight-box {
                background: #f8f9fa;
                border-left: 4px solid #667eea;
                padding: 20px;
                margin: 20px 0;
                border-radius: 4px;
            }
            .event-details {
                background: #fff;
                border: 1px solid #e9ecef;
                border-radius: 6px;
                padding: 20px;
                margin: 20px 0;
            }
            .event-details h3 {
                color: #667eea;
                margin-top: 0;
                font-size: 18px;
            }
            .detail-row {
                display: flex;
                justify-content: space-between;
                margin: 10px 0;
                padding: 8px 0;
                border-bottom: 1px solid #f8f9fa;
            }
            .detail-row:last-child {
                border-bottom: none;
            }
            .detail-label {
                font-weight: 600;
                color: #495057;
            }
            .detail-value {
                color: #6c757d;
                text-align: right;
            }
            .cta-button {
                display: inline-block;
                background: #28a745;
                color: white;
                padding: 15px 30px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                text-align: center;
                margin: 20px 0;
                transition: background 0.3s;
            }
            .cta-button:hover {
                background: #218838;
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
            .deadline-warning {
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 6px;
                padding: 15px;
                margin: 20px 0;
                color: #856404;
            }
            .deadline-warning strong {
                color: #dc3545;
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
                .detail-row {
                    flex-direction: column;
                }
                .detail-value {
                    text-align: left;
                    margin-top: 5px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎤 Spot Assignment</h1>
                <p>Congratulations! You've been selected to perform</p>
            </div>
            
            <div class="content">
                <div class="highlight-box">
                    <h2>Hi ${data.comedianName}!</h2>
                    <p>Great news! You've been assigned a <strong>${data.spotType}</strong> spot at <strong>${data.eventTitle}</strong>.</p>
                </div>

                <div class="event-details">
                    <h3>📅 Event Details</h3>
                    <div class="detail-row">
                        <span class="detail-label">Event:</span>
                        <span class="detail-value">${data.eventTitle}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Date:</span>
                        <span class="detail-value">${formattedDate}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Time:</span>
                        <span class="detail-value">${formattedTime}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Venue:</span>
                        <span class="detail-value">${data.venue}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Address:</span>
                        <span class="detail-value">${data.address}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Spot Type:</span>
                        <span class="detail-value">${data.spotType}</span>
                    </div>
                    ${data.performanceDuration ? `
                    <div class="detail-row">
                        <span class="detail-label">Duration:</span>
                        <span class="detail-value">${data.performanceDuration}</span>
                    </div>
                    ` : ''}
                    <div class="detail-row">
                        <span class="detail-label">Promoter:</span>
                        <span class="detail-value">${data.promoterName}</span>
                    </div>
                </div>

                <div class="deadline-warning">
                    <strong>⏰ Action Required:</strong> Please confirm your availability by <strong>${deadlineDate}</strong>
                </div>

                <div style="text-align: center; margin: 30px 0;">
                    <a href="${data.confirmationUrl}" class="cta-button">
                        ✅ Confirm Spot
                    </a>
                    <br>
                    <a href="${data.eventUrl}" class="secondary-button">
                        📝 View Event Details
                    </a>
                </div>

                ${data.specialInstructions ? `
                <div class="highlight-box">
                    <h3>📋 Special Instructions</h3>
                    <p>${data.specialInstructions}</p>
                </div>
                ` : ''}

                <div class="highlight-box">
                    <h3>❓ Questions?</h3>
                    <p>If you have any questions about this performance, please contact:</p>
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

export function generateSpotAssignmentEmailText(data: SpotAssignmentEmailData): string {
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

  const deadlineDate = new Date(data.confirmationDeadline).toLocaleDateString('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit'
  });

  return `
🎤 SPOT ASSIGNMENT - ${data.eventTitle}

Hi ${data.comedianName}!

Congratulations! You've been assigned a ${data.spotType} spot at ${data.eventTitle}.

EVENT DETAILS:
- Event: ${data.eventTitle}
- Date: ${formattedDate}
- Time: ${formattedTime}
- Venue: ${data.venue}
- Address: ${data.address}
- Spot Type: ${data.spotType}
${data.performanceDuration ? `- Duration: ${data.performanceDuration}` : ''}
- Promoter: ${data.promoterName}

⏰ ACTION REQUIRED:
Please confirm your availability by ${deadlineDate}

CONFIRM YOUR SPOT:
${data.confirmationUrl}

VIEW EVENT DETAILS:
${data.eventUrl}

${data.specialInstructions ? `SPECIAL INSTRUCTIONS:
${data.specialInstructions}

` : ''}QUESTIONS?
If you have any questions about this performance, please contact:
${data.promoterName}
${data.promoterEmail}

---
This email was sent by Stand Up Sydney
  `;
}