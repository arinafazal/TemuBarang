const { supabase, isConfigured } = require('../config/supabase');

// GET /api/lost-items (dengan filter opsional: ?category_id= & ?search= & ?status= & ?limit=)
exports.getAllLostItems = async (req, res) => {
  if (!isConfigured) {
    return res.status(503).json({
      success: false,
      message: 'Supabase belum dikonfigurasi. Isi file .env dengan SUPABASE_URL dan SUPABASE_KEY.'
    });
  }

  try {
    const { category_id, search, status, limit } = req.query;

    let query = supabase
      .from('lost_items')
      .select('*, categories(id, name)')
      .order('created_at', { ascending: false });

    if (category_id) {
      query = query.eq('category_id', category_id);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,location.ilike.%${search}%`);
    }

    if (limit) {
      query = query.limit(parseInt(limit, 10));
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/lost-items/:id
exports.getLostItemById = async (req, res) => {
  if (!isConfigured) {
    return res.status(503).json({
      success: false,
      message: 'Supabase belum dikonfigurasi. Isi file .env dengan SUPABASE_URL dan SUPABASE_KEY.'
    });
  }

  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('lost_items')
      .select('*, categories(id, name)')
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({ success: false, message: 'Laporan barang hilang tidak ditemukan' });
    }

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/lost-items
exports.createLostItem = async (req, res) => {
  if (!isConfigured) {
    return res.status(503).json({
      success: false,
      message: 'Supabase belum dikonfigurasi. Isi file .env dengan SUPABASE_URL dan SUPABASE_KEY.'
    });
  }

  try {
    const { name, description, category_id, location, lost_date, photo_url, contact } = req.body;

    if (!name || !location || !lost_date || !contact) {
      return res.status(400).json({
        success: false,
        message: 'Nama barang, lokasi, tanggal hilang, dan kontak wajib diisi'
      });
    }

    const { data, error } = await supabase
      .from('lost_items')
      .insert([{
        name,
        description: description || null,
        category_id: category_id || null,
        location,
        lost_date,
        photo_url: photo_url || null,
        contact,
        status: 'searching'
      }])
      .select('*, categories(id, name)')
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, message: 'Laporan barang hilang berhasil dibuat', data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/lost-items/:id
exports.updateLostItem = async (req, res) => {
  if (!isConfigured) {
    return res.status(503).json({
      success: false,
      message: 'Supabase belum dikonfigurasi. Isi file .env dengan SUPABASE_URL dan SUPABASE_KEY.'
    });
  }

  try {
    const { id } = req.params;
    const { name, description, category_id, location, lost_date, photo_url, contact, status } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (category_id !== undefined) updates.category_id = category_id;
    if (location !== undefined) updates.location = location;
    if (lost_date !== undefined) updates.lost_date = lost_date;
    if (photo_url !== undefined) updates.photo_url = photo_url;
    if (contact !== undefined) updates.contact = contact;
    if (status !== undefined) updates.status = status; // 'searching' atau 'found'

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Minimal satu field harus dikirim untuk update laporan.'
      });
    }

    const { data, error } = await supabase
      .from('lost_items')
      .update(updates)
      .eq('id', id)
      .select('*, categories(id, name)')
      .single();

    if (error) throw error;

    res.json({ success: true, message: 'Laporan barang hilang berhasil diperbarui', data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/lost-items/:id
exports.deleteLostItem = async (req, res) => {
  if (!isConfigured) {
    return res.status(503).json({
      success: false,
      message: 'Supabase belum dikonfigurasi. Isi file .env dengan SUPABASE_URL dan SUPABASE_KEY.'
    });
  }

  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('lost_items')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true, message: 'Laporan barang hilang berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
