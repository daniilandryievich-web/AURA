/* ============================================================
   AURA DOMU – script.js
   Wspólny JS dla wszystkich podstron + logika poszczególnych stron
   ============================================================ */

// ── WYSYŁKA FORMULARZY ────────────────────────────────────────
// Projekt działa na razie bez bazy danych / backendu, więc formularze
// działają w trybie demonstracyjnym: po poprawnym wypełnieniu pokazują
// komunikat o sukcesie, ale dane nigdzie nie są wysyłane.
//
// Aby wysyłać wiadomości naprawdę, wystarczy wpisać adres endpointu
// (np. Formspree: 'https://formspree.io/f/abcdwxyz' albo własne API,
// które zapisuje dane w bazie) w stałej poniżej. Nic więcej nie trzeba
// zmieniać – kod obsługuje już błędy sieci i komunikat o niepowodzeniu.
const FORM_ENDPOINT = '';

async function sendFormFields(formData) {
  if (!FORM_ENDPOINT) {
    // tryb demonstracyjny – udajemy udaną wysyłkę
    return { ok: true, configured: false };
  }
  try {
    const res = await fetch(FORM_ENDPOINT, {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: formData
    });
    return { ok: res.ok, configured: true };
  } catch (err) {
    console.error('Błąd wysyłki formularza:', err);
    return { ok: false, configured: true };
  }
}

function sendFormData(form) {
  return sendFormFields(new FormData(form));
}

// ── POMOCNICZE ────────────────────────────────────────────────
function storageGet(key) {
  try { return localStorage.getItem(key); } catch (e) { return null; }
}
function storageSet(key, value) {
  try { localStorage.setItem(key, value); } catch (e) { /* brak dostępu do pamięci – ignorujemy */ }
}
// Normalizacja tekstu do wyszukiwania (bez polskich znaków i wielkości liter)
function normalizeText(str) {
  return String(str || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/ł/g, 'l').replace(/Ł/g, 'L')
    .toLowerCase();
}
const formatPLN = n => Number(n).toLocaleString('pl-PL') + ' zł';

// ── WYSZUKIWARKA NA STRONIE GŁÓWNEJ → oferty.html ─────────────
function goToOferty() {
  const val = id => {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
  };
  const params = new URLSearchParams();
  if (val('searchType'))     params.set('type',  val('searchType'));
  if (val('searchLocation')) params.set('q',     val('searchLocation'));
  if (val('searchPrice'))    params.set('price', val('searchPrice'));
  if (val('searchRooms'))    params.set('rooms', val('searchRooms'));
  const qs = params.toString();
  window.location.href = 'oferty.html' + (qs ? '?' + qs : '');
}

// ── WYBÓR KOLORU STRONY ───────────────────────────────────────
const THEME_KEY = 'auraDomu_theme';
const THEMES = [
  { id: 'default', name: 'Domyślny (złoty)', color: '#c8982f', wide: true },
  { id: 'c-blue',   name: 'Niebieski',    color: '#1e71ed' },
  { id: 'c-red',    name: 'Czerwony',     color: '#e91a13' },
  { id: 'c-green',  name: 'Zielony',      color: '#13873a' },
  { id: 'c-orange', name: 'Pomarańczowy', color: '#c65205' },
  { id: 'c-violet', name: 'Fioletowy',    color: '#9753db' },
  { id: 'c-teal',   name: 'Turkusowy',    color: '#0b8484' }
];

function applyTheme(id) {
  if (!THEMES.some(t => t.id === id)) id = 'default';
  document.documentElement.setAttribute('data-theme', id);
  storageSet(THEME_KEY, id);
  document.querySelectorAll('.theme-option').forEach(btn => {
    btn.setAttribute('aria-pressed', btn.dataset.theme === id ? 'true' : 'false');
  });
}

function initThemePicker() {
  const toggle = document.getElementById('contrastToggle');
  if (!toggle) return;

  const panel = document.createElement('div');
  panel.className = 'theme-panel';
  panel.id = 'themePanel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Wybór koloru strony');
  panel.hidden = true;
  panel.innerHTML =
    '<p class="theme-panel-title">Kolor strony</p><div class="theme-options">' +
    THEMES.map(t =>
      `<button type="button" class="theme-option${t.wide ? ' wide' : ''}" data-theme="${t.id}" aria-pressed="false">` +
      `<span class="theme-dot" style="background:${t.color}"></span><span>${t.name}</span></button>`
    ).join('') + '</div>' +
    '<p class="theme-hint">Wszystkie kolory poza domyślnym to wersje wysokokontrastowe (biało-czarna baza).</p>';
  document.body.appendChild(panel);

  const setOpen = open => {
    panel.hidden = !open;
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  };

  toggle.addEventListener('click', e => {
    e.stopPropagation();
    setOpen(panel.hidden);
  });
  panel.addEventListener('click', e => {
    e.stopPropagation();
    const btn = e.target.closest('.theme-option');
    if (btn) applyTheme(btn.dataset.theme);
  });
  document.addEventListener('click', () => setOpen(false));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !panel.hidden) { setOpen(false); toggle.focus(); }
  });

  const saved = storageGet(THEME_KEY);
  applyTheme(THEMES.some(t => t.id === saved) ? saved : 'default');
}

document.addEventListener('DOMContentLoaded', () => {

  // ── NAVBAR SCROLL ──────────────────────────────────────────
  const navbar = document.getElementById('navbar');
  if (navbar) {
    const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ── BURGER MENU ────────────────────────────────────────────
  const burger = document.getElementById('navBurger');
  const navMenu = document.getElementById('navMenu');
  if (burger && navMenu) {
    const setMenu = open => {
      burger.classList.toggle('open', open);
      navMenu.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    burger.addEventListener('click', () => setMenu(!navMenu.classList.contains('open')));
    document.addEventListener('click', e => {
      if (!burger.contains(e.target) && !navMenu.contains(e.target)) setMenu(false);
    });
  }

  // ── DROPDOWN NA TELEFONIE (dotknięcie otwiera) ─────────────
  document.querySelectorAll('.nav-dropdown > .nav-link').forEach(link => {
    link.addEventListener('click', e => {
      if (window.innerWidth <= 800) {
        e.preventDefault();
        link.closest('.nav-dropdown').classList.toggle('open');
      }
    });
  });

  // ── WYBÓR KOLORU ───────────────────────────────────────────
  initThemePicker();

  // ── ENTER W POLU WYSZUKIWARKI NA GŁÓWNEJ ───────────────────
  document.getElementById('searchLocation')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') goToOferty();
  });

  // ── HERO SLIDER ────────────────────────────────────────────
  const slides = document.querySelectorAll('.slide');
  const dots   = document.querySelectorAll('.dot');
  let current  = 0;
  let sliderTimer;

  function goToSlide(n) {
    slides[current].classList.remove('active');
    dots[current]?.classList.remove('active');
    slides[current].querySelectorAll('.slide-subtitle, .slide-title, .btn-gold').forEach(el => {
      el.style.animation = 'none';
      el.offsetHeight; // reflow
      el.style.animation = '';
    });
    current = (n + slides.length) % slides.length;
    slides[current].classList.add('active');
    dots[current]?.classList.add('active');
  }
  function startTimer() {
    clearInterval(sliderTimer);
    sliderTimer = setInterval(() => goToSlide(current + 1), 5500);
  }

  if (slides.length) {
    startTimer();
    document.getElementById('sliderNext')?.addEventListener('click', () => { goToSlide(current + 1); startTimer(); });
    document.getElementById('sliderPrev')?.addEventListener('click', () => { goToSlide(current - 1); startTimer(); });
    dots.forEach((dot, i) => dot.addEventListener('click', () => { goToSlide(i); startTimer(); }));
    const hero = document.getElementById('hero');
    if (hero) {
      // pauza autoprzewijania po najechaniu / fokusie (dostępność)
      hero.addEventListener('mouseenter', () => clearInterval(sliderTimer));
      hero.addEventListener('mouseleave', startTimer);
      hero.addEventListener('focusin',    () => clearInterval(sliderTimer));
      hero.addEventListener('focusout',   startTimer);
      // przesunięcie palcem
      let touchStartX = 0;
      hero.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
      hero.addEventListener('touchend', e => {
        const dx = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(dx) > 50) { goToSlide(dx < 0 ? current + 1 : current - 1); startTimer(); }
      });
    }
  }

  // ── LICZNIKI STATYSTYK ─────────────────────────────────────
  const statNumbers = document.querySelectorAll('.stat-number[data-target]');
  if (statNumbers.length) {
    const countObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = +el.dataset.target;
        const step = target / (1800 / 16);
        let val = 0;
        const tick = () => {
          val = Math.min(val + step, target);
          el.textContent = Math.floor(val) + (el.dataset.suffix || '');
          if (val < target) requestAnimationFrame(tick);
        };
        tick();
        countObserver.unobserve(el);
      });
    }, { threshold: 0.5 });
    statNumbers.forEach(el => countObserver.observe(el));
  }

  // ── POJAWIANIE SIĘ ELEMENTÓW PRZY PRZEWIJANIU ──────────────
  const fadeEls = document.querySelectorAll('.listing-card, .testimonial-card, .gallery-item, .team-card, .stat-item, .section-header, .video-text, .video-frame-wrap, .contact-detail-item');
  fadeEls.forEach(el => el.classList.add('fade-in'));
  const fadeObserver = new IntersectionObserver(entries => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * 80);
        fadeObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  fadeEls.forEach(el => fadeObserver.observe(el));

  // ── PLAYER WIDEO NA STRONIE GŁÓWNEJ ────────────────────────
  const mainVideo = document.getElementById('mainVideo');
  const videoItems = document.querySelectorAll('.video-item');
  if (mainVideo && videoItems.length) {
    const nowPlaying = document.getElementById('videoNow');
    videoItems.forEach(item => {
      item.addEventListener('click', () => {
        if (item.classList.contains('active')) { mainVideo.play(); return; }
        videoItems.forEach(i => { i.classList.remove('active'); i.setAttribute('aria-pressed', 'false'); });
        item.classList.add('active');
        item.setAttribute('aria-pressed', 'true');
        mainVideo.pause();
        mainVideo.poster = item.dataset.poster;
        mainVideo.src = item.dataset.src;
        mainVideo.setAttribute('aria-label', 'Film: ' + item.dataset.label);
        mainVideo.load();
        // kliknięcie użytkownika pozwala włączyć film razem z dźwiękiem
        mainVideo.play().catch(() => { /* przeglądarka zablokowała start – użytkownik kliknie ▶ */ });
        if (nowPlaying) nowPlaying.innerHTML = 'Teraz odtwarzane: <strong>' + item.dataset.title + '</strong>';
      });
    });
    // pauza slidera/filmu nie jest potrzebna, ale zatrzymujemy film po opuszczeniu strony
    document.addEventListener('visibilitychange', () => { if (document.hidden) mainVideo.pause(); });
  }

  // ── LIGHTBOX GALERII ───────────────────────────────────────
  const lightbox  = document.getElementById('lightbox');
  const lbImg     = document.getElementById('lightboxImg');
  const lbCaption = document.getElementById('lightboxCaption');
  const allGalleryItems = Array.from(document.querySelectorAll('.gallery-item'));

  if (lightbox && lbImg && allGalleryItems.length) {
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-label', 'Powiększone zdjęcie');

    let lbList = [];
    let lbIndex = 0;
    const visibleItems = () => allGalleryItems.filter(i => i.style.display !== 'none');
    const showItem = item => {
      lbImg.src = item.dataset.src || item.querySelector('img').src;
      lbImg.alt = item.dataset.caption || item.querySelector('img').alt || '';
      lbCaption.textContent = item.dataset.caption || '';
    };
    const openLightbox = item => {
      lbList = visibleItems();
      lbIndex = Math.max(0, lbList.indexOf(item));
      showItem(lbList[lbIndex]);
      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden';
      document.getElementById('lightboxClose')?.focus();
    };
    const closeLightbox = () => {
      lightbox.classList.remove('active');
      document.body.style.overflow = '';
      lbImg.src = '';
    };
    const lbNavigate = dir => {
      if (!lbList.length) return;
      lbIndex = (lbIndex + dir + lbList.length) % lbList.length;
      lbImg.style.opacity = '0';
      setTimeout(() => { showItem(lbList[lbIndex]); lbImg.style.opacity = '1'; }, 180);
    };

    allGalleryItems.forEach(item => {
      item.setAttribute('tabindex', '0');
      item.setAttribute('role', 'button');
      item.addEventListener('click', () => openLightbox(item));
      item.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(item); }
      });
    });
    document.getElementById('lightboxClose')?.addEventListener('click', closeLightbox);
    document.getElementById('lightboxBackdrop')?.addEventListener('click', closeLightbox);
    document.getElementById('lightboxPrev')?.addEventListener('click', () => lbNavigate(-1));
    document.getElementById('lightboxNext')?.addEventListener('click', () => lbNavigate(1));
    document.addEventListener('keydown', e => {
      if (!lightbox.classList.contains('active')) return;
      if (e.key === 'Escape')     closeLightbox();
      if (e.key === 'ArrowLeft')  lbNavigate(-1);
      if (e.key === 'ArrowRight') lbNavigate(1);
    });
  }

  // ── FILTR GALERII (galeria.html) ───────────────────────────
  const galleryChips = document.querySelectorAll('.gallery-filters .filter-chip');
  galleryChips.forEach(chip => {
    chip.addEventListener('click', () => {
      galleryChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const filter = chip.dataset.filter;
      document.querySelectorAll('#galleryGrid .gallery-item').forEach(item => {
        item.style.display = (filter === 'all' || item.dataset.filter === filter) ? '' : 'none';
      });
    });
  });

  // ── FORMULARZ KONTAKTOWY ───────────────────────────────────
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    const success = document.getElementById('formSuccess');
    const successText = success ? success.textContent : '';
    contactForm.addEventListener('submit', async e => {
      e.preventDefault();
      let valid = true;
      contactForm.querySelectorAll('[data-required], #phone').forEach(field => {
        const group = field.closest('.form-group');
        const val = field.type === 'checkbox' ? (field.checked ? 'ok' : '') : field.value.trim();
        let ok = field.hasAttribute('data-required') ? val.length > 0 : true;
        if (ok && val && field.type === 'email') ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
        if (ok && val && field.type === 'tel')   ok = /^[\d\s+\-()]{7,}$/.test(val);
        group.classList.toggle('error', !ok);
        if (!ok) valid = false;
      });
      if (!valid) return;

      const submitBtn = contactForm.querySelector('button[type="submit"]');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Wysyłanie...'; }
      const result = await sendFormData(contactForm);
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Wyślij wiadomość'; }

      if (success) {
        success.textContent = result.ok
          ? successText
          : '⚠ Nie udało się wysłać wiadomości. Zadzwoń do nas lub napisz na biuro@auradomu.pl.';
        success.style.display = 'block';
        setTimeout(() => { success.style.display = 'none'; }, 6000);
      }
      if (result.ok) {
        contactForm.reset();
        contactForm.querySelectorAll('.form-group').forEach(g => g.classList.remove('error'));
      }
    });
    contactForm.querySelectorAll('input, textarea, select').forEach(el => {
      el.addEventListener('input',  () => el.closest('.form-group')?.classList.remove('error'));
      el.addEventListener('change', () => el.closest('.form-group')?.classList.remove('error'));
    });
  }

  // ── FILTRY OFERT (oferty.html) ─────────────────────────────
  const filterChips = document.querySelectorAll('.filters-bar .filter-chip');
  const offerCards  = document.querySelectorAll('.listing-card[data-type]');
  if (filterChips.length && offerCards.length) {
    const params = new URLSearchParams(window.location.search);
    const chipTypes = Array.from(filterChips).map(c => c.dataset.filter);
    const urlType = params.get('type');
    const state = {
      type:  chipTypes.includes(urlType) ? urlType : 'all',
      q:     (params.get('q') || '').trim(),
      price: parseInt(params.get('price'), 10) || 0,
      rooms: parseInt(params.get('rooms'), 10) || 0
    };
    const info = document.getElementById('resultsInfo');
    const noResults = document.getElementById('noResults');

    function applyOfferFilters() {
      let shown = 0;
      offerCards.forEach(card => {
        let ok = state.type === 'all' || card.dataset.type.split(' ').includes(state.type);
        if (ok && state.q) {
          const hay = normalizeText(
            card.querySelector('.card-location')?.textContent + ' ' + card.querySelector('.card-title')?.textContent
          );
          ok = hay.includes(normalizeText(state.q));
        }
        // limit ceny dotyczy ofert sprzedaży (oferty wynajmu mają cenę miesięczną)
        if (ok && state.price && card.dataset.price) ok = +card.dataset.price <= state.price;
        if (ok && state.rooms) ok = +card.dataset.rooms >= state.rooms;
        card.style.display = ok ? '' : 'none';
        if (ok) shown++;
      });
      if (noResults) noResults.hidden = shown !== 0;
      if (info) {
        const parts = [];
        if (state.q)     parts.push(`lokalizacja: „${state.q}”`);
        if (state.price) parts.push(`cena do ${formatPLN(state.price)}`);
        if (state.rooms) parts.push(`min. ${state.rooms} pokoi`);
        info.innerHTML = parts.length
          ? `Znaleziono ofert: <strong>${shown}</strong> (${parts.join(', ')}). <a href="oferty.html">Wyczyść filtry</a>`
          : '';
      }
    }

    filterChips.forEach(c => c.classList.toggle('active', c.dataset.filter === state.type));
    filterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        filterChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        state.type = chip.dataset.filter;
        applyOfferFilters();
      });
    });
    applyOfferFilters();
  }

  // ── AKTYWNY LINK W MENU ────────────────────────────────────
  const pageAlias = { 'szczegoly.html': 'oferty.html' };
  let currentPage = window.location.pathname.split('/').pop() || 'index.html';
  currentPage = pageAlias[currentPage] || currentPage;
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = (link.getAttribute('href') || '').split('?')[0];
    link.classList.toggle('active', href === currentPage);
  });

  // ── STRONA SZCZEGÓŁÓW OFERT (szczegoly.html) ───────────────
  if (document.getElementById('emptyState')) initDetailsPage();
});

// ── SZCZEGÓŁY: przełączanie paneli ofert ─────────────────────
// Wywoływane też z atrybutów onclick w szczegoly.html
function showPanel(n, opts) {
  const panel = document.getElementById('panel' + n);
  if (!panel) return false;                       // nieistniejące id – nic nie zmieniamy
  const scroll = !(opts && opts.scroll === false);

  document.getElementById('emptyState').style.display = 'none';
  document.querySelectorAll('.prop-panel').forEach(p => {
    p.style.display = 'none';
    p.classList.remove('visible');
  });
  panel.style.display = 'block';
  panel.offsetHeight; // reflow dla animacji
  panel.classList.add('visible');

  if (scroll) {
    if (window.innerWidth <= 900) {
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      const area = document.querySelector('.detail-area');
      if (area) area.scrollTop = 0;
      const layout = document.querySelector('.szczegoly-layout');
      if (layout) window.scrollTo({ top: layout.offsetTop - 80, behavior: 'smooth' });
    }
  }

  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  const navItem = document.querySelector('.nav-item[data-target="' + n + '"]');
  if (navItem) {
    navItem.classList.add('active');
    if (scroll) navItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  const title = panel.querySelector('.prop-title');
  if (title) document.title = title.textContent.trim() + ' – Aura Domu';
  history.replaceState(null, '', '#oferta-' + n);
  return true;
}

function initDetailsPage() {
  // miniatury zdjęć w każdym panelu
  document.querySelectorAll('.prop-thumbs').forEach(thumbRow => {
    const mainImg = document.getElementById('mainImg' + thumbRow.dataset.panel);
    if (!mainImg) return;
    thumbRow.querySelectorAll('img').forEach(thumb => {
      thumb.addEventListener('click', () => {
        mainImg.style.opacity = '0';
        setTimeout(() => {
          mainImg.src = thumb.dataset.full || thumb.src;
          mainImg.style.opacity = '1';
        }, 200);
        thumbRow.querySelectorAll('img').forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
      });
    });
  });

  // automatyczne otwarcie oferty z ?id=3 lub #oferta-3 (bez przewijania strony)
  const params = new URLSearchParams(window.location.search);
  const fromHash = (window.location.hash.match(/oferta-(\d+)/) || [])[1];
  const id = parseInt(params.get('id') || fromHash, 10);
  if (!(id && showPanel(id, { scroll: false }))) showPanel(1, { scroll: false });

  // formularze „Zapytaj o ofertę”
  document.querySelectorAll('.inquiry-submit').forEach(btn => {
    btn.addEventListener('click', async () => {
      const card    = btn.closest('.sidebar-card');
      const name    = card.querySelector('.inquiry-name');
      const email   = card.querySelector('.inquiry-email');
      const phone   = card.querySelector('.inquiry-phone');
      const msg     = card.querySelector('.inquiry-msg');
      const success = card.querySelector('.inquiry-success');
      const successText = success ? success.textContent : '';

      let valid = true;
      [name, email, msg].forEach(field => {
        const bad = !field.value.trim();
        field.style.borderColor = bad ? '#c0392b' : '';
        if (bad) valid = false;
      });
      if (email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
        email.style.borderColor = '#c0392b';
        valid = false;
      }
      if (!valid) return;

      btn.disabled = true;
      btn.style.opacity = '0.6';

      const panelTitle = btn.closest('.prop-panel')?.querySelector('.prop-title')?.textContent.trim() || document.title;
      const fd = new FormData();
      fd.append('imie', name.value);
      fd.append('email', email.value);
      fd.append('telefon', phone ? phone.value : '');
      fd.append('wiadomosc', msg.value);
      fd.append('oferta', panelTitle);
      const result = await sendFormFields(fd);

      if (success) {
        success.textContent = result.ok
          ? successText
          : '⚠ Nie udało się wysłać zapytania. Zadzwoń do nas lub napisz na biuro@auradomu.pl.';
        success.style.display = 'block';
      }
      if (result.ok) [name, email, phone, msg].forEach(f => { if (f) f.value = ''; });

      setTimeout(() => {
        btn.disabled = false;
        btn.style.opacity = '';
        if (success) success.style.display = 'none';
      }, 5000);
    });
  });
}
