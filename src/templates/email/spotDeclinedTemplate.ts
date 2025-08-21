// Email template for spot declined notifications
export interface SpotDeclinedEmailData {
  comedianName: string;
  comedianEmail: string;
  promoterName: string;
  promoterEmail: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  venue: string;
  address: string;
  spotType: string;
  reason?: string;
  eventUrl: string;
  applicationsUrl: string;
  eventsUrl: string;
  isPromoterEmail?: boolean;
}

export function generateSpotDeclinedEmailHtml(data: SpotDeclinedEmailData): string {
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

  const isPromoter = data.isPromoterEmail;
  const recipient = isPromoter ? data.promoterName : data.comedianName;
  const title = isPromoter ? 'Spot Declined by Comedian' : 'Spot Declined';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
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
                background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
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
            .declined-box {
                background: #f8d7da;
                border: 1px solid #f5c6cb;
                border-left: 4px solid #dc3545;
                padding: 20px;
                margin: 20px 0;
                border-radius: 4px;
                color: #721c24;
            }
            .declined-box h3 {
                color: #dc3545;
                margin-top: 0;
                font-size: 18px;
            }
            .event-details {
                background: #f8f9fa;
                border: 1px solid #e9ecef;
                border-radius: 6px;
                padding: 20px;
                margin: 20px 0;
            }
            .event-details h3 {
                color: #495057;
                margin-top: 0;
                font-size: 18px;
            }
            .detail-row {
                display: flex;
                justify-content: space-between;
                margin: 10px 0;
                padding: 8px 0;
                border-bottom: 1px solid #e9ecef;
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
                background: #007bff;
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
                background: #0056b3;
            }
            .cta-button.urgent {
                background: #dc3545;
            }
            .cta-button.urgent:hover {
                background: #c82333;
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
            .reason-box {
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 6px;
                padding: 15px;
                margin: 20px 0;
                color: #856404;
            }
            .info-box {
                background: #cce5ff;
                border: 1px solid #b8daff;
                border-radius: 6px;
                padding: 15px;
                margin: 20px 0;
                color: #004085;
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
                <h1>❌ ${title}</h1>
                <p>${isPromoter ? 'Spot availability update' : 'Spot declined confirmation'}</p>
            </div>
            
            <div class="content">
                <div class="declined-box">
                    <h3>📢 Spot Declined</h3>
                    ${isPromoter ? `
                        <p><strong>${data.comedianName}</strong> has declined their <strong>${data.spotType}</strong> spot for <strong>${data.eventTitle}</strong>.</p>
                    ` : `
                        <p>You have declined the <strong>${data.spotType}</strong> spot for <strong>${data.eventTitle}</strong>. Thank you for letting us know.</p>
                    `}
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
                    <div class="detail-row">
                        <span class="detail-label">${isPromoter ? 'Comedian' : 'Promoter'}:</span>
                        <span class="detail-value">${isPromoter ? data.comedianName : data.promoterName}</span>
                    </div>
                </div>

                ${data.reason ? `
                <div class="reason-box">
                    <h3>💬 Reason for Decline</h3>
                    <p><em>"${data.reason}"</em></p>
                </div>
                ` : ''}

                <div style="text-align: center; margin: 30px 0;">
                    ${isPromoter ? `
                        <a href="${data.applicationsUrl}" class="cta-button urgent">
                            🔍 Find Replacement
                        </a>
                        <br>
                        <a href="${data.eventUrl}" class="secondary-button">
                            📝 View Event Details
                        </a>
                    ` : `
                        <a href="${data.eventsUrl}" class="cta-button">
                            🎤 Browse Other Events
                        </a>
                    `}
                </div>

                ${isPromoter ? `
                <div class="info-box">
                    <h3>⚡ Next Steps</h3>
                    <p>To fill this spot:</p>
                    <ul>
                        <li>Review pending applications for this event</li>
                        <li>Contact other comedians who might be interested</li>
                        <li>Consider promoting the spot on social media</li>
                        <li>Update your event lineup if needed</li>
                    </ul>
                </div>
                ` : `
                <div class="info-box">
                    <h3>🎭 Other Opportunities</h3>
                    <p>Don't worry! There are always more opportunities:</p>
                    <ul>
                        <li>Browse other upcoming events</li>
                        <li>Set up alerts for events that match your preferences</li>
                        <li>Keep your profile updated for better matching</li>
                        <li>Connect with other promoters in your area</li>
                    </ul>
                </div>
                `}

                <div class="declined-box">
                    <h3>❓ Questions?</h3>
                    <p>If you have any questions, please contact:</p>
                    <p><strong>${isPromoter ? data.comedianName : data.promoterName}</strong><br>
                    <a href="mailto:${isPromoter ? data.comedianEmail : data.promoterEmail}">${isPromoter ? data.comedianEmail : data.promoterEmail}</a></p>
                </div>
            </div>

            <div class="footer">
                <p>This email was sent by Stand Up Sydney</p>
                <p>
                    <a href="${data.eventUrl}">View Event</a> | 
                    <a href="${isPromoter ? data.applicationsUrl : data.eventsUrl}">
                        ${isPromoter ? 'View Applications' : 'Browse Events'}
                    </a>
                </p>
            </div>
        </div>
    </body>
    </html>
  `;
}

export function generateSpotDeclinedEmailText(data: SpotDeclinedEmailData): string {
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

  const isPromoter = data.isPromoterEmail;
  const recipient = isPromoter ? data.promoterName : data.comedianName;
  const title = isPromoter ? 'SPOT DECLINED BY COMEDIAN' : 'SPOT DECLINED';

  return `
❌ ${title}

Hi ${recipient}!

${isPromoter ? `${data.comedianName} has declined their ${data.spotType} spot for ${data.eventTitle}.` : `You have declined the ${data.spotType} spot for ${data.eventTitle}. Thank you for letting us know.`}

EVENT DETAILS:
- Event: ${data.eventTitle}
- Date: ${formattedDate}
- Time: ${formattedTime}
- Venue: ${data.venue}
- Address: ${data.address}
- Spot Type: ${data.spotType}
- ${isPromoter ? 'Comedian' : 'Promoter'}: ${isPromoter ? data.comedianName : data.promoterName}

${data.reason ? `REASON FOR DECLINE:
"${data.reason}"

` : ''}${isPromoter ? `FIND REPLACEMENT:
${data.applicationsUrl}

VIEW EVENT DETAILS:
${data.eventUrl}

NEXT STEPS:
- Review pending applications for this event
- Contact other comedians who might be interested
- Consider promoting the spot on social media
- Update your event lineup if needed` : `BROWSE OTHER EVENTS:
${data.eventsUrl}

OTHER OPPORTUNITIES:
- Browse other upcoming events
- Set up alerts for events that match your preferences
- Keep your profile updated for better matching
- Connect with other promoters in your area`}

QUESTIONS?
If you have any questions, please contact:
${isPromoter ? data.comedianName : data.promoterName}
${isPromoter ? data.comedianEmail : data.promoterEmail}

---
This email was sent by Stand Up Sydney
  `;
}