import { useEffect, useState } from "react";
import API from "../api/api";

export default function Dashboard() {
  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
    revenue: 0,
    today: 0,
    month: 0
  });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const statsRes = await API.get("/stats");
      const revenueRes = await API.get("/revenue/summary");

      setStats({
        products: statsRes.data.products,
        orders: statsRes.data.orders,
        revenue: statsRes.data.revenue,
        today: revenueRes.data.today,
        month: revenueRes.data.month
      });
    } catch (err) {
      console.error("Dashboard load failed", err);
    }
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Smart Biz Dashboard</h2>

      <div className="grid grid-cols-2 gap-4">
        <div className="border p-4 rounded">
          <p>Products</p>
          <b>{stats.products}</b>
        </div>

        <div className="border p-4 rounded">
          <p>Orders</p>
          <b>{stats.orders}</b>
        </div>

        <div className="border p-4 rounded">
          <p>Today Revenue</p>
          <b>KES {stats.today}</b>
        </div>

        <div className="border p-4 rounded">
          <p>Monthly Revenue</p>
          <b>KES {stats.month}</b>
        </div>
      </div>
    </div>
  );
}
