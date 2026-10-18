require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');

const app = express();
app.use(express.json());
app.use(express.static(__dirname));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
const gClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ---------- Register (email + password) ----------
app.post('/register', async (req, res) => {
  const { firstName, secondName, age, gender, email, countryCode, phone, password } = req.body;
  if (!firstName || !secondName || !age || !gender || !email || !phone || !password)
    return res.status(400).json({ error: 'All fields required' });
  if (password.length < 8)
    return res.status(400).json({ error: 'Password must be 8+ characters' });
  const ageNum = parseInt(age, 10);
  if (isNaN(ageNum) || ageNum < 13 || ageNum > 120)
    return res.status(400).json({ error: 'Age must be between 13 and 120' });
  try {
    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      `INSERT INTO users(first_name,last_name,age,gender,email,phone,password_hash)
       VALUES($1,$2,$3,$4,$5,$6,$7)`,
      [firstName, secondName, ageNum, gender, email.toLowerCase(), countryCode + phone, hash]
    );
    res.json({ message: 'Registered successfully' });
  } catch (e) {
    if (e.code === '23505')
      return res.status(409).json({ error: 'Email already exists' });
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// ---------- Login (email + password) ----------
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password required' });
  try {
    const r = await pool.query(
      'SELECT first_name, password_hash FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    if (r.rows.length === 0)
      return res.status(401).json({ error: 'Invalid email or password' });
    if (!r.rows[0].password_hash)
      return res.status(401).json({ error: 'Use Google sign-in for this account' });
    const ok = await bcrypt.compare(password, r.rows[0].password_hash);
    if (!ok)
      return res.status(401).json({ error: 'Invalid email or password' });
    res.json({ message: 'Login successful', name: r.rows[0].first_name });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// ---------- Google sign-up / sign-in ----------
app.post('/auth/google', async (req, res) => {
  try {
    const ticket = await gClient.verifyIdToken({
      idToken: req.body.credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const p = ticket.getPayload();
    if (!p.email_verified)
      return res.status(401).json({ error: 'Google email not verified' });
    const email = p.email.toLowerCase();
    const r = await pool.query('SELECT first_name FROM users WHERE email = $1', [email]);
    if (r.rows.length === 0) {
      await pool.query(
        'INSERT INTO users(first_name,last_name,email,google_id) VALUES($1,$2,$3,$4)',
        [p.given_name || 'User', p.family_name || '-', email, p.sub]
      );
      return res.json({ message: 'Signed up with Google', name: p.given_name || 'User' });
    }
    res.json({ message: 'Signed in with Google', name: r.rows[0].first_name });
  } catch (e) {
    console.error(e);
    res.status(401).json({ error: 'Google sign-in failed' });
  }
});

app.listen(3000, () => console.log('Running at http://localhost:3000'));
