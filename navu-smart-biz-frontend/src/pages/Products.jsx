import { useEffect, useState } from "react";
import { getProducts, addProduct } from "../api/products";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("General");
  const [customCategory, setCustomCategory] = useState("");
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
        category:
          category === "Other"
            ? customCategory
            : category,
        price: Number(price),
        stock: 100,
      });

      setName("");
      setPrice("");
      setCategory("General");
      setCustomCategory("");
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

      <select
        value={category}
        onChange={e => setCategory(e.target.value)}
      >
        <option value="General">General</option>
        <option value="Cars">Cars</option>
        <option value="Electronics">Electronics</option>
        <option value="Fashion">Fashion</option>
        <option value="Food">Food</option>
        <option value="Agriculture">Agriculture</option>
        <option value="Hardware">Hardware</option>
        <option value="Pharmacy">Pharmacy</option>
        <option value="Beauty">Beauty</option>
        <option value="Home & Furniture">Home & Furniture</option>
        <option value="Other">Other...</option>
      </select>

      {category === "Other" && (
        <input
          placeholder="Enter custom category"
          value={customCategory}
          onChange={e => setCustomCategory(e.target.value)}
        />
      )}

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
