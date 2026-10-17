import type React from "react";
import { useEffect, useState } from "react";
import {
  getFixedExpenses,
  addFixedExpense,
  updateFixedExpense,
  deleteFixedExpense,
} from "../api/fixedExpenses";

export default function FixedExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    getFixedExpenses().then(setExpenses).catch((err) => setError(err.message));
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    try {
      const newExpense = await addFixedExpense({
        name,
        amount_cents: Math.round(parseFloat(amount) * 100),
        due_day: parseInt(dueDay, 10),
      });
      setExpenses([newExpense, ...expenses]);
      setName("");
      setAmount("");
      setDueDay("");
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleToggleActive(expense: any) {
    try {
      const updated = await updateFixedExpense(expense.id, {
        ...expense,
        active: expense.active ? 0 : 1,
      });
      setExpenses(expenses.map((e) => (e.id === expense.id ? updated : e)));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteFixedExpense(id);
      setExpenses(expenses.filter((e) => e.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h1>Fixed Expenses</h1>
      {error && <p className="error">{error}</p>}

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name (e.g. Rent)"
          required
        />
        <input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
          required
        />
        <input
          type="number"
          min="1"
          max="31"
          value={dueDay}
          onChange={(e) => setDueDay(e.target.value)}
          placeholder="Due day (1-31)"
          required
        />
        <button type="submit">Add Fixed Expense</button>
      </form>

      <ul>
        {expenses.map((e) => (
          <li key={e.id} style={{ opacity: e.active ? 1 : 0.5 }}>
            {e.name} — ${(e.amount_cents / 100).toFixed(2)} (due day {e.due_day})
            {!e.active && " [inactive]"}  
            <button onClick={() => handleToggleActive(e)}>{e.active ? "Deactivate" : "Active"}</button>
            <button onClick={() => handleDelete(e.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
