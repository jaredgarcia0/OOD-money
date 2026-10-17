import { useEffect, useState } from "react";
import { getBudget } from "../api/budget";
import CategoryBar from "../components/CategoryBar";

export default function Dashboard() {
  const [budget, setBudget] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getBudget()
      .then(setBudget)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="state-card error-state"><span>!</span><div><h2>Couldn’t load your overview</h2><p>{error}</p></div></div>;
  if (!budget) return <div className="loading-state"><span className="spinner" />Loading your overview…</div>;

  if (!budget.has_paycheck) return <div className="page-intro"><p className="page-kicker">Let’s get started</p><h1>Your money, in motion.</h1><p className="page-subtitle">Add your first paycheck to unlock your personalized spending plan.</p><a className="button button--primary" href="/paychecks">Add a paycheck <span>→</span></a></div>;

  const dollars = (cents: number) => (cents / 100).toFixed(2);

  return (
    <div className="dashboard-page">
      <div className="page-heading"><div><p className="page-kicker">{budget.period.start} — {budget.period.end}</p><h1>Your overview</h1><p className="page-subtitle">Here’s the shape of your money for this pay period.</p></div><a className="button button--secondary" href="/purchases">Log a purchase <span>↗</span></a></div>
      {budget.is_overspent && <div className="notice notice--danger"><span>!</span><div><strong>This pay period needs attention.</strong><p>Your fixed expenses and savings goal are greater than this paycheck.</p></div></div>}
      <section className="summary-grid">
        <div className="summary-card summary-card--highlight"><span className="summary-card__label">Spendable</span><strong>${dollars(budget.spendable_cents)}</strong><span className="summary-card__hint">after bills & savings</span></div>
        <div className="summary-card"><span className="summary-card__label">Paycheck</span><strong>${dollars(budget.paycheck.amount_cents)}</strong><span className="summary-card__hint">available this period</span></div>
        <div className="summary-card"><span className="summary-card__label">Fixed expenses</span><strong>${dollars(budget.fixed_total_cents)}</strong><span className="summary-card__hint">due this period</span></div>
        <div className="summary-card"><span className="summary-card__label">Savings goal</span><strong>${dollars(budget.savings_goal_cents)}</strong><span className="summary-card__hint">set aside first</span></div>
      </section>
      <section className="content-card categories-card"><div className="card-heading"><div><p className="page-kicker">Your spending plan</p><h2>Category budgets</h2></div><span className="percent-pill">{100 - budget.unallocated_percent}% allocated</span></div>{budget.categories.length ? budget.categories.map((cat) => <CategoryBar key={cat.id} category={cat} />) : <p className="muted">Add categories in Settings to divide up your spendable money.</p>}</section>
    </div>
  );
}
