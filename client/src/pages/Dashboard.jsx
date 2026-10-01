import { useEffect, useState } from "react";
import { getBudget } from "../api/budget.js";
import CategoryBar from "../components/CategoryBar.jsx";

export default function Dashboard() {
  const [budget, setBudget] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getBudget()
      .then(setBudget)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!budget) return <p>Loading...</p>;

  const dollars = (cents) => (cents / 100).toFixed(2);

  return (
    <div>
      <h1>Dashboard</h1>
      <p>
        Pay period: {budget.period.start} to {budget.period.end}
      </p>
      <p>Paycheck: ${dollars(budget.paycheck_cents)}</p>
      <p>Fixed expenses: ${dollars(budget.fixed_total_cents)}</p>
      <p>Savings goal: ${dollars(budget.savings_goal_cents)}</p>
      <p>
        <strong>Spendable: ${dollars(budget.spendable_cents)}</strong>
      </p>

      <h2>Categories</h2>
      {budget.categories.map((cat) => (
        <CategoryBar key={cat.id} category={cat} />
      ))}
    </div>
  );
}