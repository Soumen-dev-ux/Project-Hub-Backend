const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// Get all projects with optional tech stack filtering
router.get('/', async (req, res) => {
  try {
    let query = supabase.from('projects').select('*').order('created_at', { ascending: false });

    if (req.query.tech) {
      query = query.contains('tech_stack', [req.query.tech]);
    }

    const { data: projects, error } = await query;
    if (error) throw error;

    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get random projects
router.get('/random', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 3;
    const { data: projects, error } = await supabase.from('projects').select('*');
    if (error) throw error;

    // In-memory shuffle for simplicity. For large datasets, a Supabase RPC function is recommended.
    const shuffled = projects.sort(() => 0.5 - Math.random());
    res.json(shuffled.slice(0, limit));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all unique tech stacks
router.get('/tech', async (req, res) => {
  try {
    const { data, error } = await supabase.from('projects').select('tech_stack');
    if (error) throw error;

    // Flatten arrays and get unique values
    const allTechStacks = data.flatMap(p => p.tech_stack || []);
    const uniqueTechStacks = [...new Set(allTechStacks)];

    res.json(uniqueTechStacks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a single project
router.get('/:id', async (req, res) => {
  try {
    const { data: project, error } = await supabase.from('projects').select('*').eq('id', req.params.id).single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ message: 'Project not found' });
      }
      throw error;
    }

    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a project
router.post('/', async (req, res) => {
  try {
    const { data: project, error } = await supabase.from('projects').insert([req.body]).select().single();
    if (error) throw error;

    res.status(201).json(project);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
