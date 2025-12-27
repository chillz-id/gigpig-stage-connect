import { calendarIntegrationService } from './calendar-integration-service';

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  status?: string;
  created?: string;
  updated?: string;
}

export interface GoogleCalendarListResponse {
  items: GoogleCalendarEvent[];
  nextPageToken?: string;
}

/**
 * Google Calendar Service
 *
 * Handles Google Calendar API v3 integration:
 * - OAuth 2.0 authentication flow
 * - Fetch events from Google Calendar
 * - Create events in Google Calendar
 * - Update existing events
 * - Delete events
 * - Token refresh handling
 *
 * Prerequisites:
 * - Google Cloud project with Calendar API enabled
 * - OAuth 2.0 credentials (client ID, client secret)
 * - Redirect URI configured
 * - Required scopes: https://www.googleapis.com/auth/calendar.events
 */
class GoogleCalendarService {
  private readonly GOOGLE_CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';
  private readonly GOOGLE_AUTH_BASE = 'https://accounts.google.com/o/oauth2/v2/auth';
  private readonly GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

  // These should be in environment variables
  private readonly clientId = import.meta.env.VITE_GOOGLE_CALENDAR_CLIENT_ID || '';
  private readonly clientSecret = import.meta.env.VITE_GOOGLE_CALENDAR_CLIENT_SECRET || '';
  private readonly redirectUri = `${window.location.origin}/auth/google-calendar-callback`;

  /**
   * Initiate OAuth flow - redirect user to Google consent screen
   */
  initiateOAuthFlow(): void {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/calendar.events',
      access_type: 'offline',
      prompt: 'consent',
    });

    window.location.href = `${this.GOOGLE_AUTH_BASE}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForTokens(code: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const response = await fetch(this.GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for tokens');
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    expiresIn: number;
  }> {
    const response = await fetch(this.GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh access token');
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in,
    };
  }

  /**
   * Get access token for user, refreshing if necessary
   */
  private async getValidAccessToken(userId: string): Promise<string> {
    const integration = await calendarIntegrationService.getByUserAndProvider(userId, 'google');

    if (!integration || !integration.access_token) {
      throw new Error('No Google Calendar integration found');
    }

    // TODO: Check if token is expired and refresh if needed
    // For now, just return the access token
    return integration.access_token;
  }

  /**
   * Fetch events from Google Calendar
   */
  async listEvents(
    userId: string,
    options?: {
      timeMin?: string; // ISO 8601 format
      timeMax?: string; // ISO 8601 format
      maxResults?: number;
      pageToken?: string;
      calendarId?: string;
    }
  ): Promise<GoogleCalendarListResponse> {
    const accessToken = await this.getValidAccessToken(userId);
    const calendarId = options?.calendarId || 'primary';

    const params = new URLSearchParams({
      timeMin: options?.timeMin || new Date().toISOString(),
      timeMax: options?.timeMax || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      maxResults: (options?.maxResults || 100).toString(),
      singleEvents: 'true',
      orderBy: 'startTime',
    });

    if (options?.pageToken) {
      params.append('pageToken', options.pageToken);
    }

    const response = await fetch(
      `${this.GOOGLE_CALENDAR_API_BASE}/calendars/${calendarId}/events?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch Google Calendar events: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      items: data.items || [],
      nextPageToken: data.nextPageToken,
    };
  }

  /**
   * Create event in Google Calendar
   */
  async createEvent(
    userId: string,
    event: {
      summary: string;
      description?: string;
      location?: string;
      start: string; // ISO 8601 format
      end?: string; // ISO 8601 format
      calendarId?: string;
    }
  ): Promise<GoogleCalendarEvent> {
    const accessToken = await this.getValidAccessToken(userId);
    const calendarId = event.calendarId || 'primary';

    const eventBody = {
      summary: event.summary,
      description: event.description,
      location: event.location,
      start: {
        dateTime: event.start,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: event.end || event.start,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    };

    const response = await fetch(
      `${this.GOOGLE_CALENDAR_API_BASE}/calendars/${calendarId}/events`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventBody),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to create Google Calendar event: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Update event in Google Calendar
   */
  async updateEvent(
    userId: string,
    eventId: string,
    updates: {
      summary?: string;
      description?: string;
      location?: string;
      start?: string;
      end?: string;
      calendarId?: string;
    }
  ): Promise<GoogleCalendarEvent> {
    const accessToken = await this.getValidAccessToken(userId);
    const calendarId = updates.calendarId || 'primary';

    const eventBody: any = {};
    if (updates.summary) eventBody.summary = updates.summary;
    if (updates.description !== undefined) eventBody.description = updates.description;
    if (updates.location !== undefined) eventBody.location = updates.location;
    if (updates.start) {
      eventBody.start = {
        dateTime: updates.start,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
    }
    if (updates.end) {
      eventBody.end = {
        dateTime: updates.end,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
    }

    const response = await fetch(
      `${this.GOOGLE_CALENDAR_API_BASE}/calendars/${calendarId}/events/${eventId}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventBody),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to update Google Calendar event: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Delete event from Google Calendar
   */
  async deleteEvent(
    userId: string,
    eventId: string,
    calendarId: string = 'primary'
  ): Promise<void> {
    const accessToken = await this.getValidAccessToken(userId);

    const response = await fetch(
      `${this.GOOGLE_CALENDAR_API_BASE}/calendars/${calendarId}/events/${eventId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to delete Google Calendar event: ${response.statusText}`);
    }
  }
}

export const googleCalendarService = new GoogleCalendarService();
