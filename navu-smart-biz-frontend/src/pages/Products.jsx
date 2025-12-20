import { useEffect, useState } from "react";
import { getProducts, addProduct } from "../api/products";

export default function Products() {
  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  const load = () => getProducts().then(r => setItems(r.data));
  useEffect(load, []);

  const submit = async (e) => {
    e.preventDefault();
    await addProduct({ name, price: Number(price) });
    setName(""); setPrice("");
    load();
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Products</h2>

      <form onSubmit={submit} className="flex gap-2 mb-4">
        <input className="border p-2" placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
        <input className="border p-2" placeholder="Price" type="number" value={price} onChange={e=>setPrice(e.target.value)} />
        <button className="bg-black text-white px-4">Add</button>
      </form>

      <ul>
        {items.map(p => (
          <li key={p._id} className="border-b py-2">
            {p.name} — KES {p.price}
          </li>
        ))}
      </ul>
    </div>
  );
}
