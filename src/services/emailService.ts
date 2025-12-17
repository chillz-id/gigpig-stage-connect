import { supabase } from '@/integrations/supabase/client';

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

/**
 * Email Service
 * Handles sending transactional emails via AWS SES (through Supabase Edge Function)
 */
export const emailService = {
  /**
   * Send an email using AWS SES via Edge Function
   */
  async sendEmail({ to, subject, html, text, from, replyTo }: SendEmailParams) {
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: { to, subject, html, text, from, replyTo },
      });

      if (error) {
        console.error('Email service error:', error);
        return { success: false, error: error.message };
      }

      if (data && !data.success) {
        console.error('Email send failed:', data.error);
        return { success: false, error: data.error };
      }

      console.log('Email sent successfully:', data);
      return { success: true, data };
    } catch (error: any) {
      console.error('Email service error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Send welcome email to new comedian
   */
  async sendComedianWelcome(email: string, name: string) {
    const subject = 'Welcome to Stand Up Sydney!';
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Stand Up Sydney!</h1>
            </div>
            <div class="content">
              <p>Hi ${name},</p>

              <p>Welcome to the Stand Up Sydney comedy community! We're excited to have you join Australia's premier platform for comedians, promoters, and venues.</p>

              <h3>Get Started:</h3>
              <ul>
                <li><strong>Complete Your Profile:</strong> Add your bio, photos, and performance videos</li>
                <li><strong>Browse Events:</strong> Find open mic nights and gigs across Sydney</li>
                <li><strong>Apply for Spots:</strong> Submit applications for upcoming shows</li>
                <li><strong>Track Your Gigs:</strong> Manage your bookings and confirmations</li>
              </ul>

              <div style="text-align: center;">
                <a href="https://standupsydney.com/dashboard" class="button">
                  Go to Your Dashboard
                </a>
              </div>

              <p>If you have any questions, feel free to reach out to our support team.</p>

              <p>Break a leg!</p>

              <p>
                <strong>The Stand Up Sydney Team</strong>
              </p>
            </div>
            <div class="footer">
              <p>Stand Up Sydney | Sydney's Premier Comedy Platform</p>
              <p>
                <a href="https://standupsydney.com">Website</a> |
                <a href="https://standupsydney.com/help">Help Center</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
    });
  },

  /**
   * Send email confirmation link
   * Note: This would typically be handled by Supabase Auth,
   * but can be used for custom confirmation flows
   */
  async sendEmailConfirmation(email: string, confirmationUrl: string) {
    const subject = 'Confirm Your Email - Stand Up Sydney';
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Confirm Your Email</h1>
            </div>
            <div class="content">
              <p>Thanks for signing up with Stand Up Sydney!</p>

              <p>Please confirm your email address by clicking the button below:</p>

              <div style="text-align: center;">
                <a href="${confirmationUrl}" class="button">
                  Confirm Email Address
                </a>
              </div>

              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #667eea;">${confirmationUrl}</p>

              <p>If you didn't create an account with Stand Up Sydney, you can safely ignore this email.</p>
            </div>
            <div class="footer">
              <p>Stand Up Sydney | Sydney's Premier Comedy Platform</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
    });
  },

  /**
   * Send gig confirmation email
   */
  async sendGigConfirmation(email: string, gigDetails: {
    eventName: string;
    venue: string;
    date: string;
    time: string;
    spotDuration: string;
  }) {
    const subject = `Gig Confirmed: ${gigDetails.eventName}`;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px; }
            .details { background: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0; }
            .detail-row { display: flex; margin: 10px 0; }
            .detail-label { font-weight: bold; min-width: 120px; }
            .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Gig Confirmed!</h1>
            </div>
            <div class="content">
              <p>Great news! Your spot has been confirmed.</p>

              <div class="details">
                <div class="detail-row">
                  <div class="detail-label">Event:</div>
                  <div>${gigDetails.eventName}</div>
                </div>
                <div class="detail-row">
                  <div class="detail-label">Venue:</div>
                  <div>${gigDetails.venue}</div>
                </div>
                <div class="detail-row">
                  <div class="detail-label">Date:</div>
                  <div>${gigDetails.date}</div>
                </div>
                <div class="detail-row">
                  <div class="detail-label">Time:</div>
                  <div>${gigDetails.time}</div>
                </div>
                <div class="detail-row">
                  <div class="detail-label">Spot Duration:</div>
                  <div>${gigDetails.spotDuration}</div>
                </div>
              </div>

              <div style="text-align: center;">
                <a href="https://standupsydney.com/dashboard/gigs" class="button">
                  View My Gigs
                </a>
              </div>

              <p><strong>Remember:</strong></p>
              <ul>
                <li>Arrive at least 15 minutes early</li>
                <li>Bring your A-game material</li>
                <li>Respect the time limit</li>
                <li>Have fun!</li>
              </ul>

              <p>Break a leg!</p>
            </div>
            <div class="footer">
              <p>Stand Up Sydney | Sydney's Premier Comedy Platform</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
    });
  },
};
