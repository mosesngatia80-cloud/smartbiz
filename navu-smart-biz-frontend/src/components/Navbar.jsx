import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="bg-black text-white p-4 flex gap-4">
      <Link to="/">Dashboard</Link>
      <Link to="/business">Business</Link>
      <Link to="/products">Products</Link>
      <Link to="/orders">Orders</Link>
      <button
        onClick={() => {
          localStorage.removeItem("token");
          window.location.href = "/login";
        }}
        className="ml-auto bg-red-600 px-3 py-1 rounded"
      >
        Logout
      </button>
    </nav>
  );
}
