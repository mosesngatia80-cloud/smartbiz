import { useEffect, useState } from "react";
import { fetchStats } from "./api/stats";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStats()
      .then(setStats)
      .catch(() => setError("Failed to load dashboard"));
  }, []);

  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!stats) return <p>Loading dashboard…</p>;

  const Card = ({ title, value }) => (
    <div style={{
      border: "1px solid #ddd",
      borderRadius: 12,
      padding: 16,
      minWidth: 160
    }}>
      <h4>{title}</h4>
      <strong>{value}</strong>
    </div>
  );

  return (
    <div>
      <h2>📊 Dashboard</h2>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <Card title="Total Revenue (KES)" value={stats.totalRevenue} />
        <Card title="Today’s Revenue (KES)" value={stats.todayRevenue} />
        <Card title="Orders" value={stats.orders} />
        <Card title="Wallet Balance (KES)" value={stats.walletBalance} />
      </div>
    </div>
  );
}
