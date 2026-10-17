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
    <div>
      <h1>Paychecks</h1>
      {error && <p className="error">{error}</p>}

      <form onSubmit={handleSubmit}>
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
        <button type="submit">Add Paycheck</button>
      </form>

      <ul>
        {paychecks.map((p) => (
          <li key={p.id}>
            {p.pay_date} — ${(p.amount_cents / 100).toFixed(2)}
            {p.note && ` (${p.note})`}
            <button onClick={() => handleDelete(p.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
