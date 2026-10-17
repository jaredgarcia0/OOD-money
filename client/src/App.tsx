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
import AppShell from "./components/AppShell";

export default function App(): React.JSX.Element {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/paychecks" element={<Paychecks />} />
        <Route path="/fixed-expenses" element={<FixedExpenses />} />
        <Route path="/purchases" element={<Purchases />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
