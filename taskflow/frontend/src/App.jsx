import { useAuth } from "./AuthContext.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import Dashboard from "./pages/Dashboard.jsx";

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <p className="muted center">Loading…</p>;
  return user ? <Dashboard /> : <AuthPage />;
}
