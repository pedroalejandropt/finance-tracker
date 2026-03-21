import { loadDashboardData } from './loader';
import { DashboardClient } from './DashboardClient';

export default async function DashboardPage() {
  const { accounts, stocks } = await loadDashboardData();
  return <DashboardClient initialAccounts={accounts} initialStocks={stocks} />;
}
