import API from "./api";

// Get all products for the logged-in business
export const getProducts = async () => {
  const res = await API.get("/products");
  return res.data;
};

// Add a new product
export const addProduct = async (data) => {
  const res = await API.post("/products", data);
  return res.data;
};
