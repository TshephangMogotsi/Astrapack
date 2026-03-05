'use strict';

/* ── PURCHASE MODAL ─────────────────────────────────────────── */
(function () {

  var selectedUtility = null;

  // Demo meter database
  var METERS = {
    '888000111222': { name: 'JOHN DOE',          meter: '888000111222' },
    '26550127620':  { name: 'BABOLOKI MOGOTSI',  meter: '26550127620'  }
  };
  var INVALID_METERS = ['1234567890'];

  // SVG icon strings reused when restoring button labels after async ops
  var SVG_VERIFY = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px"><path d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
  var SVG_PAY    = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>';

  // Modal accessibility state
  var lastFocused = null;
  var removeTrap  = null;

  // Focus trap: keep Tab key cycling within containerEl
  function focusTrap(containerEl) {
    var SEL = 'button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';
    function handler(e) {
      if (e.key !== 'Tab') return;
      var nodes = Array.prototype.slice.call(containerEl.querySelectorAll(SEL));
      nodes = nodes.filter(function (n) { return n.offsetParent !== null; });
      if (!nodes.length) { e.preventDefault(); return; }
      var first = nodes[0], last = nodes[nodes.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
      }
    }
    containerEl.addEventListener('keydown', handler);
    return function () { containerEl.removeEventListener('keydown', handler); };
  }

  // Element refs
  var overlay    = document.getElementById('overlay');
  var ovBg       = document.getElementById('ovBg');
  var modalTtl   = document.getElementById('modalTtl');
  var mStep1     = document.getElementById('mStep1');
  var mStep2     = document.getElementById('mStep2');
  var mStep3     = document.getElementById('mStep3');
  var mSuccess   = document.getElementById('mSuccess');
  var modalClose = document.getElementById('modalClose');
  var step2Close = document.getElementById('step2Close');
  var step2Back  = document.getElementById('step2Back');
  var step3Close = document.getElementById('step3Close');
  var step3Back  = document.getElementById('step3Back');
  var doneBtn    = document.getElementById('doneBtn');
  var rForm      = document.getElementById('rForm');
  var amtForm    = document.getElementById('amtForm');
  var payForm    = document.getElementById('payForm');
  var verifyBtn  = document.getElementById('verifyBtn');
  var payBtn     = document.getElementById('payBtn');
  var meterErr   = document.getElementById('meterErr');
  var custName   = document.getElementById('custName');
  var custMeter  = document.getElementById('custMeter');
  var custUtil   = document.getElementById('custUtil');
  var payDesc    = document.getElementById('payDesc');
  var payAmt     = document.getElementById('payAmt');
  var successMsg = document.getElementById('successMsg');

  // Nav dropdown
  var navBtn   = document.getElementById('navBtn');
  var navMenu  = document.getElementById('navMenu');
  var navChev  = document.getElementById('navChev');
  var navElec  = document.getElementById('navElec');
  var navWater = document.getElementById('navWater');

  // ── Helpers ──────────────────────────────────────────────────
  function showOnly(el) {
    [mStep1, mStep2, mStep3, mSuccess].forEach(function (s) {
      s.style.display = 'none';
    });
    el.style.display = 'block';
  }

  function fieldError(id) {
    var el = document.getElementById(id);
    el.style.borderColor = '#e84040';
    el.style.boxShadow   = '0 0 0 3px rgba(232,64,64,0.12)';
    setTimeout(function () {
      el.style.borderColor = '';
      el.style.boxShadow   = '';
    }, 1800);
  }

  // ── Dropdown logic ────────────────────────────────────────────
  function openDrop(menu, chev) {
    menu.classList.add('open');
    chev.style.transform = 'rotate(180deg)';
  }

  function closeAllDrops() {
    if (navMenu) navMenu.classList.remove('open');
    if (navChev) navChev.style.transform = 'rotate(0deg)';
  }

  if (navBtn) {
    navBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var isOpen = navMenu.classList.contains('open');
      closeAllDrops();
      if (!isOpen) openDrop(navMenu, navChev);
    });
  }

  document.addEventListener('click', closeAllDrops);

  if (navElec)  navElec.addEventListener('click',  function () { closeAllDrops(); openModal('electricity'); });
  if (navWater) navWater.addEventListener('click', function () { closeAllDrops(); openModal('water'); });

  // ── Modal open / close ────────────────────────────────────────
  function openModal(type) {
    lastFocused = document.activeElement;
    selectedUtility = type;
    modalTtl.textContent = type === 'electricity' ? 'Buy Prepaid Electricity' : 'Buy Prepaid Water';
    showOnly(mStep1);
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    if (removeTrap) removeTrap();
    removeTrap = focusTrap(document.querySelector('.modal'));
    setTimeout(function () {
      var f = document.getElementById('meterNum');
      if (f) f.focus();
    }, 350);
  }

  function closeModal() {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    if (removeTrap) { removeTrap(); removeTrap = null; }
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    setTimeout(function () {
      rForm.reset();
      amtForm.reset();
      payForm.reset();
      meterErr.style.display = 'none';
      document.getElementById('meterNum').style.borderColor = '';
      document.getElementById('meterNum').style.boxShadow   = '';
      var ct = document.getElementById('cardType');
      if (ct) ct.textContent = '';
      document.querySelectorAll('.qst').forEach(function (b) { b.classList.remove('sel'); });
      showOnly(mStep1);
      selectedUtility = null;
    }, 320);
  }

  ovBg.addEventListener('click', closeModal);
  modalClose.addEventListener('click', closeModal);
  step2Close.addEventListener('click', closeModal);
  step3Close.addEventListener('click', closeModal);
  doneBtn.addEventListener('click', closeModal);
  step2Back.addEventListener('click', function () { showOnly(mStep1); });
  step3Back.addEventListener('click', function () { showOnly(mStep2); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });

  // ── Step 1: Verify meter ──────────────────────────────────────
  rForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var m  = document.getElementById('meterNum').value.trim();
    var c  = document.getElementById('cellNum').value.trim();
    var em = document.getElementById('emailAddr').value.trim();
    var err = false;

    meterErr.style.display = 'none';
    document.getElementById('meterNum').style.borderColor = '';
    document.getElementById('meterNum').style.boxShadow   = '';

    if (!m) {
      fieldError('meterNum');
      err = true;
    } else if (INVALID_METERS.indexOf(m) !== -1) {
      document.getElementById('meterNum').style.borderColor = '#e84040';
      document.getElementById('meterNum').style.boxShadow   = '0 0 0 3px rgba(232,64,64,0.12)';
      meterErr.style.display = 'flex';
      err = true;
    }
    if (!c)  { fieldError('cellNum');   err = true; }
    if (!em) { fieldError('emailAddr'); err = true; }
    if (err) return;

    verifyBtn.textContent = 'Verifying…';
    verifyBtn.disabled = true;

    setTimeout(function () {
      verifyBtn.disabled = false;
      verifyBtn.innerHTML = SVG_VERIFY + ' Verify';

      var record      = METERS[m];
      var displayName = record ? record.name : 'UNKNOWN ACCOUNT';
      var utilLabel   = selectedUtility === 'electricity' ? 'Electricity' : 'Water';

      custName.textContent  = displayName;
      custMeter.textContent = m;
      custUtil.textContent  = utilLabel + ' (Prepaid)';
      showOnly(mStep2);
    }, 1000);
  });

  // ── Quick amount buttons ──────────────────────────────────────
  document.querySelectorAll('.qst').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.qst').forEach(function (b) { b.classList.remove('sel'); });
      btn.classList.add('sel');
      document.getElementById('amtVal').value = btn.getAttribute('data-val');
    });
  });

  // ── Step 2: Proceed to payment ────────────────────────────────
  amtForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var a = parseInt(document.getElementById('amtVal').value, 10);
    if (!a || a < 20) { fieldError('amtVal'); return; }

    var m         = document.getElementById('meterNum').value.trim();
    var utilLabel = selectedUtility === 'electricity' ? '⚡ Electricity' : '💧 Water';
    payDesc.textContent = utilLabel + ' · Meter ' + m;
    payAmt.textContent  = 'P' + a;
    showOnly(mStep3);
  });

  // ── Card number formatting ─────────────────────────────────────
  document.getElementById('cardNum').addEventListener('input', function () {
    var v  = this.value.replace(/\D/g, '').substring(0, 16);
    this.value = v.replace(/(.{4})/g, '$1 ').trim();
    var ct = document.getElementById('cardType');
    if      (/^4/.test(v))        ct.textContent = 'VISA';
    else if (/^5[1-5]/.test(v))   ct.textContent = 'MC';
    else                           ct.textContent = '';
  });

  document.getElementById('cardExp').addEventListener('input', function () {
    var v = this.value.replace(/\D/g, '').substring(0, 4);
    if (v.length >= 2) v = v.substring(0, 2) + ' / ' + v.substring(2);
    this.value = v;
  });

  // ── Step 3: Pay ───────────────────────────────────────────────
  payForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = document.getElementById('cardName').value.trim();
    var num  = document.getElementById('cardNum').value.replace(/\s/g, '');
    var exp  = document.getElementById('cardExp').value.trim();
    var cvv  = document.getElementById('cardCvv').value.trim();
    var err  = false;

    if (!name)           { fieldError('cardName'); err = true; }
    if (num.length < 15) { fieldError('cardNum');  err = true; }
    if (!exp)            { fieldError('cardExp');  err = true; }
    if (!cvv)            { fieldError('cardCvv');  err = true; }
    if (err) return;

    payBtn.textContent = 'Processing payment…';
    payBtn.disabled = true;

    setTimeout(function () {
      payBtn.disabled = false;
      payBtn.innerHTML = SVG_PAY + ' Pay Now';
      var label = selectedUtility === 'electricity' ? 'electricity' : 'water';
      successMsg.textContent =
        'Payment successful! Your ' + label +
        ' token is being generated and will arrive on your phone and email within 30 seconds.';
      showOnly(mSuccess);
      mSuccess.style.display = 'block';
    }, 1400);
  });

}());


/* ── CAROUSEL ────────────────────────────────────────────────── */
(function () {
  var track  = document.getElementById('carouselTrack');
  var dots   = document.querySelectorAll('.cdot');
  var slides = document.querySelectorAll('.carousel-slide');
  var prev   = document.getElementById('cPrev');
  var next   = document.getElementById('cNext');
  var total  = slides.length;
  var cur    = 0;
  var timer;

  function goTo(idx) {
    cur = (idx + total) % total;
    track.style.transition = 'transform .55s cubic-bezier(.4,0,.2,1)';
    track.style.transform  = 'translateX(-' + (cur * 100) + '%)';
    dots.forEach(function (d, i) { d.classList.toggle('active', i === cur); });
  }

  function startAuto() {
    clearInterval(timer);
    timer = setInterval(function () { goTo(cur + 1); }, 5500);
  }

  prev.addEventListener('click', function () { goTo(cur - 1); startAuto(); });
  next.addEventListener('click', function () { goTo(cur + 1); startAuto(); });

  dots.forEach(function (d) {
    d.addEventListener('click', function () {
      goTo(parseInt(d.getAttribute('data-idx'), 10));
      startAuto();
    });
  });

  // Touch / swipe support
  var tsx = 0;
  track.addEventListener('touchstart', function (e) { tsx = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend',   function (e) {
    var dx = e.changedTouches[0].clientX - tsx;
    if (Math.abs(dx) > 50) { goTo(cur + (dx < 0 ? 1 : -1)); startAuto(); }
  }, { passive: true });

  startAuto();
}());


/* ── MOBILE NAVIGATION ────────────────────────────────────────────── */
(function () {
  var hamburger = document.getElementById('navHamburger');
  var navLinks  = document.getElementById('navLinks');
  if (!hamburger || !navLinks) return;

  function openNav() {
    navLinks.classList.add('open');
    hamburger.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
    hamburger.setAttribute('aria-label', 'Close navigation menu');
  }

  function closeNav() {
    navLinks.classList.remove('open');
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.setAttribute('aria-label', 'Open navigation menu');
  }

  hamburger.addEventListener('click', function (e) {
    e.stopPropagation();
    navLinks.classList.contains('open') ? closeNav() : openNav();
  });

  // Close when a nav link is clicked
  navLinks.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', closeNav);
  });

  // Close on outside click
  document.addEventListener('click', function (e) {
    if (!navLinks.contains(e.target) && e.target !== hamburger) closeNav();
  });
}());


/* ── SCROLL REVEAL & PAGE INTERACTIONS ───────────────────────────────── */
(function () {
  // Intersection observer — guard for older WebViews (Android 4.x etc.)
  if ('IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('vis'); obs.unobserve(e.target); }
      });
    }, { threshold: 0.08 });

    document.querySelectorAll('.fu, .fu-up, .fu-left, .fu-right, .fu-scale')
      .forEach(function (el) { obs.observe(el); });
  } else {
    // Fallback: reveal all animated elements immediately
    document.querySelectorAll('.fu, .fu-up, .fu-left, .fu-right, .fu-scale')
      .forEach(function (el) { el.classList.add('vis'); });
  }

  // Nav shrink + scroll progress bar
  var nav = document.querySelector('nav');
  var bar = document.getElementById('scrollBar');

  window.addEventListener('scroll', function () {
    var scrolled = window.scrollY;
    var total    = document.body.scrollHeight - window.innerHeight;
    if (bar) bar.style.width = (scrolled / total * 100) + '%';
    if (nav) nav.classList.toggle('scrolled', scrolled > 60);
  }, { passive: true });
}());


/* ── CONTACT FORM ──────────────────────────────────────────────────── */
(function () {
  var form     = document.getElementById('contactForm');
  var success  = document.getElementById('contactSuccess');
  var againBtn = document.getElementById('contactAgainBtn');
  if (!form || !success) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    form.style.display = 'none';
    success.classList.add('show');
    var h = success.querySelector('h3');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus(); }
  });

  if (againBtn) {
    againBtn.addEventListener('click', function () {
      form.reset();
      form.style.display = '';
      success.classList.remove('show');
      var first = form.querySelector('input');
      if (first) first.focus();
    });
  }
}());
