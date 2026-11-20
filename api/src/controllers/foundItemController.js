const { supabase, isConfigured } = require('../config/supabase');

// GET /api/found-items (dengan filter opsional: ?category_id= & ?search= & ?status= & ?limit=)
exports.getAllFoundItems = async (req, res) => {
  if (!isConfigured) {
    return res.status(503).json({
      success: false,
      message: 'Supabase belum dikonfigurasi. Isi file .env dengan SUPABASE_URL dan SUPABASE_KEY.'
    });
  }

  try {
    const { category_id, search, status, limit } = req.query;

    let query = supabase
      .from('found_items')
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

// GET /api/found-items/:id
exports.getFoundItemById = async (req, res) => {
  if (!isConfigured) {
    return res.status(503).json({
      success: false,
      message: 'Supabase belum dikonfigurasi. Isi file .env dengan SUPABASE_URL dan SUPABASE_KEY.'
    });
  }

  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('found_items')
      .select('*, categories(id, name)')
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({ success: false, message: 'Laporan barang temuan tidak ditemukan' });
    }

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/found-items
exports.createFoundItem = async (req, res) => {
  if (!isConfigured) {
    return res.status(503).json({
      success: false,
      message: 'Supabase belum dikonfigurasi. Isi file .env dengan SUPABASE_URL dan SUPABASE_KEY.'
    });
  }

  try {
    const { name, description, category_id, location, found_date, photo_url, keeper_contact } = req.body;

    if (!name || !location || !found_date || !keeper_contact) {
      return res.status(400).json({
        success: false,
        message: 'Nama barang, lokasi, tanggal temuan, dan kontak penemu wajib diisi'
      });
    }

    const { data, error } = await supabase
      .from('found_items')
      .insert([{
        name,
        description: description || null,
        category_id: category_id || null,
        location,
        found_date,
        photo_url: photo_url || null,
        keeper_contact,
        status: 'available'
      }])
      .select('*, categories(id, name)')
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, message: 'Laporan barang temuan berhasil dibuat', data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/found-items/:id
exports.updateFoundItem = async (req, res) => {
  if (!isConfigured) {
    return res.status(503).json({
      success: false,
      message: 'Supabase belum dikonfigurasi. Isi file .env dengan SUPABASE_URL dan SUPABASE_KEY.'
    });
  }

  try {
    const { id } = req.params;
    const { name, description, category_id, location, found_date, photo_url, keeper_contact, status } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (category_id !== undefined) updates.category_id = category_id;
    if (location !== undefined) updates.location = location;
    if (found_date !== undefined) updates.found_date = found_date;
    if (photo_url !== undefined) updates.photo_url = photo_url;
    if (keeper_contact !== undefined) updates.keeper_contact = keeper_contact;
    if (status !== undefined) updates.status = status; // 'available' atau 'claimed'

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Minimal satu field harus dikirim untuk update laporan.'
      });
    }

    const { data, error } = await supabase
      .from('found_items')
      .update(updates)
      .eq('id', id)
      .select('*, categories(id, name)')
      .single();

    if (error) throw error;

    res.json({ success: true, message: 'Laporan barang temuan berhasil diperbarui', data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/found-items/:id
exports.deleteFoundItem = async (req, res) => {
  if (!isConfigured) {
    return res.status(503).json({
      success: false,
      message: 'Supabase belum dikonfigurasi. Isi file .env dengan SUPABASE_URL dan SUPABASE_KEY.'
    });
  }

  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('found_items')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true, message: 'Laporan barang temuan berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
