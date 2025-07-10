import { useState } from 'react';
import { Button } from 'react-daisyui';

function App() {
  const [message, setMessage] = useState('');

  const fetchMessage = async () => {
    const res = await fetch('/api/message');
    const text = await res.text();
    setMessage(text);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <Button color="primary" onClick={fetchMessage}>
        Get Welcome Message
      </Button>
      {message && <div className="text-lg font-bold">{message}</div>}
    </div>
  );
}

export default App;

