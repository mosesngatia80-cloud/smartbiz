import API from "../api/api";

const TOKEN_KEY = "smartbiz_token";

export const login = async (email, password) => {
  const res = await API.post("/auth/login", {
    email,
    password,
  });

  // ✅ Save token using the correct key
  localStorage.setItem(TOKEN_KEY, res.data.token);
  return res.data;
};

export const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
};

export const isAuthenticated = () => {
  return !!localStorage.getItem(TOKEN_KEY);
};
