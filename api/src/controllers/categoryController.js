/**
 * ============================================================================
 * File: api/src/controllers/categoryController.js
 * Fungsi:
 *   - Controller untuk tabel 'categories' di Supabase.
 *   - Menyediakan handler fungsi REST API:
 *     1. getAllCategories: Mengambil seluruh daftar kategori (Elektronik, Dokumen, dll).
 *     2. getCategoryById: Mengambil detail satu kategori berdasarkan ID.
 *     3. createCategory: Menambahkan kategori baru.
 *     4. updateCategory: Memperbarui data kategori.
 *     5. deleteCategory: Menghapus kategori.
 * ============================================================================
 */

const { supabase, isConfigured } = require('../config/supabase');

// GET /api/categories
exports.getAllCategories = async (req, res) => {
  if (!isConfigured) {
    return res.status(503).json({
      success: false,
      message: 'Supabase belum dikonfigurasi. Isi file .env dengan SUPABASE_URL dan SUPABASE_KEY.'
    });
  }

  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('id', { ascending: true });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/categories/:id
exports.getCategoryById = async (req, res) => {
  if (!isConfigured) {
    return res.status(503).json({
      success: false,
      message: 'Supabase belum dikonfigurasi. Isi file .env dengan SUPABASE_URL dan SUPABASE_KEY.'
    });
  }

  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan' });
    }
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/categories
exports.createCategory = async (req, res) => {
  if (!isConfigured) {
    return res.status(503).json({
      success: false,
      message: 'Supabase belum dikonfigurasi. Isi file .env dengan SUPABASE_URL dan SUPABASE_KEY.'
    });
  }

  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Nama kategori wajib diisi' });
    }

    const { data, error } = await supabase
      .from('categories')
      .insert([{ name }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, message: 'Kategori berhasil ditambahkan', data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/categories/:id
exports.updateCategory = async (req, res) => {
  if (!isConfigured) {
    return res.status(503).json({
      success: false,
      message: 'Supabase belum dikonfigurasi. Isi file .env dengan SUPABASE_URL dan SUPABASE_KEY.'
    });
  }

  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Nama kategori wajib diisi' });
    }

    const { data, error } = await supabase
      .from('categories')
      .update({ name })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, message: 'Kategori berhasil diperbarui', data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/categories/:id
exports.deleteCategory = async (req, res) => {
  if (!isConfigured) {
    return res.status(503).json({
      success: false,
      message: 'Supabase belum dikonfigurasi. Isi file .env dengan SUPABASE_URL dan SUPABASE_KEY.'
    });
  }

  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true, message: 'Kategori berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
