import type React from "react";
import { useEffect, useState } from "react";
import { getPaychecks, addPaycheck, deletePaycheck } from "../api/paychecks";

export default function Paychecks() {
  const [paychecks, setPaychecks] = useState([]);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    getPaychecks().then(setPaychecks).catch((err) => setError(err.message));
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    try {
      const newPaycheck = await addPaycheck({
        amount_cents: Math.round(parseFloat(amount) * 100),
        pay_date: date,
        note,
      });
      setPaychecks([newPaycheck, ...paychecks]);
      setAmount("");
      setDate("");
      setNote("");
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id: number) {
    try {
      await deletePaycheck(id);
      setPaychecks(paychecks.filter((p) => p.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page-stack">
      <div className="page-heading"><div><p className="page-kicker">Income</p><h1>Paychecks</h1><p className="page-subtitle">Keep your pay schedule up to date so your budget stays accurate.</p></div></div>
      {error && <div className="notice notice--danger"><span>!</span>{error}</div>}
      <form className="content-card form-card" onSubmit={handleSubmit}>
        <div className="card-heading"><div><h2>Add a paycheck</h2><p>Start a new pay period with the details below.</p></div><span className="form-card__spark">✦</span></div>
        <div className="form-grid form-grid--three">
        <input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
          required
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note (optional)"
        />
        </div><button className="button button--primary" type="submit">Add paycheck <span>＋</span></button>
      </form>
      <section className="content-card list-card"><div className="card-heading"><div><h2>Pay history</h2><p>Your most recent paychecks appear first.</p></div><span className="count-pill">{paychecks.length} total</span></div>
      {paychecks.length ? <ul className="record-list">
        {paychecks.map((p) => (
          <li key={p.id}>
            <span className="record-list__icon">$</span><span className="record-list__main"><strong>${(p.amount_cents / 100).toFixed(2)}</strong><small>{p.note || "Paycheck"}</small></span><time>{p.pay_date}</time><button className="text-button text-button--danger" onClick={() => handleDelete(p.id)}>Delete</button>
          </li>
        ))}
      </ul> : <p className="empty-state">No paychecks yet. Add one above to create your first budget period.</p>}</section>
    </div>
  );
}
