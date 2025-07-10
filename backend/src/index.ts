import express from 'express';

const app = express();
const PORT = 5000;

app.get('/api/message', (_req, res) => {
  res.send('Welcome to Event Desk');
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});

