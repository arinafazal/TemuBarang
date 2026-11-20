const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const isConfigured = Boolean(supabaseUrl && supabaseKey);

if (!isConfigured) {
  console.warn('Peringatan: SUPABASE_URL atau SUPABASE_KEY belum disetel di .env. Aplikasi tetap bisa start, tapi endpoint database akan menolak permintaan.');
}

const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key'
);

module.exports = { supabase, isConfigured };
