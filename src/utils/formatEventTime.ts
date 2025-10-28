export const formatEventTime = (value: string | null | undefined): string => {
  if (!value) return 'TBC';
  try {
    // Extract time: "2025-11-15T20:00:00" → "20:00"
    const timePart = value.slice(11, 16);
    const [hours, minutes] = timePart.split(':').map(Number);

    const period = hours >= 12 ? 'pm' : 'am';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')}${period}`;
  } catch (error) {
    return 'TBC';
  }
};
