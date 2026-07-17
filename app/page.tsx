import PublicDashboard from './PublicDashboard';

/**
 * Root page — always shows the Public Dashboard.
 * No authentication check. Accessible to everyone.
 * Committee members use /dashboard (protected) for the private view.
 */
export default function HomePage() {
  return <PublicDashboard />;
}
