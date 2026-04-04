const express  = require('express');
const { supabase } = require('../config/supabase');
const router   = express.Router();

// Use the server-level supabase client (no user auth needed — bakery internal)

/* ── GET /api/transactions ─────────────────────────── */
router.get('/', async (req, res) => {
  try {
    const { type, category, search, sort_by = 'date', order = 'desc' } = req.query;

    let query = supabase
      .from('transactions')
      .select('*');

    if (type)     query = query.eq('type', type);
    if (category) query = query.eq('category', category);
    if (search)   query = query.ilike('title', `%${search}%`);

    const validCols = ['date', 'amount', 'created_at'];
    const col       = validCols.includes(sort_by) ? sort_by : 'date';
    query = query.order(col, { ascending: order === 'asc' });

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });

    // Compute summary
    const income  = data.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const expense = data.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);

    res.json({
      transactions: data,
      summary: { income, expense, balance: income - expense, count: data.length },
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching transactions' });
  }
});

/* ── POST /api/transactions ────────────────────────── */
router.post('/', async (req, res) => {
  try {
    const { title, amount, type, category, date, note } = req.body;

    if (!title || !amount || !type) {
      return res.status(400).json({ error: 'title, amount, and type are required' });
    }
    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({ error: 'type must be "income" or "expense"' });
    }
    if (Number(amount) <= 0) {
      return res.status(400).json({ error: 'amount must be greater than 0' });
    }

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        title:    title.trim(),
        amount:   Number(amount),
        type,
        category: category || 'Other',
        date:     date || new Date().toISOString().split('T')[0],
        note:     note || '',
      })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json({ transaction: data });
  } catch (err) {
    res.status(500).json({ error: 'Server error creating transaction' });
  }
});

/* ── PUT /api/transactions/:id ──────────────────────── */
router.put('/:id', async (req, res) => {
  try {
    const { title, amount, type, category, date, note } = req.body;
    const updates = {};

    if (title    !== undefined) updates.title    = title.trim();
    if (amount   !== undefined) updates.amount   = Number(amount);
    if (type     !== undefined) updates.type     = type;
    if (category !== undefined) updates.category = category;
    if (date     !== undefined) updates.date     = date;
    if (note     !== undefined) updates.note     = note;

    if (updates.type && !['income', 'expense'].includes(updates.type)) {
      return res.status(400).json({ error: 'type must be "income" or "expense"' });
    }
    if (updates.amount !== undefined && updates.amount <= 0) {
      return res.status(400).json({ error: 'amount must be greater than 0' });
    }

    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ transaction: data });
  } catch (err) {
    res.status(500).json({ error: 'Server error updating transaction' });
  }
});

/* ── DELETE /api/transactions/:id ───────────────────── */
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', req.params.id);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true, message: 'Transaction deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error deleting transaction' });
  }
});

module.exports = router;
