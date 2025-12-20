import { useEffect, useState } from "react";
import { getProducts } from "../api/products";
import { createOrder, getOrders } from "../api/orders";

export default function Orders() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const p = await getProducts();
    const o = await getOrders();
    setProducts(p);
    setOrders(o);
  }

  async function sell() {
    setError("");

    const product = products.find(p => p._id === productId);

    if (!product) {
      setError("Select a product");
      return;
    }

    if (product.stock <= 0) {
      setError("Out of stock");
      return;
    }

    if (quantity < 1) {
      setError("Quantity must be at least 1");
      return;
    }

    if (quantity > product.stock) {
      setError(`Only ${product.stock} left in stock`);
      return;
    }

    await createOrder(productId, quantity);
    setQuantity(1);
    setProductId("");
    load();
  }

  return (
    <div>
      <h2>Sell Products</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <select
        value={productId}
        onChange={e => setProductId(e.target.value)}
      >
        <option value="">Select product</option>
        {products.map(p => (
          <option
            key={p._id}
            value={p._id}
            disabled={p.stock === 0}
          >
            {p.name} — KES {p.price} ({p.stock} left)
          </option>
        ))}
      </select>

      <input
        type="number"
        min="1"
        value={quantity}
        onChange={e => setQuantity(Number(e.target.value))}
      />

      <button onClick={sell} disabled={!productId}>
        Sell
      </button>

      <h3>Orders</h3>
      <ul>
        {orders.map(o => (
          <li key={o._id}>
            {o.product?.name} × {o.quantity} = KES {o.total}
          </li>
        ))}
      </ul>
    </div>
  );
}
