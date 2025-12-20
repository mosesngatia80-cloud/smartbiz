import API from "./index";
export const getOrders = () => API.get("/orders");
export const createOrder = (data) => API.post("/orders", data);
