import { useEffect, useState } from "react";
import API from "../api/api";

function Products() {
  const [products, setProducts] = useState([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProducts = () => {
    API.get("/products")
      .then((res) => {
        setProducts(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load products");
        setLoading(false);
      });
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const createProduct = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await API.post("/products", {
        name,
        price: Number(price)
      });

      setName("");
      setPrice("");
      loadProducts();
    } catch {
      setError("Failed to create product");
    }
  };

  if (loading) return <p>Loading products...</p>;

  return (
    <div>
      <h3>Products</h3>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Create Product */}
      <form onSubmit={createProduct}>
        <input
          placeholder="Product name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Price (KES)"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />
        <button type="submit">Add Product</button>
      </form>

      <hr />

      {/* List Products */}
      {products.length === 0 ? (
        <p>No products yet</p>
      ) : (
        <ul>
          {products.map((p) => (
            <li key={p._id}>
              <strong>{p.name}</strong> — KES {p.price}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Products;
