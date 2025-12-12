import { useEffect, useState } from "react";
import axios from "axios";

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const BUSINESS_ID = "693ac9a21071e98a38aeb61a"; // your real business ID
    axios.get(`http://localhost:3000/api/dashboard/${BUSINESS_ID}`)
      .then(res => setData(res.data))
      .catch(err => console.log(err));
  }, []);

  if (!data) return <p>Loading dashboard...</p>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-gray-500">Total Sales</h2>
          <p className="text-3xl font-bold text-green-600">KSh {data.totalSales}</p>
        </div>

        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-gray-500">Customers</h2>
          <p className="text-3xl font-bold text-blue-600">{data.totalCustomers}</p>
        </div>

        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-gray-500">Products</h2>
          <p className="text-3xl font-bold text-purple-600">{data.totalProducts}</p>
        </div>
      </div>

      <h2 className="text-xl font-bold mt-8 mb-3">Recent Sales</h2>
      <div className="bg-white p-4 rounded shadow">
        {data.recentSales.length === 0 ? (
          <p>No sales yet</p>
        ) : (
          <ul>
            {data.recentSales.map((sale) => (
              <li key={sale._id} className="border-b py-2">
                Sale of KSh {sale.totalAmount}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
