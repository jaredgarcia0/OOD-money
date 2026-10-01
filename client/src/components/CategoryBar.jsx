export default function CategoryBar({ category }) {
  const { name, budget_cents, spent_cents, remaining_cents } = category;
  const percentSpent = budget_cents > 0
    ? Math.min(100, (spent_cents / budget_cents) * 100)
    : 0;
  const overspent = remaining_cents < 0;

  const dollars = (cents) => (cents / 100).toFixed(2);

  return (
    <div className="category-bar">
      <div className="category-bar-header">
        <span>{name}</span>
        <span className={overspent ? "overspent" : ""}>
          ${dollars(remaining_cents)} left
        </span>
      </div>
      <div className="category-bar-track">
        <div
          className="category-bar-fill"
          style={{
            width: `${percentSpent}%`,
            backgroundColor: overspent ? "#d33" : "#4a90d9",
          }}
        />
      </div>
    </div>
  );
}