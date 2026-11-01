import { useState } from "react";

import { useAuth } from "../AuthContext.jsx";

export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const isLogin = mode === "login";

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (isLogin) await login(email, password);
      else await register(email, fullName, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function useDemo() {
    setMode("login");
    setEmail("demo@taskflow.dev");
    setPassword("password123");
  }

  return (
    <div className="auth-wrapper">
      <form className="card auth-card" onSubmit={handleSubmit}>
        <h1>TaskFlow</h1>
        <p className="muted">{isLogin ? "Sign in to your account" : "Create a new account"}</p>

        {!isLogin && (
          <label>
            Full name
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} required maxLength={120} />
          </label>
        )}
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={isLogin ? 1 : 8}
          />
        </label>

        {error && <div className="error" role="alert">{error}</div>}

        <button className="btn primary" type="submit" disabled={busy}>
          {busy ? "Please wait…" : isLogin ? "Sign in" : "Create account"}
        </button>

        <p className="muted small">
          {isLogin ? "No account yet? " : "Already registered? "}
          <button type="button" className="link" onClick={() => { setMode(isLogin ? "register" : "login"); setError(""); }}>
            {isLogin ? "Register" : "Sign in"}
          </button>
          {isLogin && (
            <>
              {" · "}
              <button type="button" className="link" onClick={useDemo}>Use demo account</button>
            </>
          )}
        </p>
      </form>
    </div>
  );
}
