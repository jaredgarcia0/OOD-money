import { useEffect, useState } from 'react';
fhfghfghfghfghfgh
function App() {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/health`)
      .then((res) => res.json())
      .then((data) => setHealth(data))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div>
      <h1>API Connection Test</h1>
      {health && <p>✅ Server says: {JSON.stringify(health)}</p>}
      {error && <p>❌ Error: {error}</p>}
    </div>
  );
}

export default App;

