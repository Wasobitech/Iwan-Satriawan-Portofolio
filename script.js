/**
 * ==============================================================================
 * NEXA — LOGIKA INTERAKTIF FRONT-END VANILLA JAVASCRIPT
 * Fitur: Routing Tampilan, Manajemen Modal & Drawer, Filter Mutasi Real-time,
 * Format Rupiah, Sensor Saldo, Pengalih Tema Gelap/Terang, & Sistem Toast
 * ==============================================================================
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

  // ----------------------------------------------------------------------------
  // 1. STATE MANAGEMENT & DATA APLIKASI
  // ----------------------------------------------------------------------------
  const AppState = {
    currentTheme: localStorage.getItem('nexa_theme') || 'dark',
    isSidebarCollapsed: localStorage.getItem('nexa_sidebar_collapsed') === 'true',
    isBalanceVisible: true,
    isCardNumberVisible: false,
    activeView: 'beranda',
    balanceAmount: 84750000,
    mainPocketAmount: 65200000,
    currentFilter: 'all',
    searchQuery: '',
    unreadNotificationsCount: 3
  };

  // ----------------------------------------------------------------------------
  // 2. DOM CACHE SELECTORS
  // ----------------------------------------------------------------------------
  const DOM = {
    html: document.documentElement,
    appLayout: document.getElementById('app'),
    sidebar: document.getElementById('app-sidebar'),
    sidebarBackdrop: document.getElementById('sidebar-backdrop'),
    mobileSidebarToggle: document.getElementById('mobile-sidebar-toggle'),
    sidebarCollapseToggle: document.getElementById('sidebar-collapse-toggle'),
    headerThemeToggle: document.getElementById('header-theme-toggle'),
    sidebarThemeToggle: document.getElementById('sidebar-theme-toggle'),
    headerProfileBtn: document.getElementById('header-profile-btn'),
    headerProfileDropdown: document.getElementById('header-profile-dropdown'),
    pageTitle: document.getElementById('page-title'),
    mainScrollArea: document.getElementById('main-scroll-area'),
    
    // Balance & Card Elements
    userBalanceDisplay: document.getElementById('user-balance-display'),
    btnToggleBalance: document.getElementById('btn-toggle-balance'),
    balanceEyeIcon: document.getElementById('balance-eye-icon'),
    displayCardNumber: document.getElementById('display-card-number'),
    btnToggleCardNumber: document.getElementById('btn-toggle-card-number'),

    // Navigation Links
    sidebarNavLinks: document.querySelectorAll('.sidebar-nav .nav-link'),
    bottomNavLinks: document.querySelectorAll('.app-bottom-nav .bottom-nav-item'),
    appViews: document.querySelectorAll('.app-view'),

    // Modals
    modalTransfer: document.getElementById('modal-transfer'),
    modalTransferBackdrop: document.getElementById('modal-transfer-backdrop'),
    btnCloseModalTransfer: document.getElementById('btn-close-modal-transfer'),
    btnCancelTransfer: document.getElementById('btn-cancel-transfer'),
    transferForm: document.getElementById('transfer-form'),
    transferAmountInput: document.getElementById('transfer-amount'),
    transferRecipientInput: document.getElementById('transfer-recipient'),
    transferTotalPreview: document.getElementById('transfer-total-preview'),
    quickContactChips: document.querySelectorAll('.contact-chip'),
    presetNominalBtns: document.querySelectorAll('.preset-btn'),

    modalQris: document.getElementById('modal-qris'),
    modalQrisBackdrop: document.getElementById('modal-qris-backdrop'),
    btnCloseModalQris: document.getElementById('btn-close-modal-qris'),
    btnBnavCenterQris: document.getElementById('bnav-center-qris'),
    btnSimulasiScan: document.getElementById('btn-simulasi-scan'),
    btnUnggahQr: document.getElementById('btn-unggah-qr'),

    // Notifications Drawer
    btnOpenNotifications: document.getElementById('btn-open-notifications'),
    drawerNotifications: document.getElementById('drawer-notifications'),
    btnCloseDrawer: document.getElementById('btn-close-drawer'),
    btnMarkAllRead: document.getElementById('btn-mark-all-read'),
    btnBersihkanNotif: document.getElementById('btn-bersihkan-notif'),
    notificationsBadge: document.getElementById('notifications-badge'),
    notificationsListContainer: document.getElementById('notifications-list-container'),

    // Filter & Search Elements
    filterPills: document.querySelectorAll('.filter-pill'),
    transactionSearch: document.getElementById('transaction-search'),
    globalSearchInput: document.getElementById('global-search-input'),
    transactionListContainer: document.getElementById('transaction-list-container'),
    txEmptyState: document.getElementById('tx-empty-state'),
    btnResetFilter: document.getElementById('btn-reset-filter'),

    // Cashflow Chart
    chartPills: document.querySelectorAll('.chart-pill'),
    cashflowBars: document.querySelectorAll('.cashflow-bars-container .bar-track'),

    // Toast Container
    toastContainer: document.getElementById('toast-container')
  };

  // ----------------------------------------------------------------------------
  // 3. UTILITY FUNCTIONS
  // ----------------------------------------------------------------------------

  /**
   * Format integer number into Indonesian Rupiah (IDR)
   * @param {number} amount
   * @returns {string} e.g. "Rp 84.750.000"
   */
  const formatRupiah = (amount) => {
    return 'Rp ' + Number(amount).toLocaleString('id-ID');
  };

  /**
   * Menampilkan pemberitahuan Toast dinamis dengan animasi mulus
   * @param {string} message - Pesan pemberitahuan
   * @param {'success'|'danger'|'info'} [type='success'] - Gaya tampilan toast
   * @param {number} [duration=3500] - Durasi tampil dalam milidetik
   */
  const showToast = (message, type = 'success', duration = 3500) => {
    if (!DOM.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');

    let iconClass = 'bi-check-circle-fill text-emerald';
    if (type === 'danger') iconClass = 'bi-exclamation-triangle-fill text-primary';
    if (type === 'info') iconClass = 'bi-info-circle-fill text-blue';

    toast.innerHTML = `
      <i class="bi ${iconClass} toast-icon"></i>
      <div class="toast-message">${message}</div>
      <button type="button" class="btn-icon btn-xs" aria-label="Tutup Notifikasi" style="color: var(--text-subtle);">
        <i class="bi bi-x"></i>
      </button>
    `;

    const closeBtn = toast.querySelector('button');
    closeBtn.addEventListener('click', () => {
      removeToast(toast);
    });

    DOM.toastContainer.appendChild(toast);

    const autoTimer = setTimeout(() => {
      removeToast(toast);
    }, duration);

    function removeToast(element) {
      clearTimeout(autoTimer);
      element.style.opacity = '0';
      element.style.transform = 'translateY(-10px)';
      element.style.transition = 'all 200ms ease';
      setTimeout(() => {
        if (element.parentNode) element.parentNode.removeChild(element);
      }, 200);
    }
  };

  // ----------------------------------------------------------------------------
  // 4. THEME CONTROLLER (MODE TERANG & GELAP)
  // ----------------------------------------------------------------------------
  const applyTheme = (themeName) => {
    AppState.currentTheme = themeName;
    DOM.html.setAttribute('data-theme', themeName);
    localStorage.setItem('nexa_theme', themeName);
  };

  const toggleTheme = () => {
    const nextTheme = AppState.currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
    showToast(`Mode tampilan diubah ke ${nextTheme === 'dark' ? 'Mode Gelap' : 'Mode Terang'}.`, 'info', 2500);
  };

  // Inisialisasi tema awal
  applyTheme(AppState.currentTheme);

  if (DOM.headerThemeToggle) DOM.headerThemeToggle.addEventListener('click', toggleTheme);
  if (DOM.sidebarThemeToggle) DOM.sidebarThemeToggle.addEventListener('click', toggleTheme);

  // ----------------------------------------------------------------------------
  // 5. SIDEBAR NAVIGATION & COLLAPSE CONTROLLER
  // ----------------------------------------------------------------------------
  const openMobileSidebar = () => {
    DOM.sidebar.classList.add('mobile-open');
    DOM.sidebarBackdrop.classList.add('active');
    DOM.mobileSidebarToggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };

  const closeMobileSidebar = () => {
    DOM.sidebar.classList.remove('mobile-open');
    DOM.sidebarBackdrop.classList.remove('active');
    DOM.mobileSidebarToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  if (DOM.mobileSidebarToggle) {
    DOM.mobileSidebarToggle.addEventListener('click', () => {
      if (DOM.sidebar.classList.contains('mobile-open')) {
        closeMobileSidebar();
      } else {
        openMobileSidebar();
      }
    });
  }

  if (DOM.sidebarBackdrop) {
    DOM.sidebarBackdrop.addEventListener('click', () => {
      closeMobileSidebar();
      closeNotificationsDrawer();
    });
  }

  // Toggle Collapse Sidebar Desktop
  const applyDesktopSidebarCollapse = (collapsed) => {
    AppState.isSidebarCollapsed = collapsed;
    localStorage.setItem('nexa_sidebar_collapsed', collapsed ? 'true' : 'false');
    if (collapsed) {
      DOM.appLayout.classList.add('sidebar-collapsed');
      if (DOM.sidebarCollapseToggle) DOM.sidebarCollapseToggle.setAttribute('title', 'Perluas Bilah Sisi');
    } else {
      DOM.appLayout.classList.remove('sidebar-collapsed');
      if (DOM.sidebarCollapseToggle) DOM.sidebarCollapseToggle.setAttribute('title', 'Ciutkan Bilah Sisi');
    }
  };

  applyDesktopSidebarCollapse(AppState.isSidebarCollapsed);

  if (DOM.sidebarCollapseToggle) {
    DOM.sidebarCollapseToggle.addEventListener('click', () => {
      applyDesktopSidebarCollapse(!AppState.isSidebarCollapsed);
    });
  }

  // ----------------------------------------------------------------------------
  // 6. SPA VIEW ROUTING SYSTEM (PEMINDAHAN TAMPILAN)
  // ----------------------------------------------------------------------------
  const viewTitles = {
    'beranda': 'Dasbor Utama',
    'aktivitas': 'Riwayat Mutasi & Aktivitas',
    'dompet': 'Dompet Digital & Rekening Terhubung',
    'analitik': 'Analisis & Kesehatan Finansial',
    'pengaturan': 'Preferensi & Keamanan Akun'
  };

  const navigateToView = (viewId) => {
    if (!viewTitles[viewId]) return;

    AppState.activeView = viewId;

    // Update active class on views
    DOM.appViews.forEach(view => {
      if (view.id === `view-${viewId}`) {
        view.classList.add('active');
      } else {
        view.classList.remove('active');
      }
    });

    // Update Sidebar links active state
    DOM.sidebarNavLinks.forEach(link => {
      if (link.dataset.view === viewId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Update Mobile Bottom Nav active state
    DOM.bottomNavLinks.forEach(bnav => {
      if (bnav.dataset.view === viewId) {
        bnav.classList.add('active');
      } else {
        bnav.classList.remove('active');
      }
    });

    // Update page title
    if (DOM.pageTitle) {
      DOM.pageTitle.textContent = viewTitles[viewId];
    }

    // Scroll main view back to top
    if (DOM.mainScrollArea) {
      DOM.mainScrollArea.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Tutup mobile drawer jika terbuka
    closeMobileSidebar();
  };

  // Event listener untuk navigasi sidebar
  DOM.sidebarNavLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const viewId = link.dataset.view;
      if (viewId) {
        e.preventDefault();
        navigateToView(viewId);
        window.location.hash = viewId;
      }
    });
  });

  // Event listener untuk bottom navigation
  DOM.bottomNavLinks.forEach(bnav => {
    bnav.addEventListener('click', (e) => {
      const viewId = bnav.dataset.view;
      if (viewId) {
        e.preventDefault();
        navigateToView(viewId);
        window.location.hash = viewId;
      }
    });
  });

  // Cek hash saat halaman dimuat
  const initialHash = window.location.hash.replace('#', '');
  if (initialHash && viewTitles[initialHash]) {
    navigateToView(initialHash);
  }

  // ----------------------------------------------------------------------------
  // 7. PRIVACY SENSORS: TOGGLE SALDO & NOMOR KARTU
  // ----------------------------------------------------------------------------
  const updateBalanceDisplay = () => {
    if (!DOM.userBalanceDisplay) return;
    if (AppState.isBalanceVisible) {
      DOM.userBalanceDisplay.textContent = formatRupiah(AppState.balanceAmount);
      if (DOM.balanceEyeIcon) {
        DOM.balanceEyeIcon.className = 'bi bi-eye-slash-fill';
      }
      DOM.btnToggleBalance.setAttribute('aria-label', 'Sembunyikan Saldo');
    } else {
      DOM.userBalanceDisplay.textContent = 'Rp ••••••••';
      if (DOM.balanceEyeIcon) {
        DOM.balanceEyeIcon.className = 'bi bi-eye-fill';
      }
      DOM.btnToggleBalance.setAttribute('aria-label', 'Tampilkan Saldo');
    }
  };

  if (DOM.btnToggleBalance) {
    DOM.btnToggleBalance.addEventListener('click', () => {
      AppState.isBalanceVisible = !AppState.isBalanceVisible;
      updateBalanceDisplay();
    });
  }

  // Sensor nomor kartu debit
  if (DOM.btnToggleCardNumber && DOM.displayCardNumber) {
    DOM.btnToggleCardNumber.addEventListener('click', () => {
      AppState.isCardNumberVisible = !AppState.isCardNumberVisible;
      if (AppState.isCardNumberVisible) {
        DOM.displayCardNumber.textContent = '4821 9081 2291 8842';
        DOM.btnToggleCardNumber.innerHTML = '<i class="bi bi-eye-slash-fill"></i>';
      } else {
        DOM.displayCardNumber.textContent = '•••• •••• •••• 8842';
        DOM.btnToggleCardNumber.innerHTML = '<i class="bi bi-eye-fill"></i>';
      }
    });
  }

  // ----------------------------------------------------------------------------
  // 8. MODAL TRANSFER DANA CEPAT
  // ----------------------------------------------------------------------------
  const openTransferModal = () => {
    DOM.modalTransfer.classList.add('active');
    DOM.modalTransfer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      if (DOM.transferRecipientInput) DOM.transferRecipientInput.focus();
    }, 250);
  };

  const closeTransferModal = () => {
    DOM.modalTransfer.classList.remove('active');
    DOM.modalTransfer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  // Trigger buttons untuk transfer
  const btnQuickTransfer = document.getElementById('btn-quick-transfer');
  const actionKirim = document.getElementById('action-kirim');
  if (btnQuickTransfer) btnQuickTransfer.addEventListener('click', openTransferModal);
  if (actionKirim) actionKirim.addEventListener('click', openTransferModal);

  if (DOM.btnCloseModalTransfer) DOM.btnCloseModalTransfer.addEventListener('click', closeTransferModal);
  if (DOM.btnCancelTransfer) DOM.btnCancelTransfer.addEventListener('click', closeTransferModal);
  if (DOM.modalTransferBackdrop) DOM.modalTransferBackdrop.addEventListener('click', closeTransferModal);

  // Quick recipient chips
  DOM.quickContactChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const name = chip.dataset.name;
      const acc = chip.dataset.acc;
      if (DOM.transferRecipientInput) {
        DOM.transferRecipientInput.value = `${name} (${acc})`;
      }
    });
  });

  // Preset nominal buttons
  DOM.presetNominalBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const val = Number(btn.dataset.value);
      if (DOM.transferAmountInput) {
        DOM.transferAmountInput.value = val;
        updateTransferPreview(val);
      }
    });
  });

  const updateTransferPreview = (amount) => {
    if (!DOM.transferTotalPreview) return;
    DOM.transferTotalPreview.textContent = formatRupiah(amount || 0);
  };

  if (DOM.transferAmountInput) {
    DOM.transferAmountInput.addEventListener('input', (e) => {
      const val = Number(e.target.value);
      updateTransferPreview(val);
    });
  }

  // Form submit transfer
  if (DOM.transferForm) {
    DOM.transferForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const recipient = DOM.transferRecipientInput.value.trim();
      const amount = Number(DOM.transferAmountInput.value);

      if (!recipient) {
        showToast('Harap masukkan nama penerima atau nomor rekening.', 'danger');
        return;
      }

      if (!amount || amount < 10000) {
        showToast('Nominal transfer minimum adalah Rp 10.000.', 'danger');
        return;
      }

      if (amount > AppState.balanceAmount) {
        showToast('Saldo Anda tidak mencukupi untuk melakukan transaksi ini.', 'danger');
        return;
      }

      // Potong saldo simulasi
      AppState.balanceAmount -= amount;
      updateBalanceDisplay();

      // Tambahkan transaksi baru ke daftar mutasi
      addNewTransaction({
        id: `TX-${Math.floor(1000 + Math.random() * 9000)}`,
        title: `Transfer ke ${recipient}`,
        amount: -amount,
        category: 'keluar',
        channel: 'Transfer BI-FAST',
        time: 'Baru saja'
      });

      closeTransferModal();
      DOM.transferForm.reset();
      updateTransferPreview(0);

      showToast(`Transfer sebesar ${formatRupiah(amount)} ke ${recipient} berhasil dikirim!`, 'success');
    });
  }

  // ----------------------------------------------------------------------------
  // 9. MODAL QRIS SCANNER & SIMULATION
  // ----------------------------------------------------------------------------
  const openQrisModal = () => {
    DOM.modalQris.classList.add('active');
    DOM.modalQris.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  const closeQrisModal = () => {
    DOM.modalQris.classList.remove('active');
    DOM.modalQris.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  const actionQris = document.getElementById('action-qris');
  const navQris = document.getElementById('nav-qris');
  if (DOM.btnBnavCenterQris) DOM.btnBnavCenterQris.addEventListener('click', openQrisModal);
  if (actionQris) actionQris.addEventListener('click', openQrisModal);
  if (navQris) navQris.addEventListener('click', (e) => { e.preventDefault(); openQrisModal(); });

  if (DOM.btnCloseModalQris) DOM.btnCloseModalQris.addEventListener('click', closeQrisModal);
  if (DOM.modalQrisBackdrop) DOM.modalQrisBackdrop.addEventListener('click', closeQrisModal);

  if (DOM.btnSimulasiScan) {
    DOM.btnSimulasiScan.addEventListener('click', () => {
      const qrisAmount = 55000;
      AppState.balanceAmount -= qrisAmount;
      updateBalanceDisplay();

      addNewTransaction({
        id: `TX-${Math.floor(1000 + Math.random() * 9000)}`,
        title: 'Pembayaran QRIS Merchant Nexa',
        amount: -qrisAmount,
        category: 'keluar',
        channel: 'QRIS Dinamis',
        time: 'Baru saja'
      });

      closeQrisModal();
      showToast('Pembayaran QRIS sebesar Rp 55.000 telah sukses diproses!', 'success');
    });
  }

  if (DOM.btnUnggahQr) {
    DOM.btnUnggahQr.addEventListener('click', () => {
      showToast('Pilih foto kode QR dari penyimpanan galeri perangkat Anda.', 'info');
    });
  }

  // ----------------------------------------------------------------------------
  // 10. OFFCANVAS NOTIFICATIONS DRAWER
  // ----------------------------------------------------------------------------
  const openNotificationsDrawer = () => {
    DOM.drawerNotifications.classList.add('active');
    DOM.drawerNotifications.setAttribute('aria-hidden', 'false');
    DOM.sidebarBackdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  const closeNotificationsDrawer = () => {
    DOM.drawerNotifications.classList.remove('active');
    DOM.drawerNotifications.setAttribute('aria-hidden', 'true');
    DOM.sidebarBackdrop.classList.remove('active');
    document.body.style.overflow = '';
  };

  if (DOM.btnOpenNotifications) {
    DOM.btnOpenNotifications.addEventListener('click', openNotificationsDrawer);
  }

  if (DOM.btnCloseDrawer) {
    DOM.btnCloseDrawer.addEventListener('click', closeNotificationsDrawer);
  }

  if (DOM.btnMarkAllRead) {
    DOM.btnMarkAllRead.addEventListener('click', () => {
      const unreadCards = DOM.drawerNotifications.querySelectorAll('.notif-card.unread');
      unreadCards.forEach(card => card.classList.remove('unread'));
      if (DOM.notificationsBadge) DOM.notificationsBadge.style.display = 'none';
      AppState.unreadNotificationsCount = 0;
      showToast('Seluruh notifikasi telah ditandai sebagai sudah dibaca.', 'info');
    });
  }

  if (DOM.btnBersihkanNotif) {
    DOM.btnBersihkanNotif.addEventListener('click', () => {
      if (DOM.notificationsListContainer) {
        DOM.notificationsListContainer.innerHTML = `
          <div class="empty-state" style="padding: 2rem 0;">
            <i class="bi bi-bell-slash empty-icon"></i>
            <h4>Kotak Notifikasi Bersih</h4>
            <p>Tidak ada pemberitahuan baru yang tersisa.</p>
          </div>
        `;
      }
      if (DOM.notificationsBadge) DOM.notificationsBadge.style.display = 'none';
      showToast('Semua riwayat notifikasi telah dibersihkan.', 'info');
    });
  }

  // ----------------------------------------------------------------------------
  // 11. PROFILE HEADER DROPDOWN
  // ----------------------------------------------------------------------------
  if (DOM.headerProfileBtn && DOM.headerProfileDropdown) {
    DOM.headerProfileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isExpanded = DOM.headerProfileBtn.getAttribute('aria-expanded') === 'true';
      DOM.headerProfileBtn.setAttribute('aria-expanded', !isExpanded);
      DOM.headerProfileDropdown.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.header-profile-menu')) {
        DOM.headerProfileDropdown.classList.remove('active');
        DOM.headerProfileBtn.setAttribute('aria-expanded', 'false');
      }
    });

    // Profile Dropdown Actions
    const dropdownActions = DOM.headerProfileDropdown.querySelectorAll('.dropdown-item');
    dropdownActions.forEach(item => {
      item.addEventListener('click', () => {
        DOM.headerProfileDropdown.classList.remove('active');
        const action = item.dataset.action;
        if (action === 'go-profile') navigateToView('pengaturan');
        if (action === 'go-security') navigateToView('pengaturan');
        if (action === 'go-wallet') navigateToView('dompet');
      });
    });

    const btnLogout = document.getElementById('btn-logout-dropdown');
    const sidebarLogoutBtn = document.getElementById('sidebar-logout-btn');
    const handleLogout = () => {
      showToast('Sesi Anda telah berhasil dikunci demi keamanan akun.', 'info');
    };
    if (btnLogout) btnLogout.addEventListener('click', handleLogout);
    if (sidebarLogoutBtn) sidebarLogoutBtn.addEventListener('click', handleLogout);
  }

  // ----------------------------------------------------------------------------
  // 12. FILTER & REAL-TIME SEARCH MUTASI TRANSAKSI
  // ----------------------------------------------------------------------------
  const filterTransactions = () => {
    const items = DOM.transactionListContainer.querySelectorAll('.transaction-item');
    let visibleCount = 0;

    items.forEach(item => {
      const category = item.dataset.category;
      const title = item.querySelector('.tx-title').textContent.toLowerCase();
      const channel = item.querySelector('.tx-channel').textContent.toLowerCase();
      const matchesCategory = (AppState.currentFilter === 'all' || category === AppState.currentFilter);
      const matchesSearch = (!AppState.searchQuery || title.includes(AppState.searchQuery) || channel.includes(AppState.searchQuery));

      if (matchesCategory && matchesSearch) {
        item.style.display = 'flex';
        visibleCount++;
      } else {
        item.style.display = 'none';
      }
    });

    if (DOM.txEmptyState) {
      if (visibleCount === 0) {
        DOM.txEmptyState.classList.remove('d-none');
      } else {
        DOM.txEmptyState.classList.add('d-none');
      }
    }
  };

  DOM.filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      DOM.filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      AppState.currentFilter = pill.dataset.filter;
      filterTransactions();
    });
  });

  if (DOM.transactionSearch) {
    DOM.transactionSearch.addEventListener('input', (e) => {
      AppState.searchQuery = e.target.value.trim().toLowerCase();
      filterTransactions();
    });
  }

  if (DOM.btnResetFilter) {
    DOM.btnResetFilter.addEventListener('click', () => {
      if (DOM.transactionSearch) DOM.transactionSearch.value = '';
      AppState.searchQuery = '';
      AppState.currentFilter = 'all';
      DOM.filterPills.forEach(p => p.classList.remove('active'));
      const allPill = document.querySelector('.filter-pill[data-filter="all"]');
      if (allPill) allPill.classList.add('active');
      filterTransactions();
    });
  }

  // Fungsi menambah transaksi baru secara dinamis
  const addNewTransaction = (txData) => {
    if (!DOM.transactionListContainer) return;

    const isPositive = txData.amount > 0;
    const item = document.createElement('article');
    item.className = 'transaction-item';
    item.dataset.category = txData.category;
    item.dataset.id = txData.id;
    item.setAttribute('role', 'listitem');

    let iconBoxClass = 'bg-red-soft';
    let iconClass = 'bi-arrow-up-right text-primary';

    if (isPositive) {
      iconBoxClass = 'bg-emerald-soft';
      iconClass = 'bi-arrow-down-left text-emerald';
    }

    item.innerHTML = `
      <div class="tx-icon-box ${iconBoxClass}">
        <i class="bi ${iconClass}"></i>
      </div>
      <div class="tx-main-info">
        <h4 class="tx-title">${txData.title}</h4>
        <div class="tx-meta">
          <span class="tx-time">${txData.time}</span>
          <span class="tx-bullet">•</span>
          <span class="tx-channel">${txData.channel}</span>
          <span class="badge-status success">Berhasil</span>
        </div>
      </div>
      <div class="tx-amount-col">
        <span class="tx-amount ${isPositive ? 'positive' : 'negative'}">
          ${isPositive ? '+' : '-'} ${formatRupiah(Math.abs(txData.amount))}
        </span>
        <span class="tx-fee">Bebas Biaya Admin</span>
      </div>
      <button type="button" class="btn-icon btn-sm tx-detail-btn" data-tx="${txData.id}" aria-label="Lihat Rincian Transaksi ${txData.id}">
        <i class="bi bi-chevron-right"></i>
      </button>
    `;

    // Sisipkan item ke paling atas
    DOM.transactionListContainer.prepend(item);
    attachDetailBtnListener(item.querySelector('.tx-detail-btn'));
    filterTransactions();
  };

  const attachDetailBtnListener = (btn) => {
    if (!btn) return;
    btn.addEventListener('click', () => {
      const txId = btn.dataset.tx;
      showToast(`Membuka rincian lengkap e-Receipt ID: ${txId}`, 'info');
    });
  };

  document.querySelectorAll('.tx-detail-btn').forEach(attachDetailBtnListener);

  // ----------------------------------------------------------------------------
  // 13. INTERAKTIVITAS GRAFIK ARUS KAS & PERIODE
  // ----------------------------------------------------------------------------
  DOM.chartPills.forEach(pill => {
    pill.addEventListener('click', () => {
      DOM.chartPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      const isMonthly = pill.dataset.period === 'monthly';
      DOM.cashflowBars.forEach(track => {
        const inBar = track.querySelector('.bar-fill.in');
        const outBar = track.querySelector('.bar-fill.out');
        if (isMonthly) {
          inBar.style.height = `${Math.floor(40 + Math.random() * 55)}%`;
          outBar.style.height = `${Math.floor(25 + Math.random() * 65)}%`;
        } else {
          inBar.style.height = `${Math.floor(30 + Math.random() * 65)}%`;
          outBar.style.height = `${Math.floor(20 + Math.random() * 60)}%`;
        }
      });

      showToast(`Grafik diperbarui ke tampilan arus kas ${isMonthly ? 'Bulanan' : 'Mingguan'}.`, 'info', 2000);
    });
  });

  // ----------------------------------------------------------------------------
  // 14. GLOBAL SHORTCUT KEYS (AKSESIBILITAS KEYBOARD)
  // ----------------------------------------------------------------------------
  document.addEventListener('keydown', (e) => {
    // Tombol '/' untuk fokus pencarian global
    if (e.key === '/' && document.activeElement !== DOM.globalSearchInput && document.activeElement !== DOM.transactionSearch) {
      e.preventDefault();
      if (DOM.globalSearchInput) {
        DOM.globalSearchInput.focus();
        DOM.globalSearchInput.select();
      }
    }

    // Tombol 'Escape' untuk menutup seluruh modal atau drawer terbuka
    if (e.key === 'Escape') {
      closeTransferModal();
      closeQrisModal();
      closeNotificationsDrawer();
      closeMobileSidebar();
      if (DOM.headerProfileDropdown) DOM.headerProfileDropdown.classList.remove('active');
    }
  });

  // ----------------------------------------------------------------------------
  // 15. DYNAMIC INTERACTIVE BUTTONS & CALL-TO-ACTIONS
  // ----------------------------------------------------------------------------
  const setupButtonActions = () => {
    const btnLihatAnalisis = document.getElementById('btn-lihat-analisis');
    if (btnLihatAnalisis) btnLihatAnalisis.addEventListener('click', () => navigateToView('analitik'));

    const btnUnduhRekeningKoran = document.getElementById('btn-unduh-rekening-koran');
    if (btnUnduhRekeningKoran) {
      btnUnduhRekeningKoran.addEventListener('click', () => {
        showToast('Memproses berkas e-Statement PDF terenkripsi Anda...', 'info');
        setTimeout(() => {
          showToast('e-Statement bulan berjalan siap diunduh.', 'success');
        }, 1500);
      });
    }

    const btnExportCsv = document.getElementById('btn-export-csv');
    if (btnExportCsv) {
      btnExportCsv.addEventListener('click', () => {
        showToast('Ekspor data mutasi ke format CSV berhasil disimpan.', 'success');
      });
    }

    const btnLihatSemuaMutasi = document.getElementById('btn-lihat-semua-mutasi');
    if (btnLihatSemuaMutasi) btnLihatSemuaMutasi.addEventListener('click', () => navigateToView('aktivitas'));

    const btnUpgradePrime = document.getElementById('btn-upgrade-prime');
    if (btnUpgradePrime) {
      btnUpgradePrime.addEventListener('click', () => {
        showToast('Paket Nexa Prime Anda saat ini aktif hingga 31 Desember 2026.', 'info');
      });
    }

    const actionMinta = document.getElementById('action-minta');
    if (actionMinta) {
      actionMinta.addEventListener('click', () => {
        showToast('Tautan permintaan dana (Invoice QRIS) telah disalin ke papan klip!', 'success');
      });
    }

    const actionTopup = document.getElementById('action-topup');
    if (actionTopup) {
      actionTopup.addEventListener('click', () => {
        showToast('Nomor Rekening Virtual Account Top Up BCA: 3901 0812 9988 7711', 'info', 4500);
      });
    }

    const btnTambahTarget = document.getElementById('btn-tambah-target');
    if (btnTambahTarget) {
      btnTambahTarget.addEventListener('click', () => {
        showToast('Fitur pembuatan Kantong Target Tabungan Baru siap digunakan.', 'info');
      });
    }

    const btnHubungkanRekening = document.getElementById('btn-hubungkan-rekening');
    if (btnHubungkanRekening) {
      btnHubungkanRekening.addEventListener('click', () => {
        showToast('Membuka wizard integrasi Open Banking API BI-FAST...', 'info');
      });
    }

    const btnPilihKontak = document.getElementById('btn-pilih-kontak');
    if (btnPilihKontak) {
      btnPilihKontak.addEventListener('click', () => {
        showToast('Menampilkan daftar kontak transfer prioritas Anda.', 'info');
      });
    }

    const navKartu = document.getElementById('nav-kartu');
    if (navKartu) {
      navKartu.addEventListener('click', (e) => {
        e.preventDefault();
        showToast('Kartu Virtual Nexa Platinum Black aktif dengan limit harian Rp 50.000.000.', 'info');
      });
    }

    const navTagihan = document.getElementById('nav-tagihan');
    if (navTagihan) {
      navTagihan.addEventListener('click', (e) => {
        e.preventDefault();
        showToast('2 Tagihan baru: PLN Pascabayar (Rp 875.000) & Internet Fiber (Rp 350.000).', 'info');
      });
    }

    const navKeamanan = document.getElementById('nav-keamanan');
    if (navKeamanan) {
      navKeamanan.addEventListener('click', (e) => {
        e.preventDefault();
        navigateToView('pengaturan');
      });
    }

    const quickProfileBtn = document.getElementById('quick-profile-btn');
    if (quickProfileBtn) {
      quickProfileBtn.addEventListener('click', () => {
        navigateToView('pengaturan');
      });
    }

    const btnFilterRentang = document.getElementById('btn-filter-rentang');
    if (btnFilterRentang) {
      btnFilterRentang.addEventListener('click', () => {
        showToast('Filter rentang tanggal aktif: 30 Hari Terakhir.', 'info');
      });
    }
  };

  setupButtonActions();

});
