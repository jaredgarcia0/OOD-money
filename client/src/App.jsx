import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Paychecks from "./pages/Paychecks.jsx";
import FixedExpenses from "./pages/FixedExpenses.jsx";
import Purchases from "./pages/Purchases.jsx";
import Settings from "./pages/Settings.jsx";



export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} /> // so clicking the browser's "back" button won't bring the user back to / and bounce them forward again; it skips past it.
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/paychecks" element={<Paychecks />} />
      <Route path="/fixed-expenses" element={<FixedExpenses />} />
      <Route path="/purchases" element={<Purchases />} />
      <Route path="/settings" element={<Settings />} />
    </Routes>
  );
}