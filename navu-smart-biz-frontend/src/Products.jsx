import { useEffect, useState } from "react";
import API from "./api/api";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [error, setError] = useState("");

  // Load products
  const loadProducts = async () => {
    try {
      const res = await API.get("/products");
      setProducts(res.data);
      setError("");
    } catch (err) {
      console.error("LOAD PRODUCTS ERROR:", err);
      setError("Failed to load products");
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Add product
  const addProduct = async () => {
    if (!name || !price) {
      setError("Name and price are required");
      return;
    }

    try {
      await API.post("/products", {
        name,
        price: Number(price) // 🔥 force number
      });

      setName("");
      setPrice("");
      setError("");
      loadProducts(); // 🔥 refresh list after add
    } catch (err) {
      console.error("ADD PRODUCT ERROR:", err.response?.data || err.message);
      setError("Failed to add product");
    }
  };

  return (
    <div>
      <h2>📦 Products</h2>

      <input
        placeholder="Product name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        type="number"
        placeholder="Price"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />

      <button onClick={addProduct}>Add Product</button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <ul>
        {products.map((p) => (
          <li key={p._id}>
            <strong>{p.name}</strong> — KES {p.price}
          </li>
        ))}
      </ul>
    </div>
  );
}
