import { Link } from "react-router-dom";
import { FiHome, FiShoppingCart, FiUsers, FiBox } from "react-icons/fi";

export default function Sidebar() {
  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen px-4 py-6">
      <h1 className="text-2xl font-bold mb-8">SmartBiz</h1>

      <nav className="flex flex-col gap-4">
        <Link className="flex gap-2 items-center hover:text-blue-400" to="/">
          <FiHome /> Dashboard
        </Link>

        <Link className="flex gap-2 items-center hover:text-blue-400" to="/sales">
          <FiShoppingCart /> Sales
        </Link>

        <Link className="flex gap-2 items-center hover:text-blue-400" to="/products">
          <FiBox /> Products
        </Link>

        <Link className="flex gap-2 items-center hover:text-blue-400" to="/customers">
          <FiUsers /> Customers
        </Link>
      </nav>
    </div>
  );
}
