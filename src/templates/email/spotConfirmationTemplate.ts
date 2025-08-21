// Email template for spot confirmation notifications
export interface SpotConfirmationEmailData {
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
  eventUrl: string;
  lineupUrl: string;
  performanceDuration?: string;
  arrivalTime?: string;
  soundCheckTime?: string;
  additionalInfo?: string;
  isPromoterEmail?: boolean;
}

export function generateSpotConfirmationEmailHtml(data: SpotConfirmationEmailData): string {
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
  const title = isPromoter ? 'Spot Confirmed by Comedian' : 'Spot Confirmation Received';

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
                background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
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
            .success-box {
                background: #d4edda;
                border: 1px solid #c3e6cb;
                border-left: 4px solid #28a745;
                padding: 20px;
                margin: 20px 0;
                border-radius: 4px;
                color: #155724;
            }
            .success-box h3 {
                color: #28a745;
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
                <h1>✅ ${title}</h1>
                <p>${isPromoter ? 'Lineup Update' : 'Thank you for confirming!'}</p>
            </div>
            
            <div class="content">
                <div class="success-box">
                    <h3>🎉 Confirmation Successful</h3>
                    ${isPromoter ? `
                        <p><strong>${data.comedianName}</strong> has confirmed their <strong>${data.spotType}</strong> spot for <strong>${data.eventTitle}</strong>.</p>
                    ` : `
                        <p>Thank you for confirming your <strong>${data.spotType}</strong> spot for <strong>${data.eventTitle}</strong>. You're all set!</p>
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
                    ${data.performanceDuration ? `
                    <div class="detail-row">
                        <span class="detail-label">Duration:</span>
                        <span class="detail-value">${data.performanceDuration}</span>
                    </div>
                    ` : ''}
                    ${data.arrivalTime ? `
                    <div class="detail-row">
                        <span class="detail-label">Arrival Time:</span>
                        <span class="detail-value">${data.arrivalTime}</span>
                    </div>
                    ` : ''}
                    ${data.soundCheckTime ? `
                    <div class="detail-row">
                        <span class="detail-label">Sound Check:</span>
                        <span class="detail-value">${data.soundCheckTime}</span>
                    </div>
                    ` : ''}
                    <div class="detail-row">
                        <span class="detail-label">${isPromoter ? 'Comedian' : 'Promoter'}:</span>
                        <span class="detail-value">${isPromoter ? data.comedianName : data.promoterName}</span>
                    </div>
                </div>

                <div style="text-align: center; margin: 30px 0;">
                    ${isPromoter ? `
                        <a href="${data.lineupUrl}" class="cta-button">
                            📋 View Full Lineup
                        </a>
                    ` : `
                        <a href="${data.eventUrl}" class="cta-button">
                            📝 View Event Details
                        </a>
                    `}
                </div>

                ${data.additionalInfo ? `
                <div class="info-box">
                    <h3>📋 Additional Information</h3>
                    <p>${data.additionalInfo}</p>
                </div>
                ` : ''}

                ${!isPromoter ? `
                <div class="info-box">
                    <h3>🎤 Next Steps</h3>
                    <p>Your spot is confirmed! Make sure to:</p>
                    <ul>
                        <li>Mark your calendar for ${formattedDate}</li>
                        <li>Prepare your ${data.spotType} material</li>
                        ${data.arrivalTime ? `<li>Arrive by ${data.arrivalTime}</li>` : ''}
                        <li>Contact ${data.promoterName} if you have any questions</li>
                    </ul>
                </div>
                ` : ''}

                <div class="success-box">
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
                    <a href="${isPromoter ? data.lineupUrl : data.eventUrl}">
                        ${isPromoter ? 'View Lineup' : 'View Details'}
                    </a>
                </p>
            </div>
        </div>
    </body>
    </html>
  `;
}

export function generateSpotConfirmationEmailText(data: SpotConfirmationEmailData): string {
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
  const title = isPromoter ? 'SPOT CONFIRMED BY COMEDIAN' : 'SPOT CONFIRMATION RECEIVED';

  return `
✅ ${title}

Hi ${recipient}!

${isPromoter ? `${data.comedianName} has confirmed their ${data.spotType} spot for ${data.eventTitle}.` : `Thank you for confirming your ${data.spotType} spot for ${data.eventTitle}. You're all set!`}

EVENT DETAILS:
- Event: ${data.eventTitle}
- Date: ${formattedDate}
- Time: ${formattedTime}
- Venue: ${data.venue}
- Address: ${data.address}
- Spot Type: ${data.spotType}
${data.performanceDuration ? `- Duration: ${data.performanceDuration}` : ''}
${data.arrivalTime ? `- Arrival Time: ${data.arrivalTime}` : ''}
${data.soundCheckTime ? `- Sound Check: ${data.soundCheckTime}` : ''}
- ${isPromoter ? 'Comedian' : 'Promoter'}: ${isPromoter ? data.comedianName : data.promoterName}

${isPromoter ? `VIEW FULL LINEUP:
${data.lineupUrl}` : `VIEW EVENT DETAILS:
${data.eventUrl}`}

${data.additionalInfo ? `ADDITIONAL INFORMATION:
${data.additionalInfo}

` : ''}${!isPromoter ? `NEXT STEPS:
- Mark your calendar for ${formattedDate}
- Prepare your ${data.spotType} material
${data.arrivalTime ? `- Arrive by ${data.arrivalTime}` : ''}
- Contact ${data.promoterName} if you have any questions

` : ''}QUESTIONS?
If you have any questions, please contact:
${isPromoter ? data.comedianName : data.promoterName}
${isPromoter ? data.comedianEmail : data.promoterEmail}

---
This email was sent by Stand Up Sydney
  `;
}