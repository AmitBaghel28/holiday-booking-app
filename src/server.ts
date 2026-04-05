import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { initDB } from './db';

const PORT = process.env.PORT ?? 3000;

initDB();

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
