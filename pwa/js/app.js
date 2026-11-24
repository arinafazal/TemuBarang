// ==========================================================================
// TemuBarang - Controller & Router PWA
// ==========================================================================

const state = {
  categories: [],
  foundItems: [],
  lostItems: [],
  deferredPrompt: null
};

// SVG Placeholder bersih saat laporan dibuat tanpa foto
const NO_PHOTO_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='500' height='500' viewBox='0 0 500 500'%3E%3Crect width='500' height='500' fill='%23f8fafc'/%3E%3Cg transform='translate(175, 150)' fill='none' stroke='%2394a3b8' stroke-width='14' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='10' y='30' width='130' height='100' rx='16'/%3E%3Ccircle cx='75' cy='80' r='26'/%3E%3Cpath d='M45 30l10-18h40l10 18'/%3E%3C/g%3E%3Ctext x='250' y='320' font-family='system-ui, -apple-system, sans-serif' font-size='16' font-weight='800' fill='%2394a3b8' text-anchor='middle' letter-spacing='1'%3ETIDAK ADA FOTO%3C/text%3E%3C/svg%3E";

// Inisialisasi PWA
function initPWA() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./service-worker.js')
        .then(reg => console.log('Service Worker aktif:', reg.scope))
        .catch(err => console.error('Service Worker error:', err));
    });
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    state.deferredPrompt = e;
  });
}

// Router Navigasi (Sinkronkan Desktop Sidebar & Mobile Bottom Nav)
async function router() {
  const hash = window.location.hash || '#/hilang';
  const container = document.getElementById('app-content');

  // Reset tab active di sidebar desktop dan bottom bar mobile
  document.querySelectorAll('.sidebar-item, .mobile-tab, .mobile-fab').forEach(el => {
    el.classList.remove('active');
  });

  const setTabActive = (name) => {
    const side = document.getElementById(`side-tab-${name}`);
    if (side) side.classList.add('active');
    const mob = document.getElementById(`tab-${name}`);
    if (mob) mob.classList.add('active');
  };

  if (hash === '#/beranda') {
    setTabActive('beranda');
    await renderBeranda(container);
  } else if (hash === '#/hilang' || hash.startsWith('#/hilang?')) {
    setTabActive('hilang');
    await renderDaftarHilang(container);
  } else if (hash.startsWith('#/hilang/')) {
    const id = hash.replace('#/hilang/', '');
    setTabActive('hilang');
    await renderDetail(container, id, 'hilang');
  } else if (hash === '#/temuan' || hash === '#/' || hash === '') {
    setTabActive('temuan');
    await renderDaftarTemuan(container);
  } else if (hash.startsWith('#/temuan/')) {
    const id = hash.replace('#/temuan/', '');
    setTabActive('temuan');
    await renderDetail(container, id, 'temuan');
  } else if (hash === '#/lapor') {
    setTabActive('lapor');
    await renderFormLapor(container);
  } else if (hash === '#/profil') {
    setTabActive('profil');
    renderProfil(container);
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==========================================================================
// 1. DAFTAR BARANG HILANG (EXACT MATCH FIGMA REVAMP SCREENSHOT)
// ==========================================================================
async function renderDaftarHilang(container) {
  container.innerHTML = `
    <div style="text-align:center; padding: 60px; color: var(--text-gray);">
      <div>Memuat data barang hilang...</div>
    </div>
  `;

  try {
    const [catRes, itemsRes] = await Promise.all([
      API.getCategories(),
      API.getLostItems()
    ]);

    state.categories = catRes.data || [];
    const rawLost = itemsRes.data || [];
    const allItems = rawLost.filter(it => !window.TB_ARCHIVE || !window.TB_ARCHIVE.isItemArchived(it.id, 'hilang'));
    state.lostItems = allItems;

    container.innerHTML = `
      <!-- Content Header (Overline, Title, Desc) -->
      <div class="content-header-row">
        <div class="content-header-left">
          <div class="content-overline">TEMUBARANG</div>
          <h1 class="page-title-figma">Barang Hilang</h1>
          <p class="page-desc-figma">Bantu temukan dan kembalikan barang mereka.</p>
        </div>
      </div>

      <!-- Search Box (Exact Figma) -->
      <div class="search-box-figma">
        <svg class="search-icon-figma" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input type="text" id="lost-search-input" class="search-input-figma" placeholder="Cari barang hilang..." />
      </div>

      <!-- Section Divider -->
      <div class="section-divider-figma"></div>

      <!-- Category Filter Pills (Exact Figma Rounded Full) -->
      <div class="filter-pills-row-figma" id="lost-cat-filters">
        <button class="pill-btn-figma active" data-cat="">Semua</button>
        ${state.categories.map(c => `
          <button class="pill-btn-figma" data-cat="${c.id}">${c.name}</button>
        `).join('')}
      </div>

      <!-- Meta Row (Counter & Sort) -->
      <div class="meta-row-figma">
        <span class="meta-counter-figma" id="lost-counter-text">
          <strong>${allItems.length}</strong> laporan ditemukan
        </span>
        <select class="sort-select-figma" id="lost-sort-select" title="Urutkan laporan">
          <option value="newest">Terbaru</option>
          <option value="oldest">Terlama</option>
          <option value="az">Nama (A - Z)</option>
          <option value="za">Nama (Z - A)</option>
        </select>
      </div>

      <!-- Cards Grid Feed -->
      <div class="cards-grid-figma" id="lost-cards-feed">
        ${allItems.length ? allItems.map(item => renderItemCardHTML(item, 'hilang')).join('') : `
          <div class="empty-state-figma">
            <div class="empty-icon-figma">🔍</div>
            <h3>Belum Ada Barang Hilang</h3>
            <p>Tidak ada laporan barang hilang yang sedang dicari saat ini.</p>
            <a href="#/lapor" class="pill-btn-figma active" style="text-decoration:none; display:inline-flex;">+ Laporkan Barang Hilang</a>
          </div>
        `}
      </div>
    `;

    let activeCat = '';
    let searchQuery = '';
    let currentSort = 'newest';

    const applyLostFilter = () => {
      let filtered = [...allItems];
      if (activeCat) {
        filtered = filtered.filter(it => String(it.category_id) === String(activeCat));
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(it =>
          (it.name && it.name.toLowerCase().includes(q)) ||
          (it.location && it.location.toLowerCase().includes(q)) ||
          (it.description && it.description.toLowerCase().includes(q))
        );
      }

      if (currentSort === 'newest') {
        filtered.sort((a, b) => new Date(b.lost_date || b.created_at || 0) - new Date(a.lost_date || a.created_at || 0));
      } else if (currentSort === 'oldest') {
        filtered.sort((a, b) => new Date(a.lost_date || a.created_at || 0) - new Date(b.lost_date || b.created_at || 0));
      } else if (currentSort === 'az') {
        filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      } else if (currentSort === 'za') {
        filtered.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
      }

      const feed = document.getElementById('lost-cards-feed');
      const counterEl = document.getElementById('lost-counter-text');
      if (counterEl) {
        counterEl.innerHTML = `<strong>${filtered.length}</strong> laporan ditemukan`;
      }
      if (feed) {
        feed.innerHTML = filtered.length
          ? filtered.map(item => renderItemCardHTML(item, 'hilang')).join('')
          : '<div class="empty-state-figma"><p>Tidak ada barang hilang yang sesuai dengan filter.</p></div>';
      }
    };

    const lostSortSelect = document.getElementById('lost-sort-select');
    if (lostSortSelect) {
      lostSortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        applyLostFilter();
      });
    }

    document.querySelectorAll('#lost-cat-filters .pill-btn-figma').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#lost-cat-filters .pill-btn-figma').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeCat = btn.getAttribute('data-cat');
        applyLostFilter();
      });
    });

    const input = document.getElementById('lost-search-input');
    if (input) {
      input.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim();
        applyLostFilter();
      });
    }

  } catch (err) {
    console.error('Error rendering lost page:', err);
    container.innerHTML = `
      <div class="empty-state-figma" style="padding: 40px 20px;">
        <div class="empty-icon-figma">⚡</div>
        <h3>Sedang Mode Offline</h3>
        <p>Aplikasi sedang offline. Silakan sambungkan internet untuk memperbarui data terbaru.</p>
        <button onclick="location.reload()" class="pill-btn-figma active" style="margin-top:14px; cursor:pointer;">Muat Ulang</button>
      </div>
    `;
  }
}

// ==========================================================================
// 2. DAFTAR BARANG TEMUAN
// ==========================================================================
async function renderDaftarTemuan(container) {
  container.innerHTML = `
    <div style="text-align:center; padding: 60px; color: var(--text-gray);">
      <div>Memuat data barang temuan...</div>
    </div>
  `;

  try {
    const [catRes, itemsRes] = await Promise.all([
      API.getCategories(),
      API.getFoundItems()
    ]);

    state.categories = catRes.data || [];
    const rawFound = itemsRes.data || [];
    const allItems = rawFound.filter(it => !window.TB_ARCHIVE || !window.TB_ARCHIVE.isItemArchived(it.id, 'temuan'));
    state.foundItems = allItems;

    container.innerHTML = `
      <!-- Content Header -->
      <div class="content-header-row">
        <div class="content-header-left">
          <div class="content-overline">TEMUBARANG</div>
          <h1 class="page-title-figma">Barang Temuan</h1>
          <p class="page-desc-figma">Barang yang diamankan civitas kampus atau pos satpam.</p>
        </div>
      </div>

      <!-- Search Box -->
      <div class="search-box-figma">
        <svg class="search-icon-figma" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input type="text" id="main-search-input" class="search-input-figma" placeholder="Cari barang temuan, lokasi penemuan, pos satpam..." />
      </div>

      <!-- Section Divider -->
      <div class="section-divider-figma"></div>

      <!-- Category Filter Pills -->
      <div class="filter-pills-row-figma" id="cat-filters">
        <button class="pill-btn-figma active" data-cat="">Semua</button>
        ${state.categories.map(c => `
          <button class="pill-btn-figma" data-cat="${c.id}">${c.name}</button>
        `).join('')}
      </div>

      <!-- Subfilter Lokasi -->
      <div class="subfilter-row-figma">
        <span style="font-weight:700; display:inline-flex; align-items:center; gap:4px; margin-right:4px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          Lokasi:
        </span>
        <button class="subfilter-chip-figma active" data-loc="all">Semua Lokasi</button>
        <button class="subfilter-chip-figma" data-loc="satpam">Disimpan di Satpam</button>
        <button class="subfilter-chip-figma" data-loc="penemu">Dipegang Penemu</button>
      </div>

      <!-- Meta Row -->
      <div class="meta-row-figma">
        <span class="meta-counter-figma" id="counter-text">
          <strong>${allItems.length}</strong> barang temuan tersedia
        </span>
        <select class="sort-select-figma" id="found-sort-select" title="Urutkan temuan">
          <option value="newest">Terbaru</option>
          <option value="oldest">Terlama</option>
          <option value="az">Nama (A - Z)</option>
          <option value="za">Nama (Z - A)</option>
        </select>
      </div>

      <!-- Cards Grid Feed -->
      <div class="cards-grid-figma" id="cards-feed">
        ${allItems.length ? allItems.map(item => renderItemCardHTML(item, 'temuan')).join('') : `
          <div class="empty-state-figma">
            <div class="empty-icon-figma">📦</div>
            <h3>Belum Ada Barang Temuan</h3>
            <p>Database saat ini bersih & kosong. Jadilah yang pertama melaporkan!</p>
            <a href="#/lapor" class="pill-btn-figma active" style="text-decoration:none; display:inline-flex;">+ Buat Laporan Temuan</a>
          </div>
        `}
      </div>
    `;

    let activeCat = '';
    let activeLoc = 'all';
    let searchQuery = '';
    let currentSort = 'newest';

    const applyFilter = () => {
      let filtered = [...allItems];
      if (activeCat) {
        filtered = filtered.filter(it => String(it.category_id) === String(activeCat));
      }
      if (activeLoc === 'satpam') {
        filtered = filtered.filter(it => it.location && it.location.toLowerCase().includes('satpam'));
      } else if (activeLoc === 'penemu') {
        filtered = filtered.filter(it => !it.location || !it.location.toLowerCase().includes('satpam'));
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(it =>
          (it.name && it.name.toLowerCase().includes(q)) ||
          (it.location && it.location.toLowerCase().includes(q)) ||
          (it.description && it.description.toLowerCase().includes(q))
        );
      }

      if (currentSort === 'newest') {
        filtered.sort((a, b) => new Date(b.found_date || b.created_at || 0) - new Date(a.found_date || a.created_at || 0));
      } else if (currentSort === 'oldest') {
        filtered.sort((a, b) => new Date(a.found_date || a.created_at || 0) - new Date(b.found_date || b.created_at || 0));
      } else if (currentSort === 'az') {
        filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      } else if (currentSort === 'za') {
        filtered.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
      }

      const feed = document.getElementById('cards-feed');
      const counterEl = document.getElementById('counter-text');
      if (counterEl) {
        counterEl.innerHTML = `<strong>${filtered.length}</strong> barang temuan tersedia`;
      }
      if (feed) {
        feed.innerHTML = filtered.length
          ? filtered.map(item => renderItemCardHTML(item, 'temuan')).join('')
          : '<div class="empty-state-figma"><p>Tidak ada barang temuan yang sesuai dengan filter.</p></div>';
      }
    };

    const foundSortSelect = document.getElementById('found-sort-select');
    if (foundSortSelect) {
      foundSortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        applyFilter();
      });
    }

    document.querySelectorAll('#cat-filters .pill-btn-figma').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#cat-filters .pill-btn-figma').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeCat = btn.getAttribute('data-cat');
        applyFilter();
      });
    });

    document.querySelectorAll('.subfilter-chip-figma').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.subfilter-chip-figma').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeLoc = btn.getAttribute('data-loc');
        applyFilter();
      });
    });

    const searchInput = document.getElementById('main-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim();
        applyFilter();
      });
    }

  } catch (err) {
    console.error('Error rendering lost page:', err);
    container.innerHTML = `
      <div class="empty-state-figma" style="padding: 40px 20px;">
        <div class="empty-icon-figma">⚡</div>
        <h3>Sedang Mode Offline</h3>
        <p>Aplikasi sedang offline. Silakan sambungkan internet untuk memperbarui data terbaru.</p>
        <button onclick="location.reload()" class="pill-btn-figma active" style="margin-top:14px; cursor:pointer;">Muat Ulang</button>
      </div>
    `;
  }
}

// ==========================================================================
// 3. BERANDA DASHBOARD
// ==========================================================================
async function renderBeranda(container) {
  try {
    const [foundRes, lostRes] = await Promise.all([
      API.getFoundItems({ limit: 4 }),
      API.getLostItems({ limit: 4 })
    ]);

    const foundItems = (foundRes.data || []).filter(it => !window.TB_ARCHIVE || !window.TB_ARCHIVE.isItemArchived(it.id, 'temuan'));
    const lostItems = (lostRes.data || []).filter(it => !window.TB_ARCHIVE || !window.TB_ARCHIVE.isItemArchived(it.id, 'hilang'));

    container.innerHTML = `
      <!-- Content Header -->
      <div class="content-header-row">
        <div class="content-header-left">
          <div class="content-overline">TEMUBARANG</div>
          <h1 class="page-title-figma">Beranda TemuBarang</h1>
          <p class="page-desc-figma">Pusat pelaporan dan pengamanan barang hilang & temuan resmi kampus.</p>
        </div>
      </div>

      <!-- Search Box -->
      <div class="search-box-figma">
        <svg class="search-icon-figma" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input type="text" id="beranda-search-input" class="search-input-figma" placeholder="Cari barang hilang atau temuan di kampus..." />
      </div>

      <!-- Section Divider -->
      <div class="section-divider-figma"></div>

      <!-- KPI Summary Cards -->
      <div class="stats-kpi-grid">
        <div class="stat-kpi-card" onclick="location.hash='#/temuan'">
          <div class="stat-kpi-num" style="color:var(--primary-blue);">${foundRes.count !== undefined ? foundRes.count : foundItems.length}</div>
          <div class="stat-kpi-label">Barang Temuan Tersedia</div>
        </div>
        <div class="stat-kpi-card" onclick="location.hash='#/hilang'">
          <div class="stat-kpi-num" style="color:var(--amber-text);">${lostRes.count !== undefined ? lostRes.count : lostItems.length}</div>
          <div class="stat-kpi-label">Barang Hilang Dicari</div>
        </div>
      </div>

      <!-- Recent Found Section -->
      <div class="section-head-row">
        <h2 class="section-head-title">Barang Temuan Terbaru</h2>
        <a href="#/temuan" class="btn-see-all-figma">Lihat Semua ›</a>
      </div>
      <div class="cards-grid-figma" id="beranda-found-feed">
        ${foundItems.length ? foundItems.map(it => renderItemCardHTML(it, 'temuan')).join('') : '<div class="empty-state-figma" style="padding:28px;"><p>Belum ada data barang temuan.</p></div>'}
      </div>

      <!-- Recent Lost Section -->
      <div class="section-head-row" style="margin-top:36px;">
        <h2 class="section-head-title">Barang Hilang Sedang Dicari</h2>
        <a href="#/hilang" class="btn-see-all-figma">Lihat Semua ›</a>
      </div>
      <div class="cards-grid-figma" id="beranda-lost-feed">
        ${lostItems.length ? lostItems.map(it => renderItemCardHTML(it, 'hilang')).join('') : '<div class="empty-state-figma" style="padding:28px;"><p>Belum ada data barang hilang.</p></div>'}
      </div>
    `;

    const bInput = document.getElementById('beranda-search-input');
    if (bInput) {
      bInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          location.hash = '#/temuan';
        }
      });
    }

  } catch (e) {
    console.error('Error rendering beranda:', e);
    container.innerHTML = `
      <div class="empty-state-figma" style="padding: 40px 20px;">
        <div class="empty-icon-figma">⚡</div>
        <h3>Sedang Mode Offline</h3>
        <p>Aplikasi sedang offline. Data yang ditampilkan adalah data cache tersimpan.</p>
        <button onclick="location.reload()" class="pill-btn-figma active" style="margin-top:14px; cursor:pointer;">Muat Ulang</button>
      </div>
    `;
  }
}

// ==========================================================================
// 4. FORM LAPOR
// ==========================================================================
async function renderFormLapor(container) {
  try {
    const catRes = await API.getCategories();
    state.categories = catRes.data || [];
  } catch (e) {
    console.error(e);
  }

  const today = new Date().toISOString().split('T')[0];

  container.innerHTML = `
    <!-- Content Header -->
    <div class="content-header-row">
      <div class="content-header-left">
        <div class="content-overline">TEMUBARANG</div>
        <h1 class="page-title-figma">Buat Laporan Barang</h1>
        <p class="page-desc-figma">Laporkan barang yang Anda temukan atau kehilangan barang.</p>
      </div>
    </div>

    <div class="section-divider-figma"></div>

    <div class="form-card-figma">
      <form id="real-report-form" class="form-grid-figma">
        <div class="form-group-figma">
          <label class="form-label-figma">Jenis Laporan *</label>
          <select id="lap-type" class="form-input-figma" required>
            <option value="found">Barang Temuan (Saya mengamankan barang orang)</option>
            <option value="lost">Barang Hilang (Saya kehilangan barang saya)</option>
          </select>
        </div>

        <div class="form-group-figma">
          <label class="form-label-figma">Tanggal Kejadian *</label>
          <input type="date" id="lap-date" class="form-input-figma" value="${today}" required />
        </div>

        <div class="form-group-figma">
          <label class="form-label-figma">Nama Barang *</label>
          <input type="text" id="lap-name" class="form-input-figma" placeholder="Contoh: AirPods Pro Gen 2 (Case Biru)" required />
        </div>

        <div class="form-group-figma">
          <label class="form-label-figma">Kategori *</label>
          <select id="lap-cat" class="form-input-figma" required>
            <option value="">Pilih Kategori Barang</option>
            ${state.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
          </select>
        </div>

        <div class="form-group-figma">
          <label class="form-label-figma" id="lbl-location">Lokasi Penemuan / Pos Satpam Pengaman *</label>
          <input type="text" id="lap-loc" class="form-input-figma" placeholder="Contoh: Pos Satpam Gedung Rektorat (Ditemukan di Kantin)" required />
        </div>

        <div class="form-group-figma">
          <label class="form-label-figma" id="lbl-contact">Nomor Kontak WhatsApp Pelapor *</label>
          <input type="text" id="lap-contact" class="form-input-figma" placeholder="081234567890 (Satpam Bambang)" required />
        </div>

        <div class="form-group-figma form-col-full">
          <label class="form-label-figma">Foto Barang</label>
          <div class="upload-dropzone-figma" id="upload-dropzone">
            <input type="file" id="lap-photo-file" accept="image/*" style="display:none;" />
            <div id="upload-placeholder" style="display:flex; flex-direction:column; align-items:center; gap:8px;">
              <div class="upload-icon-circle">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
              </div>
              <div style="font-size:13.5px; font-weight:700; color:var(--text-dark);">Pilih, Seret, atau Paste Foto ke Sini</div>
              <div style="font-size:12px; color:var(--text-gray);">Bisa seret gambar langsung dari Google / internet / PC, klik cari file, atau paste (Ctrl + V)</div>
            </div>
            <div id="upload-preview-box" style="display:none; align-items:center; gap:14px; text-align:left;">
              <img id="upload-preview-img" src="" alt="Preview" style="width:72px; height:72px; border-radius:10px; object-fit:cover; border:1px solid var(--border-color);" />
              <div style="flex:1; min-width:0;">
                <div id="upload-preview-name" style="font-size:13px; font-weight:700; color:var(--text-dark); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"></div>
                <div id="upload-preview-size" style="font-size:11.5px; color:var(--text-gray); margin-top:2px;"></div>
                <button type="button" id="btn-remove-photo" style="background:none; border:none; color:#ef4444; font-size:12px; font-weight:700; cursor:pointer; padding:0; margin-top:4px;">✕ Hapus / Ganti Foto</button>
              </div>
            </div>
          </div>

          <!-- Input URL Alternatif dari Internet -->
          <div style="margin-top:10px; display:flex; gap:8px; align-items:center;">
            <input type="url" id="lap-photo-url-input" class="form-input-figma" style="height:42px; font-size:12.5px;" placeholder="Atau paste link URL gambar dari internet (https://...)" />
            <button type="button" id="btn-apply-url" class="btn-primary-figma" style="width:auto; height:42px; padding:0 18px; font-size:12.5px; white-space:nowrap;">Ambil Foto</button>
          </div>

          <input type="hidden" id="lap-photo-data" />
        </div>

        <div class="form-group-figma form-col-full">
          <label class="form-label-figma">Deskripsi & Ciri Khusus</label>
          <textarea id="lap-desc" class="form-input-figma" style="height:86px; padding:10px 14px;" placeholder="Warna, stiker khusus, lecet, atau tanda pengenal..."></textarea>
        </div>

        <div class="form-col-full" style="margin-top:6px;">
          <button type="submit" class="btn-primary-figma" id="btn-submit-report">
            Kirim Laporan
          </button>
        </div>
      </form>
    </div>
  `;

  const lapType = document.getElementById('lap-type');
  const lblLocation = document.getElementById('lbl-location');
  const lblContact = document.getElementById('lbl-contact');

  // File Upload & Preview Handler
  const dropzone = document.getElementById('upload-dropzone');
  const fileInput = document.getElementById('lap-photo-file');
  const photoDataInput = document.getElementById('lap-photo-data');
  const placeholder = document.getElementById('upload-placeholder');
  const previewBox = document.getElementById('upload-preview-box');
  const previewImg = document.getElementById('upload-preview-img');
  const previewName = document.getElementById('upload-preview-name');
  const previewSize = document.getElementById('upload-preview-size');
  const btnRemove = document.getElementById('btn-remove-photo');
  const urlInput = document.getElementById('lap-photo-url-input');
  const btnApplyUrl = document.getElementById('btn-apply-url');

  const processImageSrc = (src, label = 'Foto Barang') => {
    if (!src) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 800;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressed = canvas.toDataURL('image/jpeg', 0.82);
        photoDataInput.value = compressed;
        previewImg.src = compressed;
      } catch (err) {
        // Fallback jika diblokir CORS browser dari origin luar
        photoDataInput.value = src;
        previewImg.src = src;
      }
      previewName.textContent = label;
      previewSize.textContent = 'Gambar siap dikirim';
      placeholder.style.display = 'none';
      previewBox.style.display = 'flex';
    };
    img.onerror = () => {
      // Jika hotlink terproteksi, tetap gunakan URL-nya langsung
      photoDataInput.value = src;
      previewImg.src = src;
      previewName.textContent = label;
      previewSize.textContent = 'Tautan gambar eksternal';
      placeholder.style.display = 'none';
      previewBox.style.display = 'flex';
    };
    img.src = src;
  };

  const processImageFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Silakan pilih file gambar yang valid (JPG, PNG, WEBP)');
      return;
    }
    previewName.textContent = file.name || 'Foto Terpilih';
    previewSize.textContent = `${(file.size / 1024).toFixed(1)} KB`;

    const reader = new FileReader();
    reader.onload = (ev) => {
      processImageSrc(ev.target.result, file.name);
    };
    reader.readAsDataURL(file);
  };

  if (dropzone && fileInput) {
    dropzone.addEventListener('click', (e) => {
      if (e.target !== btnRemove) {
        fileInput.click();
      }
    });

    fileInput.addEventListener('change', () => {
      const file = fileInput.files[0];
      if (file) processImageFile(file);
    });

    // Drag & Drop dari tab internet / file lokal
    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('drag-over');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('drag-over');
      });
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('drag-over');

      // 1. Seret file dari PC
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processImageFile(e.dataTransfer.files[0]);
        return;
      }

      // 2. Seret gambar dari internet / tab browser / Google Images
      const htmlData = e.dataTransfer.getData('text/html');
      if (htmlData) {
        const match = htmlData.match(/<img[^>]+src=["']([^"']+)["']/i);
        if (match && match[1]) {
          processImageSrc(match[1], 'Gambar dari Web');
          return;
        }
      }

      const uriData = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
      if (uriData && uriData.match(/^https?:\/\//i)) {
        processImageSrc(uriData.trim(), 'Gambar dari Internet');
        return;
      }
    });

    if (btnRemove) {
      btnRemove.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.value = '';
        photoDataInput.value = '';
        previewImg.src = '';
        placeholder.style.display = 'flex';
        previewBox.style.display = 'none';
      });
    }

    // Paste listener (Ctrl + V)
    window.addEventListener('paste', (e) => {
      if (!document.getElementById('upload-dropzone')) return;
      if (e.clipboardData && e.clipboardData.items) {
        for (let item of e.clipboardData.items) {
          if (item.type.startsWith('image/')) {
            const file = item.getAsFile();
            if (file) {
              processImageFile(file);
              return;
            }
          }
        }
        const text = e.clipboardData.getData('text');
        if (text && text.match(/^https?:\/\/.*\.(jpeg|jpg|png|webp|gif)($|\?)/i)) {
          processImageSrc(text.trim(), 'Gambar dari Clipboard');
        }
      }
    });

    // Direct URL input handler
    if (btnApplyUrl && urlInput) {
      const applyUrlAction = () => {
        const url = urlInput.value.trim();
        if (!url) return;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          alert('Masukkan URL yang valid diawali https:// atau http://');
          return;
        }
        processImageSrc(url, 'Gambar dari Internet');
        urlInput.value = '';
      };

      btnApplyUrl.addEventListener('click', applyUrlAction);
      urlInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          applyUrlAction();
        }
      });
    }
  }

  lapType.addEventListener('change', () => {
    if (lapType.value === 'lost') {
      lblLocation.textContent = 'Lokasi Terakhir / Hilang *';
      lblContact.textContent = 'Nomor WhatsApp Pemilik Barang *';
    } else {
      lblLocation.textContent = 'Lokasi Penemuan / Pos Satpam Pengaman *';
      lblContact.textContent = 'Nomor Kontak WhatsApp Pelapor *';
    }
  });

  const form = document.getElementById('real-report-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btnSubmit = document.getElementById('btn-submit-report');
    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Mengirim Laporan...';

    const type = document.getElementById('lap-type').value;
    const name = document.getElementById('lap-name').value.trim();
    const category_id = document.getElementById('lap-cat').value;
    const locationVal = document.getElementById('lap-loc').value.trim();
    const dateVal = document.getElementById('lap-date').value;
    const photo_url = photoDataInput ? photoDataInput.value.trim() : '';
    const contact = document.getElementById('lap-contact').value.trim();
    const description = document.getElementById('lap-desc').value.trim();

    try {
      if (type === 'found') {
        await API.createFoundItem({
          name,
          category_id: parseInt(category_id),
          location: locationVal,
          found_date: dateVal,
          photo_url: photo_url || null,
          keeper_contact: contact,
          description: description || null,
          status: 'available'
        });
        alert('Laporan Barang Temuan berhasil dikirim!');
        location.hash = '#/temuan';
      } else {
        await API.createLostItem({
          name,
          category_id: parseInt(category_id),
          location: locationVal,
          lost_date: dateVal,
          photo_url: photo_url || null,
          contact: contact,
          description: description || null,
          status: 'searching'
        });
        alert('Laporan Barang Hilang berhasil dikirim!');
        location.hash = '#/hilang';
      }
    } catch (err) {
      alert('Gagal menyimpan laporan: ' + err.message);
      btnSubmit.disabled = false;
      btnSubmit.textContent = 'Kirim Laporan';
    }
  });
}

// ==========================================================================
// 5. PROFIL PENGEMBANG
// ==========================================================================
async function renderProfil(container) {
  let archivedList = [];
  try {
    const [lostRes, foundRes] = await Promise.all([
      API.getLostItems(),
      API.getFoundItems()
    ]);
    const dbLost = (lostRes.data || []).filter(it => it.status === 'archived').map(it => ({ ...it, _archiveType: 'hilang' }));
    const dbFound = (foundRes.data || []).filter(it => it.status === 'archived').map(it => ({ ...it, _archiveType: 'temuan' }));
    const local = window.TB_ARCHIVE ? window.TB_ARCHIVE.getArchivedItems() : [];

    const seen = new Set();
    [...dbLost, ...dbFound, ...local].forEach(item => {
      const key = `${item.id}-${item._archiveType || 'temuan'}`;
      if (!seen.has(key)) {
        seen.add(key);
        archivedList.push(item);
      }
    });
  } catch (e) {
    archivedList = window.TB_ARCHIVE ? window.TB_ARCHIVE.getArchivedItems() : [];
  }

  container.innerHTML = `
    <!-- Content Header -->
    <div class="content-header-row">
      <div class="content-header-left">
        <div class="content-overline">TEMUBARANG</div>
        <h1 class="page-title-figma">Profil Pengembang</h1>
        <p class="page-desc-figma">Informasi pengembang dan aplikasi TemuBarang.</p>
      </div>
    </div>

    <div class="section-divider-figma"></div>

    <div class="profil-card-figma">
      <div class="profil-avatar-wrap">
        <img src="images/profile.jpg" alt="Avatar">
      </div>
      <h2 class="profil-name-figma">Arina Fazal Hak</h2>
      <p class="profil-nim-figma">21120124120042</p>
      <p class="profil-dept-figma">Teknik Komputer · Praktikum PPB 2026</p>

      <div style="display:flex; justify-content:center; gap:12px; margin-bottom:28px; flex-wrap:wrap;">
        <span style="font-size:12px; background:#eff6ff; color:#2563eb; font-weight:700; padding:6px 14px; border-radius:9999px;">
          ⚡ Database Terhubung
        </span>
        <span style="font-size:12px; background:#ecfdf5; color:#047857; font-weight:700; padding:6px 14px; border-radius:9999px;">
          📱 PWA Ready & Offline Cache
        </span>
      </div>

      <button class="btn-primary-figma" style="max-width:320px; margin:0 auto;" onclick="if(state.deferredPrompt){ state.deferredPrompt.prompt(); } else { alert('Aplikasi PWA sudah siap diinstall melalui menu browser kamu!'); }">
        📲 Install TemuBarang ke Layar Utama
      </button>
    </div>

    <!-- About Aplikasi Card -->
    <div class="profil-card-figma" style="margin-top:24px; text-align:left; padding:32px 28px;">
      <div style="display:flex; align-items:center; gap:12px; margin-bottom:16px;">
        <div style="width:40px; height:40px; border-radius:10px; background:#eff6ff; color:#2563eb; display:flex; align-items:center; justify-content:center; font-size:20px;">
          ℹ️
        </div>
        <div>
          <h3 style="font-size:16px; font-weight:800; color:var(--text-dark); margin:0;">Tentang Aplikasi TemuBarang</h3>
          <p style="font-size:12px; color:var(--text-gray); margin:2px 0 0;">Tugas Akhir Praktikum Pemrograman Perangkat Bergerak (PPB) 2026</p>
        </div>
      </div>
      
      <p style="font-size:13px; color:var(--text-body); line-height:1.6; margin-bottom:20px;">
        <strong>TemuBarang</strong> adalah aplikasi <em>Progressive Web Apps (PWA)</em> Lost & Found kampus yang dirancang untuk mempermudah civitas akademika dalam melaporkan dan mencari barang hilang maupun barang temuan secara cepat, terstruktur, dan terhubung langsung ke basis data realtime.
      </p>

      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:12px; font-size:12.5px;">
        <div style="background:#f8fafc; border:1px solid var(--border-light); border-radius:12px; padding:12px 14px;">
          <div style="font-weight:700; color:var(--text-dark); margin-bottom:4px;">🌐 Platform</div>
          <div style="color:var(--text-gray);">Progressive Web Apps (PWA)</div>
        </div>
        <div style="background:#f8fafc; border:1px solid var(--border-light); border-radius:12px; padding:12px 14px;">
          <div style="font-weight:700; color:var(--text-dark); margin-bottom:4px;">📡 Backend API</div>
          <div style="color:var(--text-gray);">Node.js, Express REST API</div>
        </div>
        <div style="background:#f8fafc; border:1px solid var(--border-light); border-radius:12px; padding:12px 14px;">
          <div style="font-weight:700; color:var(--text-dark); margin-bottom:4px;">🗄️ Database</div>
          <div style="color:var(--text-gray);">PostgreSQL (Supabase)</div>
        </div>
        <div style="background:#f8fafc; border:1px solid var(--border-light); border-radius:12px; padding:12px 14px;">
          <div style="font-weight:700; color:var(--text-dark); margin-bottom:4px;">🚀 Versi</div>
          <div style="color:var(--text-gray);">v1.0.0 — Ganjil 2026</div>
        </div>
      </div>
    </div>

    <!-- Kotak Arsip Laporan (Soft Delete Feature - Tersinkron ke Database) -->
    <div class="profil-card-figma" style="margin-top:24px; text-align:left; padding:28px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:8px;">
        <div style="display:flex; align-items:center; gap:10px;">
          <div style="width:38px; height:38px; border-radius:10px; background:#fef3c7; color:#b45309; display:flex; align-items:center; justify-content:center; font-size:18px;">
            📦
          </div>
          <div>
            <h3 style="font-size:16px; font-weight:800; color:var(--text-dark); margin:0;">Kotak Arsip Laporan (Soft Delete)</h3>
            <p style="font-size:12px; color:var(--text-gray); margin:2px 0 0;">Laporan yang diarsipkan disembunyikan dari daftar publik dan tersinkron ke semua perangkat.</p>
          </div>
        </div>
        <span style="font-size:12px; font-weight:700; background:#f1f5f9; color:#475569; padding:4px 10px; border-radius:9999px;">
          ${archivedList.length} laporan
        </span>
      </div>

      <div id="archived-items-container">
        ${archivedList.length ? `
          <div style="display:flex; flex-direction:column; gap:10px;">
            ${archivedList.map(item => `
              <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 16px; background:#f8fafc; border:1px solid var(--border-light); border-radius:12px; flex-wrap:wrap; gap:10px;">
                <div>
                  <div style="font-weight:700; font-size:14px; color:var(--text-dark);">${item.name}</div>
                  <div style="font-size:12px; color:var(--text-gray); margin-top:2px;">
                    Tipe: <span style="font-weight:600; color:#2563eb;">${item._archiveType === 'temuan' ? 'Barang Temuan' : 'Barang Hilang'}</span> · Lokasi: ${item.location || '-'}
                  </div>
                </div>
                <button class="pill-btn-figma active" onclick="restoreArchiveItem('${item.id}', '${item._archiveType || 'temuan'}')" style="padding:6px 14px; font-size:12px; cursor:pointer;">
                  🔄 Pulihkan ke Publik
                </button>
              </div>
            `).join('')}
          </div>
        ` : `
          <div style="text-align:center; padding:28px 16px; color:var(--text-gray); font-size:13px; background:#f8fafc; border-radius:12px; border:1px dashed var(--border-color);">
            Belum ada laporan yang diarsipkan. Anda dapat mengarsipkan laporan dari tombol "📦 Arsipkan" di halaman detail barang.
          </div>
        `}
      </div>
    </div>
  `;
}

// Global Restore Handler for Archived Items
window.restoreArchiveItem = async function (id, type) {
  if (confirm('Pulihkan laporan ini agar kembali tampil di daftar publik?')) {
    try {
      if (type === 'temuan') {
        await API.updateFoundItem(id, { status: 'available' });
      } else {
        await API.updateLostItem(id, { status: 'searching' });
      }
      if (window.TB_ARCHIVE) {
        window.TB_ARCHIVE.restoreItemLocally(id, type);
      }
      alert('Laporan berhasil dipulihkan!');
      const container = document.getElementById('app-content');
      if (container) renderProfil(container);
    } catch (e) {
      alert('Gagal memulihkan laporan: ' + e.message);
    }
  }
};

// ==========================================================================
// 6. DETAIL VIEW
// ==========================================================================
async function renderDetail(container, id, type) {
  container.innerHTML = `
    <div style="text-align:center; padding: 60px; color: var(--text-gray);">
      <div>Mengambil detail data...</div>
    </div>
  `;

  const isFound = type === 'temuan';

  try {
    const res = isFound ? await API.getFoundItemById(id) : await API.getLostItemById(id);
    const item = res.data;

    if (!item) {
      container.innerHTML = `
        <div class="empty-state-figma">
          <h3>Barang tidak ditemukan di database</h3>
          <a href="#/${isFound ? 'temuan' : 'hilang'}" class="pill-btn-figma active" style="margin-top:16px; text-decoration:none; display:inline-flex;">Kembali</a>
        </div>
      `;
      return;
    }

    const contactRaw = isFound ? item.keeper_contact : item.contact;
    const reporter = parseReporterInfo(contactRaw, isFound ? 'Petugas' : 'Pemilik');
    const contactNumber = contactRaw ? contactRaw.replace(/\s*\([^)]*\)\s*$/, '').trim() : '';
    const cleanWa = contactNumber.replace(/\D/g, '');
    const waUrl = cleanWa ? `https://wa.me/${cleanWa.startsWith('0') ? '62' + cleanWa.slice(1) : cleanWa}` : '#';

    const photoUrl = item.photo_url || NO_PHOTO_PLACEHOLDER;

    const catName = item.categories ? item.categories.name : 'Umum';
    const statusClass = !isFound ? 'chip-status-lost' : 'chip-status-found';

    container.innerHTML = `
      <div style="margin-bottom: 16px;">
        <a href="#/${isFound ? 'temuan' : 'hilang'}" class="btn-see-all-figma" style="font-size:13px;">
          ← Kembali ke Daftar ${isFound ? 'Temuan' : 'Hilang'}
        </a>
      </div>

      <div class="detail-card-figma">
        <div class="detail-split-wrap">
          <div class="detail-img-box">
            <img src="${photoUrl}" class="detail-img-full" alt="${item.name}" loading="lazy" decoding="async" onerror="this.src='${NO_PHOTO_PLACEHOLDER}'">
          </div>

          <div class="detail-info-box">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
              <span class="chip-cat-figma">${catName}</span>
              <span class="chip-status-figma ${statusClass}">
                <span class="status-dot"></span>
                ${formatStatusLabel(item.status, isFound)}
              </span>
            </div>

            <h1 class="page-title-figma" style="font-size:24px; margin-bottom:6px;">${item.name}</h1>
            <span style="font-size:12.5px; color:var(--text-gray); margin-bottom:12px;">
              Dilaporkan ${formatRelativeTime(isFound ? item.found_date : item.lost_date)}
            </span>

            <div class="detail-meta-box">
              <p><strong>📍 Lokasi:</strong> ${item.location || '-'}</p>
              <p><strong>👤 ${isFound ? 'Dilaporkan oleh' : 'Pemilik'}:</strong> ${reporter.name}</p>
              <p><strong>📞 Kontak:</strong> ${contactNumber || '-'}</p>
            </div>

            <div style="margin-bottom:20px;">
              <h4 style="font-size:13px; font-weight:700; margin-bottom:6px; color:var(--text-dark);">Deskripsi:</h4>
              <p style="font-size:13.5px; color:var(--text-body); line-height:1.6;">${item.description || 'Tidak ada deskripsi tambahan.'}</p>
            </div>

            ${cleanWa ? `
              <a href="${waUrl}" target="_blank" class="detail-wa-btn">
                💬 Hubungi via WhatsApp (${cleanWa})
              </a>
            ` : ''}

            <!-- Live Status & Delete Actions -->
            <div style="font-size:11px; color:#94a3b8; text-align:center; margin-top:16px; margin-bottom:6px;">
              ⚠️ Opsi Pengelolaan Laporan (Pelapor)
            </div>
            <div style="display:flex; gap:10px; margin-top:4px; flex-wrap:wrap;">
              <button class="btn-secondary-action" id="btn-toggle-status" style="flex:1; min-width:130px;">
                ${isFound
                  ? (item.status === 'available' ? 'Tandai Sudah Diklaim' : 'Ubah ke Tersedia')
                  : (item.status === 'searching' ? 'Tandai Sudah Ditemukan' : 'Ubah ke Sedang Dicari')}
              </button>
              <button class="btn-secondary-action" id="btn-archive-report" style="flex:1; min-width:130px; background:#f8fafc; border-color:#cbd5e1; color:#334155;">
                ${item.status === 'archived' ? '🔄 Pulihkan ke Publik' : '📦 Arsipkan (Soft Delete)'}
              </button>
              <button class="btn-danger-action" id="btn-delete-report" style="flex:1; min-width:130px;">
                Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    const archiveBtn = document.getElementById('btn-archive-report');
    if (archiveBtn) {
      archiveBtn.addEventListener('click', async () => {
        const isArchived = item.status === 'archived';
        if (isArchived) {
          if (confirm(`Pulihkan laporan "${item.name}" agar kembali tampil di daftar publik?`)) {
            try {
              const restoredStatus = isFound ? 'available' : 'searching';
              if (isFound) await API.updateFoundItem(id, { status: restoredStatus });
              else await API.updateLostItem(id, { status: restoredStatus });
              if (window.TB_ARCHIVE) window.TB_ARCHIVE.restoreItemLocally(id, isFound ? 'temuan' : 'hilang');
              alert('Laporan berhasil dipulihkan ke publik!');
              location.hash = `#/${isFound ? 'temuan' : 'hilang'}`;
            } catch (e) {
              alert('Gagal memulihkan laporan: ' + e.message);
            }
          }
        } else {
          if (confirm(`Arsipkan laporan "${item.name}"? Laporan akan disembunyikan dari daftar publik dan tersinkron ke semua perangkat.`)) {
            try {
              if (isFound) await API.updateFoundItem(id, { status: 'archived' });
              else await API.updateLostItem(id, { status: 'archived' });
              if (window.TB_ARCHIVE) window.TB_ARCHIVE.archiveItemLocally(item, isFound ? 'temuan' : 'hilang');
              alert('Laporan berhasil diarsipkan di database!');
              location.hash = `#/${isFound ? 'temuan' : 'hilang'}`;
            } catch (e) {
              alert('Gagal mengarsipkan laporan: ' + e.message);
            }
          }
        }
      });
    }

    document.getElementById('btn-toggle-status').addEventListener('click', async () => {
      const konfirmasi = confirm(`Hanya pelapor yang boleh mengubah status ini.\n\nLanjutkan perubahan status laporan "${item.name}"?`);
      if (!konfirmasi) return;
      let newStatus;
      if (isFound) {
        newStatus = item.status === 'available' ? 'claimed' : 'available';
        await API.updateFoundItem(id, { status: newStatus });
      } else {
        newStatus = item.status === 'searching' ? 'found' : 'searching';
        await API.updateLostItem(id, { status: newStatus });
      }
      alert('Status laporan berhasil diperbarui!');
      renderDetail(container, id, type);
    });

    document.getElementById('btn-delete-report').addEventListener('click', async () => {
      if (confirm(`Hanya pelapor yang boleh menghapus laporan ini.\n\nYakin ingin menghapus laporan "${item.name}" secara permanen?`)) {
        if (isFound) {
          await API.deleteFoundItem(id);
        } else {
          await API.deleteLostItem(id);
        }
        alert('Laporan berhasil dihapus!');
        location.hash = `#/${isFound ? 'temuan' : 'hilang'}`;
      }
    });

  } catch (err) {
    console.error('Error rendering detail:', err);
    container.innerHTML = `
      <div class="empty-state-figma" style="padding: 40px 20px;">
        <div class="empty-icon-figma">⚡</div>
        <h3>Detail Tidak Tersedia Saat Offline</h3>
        <p>Barang ini belum sempat tersimpan di cache memori perangkat.</p>
        <a href="#/${isFound ? 'temuan' : 'hilang'}" class="pill-btn-figma active" style="margin-top:14px; text-decoration:none; display:inline-flex;">Kembali ke Daftar</a>
      </div>
    `;
  }
}

// ==========================================================================
// 7. CARD RENDERER KOMPONEN (EXACT MATCH FIGMA REVAMP)
// ==========================================================================
function renderItemCardHTML(item, type) {
  const isFound = type === 'temuan';
  const detailUrl = isFound ? `#/temuan/${item.id}` : `#/hilang/${item.id}`;
  const dateVal = isFound ? item.found_date : item.lost_date;
  const timeFormatted = formatRelativeTime(dateVal);

  const contactVal = isFound ? item.keeper_contact : item.contact;
  const reporter = parseReporterInfo(contactVal, isFound ? 'Petugas' : 'Pemilik');
  const initial = reporter.name ? reporter.name.charAt(0).toUpperCase() : 'U';
  const catName = item.categories ? item.categories.name : 'Umum';

  const isLost = !isFound;
  const statusClass = isLost ? 'chip-status-lost' : 'chip-status-found';
  const statusText = isLost
    ? (item.status === 'searching' ? 'Sedang Dicari' : 'Ditemukan')
    : (item.status === 'available' ? 'Tersedia' : 'Diklaim');

  const photo = item.photo_url || NO_PHOTO_PLACEHOLDER;

  return `
    <div class="card-figma" onclick="location.hash='${detailUrl}'">
      <div class="card-figma-img-wrap">
        <img src="${photo}" class="card-figma-img" alt="${item.name}" loading="lazy" decoding="async" onerror="this.src='${NO_PHOTO_PLACEHOLDER}'">
      </div>
      <div class="card-figma-body">
        <div class="card-figma-top-tags">
          <span class="chip-cat-figma">${catName}</span>
          <span class="chip-status-figma ${statusClass}">
            <span class="status-dot"></span>
            ${statusText}
          </span>
        </div>

        <h3 class="card-figma-title" title="${item.name}">${item.name}</h3>

        <div class="card-figma-meta">
          <div class="meta-item-figma">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span>${item.location || '-'}</span>
          </div>
          <div class="meta-item-figma">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span>${timeFormatted}</span>
          </div>
        </div>

        <div class="card-figma-footer">
          <div class="reporter-figma">
            <div class="reporter-avatar-figma">${initial}</div>
            <span class="reporter-label-figma">Dilaporkan oleh <strong>${reporter.name}</strong></span>
          </div>
          <div class="card-chevron-figma">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Helpers
function formatRelativeTime(dateString) {
  if (!dateString) return 'Baru saja';
  const diff = Math.floor((new Date() - new Date(dateString)) / (1000 * 60 * 60 * 24));
  if (diff <= 0) return 'Hari ini';
  if (diff === 1) return 'Kemarin';
  return `${diff} hari lalu`;
}

function parseReporterInfo(str, defaultRole = 'Petugas') {
  if (!str) return { name: 'Civitas Kampus', role: 'Petugas' };
  const match = str.match(/\((.*?)\)/);
  const name = match ? match[1] : str;
  return { name, role: defaultRole };
}

function formatStatusLabel(status, isFound) {
  if (status === 'archived') return 'Diarsipkan (Soft Delete)';
  if (isFound) {
    return status === 'claimed' ? 'Sudah Diklaim' : 'Tersedia';
  }
  return status === 'found' ? 'Sudah Ditemukan' : 'Sedang Dicari';
}

// Offline Detection & Notification
function updateOnlineStatus() {
  let banner = document.getElementById('tb-offline-banner');
  if (!navigator.onLine) {
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'tb-offline-banner';
      banner.className = 'offline-toast-banner';
      banner.innerHTML = `
        <span>⚡</span>
        <span><strong>Mode Offline:</strong> Menampilkan data tersimpan dari cache lokal.</span>
      `;
      document.body.prepend(banner);
    }
  } else {
    if (banner) banner.remove();
  }
}

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

// Global Listeners
window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', () => {
  initPWA();
  updateOnlineStatus();
  router();
});
