import { useEffect, useState } from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("smartbiz_token");
    setIsAuthenticated(!!token);
    setCheckingAuth(false);
  }, []);

  if (checkingAuth) {
    return <p style={{ padding: 20 }}>Loading...</p>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Smart Biz</h2>
      {isAuthenticated ? <Dashboard /> : <Login />}
    </div>
  );
}

export default App;
