import type React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Paychecks from "./pages/Paychecks";
import FixedExpenses from "./pages/FixedExpenses";
import Purchases from "./pages/Purchases";
import Settings from "./pages/Settings";

export default function App(): React.JSX.Element {
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
