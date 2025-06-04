import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

app.use(cors());
app.use(express.json());

app.get('/api/lancamentos', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM lancamentos');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/centro-custos', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM centro_custos');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/dashboard', async (req, res) => {
  try {
    const [monthly] = await pool.query("SELECT MONTH(data) as mes, SUM(CASE WHEN type='receita' THEN amount ELSE 0 END) as receita, SUM(CASE WHEN type='despesa' THEN ABS(amount) ELSE 0 END) as despesa FROM lancamentos GROUP BY MONTH(data) ORDER BY MONTH(data)");
    const [category] = await pool.query("SELECT c.nome as name, SUM(ABS(l.amount)) as value FROM lancamentos l JOIN centro_custos c ON l.centro_id = c.id WHERE l.type='despesa' GROUP BY l.centro_id");
    const [recent] = await pool.query("SELECT id, description, amount, data, type FROM lancamentos ORDER BY data DESC LIMIT 10");
    res.json({ monthlyData: monthly, expensesByCategory: category, recentTransactions: recent });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
