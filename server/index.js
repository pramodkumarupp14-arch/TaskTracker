import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', 'app_data', '.env') });

const app = express();
app.use(cors());
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ── Helpers ────────────────────────────────────────────────────────
const mapToCamel = (item) => {
  if (!item) return item;
  return {
    id: item.id,
    sourceDept: item.source_dept,
    letterNo: item.letter_no,
    letterDate: item.letter_date,
    receivedDateTime: item.received_date_time,
    briefSubject: item.brief_subject,
    assignedBySenior: item.assigned_by_senior,
    priority: item.priority,
    instructions: item.instructions,
    assignedTo: item.assigned_to,
    assignmentDateTime: item.assignment_date_time,
    tentativeCompletionTime: item.tentative_completion_time,
    inchargeRemarks: item.incharge_remarks,
    status: item.status,
    subordinateStatuses: item.subordinate_statuses,
    pushRemarks: item.push_remarks,
    createdAt: item.created_at,
    updatedAt: item.updated_at
  };
};

const mapToSnake = (item) => {
  return {
    source_dept: item.sourceDept,
    letter_no: item.letterNo,
    letter_date: item.letterDate,
    received_date_time: item.receivedDateTime,
    brief_subject: item.briefSubject,
    assigned_by_senior: item.assignedBySenior,
    priority: item.priority,
    instructions: item.instructions,
    assigned_to: item.assignedTo,
    assignment_date_time: item.assignmentDateTime,
    tentative_completion_time: item.tentativeCompletionTime,
    incharge_remarks: item.inchargeRemarks,
    status: item.status,
    subordinate_statuses: item.subordinateStatuses,
    push_remarks: item.pushRemarks
  };
};

// ── Tasks ──────────────────────────────────────────────────────────
app.get('/api/tasks', async (_req, res) => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data.map(mapToCamel));
});

app.post('/api/tasks', async (req, res) => {
  const newTask = { ...mapToSnake(req.body), id: Date.now() };
  const { data, error } = await supabase
    .from('tasks')
    .insert([newTask])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(mapToCamel(data));
});

app.put('/api/tasks/:id', async (req, res) => {
  const updates = mapToSnake(req.body);
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(mapToCamel(data));
});

// ── Users ──────────────────────────────────────────────────────────
app.get('/api/users', async (_req, res) => {
  const { data, error } = await supabase.from('users').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/api/users', async (req, res) => {
  const newUser = { ...req.body, id: Date.now() };
  const { data, error } = await supabase
    .from('users')
    .insert([newUser])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.put('/api/users/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .update(req.body)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ── Config ──────────────────────────────────────────────────────────
app.get('/api/config', async (_req, res) => {
  const [prioritiesResult, officersResult] = await Promise.all([
    supabase.from('priorities').select('name').order('id'),
    supabase.from('officers').select('name').order('id')
  ]);

  if (prioritiesResult.error) return res.status(500).json({ error: prioritiesResult.error.message });
  if (officersResult.error) return res.status(500).json({ error: officersResult.error.message });

  res.json({
    priorities: prioritiesResult.data.map(p => p.name),
    officers: officersResult.data.map(o => o.name)
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✅ TaskTracker API running at http://localhost:${PORT}`));
