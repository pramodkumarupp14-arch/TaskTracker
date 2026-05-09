import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json());

const DATA_DIR = path.join(__dirname, '..', 'app_data');
const tasksPath = path.join(DATA_DIR, 'tasks.json');
const usersPath = path.join(DATA_DIR, 'users.json');

const readJSON = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf-8'));
const writeJSON = (filePath, data) => fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');

// ── Tasks ──────────────────────────────────────────────────────────
app.get('/api/tasks', (_req, res) => res.json(readJSON(tasksPath)));

app.post('/api/tasks', (req, res) => {
  const tasks = readJSON(tasksPath);
  const newTask = { ...req.body, id: Date.now().toString() };
  tasks.unshift(newTask);
  writeJSON(tasksPath, tasks);
  res.json(newTask);
});

app.put('/api/tasks/:id', (req, res) => {
  const tasks = readJSON(tasksPath);
  const idx = tasks.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Task not found' });
  tasks[idx] = { ...tasks[idx], ...req.body };
  writeJSON(tasksPath, tasks);
  res.json(tasks[idx]);
});

// ── Users ──────────────────────────────────────────────────────────
app.get('/api/users', (_req, res) => res.json(readJSON(usersPath)));

app.post('/api/users', (req, res) => {
  const users = readJSON(usersPath);
  const newUser = { ...req.body, id: Date.now().toString() };
  users.push(newUser);
  writeJSON(usersPath, users);
  res.json(newUser);
});

app.put('/api/users/:id', (req, res) => {
  const users = readJSON(usersPath);
  const idx = users.findIndex(u => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'User not found' });
  users[idx] = { ...users[idx], ...req.body };
  writeJSON(usersPath, users);
  res.json(users[idx]);
});

const PORT = 3001;
app.listen(PORT, () => console.log(`✅ TaskTracker API running at http://localhost:${PORT}`));
