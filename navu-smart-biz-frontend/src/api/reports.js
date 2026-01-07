import API from "./api";

export const fetchOrdersReport = async () => {
  const res = await API.get("/reports/orders");
  return res.data;
};

export const fetchTransactionsReport = async () => {
  const res = await API.get("/reports/transactions");
  return res.data;
};
