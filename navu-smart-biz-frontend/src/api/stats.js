import API from "./api";

export const fetchStats = async () => {
  const res = await API.get("/stats");
  return res.data;
};
