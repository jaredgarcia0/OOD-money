// The API uses 'YYYY-MM-DD' strings for calendar dates. Postgres stores them as DATE,
// which Prisma returns as a JS Date at midnight UTC. These helpers convert between the two.

// True only for a real calendar date in YYYY-MM-DD form (rejects 2026-02-30).
function isValidDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T00:00:00Z');
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function toDbDate(value) {
  return new Date(value + 'T00:00:00Z');
}

function fromDbDate(date) {
  return date.toISOString().slice(0, 10);
}

module.exports = { isValidDate, toDbDate, fromDbDate };
