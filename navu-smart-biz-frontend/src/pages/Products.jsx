import { useEffect, useState } from "react";
import { getProducts, addProduct } from "../api/products";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [error, setError] = useState("");

  async function loadProducts() {
    try {
      const data = await getProducts();
      setProducts(data);
      setError("");
    } catch (err) {
      setError("Failed to load products");
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  async function handleAdd() {
    try {
      await addProduct({
        name,
        price: Number(price),
        stock: 100, // ✅ REQUIRED BY BACKEND
      });

      setName("");
      setPrice("");
      loadProducts();
    } catch (err) {
      alert("Failed to add product");
    }
  }

  return (
    <div>
      <h2>🛒 Products</h2>

      <input
        placeholder="Product name"
        value={name}
        onChange={e => setName(e.target.value)}
      />

      <input
        placeholder="Price (KES)"
        type="number"
        value={price}
        onChange={e => setPrice(e.target.value)}
      />

      <button onClick={handleAdd}>➕ Add Product</button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {products.length === 0 && <p>No products yet.</p>}

      <ul>
        {products.map(p => (
          <li key={p._id}>
            <strong>{p.name}</strong> — KES {p.price}
          </li>
        ))}
      </ul>
    </div>
  );
}
