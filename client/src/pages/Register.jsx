import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "../api/auth.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await register(email, password);
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Could not create account");
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Register</h1>
      {error && <p className="error">{error}</p>}
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password (8+ characters)"
        required
        minLength={8}
      />
      <button type="submit">Create Account</button>
    </form>
  );
}