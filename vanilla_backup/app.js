/* ═══════════════════════════════════════════════════════════
   VIỆC LÀM KCN — Main Application Logic
   Google Sheets as Database (Google Visualization API - gviz/tq)
   ─────────────────────────────────────────────────────────
   SETUP: Điền SHEET_ID và SHEET_TAB_NAME vào CONFIG bên dưới.
   Cách lấy SHEET_ID: mở Google Sheet → copy ID từ URL:
   https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit
═══════════════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────────
   1. CONFIGURATION
   Chỉnh sửa phần này để kết nối Google Sheets
───────────────────────────────────────────── */
const CONFIG = {
  /**
   * ID của Google Sheet (lấy từ URL).
   * Sheet phải được chia sẻ công khai (Anyone with link can view).
   * Ví dụ: '1xdCkET1iFgPWAKbdRPwpeAPJ7dPjGfP3EHIM9RsPwVQ'
   */
  SHEET_ID: '1R-Rq2rihfBdZK5qhiLXzFq1X_iqif86ocf3KRFicpSk', // ← Điền Sheet ID vào đây

  /**
   * Tên tab/sheet trong file Google Sheets.
   * Nhìn vào thanh tab phía dưới file — mặc định là 'Sheet1'
   */
  SHEET_TAB_NAME: 'mock_data', // ← Đổi nếu tab có tên khác (VD: 'Jobs', 'Data')

  /**
   * Google Form URL để báo tin sai (tùy chọn)
   */
  REPORT_FORM_URL: '',

  /**
   * Google Analytics 4 Measurement ID (tùy chọn)
   * Ví dụ: 'G-XXXXXXXXXX'
   */
  GA_ID: '',

  /**
   * Thời gian debounce cho search (ms)
   */
  SEARCH_DEBOUNCE_MS: 300,

  /**
   * Tên site
   */
  SITE_NAME: 'Việc Làm KCN',
};


/* ─────────────────────────────────────────────
   3. APPLICATION STATE
───────────────────────────────────────────── */
const state = {
  allJobs: [],
  filteredJobs: [],
  searchQuery: '',
  filters: {
    kcn: '',
    salary: '',
    gender: '',
  },
  isLoading: true,
  hasError: false,
};

/* ─────────────────────────────────────────────
   4. DOM ELEMENT REFERENCES
───────────────────────────────────────────── */
const DOM = {
  searchInput:    () => document.getElementById('searchInput'),
  searchClearBtn: () => document.getElementById('searchClearBtn'),
  filterKCN:      () => document.getElementById('filterKCN'),
  filterSalary:   () => document.getElementById('filterSalary'),
  filterGender:   () => document.getElementById('filterGender'),
  filterResetBtn: () => document.getElementById('filterResetBtn'),
  jobGrid:        () => document.getElementById('jobGrid'),
  jobCountBar:    () => document.getElementById('jobCountBar'),
  jobCountText:   () => document.getElementById('jobCountText'),
  headerJobCount: () => document.getElementById('headerJobCount'),
  loadingState:   () => document.getElementById('loadingState'),
  errorState:     () => document.getElementById('errorState'),
  emptyState:     () => document.getElementById('emptyState'),
  retryBtn:       () => document.getElementById('retryBtn'),
  emptyResetBtn:  () => document.getElementById('emptyResetBtn'),
  footerReportLink: () => document.getElementById('footerReportLink'),
};

/* ─────────────────────────────────────────────
   5. GOOGLE SHEETS — FETCH VIA GVIZ/TQ API
   (Giống cách TrangAn_Restaurant dùng)
───────────────────────────────────────────── */

/**
 * Fetch dữ liệu job từ Google Sheets qua Google Visualization API.
 * Không cần "Publish to web" — chỉ cần sheet được chia sẻ public.
 *
 * Cấu trúc cột trong Sheet (theo thứ tự):
 * A(0):id  B(1):company  C(2):position  D(3):salary_text
 * E(4):salary_min  F(5):salary_max  G(6):industrial_park
 * H(7):location  I(8):gender  J(9):age  K(10):shift
 * L(11):experience  M(12):urgent  N(13):hr_contact_type
 * O(14):hr_contact  P(15):source_type  Q(16):source_link
 * R(17):updated_at  S(18):status
 * T(19):total_slots U(20):filled_slots
 */
async function fetchJobsFromSheet(sheetId, tabName) {
  // Chỉ lấy các job ACTIVE, sort theo updated_at mới nhất
  const query = encodeURIComponent("Select * where S = 'ACTIVE'");
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(tabName)}&tq=${query}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error('HTTP ' + response.status);

  const text = await response.text();
  return parseGvizResponse(text);
}

/**
 * Parse response từ gviz/tq API.
 * Google trả về format JSON_CALLBACK (có wrapper), phải strip ra.
 * Ví dụ response: /*O_o*\/ google.visualization.Query.setResponse({...});
 */
function parseGvizResponse(text) {
  // Strip wrapper: lấy phần JSON bên trong dấu ngoặc
  const match = text.match(/google\.visualization\.Query\.setResponse\((.*)\);?\s*$/s);
  if (!match || !match[1]) throw new Error('Invalid gviz response format');

  const data = JSON.parse(match[1]);

  // Kiểm tra lỗi từ Google (VD: sheet không public, sai tên tab)
  if (data.status === 'error') {
    const errMsg = data.errors?.[0]?.detailed_message || data.errors?.[0]?.message || 'Unknown error';
    throw new Error('Google Sheets error: ' + errMsg);
  }

  const rows = data?.table?.rows || [];
  const jobs = [];

  for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
    const row = rows[rowIdx];
    const c = row.c || [];
    const get = (idx) => (c[idx]?.v ?? null);
    const getStr = (idx) => {
      const v = get(idx);
      return v === null || v === undefined ? null : String(v).trim() || null;
    };
    const getNum = (idx) => {
      const v = get(idx);
      if (v === null || v === undefined || v === '') return null;
      const n = parseFloat(v);
      return isNaN(n) ? null : n;
    };
    const getBool = (idx) => {
      const v = getStr(idx);
      if (!v) return false;
      return v.toLowerCase() === 'true' || v === '1' || v.toLowerCase() === 'có';
    };

    const status = getStr(18);
    // Chỉ lấy ACTIVE (query đã filter nhưng double-check)
    if (!status || status.toUpperCase() !== 'ACTIVE') continue;

    jobs.push({
      id:               getStr(0) || `row_${rowIdx + 1}`,
      company:          getStr(1),
      position:         getStr(2),
      salary_text:      getStr(3),
      salary_min:       getNum(4),
      salary_max:       getNum(5),
      industrial_park:  getStr(6),
      location:         getStr(7),
      gender:           getStr(8),
      age:              getStr(9),
      shift:            getStr(10),
      experience:       getStr(11),
      urgent:           getBool(12),
      hr_contact_type:  getStr(13),
      hr_contact:       getStr(14),
      source_type:      getStr(15),
      source_link:      getStr(16),
      updated_at:       getStr(17),
      status:           status,
      total_slots:      getNum(19),
      filled_slots:     getNum(20),
    });
  }

  return jobs;
}

/* ─────────────────────────────────────────────
   6. FILTER & SEARCH LOGIC
───────────────────────────────────────────── */

function normalize(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim();
}

function applyFiltersAndSearch() {
  const { searchQuery, filters } = state;
  const normSearch = normalize(searchQuery);

  state.filteredJobs = state.allJobs.filter(job => {
    // ── Search ──
    if (normSearch) {
      const haystack = normalize(
        (job.company || '') + ' ' + (job.position || '')
      );
      if (!haystack.includes(normSearch)) return false;
    }

    // ── Filter: KCN ──
    if (filters.kcn && job.industrial_park !== filters.kcn) return false;

    // ── Filter: Salary ──
    if (filters.salary) {
      const threshold = parseFloat(filters.salary);
      // Include if salary_max >= threshold OR salary_min >= threshold
      // Exclude if both null (Thỏa thuận) when filter active
      const max = job.salary_max;
      const min = job.salary_min;
      if (max === null && min === null) return false;
      const effectiveMax = max !== null ? max : min;
      if (effectiveMax < threshold) return false;
    }

    // ── Filter: Gender ──
    if (filters.gender) {
      const g = (job.gender || '').toLowerCase();
      const selected = filters.gender.toLowerCase();
      // "nam/nữ" matches both "nam" and "nữ"
      if (!g.includes(selected) && g !== 'nam/nữ' && g !== 'nu/nam') return false;
    }

    return true;
  });

  renderJobGrid();
  updateJobCount();
  updateFilterResetVisibility();
}

/* ─────────────────────────────────────────────
   7. RENDER FUNCTIONS
───────────────────────────────────────────── */

function renderJobGrid() {
  const grid = DOM.jobGrid();
  const { filteredJobs } = state;

  // Empty state
  const empty = DOM.emptyState();
  if (filteredJobs.length === 0) {
    grid.innerHTML = '';
    grid.style.display = 'none';
    empty.style.display = 'flex';
    return;
  }

  empty.style.display = 'none';
  grid.style.display = 'grid';
  grid.innerHTML = filteredJobs.map(buildJobCardHTML).join('');

  // Attach event listeners after render
  grid.querySelectorAll('[data-hr-click]').forEach(btn => {
    btn.addEventListener('click', handleHRContactClick);
  });
  grid.querySelectorAll('[data-source-click]').forEach(btn => {
    btn.addEventListener('click', handleSourceClick);
  });
  grid.querySelectorAll('[data-report-click]').forEach(link => {
    link.addEventListener('click', handleReportClick);
  });
}

function buildJobCardHTML(job) {
  const urgent = job.urgent === true || job.urgent === 'true';
  const hasHR = job.hr_contact && job.hr_contact_type;
  const hasSource = job.source_link;

  return `
    <article class="job-card ${urgent ? 'job-card--urgent' : ''}" id="job-${job.id}">

      <!-- Card Header -->
      <div class="card-header">
        <div class="card-company-wrap">
          <div class="card-company-info">
            <div class="card-company">${escapeHtml(job.company || '')}</div>
          </div>
        </div>
        <div class="badge-group">
          ${urgent ? '<span class="badge badge--urgent">🔥 TUYỂN GẤP</span>' : ''}
        </div>
      </div>

      <!-- Level 1: Position, Salary, Location -->
      <div class="card-level1">
        <h2 class="card-position">${escapeHtml(job.position || '')}</h2>

        <div class="card-info-row">
          <span class="card-info-icon">💰</span>
          <span class="card-salary">${escapeHtml(job.salary_text || 'Thỏa thuận')}</span>
        </div>

        <div class="card-info-row">
          <span class="card-info-icon">📍</span>
          <span class="card-location">${escapeHtml(buildLocationText(job))}</span>
        </div>
      </div>

      <!-- Level 2: Tags (optional fields) -->
      ${buildTagsHTML(job)}

      <!-- Footer (Bám đáy) -->
      <div class="card-footer">
        <!-- Level 2.5: Scarcity Progress Bar -->
        ${buildSlotsHTML(job)}

        <!-- Level 3: Meta -->
        <div class="card-meta">
          <span class="card-updated">${buildUpdatedText(job.updated_at)}</span>
        </div>

        <!-- CTAs -->
        <div class="card-ctas">
          ${buildHRContactBtnHTML(job)}
          ${hasSource ? `
            <button
              class="btn-view-source"
              data-source-click
              data-job-id="${job.id}"
              data-company="${escapeAttr(job.company)}"
              data-source-type="${escapeAttr(job.source_type)}"
              data-source-link="${escapeAttr(job.source_link)}"
            >
              🔗 Xem nguồn tuyển dụng ↗
            </button>
          ` : ''}
        </div>

        <!-- Report -->
        <a
          href="#"
          class="card-report-link"
          data-report-click
          data-job-id="${job.id}"
        >🚩 Báo tin sai / hết hạn</a>
      </div>

    </article>
  `;
}

function buildSlotsHTML(job) {
  const total = job.total_slots;
  const filled = job.filled_slots || 0;
  
  if (total === null || total === undefined || total <= 0) return '';
  
  const left = Math.max(0, total - filled);
  const percentage = Math.min(100, Math.max(0, (filled / total) * 100));
  
  return `
    <div class="card-slots">
      <div class="slots-header">
        <span>Đã tuyển: ${filled}/${total}</span>
        <span class="slots-left">Còn ${left} chỗ</span>
      </div>
      <div class="slots-bar-bg">
        <div class="slots-bar-fill" style="width: ${percentage}%"></div>
      </div>
    </div>
  `;
}


function buildLocationText(job) {
  const parts = [];
  if (job.industrial_park) parts.push(job.industrial_park);
  if (job.location)        parts.push(job.location);
  return parts.join(' · ');
}

function buildTagsHTML(job) {
  const tags = [];
  if (job.gender)     tags.push(job.gender);
  if (job.age)        tags.push(job.age);
  if (job.shift)      tags.push(job.shift);
  if (job.experience && job.experience.toLowerCase() !== 'không yêu cầu') {
    tags.push('KN: ' + job.experience);
  }

  if (!tags.length) return '';

  return `
    <div class="card-tags">
      ${tags.map(t => `<span class="card-tag">${escapeHtml(t)}</span>`).join('')}
    </div>
  `;
}

function buildHRContactBtnHTML(job) {
  const type = (job.hr_contact_type || '').toLowerCase();
  let href = '#';

  // Build href theo loại contact (label đồng nhất: 💬 Liên hệ HR)
  switch (type) {
    case 'zalo':
      href = `https://zalo.me/${job.hr_contact}`;
      break;
    case 'messenger':
      href = job.hr_contact && job.hr_contact.startsWith('http')
        ? job.hr_contact
        : `https://m.me/${job.hr_contact}`;
      break;
    case 'phone':
      href = `tel:${job.hr_contact}`;
      break;
    default:
      href = job.hr_contact || '#';
  }

  return `
    <a
      href="${escapeAttr(href)}"
      target="${type !== 'phone' ? '_blank' : '_self'}"
      rel="noopener noreferrer"
      class="btn-hr-contact"
      data-hr-click
      data-job-id="${job.id}"
      data-company="${escapeAttr(job.company)}"
      data-position="${escapeAttr(job.position)}"
      data-contact-type="${escapeAttr(type)}"
    >💬 Liên hệ HR</a>
  `;
}

function buildUpdatedText(dateStr) {
  if (!dateStr) return '';
  try {
    let d;
    // Check if dateStr is from Google Viz API format "Date(2026,8,17)"
    const match = dateStr.match(/Date\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      d = new Date(match[1], match[2], match[3]);
    } else {
      d = new Date(dateStr);
    }
    
    if (isNaN(d.getTime())) return '';

    const today = new Date();
    // Reset times to compare just the dates
    today.setHours(0, 0, 0, 0);
    const jobDate = new Date(d);
    jobDate.setHours(0, 0, 0, 0);
    
    const diffDays = Math.floor((today - jobDate) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Cập nhật hôm nay';
    if (diffDays === 1) return 'Cập nhật hôm qua';
    if (diffDays <= 3)  return `Cập nhật ${diffDays} ngày trước`;

    const day   = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `Cập nhật ${day}/${month}`;
  } catch {
    return 'Cập nhật ' + dateStr;
  }
}

function updateJobCount() {
  const bar  = DOM.jobCountBar();
  const text = DOM.jobCountText();
  const headerCount = DOM.headerJobCount();
  const total = state.allJobs.length;
  const shown = state.filteredJobs.length;

  bar.style.display = 'flex';

  const isFiltered = state.searchQuery || state.filters.kcn || state.filters.salary || state.filters.gender;

  if (isFiltered) {
    text.innerHTML = `<strong>${shown} việc phù hợp</strong> (trong ${total} việc đang tuyển)`;
    headerCount.textContent = `${shown} kết quả`;
  } else {
    text.innerHTML = `🔥 <strong>${total} việc đang tuyển</strong>`;
    headerCount.textContent = `${total} việc`;
  }
}

function updateFilterResetVisibility() {
  const btn = DOM.filterResetBtn();
  const active = state.filters.kcn || state.filters.salary || state.filters.gender || state.searchQuery;
  btn.style.display = active ? 'inline-flex' : 'none';
}

/* ─────────────────────────────────────────────
   8. KCN FILTER POPULATION
───────────────────────────────────────────── */

function populateKCNFilter(jobs) {
  const select = DOM.filterKCN();
  const parks = [...new Set(jobs.map(j => j.industrial_park).filter(Boolean))].sort();

  parks.forEach(park => {
    const opt = document.createElement('option');
    opt.value = park;
    opt.textContent = park;
    select.appendChild(opt);
  });
}

/* ─────────────────────────────────────────────
   9. EVENT HANDLERS
───────────────────────────────────────────── */

let searchDebounceTimer = null;

function handleSearchInput(e) {
  clearTimeout(searchDebounceTimer);
  const val = e.target.value;
  DOM.searchClearBtn().style.display = val ? 'flex' : 'none';

  searchDebounceTimer = setTimeout(() => {
    state.searchQuery = val.trim();
    applyFiltersAndSearch();
    trackEvent('job_search', { keyword: state.searchQuery, result_count: state.filteredJobs.length });
  }, CONFIG.SEARCH_DEBOUNCE_MS);
}

function handleSearchClear() {
  DOM.searchInput().value = '';
  DOM.searchClearBtn().style.display = 'none';
  DOM.searchInput().focus();
  state.searchQuery = '';
  applyFiltersAndSearch();
}

function handleFilterChange() {
  state.filters.kcn    = DOM.filterKCN().value;
  state.filters.salary = DOM.filterSalary().value;
  state.filters.gender = DOM.filterGender().value;
  applyFiltersAndSearch();

  trackEvent('job_filter', {
    industrial_park: state.filters.kcn,
    salary: state.filters.salary,
    gender: state.filters.gender,
    result_count: state.filteredJobs.length,
  });
}

function handleHRContactClick(e) {
  const el = e.currentTarget;
  trackEvent('job_hr_click', {
    job_id:       el.dataset.jobId,
    company:      el.dataset.company,
    position:     el.dataset.position,
    contact_type: el.dataset.contactType,
  });
  // Native navigation continues (href)
}

function handleSourceClick(e) {
  e.preventDefault();
  const el = e.currentTarget;
  const link = el.dataset.sourceLink;

  trackEvent('job_source_click', {
    job_id:      el.dataset.jobId,
    company:     el.dataset.company,
    source_type: el.dataset.sourceType,
  });

  if (link && link !== '#') {
    window.open(link, '_blank', 'noopener,noreferrer');
  }
}

function handleReportClick(e) {
  e.preventDefault();
  const jobId = e.currentTarget.dataset.jobId;
  const url = CONFIG.REPORT_FORM_URL;

  if (url) {
    window.open(url + '?job_id=' + jobId, '_blank', 'noopener,noreferrer');
  } else {
    alert('Cảm ơn bạn đã báo cáo. Chúng tôi sẽ kiểm tra tin này sớm nhất có thể.');
  }
}

function resetAllFilters() {
  DOM.searchInput().value  = '';
  DOM.filterKCN().value    = '';
  DOM.filterSalary().value = '';
  DOM.filterGender().value = '';
  DOM.searchClearBtn().style.display = 'none';

  state.searchQuery = '';
  state.filters = { kcn: '', salary: '', gender: '' };

  applyFiltersAndSearch();
}

/* ─────────────────────────────────────────────
   10. ANALYTICS
───────────────────────────────────────────── */

function trackEvent(eventName, properties = {}) {
  // Console log always (dev/debug)
  console.log('[Analytics]', eventName, properties);

  // Google Analytics 4
  if (CONFIG.GA_ID && typeof gtag === 'function') {
    gtag('event', eventName, properties);
  }

  // Custom hook (extend here for Mixpanel, Amplitude, etc.)
}

function trackPageView() {
  const url = new URL(window.location.href);
  const source   = url.searchParams.get('utm_source')   || url.searchParams.get('source')   || 'direct';
  const medium   = url.searchParams.get('utm_medium')   || url.searchParams.get('medium')   || '';
  const campaign = url.searchParams.get('utm_campaign') || url.searchParams.get('campaign') || '';

  trackEvent('page_view', { source, medium, campaign, path: url.pathname });
}

/* ─────────────────────────────────────────────
   11. UI STATE HELPERS
───────────────────────────────────────────── */

function showLoading() {
  DOM.loadingState().style.display = 'grid';
  DOM.errorState().style.display   = 'none';
  DOM.emptyState().style.display   = 'none';
  DOM.jobGrid().style.display      = 'none';
  DOM.jobCountBar().style.display  = 'none';
}

function hideLoading() {
  DOM.loadingState().style.display = 'none';
}

function showError() {
  DOM.loadingState().style.display = 'none';
  DOM.errorState().style.display   = 'flex';
  DOM.jobGrid().style.display      = 'none';
  DOM.jobCountBar().style.display  = 'none';
}

/* ─────────────────────────────────────────────
   12. HELPERS
───────────────────────────────────────────── */

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeAttr(str) {
  if (!str) return '';
  return String(str).replace(/"/g, '&quot;');
}

/* ─────────────────────────────────────────────
   13. INITIALIZATION
───────────────────────────────────────────── */

async function initApp() {
  // Track page view
  trackPageView();

  // Show loading
  showLoading();

  try {
    let jobs;

    if (CONFIG.SHEET_ID) {
      // Fetch từ Google Sheets qua gviz/tq API
      jobs = await fetchJobsFromSheet(CONFIG.SHEET_ID, CONFIG.SHEET_TAB_NAME);
    } else {
      // Không có SHEET_ID → trả về rỗng, hiển thị empty state
      jobs = [];
    }

    // Sort: updated_at DESC (newest first)
    jobs.sort((a, b) => {
      const da = new Date(a.updated_at || '2000-01-01');
      const db = new Date(b.updated_at || '2000-01-01');
      return db - da;
    });

    state.allJobs = jobs;
    state.filteredJobs = [...jobs];

    // Populate KCN filter
    populateKCNFilter(jobs);

    // Hide loading, render jobs
    hideLoading();
    applyFiltersAndSearch();

    // Setup footer report link
    if (CONFIG.REPORT_FORM_URL) {
      DOM.footerReportLink().href = CONFIG.REPORT_FORM_URL;
      DOM.footerReportLink().target = '_blank';
    } else {
      DOM.footerReportLink().addEventListener('click', e => {
        e.preventDefault();
        alert('Cảm ơn bạn đã muốn báo cáo. Tính năng này sẽ sớm được cập nhật.');
      });
    }

  } catch (err) {
    console.error('[Việc Làm KCN] Failed to load jobs:', err);
    hideLoading();
    showError();
  }
}

// Hàm fetch ngầm (không hiện loading) để cập nhật data liên tục
async function silentRefreshData() {
  if (!CONFIG.SHEET_ID) return;
  try {
    const jobs = await fetchJobsFromSheet(CONFIG.SHEET_ID, CONFIG.SHEET_TAB_NAME);
    jobs.sort((a, b) => {
      const da = new Date(a.updated_at || '2000-01-01');
      const db = new Date(b.updated_at || '2000-01-01');
      return db - da;
    });
    
    // So sánh xem số lượng job có thay đổi không (cơ bản)
    // Nếu có thể, hãy update mảng và re-render
    state.allJobs = jobs;
    
    // Gọi applyFiltersAndSearch để render lại grid bằng data mới 
    // (nhưng vẫn giữ nguyên các filter user đang chọn)
    applyFiltersAndSearch();
  } catch (err) {
    console.log('[Việc Làm KCN] Silent refresh failed, keeping old data.');
  }
}

/* ─────────────────────────────────────────────
   14. EVENT LISTENERS SETUP
───────────────────────────────────────────── */

function setupEventListeners() {
  DOM.searchInput().addEventListener('input', handleSearchInput);
  DOM.searchClearBtn().addEventListener('click', handleSearchClear);

  DOM.filterKCN().addEventListener('change', handleFilterChange);
  DOM.filterSalary().addEventListener('change', handleFilterChange);
  DOM.filterGender().addEventListener('change', handleFilterChange);

  DOM.filterResetBtn().addEventListener('click', resetAllFilters);
  DOM.retryBtn().addEventListener('click', initApp);
  DOM.emptyResetBtn().addEventListener('click', resetAllFilters);
}

/* ─────────────────────────────────────────────
   15. BOOTSTRAP
───────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  initApp();

  // Tự động làm mới dữ liệu ngầm mỗi 3 phút (180,000 ms)
  // Giúp người dùng để treo tab vẫn nhận được job mới
  setInterval(silentRefreshData, 180000);
});
