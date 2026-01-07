import { useEffect, useState } from "react";
import { fetchTransactionsReport } from "./api/reports";

export default function Transactions() {
  const [tx, setTx] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTransactionsReport()
      .then(setTx)
      .catch(() => setError("Failed to load transactions"));
  }, []);

  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div>
      <h3>💳 Recent Transactions</h3>
      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>Ref</th>
            <th>Amount (KES)</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {tx.map(t => (
            <tr key={t._id}>
              <td>{t.reference}</td>
              <td>{t.amount}</td>
              <td>{new Date(t.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
