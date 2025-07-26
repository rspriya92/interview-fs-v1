import express from 'express';

const router = express.Router();

// GET /api/message - Simple welcome message
router.get('/message', (_req, res) => {
  res.status(200).send('Welcome to Event Desk');
});

export default router;