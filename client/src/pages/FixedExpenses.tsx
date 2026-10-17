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
    <div className="page-stack">
      <div className="page-heading"><div><p className="page-kicker">Commitments</p><h1>Fixed expenses</h1><p className="page-subtitle">Plan for the bills that keep your life running.</p></div></div>
      {error && <div className="notice notice--danger"><span>!</span>{error}</div>}
      <form className="content-card form-card" onSubmit={handleSubmit}>
        <div className="card-heading"><div><h2>Add a fixed expense</h2><p>We’ll include active expenses in your pay-period calculation.</p></div><span className="form-card__spark">✦</span></div>
        <div className="form-grid form-grid--three">
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
        </div><button className="button button--primary" type="submit">Add expense <span>＋</span></button>
      </form>
      <section className="content-card list-card"><div className="card-heading"><div><h2>Your expenses</h2><p>Toggle an expense off when it no longer applies.</p></div><span className="count-pill">{expenses.length} total</span></div>
      {expenses.length ? <ul className="record-list">
        {expenses.map((e) => (
          <li key={e.id} className={!e.active ? "is-muted" : ""}>
            <span className="record-list__icon">⌁</span><span className="record-list__main"><strong>{e.name}</strong><small>Due on the {e.due_day} of each month</small></span><strong>${(e.amount_cents / 100).toFixed(2)}</strong><button className="text-button" onClick={() => handleToggleActive(e)}>{e.active ? "Deactivate" : "Activate"}</button><button className="text-button text-button--danger" onClick={() => handleDelete(e.id)}>Delete</button>
          </li>
        ))}
      </ul> : <p className="empty-state">No fixed expenses yet. Add rent, subscriptions, or other recurring bills above.</p>}</section>
    </div>
  );
}
