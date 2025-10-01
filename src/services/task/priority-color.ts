export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'urgent':
      return '#ef4444';
    case 'high':
      return '#f97316';
    case 'medium':
      return '#eab308';
    case 'low':
      return '#22c55e';
    default:
      return '#6b7280';
  }
}
