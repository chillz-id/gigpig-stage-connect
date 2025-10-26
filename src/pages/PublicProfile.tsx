// Placeholder - will be implemented in Task 12
interface PublicProfileProps {
  type: 'comedian' | 'manager' | 'organization' | 'venue';
}

export default function PublicProfile({ type }: PublicProfileProps) {
  return <div>Public Profile for {type} - Coming Soon</div>;
}
