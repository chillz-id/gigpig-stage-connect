import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { SESClient, SendEmailCommand } from 'npm:@aws-sdk/client-ses@3.525.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

// Initialize SES client
const sesClient = new SESClient({
  region: Deno.env.get('AWS_REGION') || 'ap-southeast-2',
  credentials: {
    accessKeyId: Deno.env.get('AWS_ACCESS_KEY_ID')!,
    secretAccessKey: Deno.env.get('AWS_SECRET_ACCESS_KEY')!,
  },
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, html, text, from, replyTo } = await req.json() as EmailRequest;

    // Validate required fields
    if (!to || !subject) {
      throw new Error('Missing required fields: to, subject');
    }

    if (!html && !text) {
      throw new Error('Either html or text content is required');
    }

    // Normalize recipients to array
    const recipients = Array.isArray(to) ? to : [to];

    // Default from address (noreply for automated sends)
    const fromAddress = from || Deno.env.get('SES_FROM_EMAIL') || 'noreply@gigpigs.app';

    // Default reply-to (team mailbox for customer replies)
    const replyToAddress = replyTo || Deno.env.get('SES_REPLY_TO_EMAIL') || 'team@gigpigs.app';

    // Build email params
    const params = {
      Source: fromAddress,
      Destination: {
        ToAddresses: recipients,
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8',
        },
        Body: {
          ...(html && {
            Html: {
              Data: html,
              Charset: 'UTF-8',
            },
          }),
          ...(text && {
            Text: {
              Data: text,
              Charset: 'UTF-8',
            },
          }),
        },
      },
      ReplyToAddresses: [replyToAddress],
    };

    // Send email via SES
    const command = new SendEmailCommand(params);
    const response = await sesClient.send(command);

    console.log('Email sent successfully:', {
      messageId: response.MessageId,
      to: recipients,
      subject,
    });

    return new Response(
      JSON.stringify({
        success: true,
        messageId: response.MessageId,
        message: `Email sent to ${recipients.length} recipient(s)`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending email:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
