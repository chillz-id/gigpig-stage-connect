export function generateSessionId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const userAgent = navigator.userAgent.substring(0, 20).replace(/[^a-zA-Z0-9]/g, '');
  
  return `${timestamp}-${random}-${userAgent}`;
}

export function isSessionExpired(sessionId: string): boolean {
  const parts = sessionId.split('-');
  if (parts.length < 1) return true;
  
  const timestamp = parseInt(parts[0], 10);
  const now = Date.now();
  const thirtyMinutes = 30 * 60 * 1000;
  
  return now - timestamp > thirtyMinutes;
}

export function getSessionDuration(sessionId: string): number {
  const parts = sessionId.split('-');
  if (parts.length < 1) return 0;
  
  const timestamp = parseInt(parts[0], 10);
  return Math.floor((Date.now() - timestamp) / 1000); // Return in seconds
}