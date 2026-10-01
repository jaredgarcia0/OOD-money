import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
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
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/dashboard"
        element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
      />
      <Route
        path="/paychecks"
        element={<ProtectedRoute><Paychecks /></ProtectedRoute>}
      />
      <Route
        path="/fixed-expenses"
        element={<ProtectedRoute><FixedExpenses /></ProtectedRoute>}
      />
      <Route
        path="/purchases"
        element={<ProtectedRoute><Purchases /></ProtectedRoute>}
      />
      <Route
        path="/settings"
        element={<ProtectedRoute><Settings /></ProtectedRoute>}
      />
    </Routes>
  );
}