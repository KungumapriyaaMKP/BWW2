/**
 * Royal Wedding Invitation | Sivani & Abhishek
 * Cinematic Temple Gopuram Video Frame Scrub Engine & Interactive Wedding Portal
 * Strict Rule: Strictly NO em dashes and NO emojis
 */

(() => {
  'use strict';

  /* =========================================================
     1. CONFIGURATION & STATE
     ========================================================= */
  let FRAME_COUNT = 188;
  const isMobile = Math.min(window.innerWidth, window.innerHeight) < 768;
  const FRAME_DIR = isMobile ? 'frames/mobile' : 'frames/desktop';
  const frameUrl = (i) => `${FRAME_DIR}/frame_${String(i + 1).padStart(4, '0')}.webp`;

  // DOM elements
  const canvas = document.getElementById('canvas-scrubber');
  const ctx = canvas ? canvas.getContext('2d', { alpha: false, desynchronized: true }) : null;
  const scrubSection = document.getElementById('video-scrub-section');
  const scrubProgress = document.getElementById('video-load-progress');
  const captions = document.querySelectorAll('.video-caption');
  const scrollIndicator = document.getElementById('scroll-indicator');
  
  const musicToggle = document.getElementById('music-toggle-btn');
  const bgMusic = document.getElementById('bg-music');
  const toast = document.getElementById('royal-toast');

  let frames = [];
  let isFramesReady = false;
  let targetProgress = 0;
  let currentProgress = 0;
  let lastDrawnPos = -1;
  let isPlayingMusic = false;

  /* =========================================================
     2. MANIFEST & PARALLEL FRAME PRELOADER (ZERO LATENCY ENGINE)
     ========================================================= */
  function initManifestAndFrames() {
    frames = new Array(FRAME_COUNT);

    // 1. Kick off parallel frame preloading instantly without waiting for manifest network roundtrip
    preloadFrames();

    // 2. Fetch manifest asynchronously in background for dynamic verification without blocking
    fetch('frames/manifest.json')
      .then((res) => (res.ok ? res.json() : null))
      .then((meta) => {
        if (meta && meta.frameCount && meta.frameCount !== FRAME_COUNT) {
          FRAME_COUNT = meta.frameCount;
        }
      })
      .catch(() => {});
  }

  async function loadSingleFrame(index) {
    if (frames[index]) return frames[index];
    const img = new Image();
    img.decoding = 'async';
    img.src = frameUrl(index);
    try {
      await img.decode();
      if ('createImageBitmap' in window) {
        try {
          const bmp = await createImageBitmap(img);
          frames[index] = bmp;
          return bmp;
        } catch (_) {}
      }
      frames[index] = img;
      return img;
    } catch (err) {
      return null;
    }
  }

  function preloadFrames() {
    // 1. Load initial frame 0 immediately and render canvas instantly
    loadSingleFrame(0).then(() => {
      resizeCanvas();
      draw(0);
    });

    // 2. High-Priority Immediate Phase: Load frames 1 through 24 first so initial scroll is 100% in memory
    const highPriority = [];
    for (let i = 1; i <= Math.min(24, FRAME_COUNT - 1); i++) {
      highPriority.push(i);
    }

    // 3. Staggered Stream Phase: Rapidly stream the remaining frames
    const remaining = [];
    const seen = new Set(highPriority);
    seen.add(0);

    const steps = [8, 4, 2, 1];
    for (const step of steps) {
      for (let i = 25; i < FRAME_COUNT; i += step) {
        if (!seen.has(i)) {
          seen.add(i);
          remaining.push(i);
        }
      }
    }

    const loadQueue = [...highPriority, ...remaining];
    let loadedCount = 0;
    const concurrency = 16;
    let cursor = 0;

    async function worker() {
      while (cursor < loadQueue.length) {
        const idx = loadQueue[cursor++];
        await loadSingleFrame(idx);
        loadedCount++;
        const pct = Math.round((loadedCount / FRAME_COUNT) * 100);
        if (scrubProgress) {
          scrubProgress.style.width = pct + '%';
          if (pct >= 100) {
            scrubProgress.style.opacity = '0';
          }
        }
      }
      isFramesReady = true;
    }

    for (let c = 0; c < concurrency; c++) {
      worker();
    }
  }

  /* =========================================================
     3. HIGH-PERFORMANCE CANVAS RENDERING & SUB-FRAME BLENDING
     ========================================================= */
  function resizeCanvas() {
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;

    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      lastDrawnPos = -1;
      draw(currentProgress);
    }
  }

  function cover(img, alpha) {
    const iw = img.width || 1920;
    const ih = img.height || 1080;
    const cw = canvas.width;
    const ch = canvas.height;

    const scale = Math.max(cw / iw, ch / ih);
    const w = iw * scale;
    const h = ih * scale;
    const x = (cw - w) / 2;
    const y = (ch - h) / 2;

    ctx.globalAlpha = alpha;
    ctx.drawImage(img, x, y, w, h);
  }

  function nearestLoaded(index) {
    if (frames[index]) return frames[index];
    for (let offset = 1; offset < FRAME_COUNT; offset++) {
      const prev = index - offset;
      if (prev >= 0 && frames[prev]) return frames[prev];
      const next = index + offset;
      if (next < FRAME_COUNT && frames[next]) return frames[next];
    }
    return frames[0] || null;
  }

  function draw(progress) {
    if (!ctx || !canvas) return;

    const pos = progress * (FRAME_COUNT - 1);
    const a = Math.floor(pos);
    const b = Math.min(FRAME_COUNT - 1, a + 1);
    const t = pos - a;

    const imgA = nearestLoaded(a);
    if (!imgA) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Base frame
    cover(imgA, 1.0);

    // Sub-frame cross-blend using smoothstep
    if (b !== a && frames[b]) {
      const blend = t * t * (3 - 2 * t);
      cover(frames[b], blend);
    }

    lastDrawnPos = pos;
  }

  /* =========================================================
     4. SMOOTH SCROLL SCRUBBING & CHOREOGRAPHED CAPTIONS
     ========================================================= */
  function onScroll() {
    if (!scrubSection) return;

    // Scrub progression
    const rect = scrubSection.getBoundingClientRect();
    const totalDist = scrubSection.offsetHeight - window.innerHeight;
    const scrolled = -rect.top;

    if (totalDist > 0) {
      const p = Math.max(0, Math.min(1, scrolled / totalDist));
      targetProgress = p;
    }

    // Activate persistent luxury lotus side borders ONLY after video section is completely scrolled past
    if (rect.bottom <= 0) {
      document.body.classList.add('borders-active');
    } else {
      document.body.classList.remove('borders-active');
    }
  }

  function updateCaptions(p) {
    captions.forEach((cap) => {
      const range = cap.dataset.range.split('-').map(Number);
      if (p >= range[0] && p <= range[1]) {
        cap.classList.add('active');
      } else {
        cap.classList.remove('active');
      }
    });

    if (scrollIndicator) {
      if (p > 0.04) {
        scrollIndicator.style.opacity = '0';
        scrollIndicator.style.pointerEvents = 'none';
      } else {
        scrollIndicator.style.opacity = '0.95';
        scrollIndicator.style.pointerEvents = 'auto';
      }
    }
  }

  function animationLoop() {
    const diff = targetProgress - currentProgress;
    const absDiff = Math.abs(diff);

    if (absDiff > 0.00005) {
      // Snappy, instant tracking with zero perceived latency
      const lerpFactor = absDiff > 0.03 ? 0.38 : 0.25;
      currentProgress += diff * lerpFactor;

      if (absDiff < 0.0005) {
        currentProgress = targetProgress;
      }

      draw(currentProgress);
      updateCaptions(currentProgress);
    }

    requestAnimationFrame(animationLoop);
  }

  /* =========================================================
     4.5 CINEMATIC TEMPLE GATE OPENING CONTROLLER
     ========================================================= */
  function setupTempleGate() {
    const gateOverlay = document.getElementById('temple-gate-overlay');
    const gateVideo = document.getElementById('gate-video');
    const skipBtn = document.getElementById('gate-skip-btn');
    const bloom = document.getElementById('gate-light-bloom');

    if (!gateOverlay || !gateVideo) return;

    let isGateOpening = false;
    let isGateComplete = false;

    // Pre-buffer gate video and wedding audio for zero latency playback
    try {
      gateVideo.load();
      if (bgMusic) bgMusic.load();
    } catch (_) {}

    // Lock background scroll while gate is closed
    document.body.classList.add('gate-active');

    function openGate() {
      if (isGateOpening || isGateComplete) return;
      isGateOpening = true;
      gateOverlay.classList.add('is-playing');

      // Play gate video with audio immediately on direct user click
      gateVideo.muted = false;
      const playPromise = gateVideo.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Fallback to muted playback if browser restricts audio
          gateVideo.muted = true;
          gateVideo.play().catch(() => {
            completeGate();
          });
        });
      }
    }

    function completeGate() {
      if (isGateComplete) return;
      isGateComplete = true;

      // Unlock scrolling and start transition immediately with zero delay
      document.body.classList.remove('gate-active');
      gateOverlay.classList.add('gate-opened');

      if (bloom) {
        bloom.classList.add('bloom-active');
      }

      // Start background wedding music immediately
      if (bgMusic && !isPlayingMusic) {
        bgMusic.play().then(() => {
          isPlayingMusic = true;
          if (musicToggle) {
            musicToggle.classList.add('music-playing');
            musicToggle.classList.remove('music-paused');
          }
        }).catch(() => {});
      }

      setTimeout(() => {
        gateOverlay.style.display = 'none';
        try {
          gateVideo.pause();
        } catch (_) {}
      }, 400);
    }

    // Trigger transition as soon as doors are opened (~5.2s of 5.95s)
    gateVideo.addEventListener('timeupdate', () => {
      if (!isGateComplete && gateVideo.currentTime >= 5.2) {
        completeGate();
      }
    });

    gateVideo.addEventListener('ended', completeGate);

    // Tap or click on gate overlay starts the video
    gateOverlay.addEventListener('click', (e) => {
      if (e.target.closest('#gate-skip-btn')) return;
      openGate();
    });

    // Touch support for phones and tablets
    gateOverlay.addEventListener('touchend', (e) => {
      if (e.target.closest('#gate-skip-btn')) return;
      openGate();
    }, { passive: true });

    // Skip directly into invitation with zero latency
    if (skipBtn) {
      skipBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        completeGate();
      });
    }
  }

  /* =========================================================
     5. AMBIENT AUDIO MUSIC ENGINE
     ========================================================= */
  function setupAudio() {
    function toggleAudio() {
      if (!bgMusic) return;
      if (isPlayingMusic) {
        bgMusic.pause();
        isPlayingMusic = false;
        musicToggle.classList.remove('music-playing');
        musicToggle.classList.add('music-paused');
      } else {
        bgMusic.play().then(() => {
          isPlayingMusic = true;
          musicToggle.classList.add('music-playing');
          musicToggle.classList.remove('music-paused');
        }).catch(() => {
          // Handled if browser restricts autoplay
        });
      }
    }

    if (musicToggle) {
      musicToggle.addEventListener('click', toggleAudio);
    }

    // Gentle listener to start music on user gesture once gate has opened
    function attemptAutoStart() {
      if (document.body.classList.contains('gate-active')) return;
      if (bgMusic && !isPlayingMusic) {
        bgMusic.play().then(() => {
          isPlayingMusic = true;
          if (musicToggle) {
            musicToggle.classList.add('music-playing');
            musicToggle.classList.remove('music-paused');
          }
          cleanupGestureListeners();
        }).catch(() => {});
      }
    }

    function cleanupGestureListeners() {
      window.removeEventListener('click', attemptAutoStart);
      window.removeEventListener('touchstart', attemptAutoStart);
    }

    window.addEventListener('click', attemptAutoStart);
    window.addEventListener('touchstart', attemptAutoStart, { passive: true });
  }

  /* =========================================================
     6. LIVE MUHURTHAM COUNTDOWN TIMER
     ========================================================= */
  function setupCountdown() {
    // Target Muhurtham: December 14, 2026, 09:15:00 IST
    const targetDate = new Date('2026-12-14T09:15:00+05:30').getTime();

    const dEl = document.getElementById('count-days');
    const hEl = document.getElementById('count-hours');
    const mEl = document.getElementById('count-minutes');
    const sEl = document.getElementById('count-seconds');

    if (!dEl || !hEl || !mEl || !sEl) return;

    function update() {
      const now = Date.now();
      const distance = targetDate - now;

      if (distance < 0) {
        dEl.textContent = '00';
        hEl.textContent = '00';
        mEl.textContent = '00';
        sEl.textContent = '00';
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      dEl.textContent = String(days).padStart(2, '0');
      hEl.textContent = String(hours).padStart(2, '0');
      mEl.textContent = String(minutes).padStart(2, '0');
      sEl.textContent = String(seconds).padStart(2, '0');
    }

    update();
    setInterval(update, 1000);
  }

  /* =========================================================
     6.5 CELEBRATION POPPER & CONFETTI ENGINE
     ========================================================= */
  function setupCountdownPopper() {
    const pCanvas = document.getElementById('popper-canvas');
    const countdownSec = document.getElementById('countdown-section');
    const countdownGrid = document.getElementById('countdown-grid');
    const popperBtn = document.getElementById('popper-btn');

    if (!pCanvas || !countdownSec) return;

    const pCtx = pCanvas.getContext('2d');
    let pWidth = 0, pHeight = 0;
    let particles = [];
    let isPopperRunning = false;
    let hasAutoPopped = false;

    function resizePopper() {
      const rect = countdownSec.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      pWidth = rect.width;
      pHeight = rect.height;
      pCanvas.width = Math.round(pWidth * dpr);
      pCanvas.height = Math.round(pHeight * dpr);
      pCanvas.style.width = pWidth + 'px';
      pCanvas.style.height = pHeight + 'px';
      pCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    const goldColors = ['#fff2c6', '#f6e19c', '#e7c76d', '#d4af37', '#be9527', '#ffffff'];
    const rubyColors = ['#800a20', '#a31d24', '#c92a2a', '#e03131'];

    class Particle {
      constructor(originX, originY, angleRad, speed) {
        this.x = originX;
        this.y = originY;
        const v = speed * (0.8 + Math.random() * 0.4);
        this.vx = Math.cos(angleRad) * v;
        this.vy = Math.sin(angleRad) * v;
        this.gravity = 0.28 + Math.random() * 0.12;
        this.drag = 0.982;
        
        const r = Math.random();
        if (r < 0.6) {
          this.shape = 'ribbon';
          this.color = goldColors[Math.floor(Math.random() * goldColors.length)];
          this.w = 6 + Math.random() * 6;
          this.h = 12 + Math.random() * 10;
        } else if (r < 0.85) {
          this.shape = 'petal';
          this.color = rubyColors[Math.floor(Math.random() * rubyColors.length)];
          this.w = 8 + Math.random() * 6;
          this.h = 14 + Math.random() * 8;
        } else {
          this.shape = 'sparkle';
          this.color = '#ffffff';
          this.w = 5 + Math.random() * 4;
          this.h = this.w;
        }

        this.rotation = Math.random() * Math.PI * 2;
        this.vRotation = (Math.random() - 0.5) * 0.2;
        this.wobble = Math.random() * Math.PI * 2;
        this.vWobble = 0.08 + Math.random() * 0.08;
        this.alpha = 1.0;
        this.decay = 0.005 + Math.random() * 0.006;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.vx *= this.drag;
        this.vy *= this.drag;
        this.rotation += this.vRotation;
        this.wobble += this.vWobble;
        this.alpha -= this.decay;
      }

      draw(ctx) {
        if (this.alpha <= 0) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.scale(Math.cos(this.wobble), 1);
        ctx.globalAlpha = Math.max(0, this.alpha);
        ctx.fillStyle = this.color;

        if (this.shape === 'ribbon') {
          ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
        } else if (this.shape === 'petal') {
          ctx.beginPath();
          ctx.ellipse(0, 0, this.w / 2, this.h / 2, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (this.shape === 'sparkle') {
          ctx.beginPath();
          const s = this.w;
          ctx.moveTo(0, -s);
          ctx.quadraticCurveTo(0, 0, s, 0);
          ctx.quadraticCurveTo(0, 0, 0, s);
          ctx.quadraticCurveTo(0, 0, -s, 0);
          ctx.quadraticCurveTo(0, 0, 0, -s);
          ctx.fill();
        }
        ctx.restore();
      }
    }

    function firePopperBurst() {
      resizePopper();

      // Left cannon
      for (let i = 0; i < 48; i++) {
        const angle = -Math.PI * (0.22 + Math.random() * 0.22);
        particles.push(new Particle(pWidth * 0.08, pHeight * 0.95, angle, 16 + Math.random() * 10));
      }
      // Right cannon
      for (let i = 0; i < 48; i++) {
        const angle = -Math.PI * (0.56 + Math.random() * 0.22);
        particles.push(new Particle(pWidth * 0.92, pHeight * 0.95, angle, 16 + Math.random() * 10));
      }
      // Center burst
      for (let i = 0; i < 36; i++) {
        const angle = -Math.PI * (0.35 + Math.random() * 0.30);
        particles.push(new Particle(pWidth * 0.50, pHeight * 0.70, angle, 12 + Math.random() * 10));
      }

      // Cascading pop effect on countdown cards
      document.querySelectorAll('.countdown-item').forEach((item, idx) => {
        setTimeout(() => {
          item.classList.add('pop-active');
          setTimeout(() => item.classList.remove('pop-active'), 800);
        }, idx * 60);
      });

      if (!isPopperRunning) {
        isPopperRunning = true;
        requestAnimationFrame(renderPopperLoop);
      }
    }

    function renderPopperLoop() {
      pCtx.clearRect(0, 0, pWidth, pHeight);

      particles = particles.filter(p => p.alpha > 0 && p.y < pHeight + 30);

      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw(pCtx);
      }

      if (particles.length > 0) {
        requestAnimationFrame(renderPopperLoop);
      } else {
        isPopperRunning = false;
        pCtx.clearRect(0, 0, pWidth, pHeight);
      }
    }

    // Auto fire when user scrolls to countdown section
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !hasAutoPopped) {
            hasAutoPopped = true;
            setTimeout(firePopperBurst, 250);
          } else if (!entry.isIntersecting && entry.boundingClientRect.top > 0) {
            hasAutoPopped = false;
          }
        });
      }, { threshold: 0.35 });

      observer.observe(countdownSec);
    }

    // Interactive taps to celebrate
    if (countdownGrid) {
      countdownGrid.addEventListener('click', firePopperBurst);
    }
    if (popperBtn) {
      popperBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        firePopperBurst();
      });
    }

    window.addEventListener('resize', resizePopper, { passive: true });
    resizePopper();
  }

  /* =========================================================
     7. CALENDAR INVITE GENERATOR (.ICS)
     ========================================================= */
  function setupCalendarButtons() {
    const events = {
      engagement: {
        title: 'Engagement: Sivani & Abhishek',
        description: 'Engagement ceremony of Sivani Ahilan Annalakshmi & Abhishek Krishna SS at The Royal Mahal, Trichy.',
        location: 'The Royal Mahal, Vayalur Murugan Temple Road, Trichy, Tamil Nadu',
        start: '20261213T190000',
        end: '20261213T220000'
      },
      wedding: {
        title: 'Wedding Muhurtham: Sivani & Abhishek',
        description: 'Sacred wedding ceremony of Sivani Ahilan Annalakshmi & Abhishek Krishna SS at The Royal Mahal, Trichy.',
        location: 'The Royal Mahal, Vayalur Murugan Temple Road, Trichy, Tamil Nadu',
        start: '20261214T091500',
        end: '20261214T113000'
      },
      reception: {
        title: 'Grand Reception: Sivani & Abhishek',
        description: 'Wedding reception honoring newlyweds Sivani & Abhishek at Al Saj Gravity, Trivandrum.',
        location: 'Al Saj Gravity, Al Saj Convention Center, Kazhakootam, Trivandrum, Kerala',
        start: '20261217T183000',
        end: '20261217T223000'
      }
    };

    document.querySelectorAll('[data-cal-event]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const eventKey = btn.dataset.calEvent;
        const ev = events[eventKey];
        if (!ev) return;

        const icsContent = [
          'BEGIN:VCALENDAR',
          'VERSION:2.0',
          'PRODID:-//Sivani & Abhishek Wedding//EN',
          'CALSCALE:GREGORIAN',
          'METHOD:PUBLISH',
          'BEGIN:VEVENT',
          `SUMMARY:${ev.title}`,
          `DESCRIPTION:${ev.description}`,
          `LOCATION:${ev.location}`,
          `DTSTART;TZID=Asia/Kolkata:${ev.start}`,
          `DTEND;TZID=Asia/Kolkata:${ev.end}`,
          'STATUS:CONFIRMED',
          'END:VEVENT',
          'END:VCALENDAR'
        ].join('\r\n');

        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${eventKey}_sivani_abhishek.ics`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast('Event added to calendar invite');
      });
    });
  }

  /* =========================================================
     8. RSVP FORM & BLESSINGS STORAGE
     ========================================================= */
  function setupRSVP() {
    const form = document.getElementById('rsvp-form');
    const blessingsList = document.getElementById('blessings-list');
    if (!form && !blessingsList) return;

    const savedBlessings = JSON.parse(localStorage.getItem('wedding_blessings') || '[]');

    function renderBlessingCard(item) {
      if (!blessingsList) return;
      const card = document.createElement('div');
      card.className = 'blessing-card';
      card.innerHTML = `
        <div class="blessing-author">${escapeHTML(item.name)}</div>
        <div class="blessing-text">"${escapeHTML(item.message)}"</div>
      `;
      blessingsList.prepend(card);
    }

    if (savedBlessings.length === 0) {
      const initialBlessings = [
        { name: 'Dr. Ramesh and Family', message: 'Wishing Sivani and Abhishek a lifetime filled with celestial grace, boundless joy, and eternal prosperity.' },
        { name: 'Karthik and Priya', message: 'Hearty congratulations to the lovely couple. May your sacred journey together be blessed with love and understanding.' }
      ];
      initialBlessings.forEach(renderBlessingCard);
    } else {
      savedBlessings.forEach(renderBlessingCard);
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('rsvp-name').value.trim();
        const phone = document.getElementById('rsvp-phone').value.trim();
        const guests = document.getElementById('rsvp-guests').value;
        const message = document.getElementById('rsvp-message').value.trim();

        if (!name) return;

        const newEntry = {
          name,
          phone,
          guests,
          message: message || 'Warmest congratulations and best wishes for a beautiful life together.',
          timestamp: Date.now()
        };

        const currentSaved = JSON.parse(localStorage.getItem('wedding_blessings') || '[]');
        currentSaved.unshift(newEntry);
        localStorage.setItem('wedding_blessings', JSON.stringify(currentSaved));

        renderBlessingCard(newEntry);
        form.reset();
        showToast('Your blessings and RSVP have been recorded with gratitude.');
      });
    }
  }

  function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 4000);
  }

  /* =========================================================
     9. AMBIENT SACRED TEMPLE STARDUST ENGINE
     ========================================================= */
  function setupStardustCanvas() {
    const sCanvas = document.getElementById('stardust-canvas');
    if (!sCanvas) return;
    const sCtx = sCanvas.getContext('2d');
    let sw = 0, sh = 0;

    function resizeStardust() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      sw = window.innerWidth;
      sh = window.innerHeight;
      sCanvas.width = Math.round(sw * dpr);
      sCanvas.height = Math.round(sh * dpr);
      sCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    const speckCount = 38;
    const specks = [];
    const speckColors = ['#fff2c6', '#f6e19c', '#d4af37', '#e7c76d'];

    for (let i = 0; i < speckCount; i++) {
      specks.push({
        x: Math.random() * (sw || 1200),
        y: Math.random() * (sh || 800),
        r: 0.8 + Math.random() * 1.6,
        vy: 0.25 + Math.random() * 0.45,
        swayAmp: 0.6 + Math.random() * 1.2,
        swaySpeed: 0.015 + Math.random() * 0.02,
        phase: Math.random() * Math.PI * 2,
        baseAlpha: 0.2 + Math.random() * 0.5,
        color: speckColors[Math.floor(Math.random() * speckColors.length)]
      });
    }

    let t = 0;
    function renderStardust() {
      sCtx.clearRect(0, 0, sw, sh);
      t += 0.02;

      for (let i = 0; i < specks.length; i++) {
        const p = specks[i];
        p.y -= p.vy;
        p.x += Math.sin(t * p.swaySpeed + p.phase) * p.swayAmp;

        if (p.y < -10) {
          p.y = sh + 10;
          p.x = Math.random() * sw;
        }

        const alpha = p.baseAlpha * (0.6 + 0.4 * Math.sin(t + p.phase));
        sCtx.beginPath();
        sCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        sCtx.fillStyle = p.color;
        sCtx.globalAlpha = Math.max(0, Math.min(1, alpha));
        sCtx.fill();
      }

      requestAnimationFrame(renderStardust);
    }

    window.addEventListener('resize', resizeStardust, { passive: true });
    resizeStardust();
    requestAnimationFrame(renderStardust);
  }

  /* =========================================================
     9.6 SCROLL-DRIVEN REVEALS & 3D MAGNETIC CARD TILT
     ========================================================= */
  function setupScrollReveals() {
    const revealItems = document.querySelectorAll('.reveal-item');
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.05, rootMargin: '60px 0px 60px 0px' });

      revealItems.forEach(item => observer.observe(item));
    } else {
      revealItems.forEach(item => item.classList.add('is-revealed'));
    }
  }

  function setupCardTilt() {
    const isFinePointer = window.matchMedia('(pointer: fine)').matches;
    if (!isFinePointer) return;

    const cards = document.querySelectorAll('.tilt-card');
    cards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const deltaX = (x - centerX) / centerX;
        const deltaY = (y - centerY) / centerY;
        const maxTilt = 4.5;
        const rotateY = deltaX * maxTilt;
        const rotateX = -deltaY * maxTilt;

        card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-4px)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
      });
    });
  }

  /* =========================================================
     10. ZERO-DELAY INITIALIZATION
     ========================================================= */
  function init() {
    setupTempleGate();
    initManifestAndFrames();
    setupAudio();
    setupCountdown();
    setupCountdownPopper();
    setupStardustCanvas();
    setupScrollReveals();
    setupCardTilt();
    setupCalendarButtons();

    window.addEventListener('resize', resizeCanvas, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });

    onScroll();
    requestAnimationFrame(animationLoop);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
