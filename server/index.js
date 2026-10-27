require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/complaints', require('./routes/complaints'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/institutions', require('./routes/institutions'));

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(process.env.PORT, () => console.log(`API on http://localhost:${process.env.PORT}`));
  })
  .catch((err) => console.error('DB connection failed:', err.message));