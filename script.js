/* =====================================================================
   BIRTHDAY STORY — script.js
   Vanilla JS, no dependencies. Organized into small modules:
     1. Utilities
     2. Chapter/step navigation
     3. Ambient starfield + floating hearts
     4. Music player (single <audio>, never recreated)
     5. Balloons
     6. Grand reveal (wax seal + letter typewriter/fade reveal)
     7. Memory gallery
   ===================================================================== */
(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* -------------------------------------------------------------------
     1. UTILITIES
     ------------------------------------------------------------------- */
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const rand = (min, max) => Math.random() * (max - min) + min;

  function addRipple(btn, evt) {
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const ripple = document.createElement('span');
    const x = (evt.clientX ?? rect.left + rect.width / 2) - rect.left - size / 2;
    const y = (evt.clientY ?? rect.top + rect.height / 2) - rect.top - size / 2;
    ripple.className = 'ripple';
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    btn.style.position = btn.style.position || 'relative';
    btn.style.overflow = 'hidden';
    btn.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  }

  $$('.btn').forEach(btn => {
    btn.addEventListener('click', (e) => addRipple(btn, e));
  });

  /* -------------------------------------------------------------------
     2. CHAPTER / STEP NAVIGATION
     ------------------------------------------------------------------- */
  const chapters = $$('.chapter');
  const chapterNumeral = $('#chapterNumeral');
  const chapterLabel = $('#chapterLabel');
  let currentIndex = 0;

  function goToStep(index) {
    if (index < 0 || index >= chapters.length || index === currentIndex && chapters[index].classList.contains('is-active')) return;

    const outgoing = chapters[currentIndex];
    const incoming = chapters[index];

    outgoing.classList.add('is-leaving');
    outgoing.classList.remove('is-active');

    // slight stagger so the leave animation is visible before the next fades in
    window.setTimeout(() => {
      outgoing.classList.remove('is-leaving');
    }, 620);

    incoming.classList.add('is-active');
    currentIndex = index;

    chapterNumeral.textContent = incoming.dataset.numeral || '';
    chapterLabel.textContent = incoming.dataset.label || '';

    // Step-specific "on enter" behavior
    const step = incoming.dataset.step;
    if (step === 'reveal') handleRevealEnter();
    if (step === 'gallery') handleGalleryEnter();
  }

  $$('[data-next]').forEach(btn => {
    btn.addEventListener('click', () => goToStep(currentIndex + 1));
  });

  /* -------------------------------------------------------------------
     3. AMBIENT STARFIELD + FLOATING HEARTS
     ------------------------------------------------------------------- */
  const starfield = $('#starfield');
  const heartfield = $('#heartfield');

  function buildStars(count) {
    if (prefersReducedMotion) return;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const star = document.createElement('span');
      star.className = 'star';
      star.style.left = rand(0, 100) + 'vw';
      star.style.top = rand(0, 100) + 'vh';
      star.style.setProperty('--star-op', rand(.35, .9).toFixed(2));
      star.style.animationDelay = rand(0, 4) + 's';
      star.style.animationDuration = rand(3, 6) + 's';
      frag.appendChild(star);
    }
    starfield.appendChild(frag);
  }
  buildStars(46);

  let heartSpawnTimer = null;
  function spawnHeart() {
    const heart = document.createElement('span');
    heart.className = 'floating-heart';
    heart.textContent = Math.random() > .5 ? '❤' : '♡';
    heart.style.left = rand(4, 96) + 'vw';
    heart.style.setProperty('--size', rand(12, 26).toFixed(0) + 'px');
    heart.style.setProperty('--dur', rand(7, 12).toFixed(1) + 's');
    heart.style.setProperty('--drift', rand(-60, 60).toFixed(0) + 'px');
    heartfield.appendChild(heart);
    heart.addEventListener('animationend', () => heart.remove());
  }
  function startHeartAmbience(intervalMs) {
    if (prefersReducedMotion) return;
    stopHeartAmbience();
    heartSpawnTimer = window.setInterval(spawnHeart, intervalMs);
  }
  function stopHeartAmbience() {
    if (heartSpawnTimer) { window.clearInterval(heartSpawnTimer); heartSpawnTimer = null; }
  }
  // Gentle ambient hearts throughout; picks up during the reveal (see below)
  startHeartAmbience(2600);

  /* -------------------------------------------------------------------
     4. MUSIC PLAYER — single <audio>, controlled from Step 4,
        stays in the DOM and keeps playing across every later step.
     ------------------------------------------------------------------- */
  const song = $('#theSong');
  const musicToggle = $('#musicToggle');
  const musicToggleLabel = $('#musicToggleLabel');
  const miniPlayer = $('#miniPlayer');
  let musicStarted = false;

  function setPlayingUI(isPlaying) {
    musicToggle.setAttribute('aria-pressed', String(isPlaying));
    musicToggleLabel.textContent = isPlaying ? 'Pause Our Song ⏸️' : 'Play Our Song 🎵';
    miniPlayer.classList.toggle('is-playing', isPlaying);
    miniPlayer.querySelector('.mini-player__text').textContent = isPlaying ? 'Playing' : 'Paused';
  }

  async function playSong() {
    try {
      await song.play();
      musicStarted = true;
      miniPlayer.hidden = false;
      setPlayingUI(true);
    } catch (err) {
      // Autoplay/permission restrictions — surface a gentle inline hint instead of a console error only.
      musicToggleLabel.textContent = 'Tap Again to Play 🎵';
    }
  }

  function pauseSong() {
    song.pause();
    setPlayingUI(false);
  }

  musicToggle.addEventListener('click', () => {
    if (song.paused) playSong(); else pauseSong();
  });
  miniPlayer.addEventListener('click', () => {
    if (song.paused) playSong(); else pauseSong();
  });
  song.addEventListener('ended', () => {
    // loop attribute already handles this, but keep UI honest if a browser ever stalls the loop
    if (!song.paused) setPlayingUI(true);
  });

  /* -------------------------------------------------------------------
     5. BALLOONS
     ------------------------------------------------------------------- */
  const balloonfield = $('#balloonfield');
  const balloonToggle = $('#balloonToggle');
  const balloonToggleLabel = $('#balloonToggleLabel');
  const balloonColors = ['#D8A7B1', '#C9A66B', '#B9A6D9', '#E8C39E', '#B76E79'];
  let balloonsActive = false;
  let balloonTimer = null;
  const MAX_BALLOONS = 14;

  function spawnBalloon() {
    if (balloonfield.childElementCount >= MAX_BALLOONS) return;
    const balloon = document.createElement('div');
    balloon.className = 'balloon';
    balloon.style.left = rand(4, 92) + 'vw';
    balloon.style.background = balloonColors[Math.floor(rand(0, balloonColors.length))];
    balloon.style.setProperty('--w', rand(34, 56).toFixed(0) + 'px');
    balloon.style.setProperty('--dur', rand(9, 15).toFixed(1) + 's');
    balloon.style.setProperty('--drift', rand(-80, 80).toFixed(0) + 'px');
    balloon.style.setProperty('--rot', rand(-16, 16).toFixed(0) + 'deg');
    balloonfield.appendChild(balloon);
    balloon.addEventListener('animationend', () => balloon.remove());
  }

  function startBalloons() {
    if (balloonsActive || prefersReducedMotion) {
      if (prefersReducedMotion) balloonsActive = true; // mark done without heavy motion
      balloonToggle.setAttribute('aria-pressed', 'true');
      balloonToggleLabel.textContent = 'Colors Flying 🎈';
      return;
    }
    balloonsActive = true;
    balloonToggle.setAttribute('aria-pressed', 'true');
    balloonToggleLabel.textContent = 'Colors Flying 🎈';
    for (let i = 0; i < 5; i++) window.setTimeout(spawnBalloon, i * 220);
    balloonTimer = window.setInterval(spawnBalloon, 850);
  }

  balloonToggle.addEventListener('click', startBalloons);

  /* -------------------------------------------------------------------
     6. GRAND REVEAL — wax seal cracks open, letter fades in line by line
     ------------------------------------------------------------------- */
  const revealChapter = $('.chapter--reveal');
  const waxSeal = $('#waxSeal');
  const letterLines = $$('#letterBody p');
  const letterSignoff = $('.letter__signoff');
  const memoriesBtn = $('#memoriesBtn');
  let revealHandled = false;

  function handleRevealEnter() {
    if (revealHandled) return;
    revealHandled = true;

    // Auto-start balloons if the guest skipped that button, per spec.
    if (!balloonsActive) startBalloons();

    // Turn up the ambience for this one signature moment.
    startHeartAmbience(900);

    window.setTimeout(() => {
      revealChapter.classList.add('is-cracking');
      window.setTimeout(() => waxSeal.classList.add('is-hidden'), 900);
    }, 500);

    // Reveal letter lines one at a time.
    const baseDelay = 1300;
    const stagger = 650;
    letterLines.forEach((line, i) => {
      window.setTimeout(() => line.classList.add('is-revealed'), baseDelay + i * stagger);
    });
    const signoffDelay = baseDelay + letterLines.length * stagger + 300;
    window.setTimeout(() => letterSignoff.classList.add('is-revealed'), signoffDelay);

    // Reveal the "Our Memories" button after everything has appeared.
    window.setTimeout(() => {
      memoriesBtn.hidden = false;
      requestAnimationFrame(() => memoriesBtn.classList.add('is-visible'));
      startHeartAmbience(2600); // settle back to gentle ambience
    }, signoffDelay + 900);
  }

  /* -------------------------------------------------------------------
     7. MEMORY GALLERY
     ------------------------------------------------------------------- */
  const slides = $$('.gallery__slide');
  const dotsWrap = $('#galleryDots');
  const prevBtn = $('#galleryPrev');
  const nextBtn = $('#galleryNext');
  let galleryIndex = 0;
  let galleryTimer = null;
  let galleryBuilt = false;

  function buildDots() {
    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'gallery__dot' + (i === 0 ? ' is-active' : '');
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', 'Go to memory ' + (i + 1));
      dot.addEventListener('click', () => { showSlide(i); resetAutoplay(); });
      dotsWrap.appendChild(dot);
    });
  }

  function showSlide(index) {
    slides[galleryIndex].classList.remove('is-active');
    dotsWrap.children[galleryIndex].classList.remove('is-active');
    galleryIndex = (index + slides.length) % slides.length;
    slides[galleryIndex].classList.add('is-active');
    dotsWrap.children[galleryIndex].classList.add('is-active');
  }

  function resetAutoplay() {
    if (galleryTimer) window.clearInterval(galleryTimer);
    if (prefersReducedMotion) return;
    galleryTimer = window.setInterval(() => showSlide(galleryIndex + 1), 5000);
  }

  function handleGalleryEnter() {
    if (!galleryBuilt) {
      buildDots();
      galleryBuilt = true;
    }
    resetAutoplay();
  }

  prevBtn.addEventListener('click', () => { showSlide(galleryIndex - 1); resetAutoplay(); });
  nextBtn.addEventListener('click', () => { showSlide(galleryIndex + 1); resetAutoplay(); });

  // Pause autoplay on manual touch/drag interaction too.
  let touchStartX = null;
  const frame = $('.gallery__frame');
  frame.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
  frame.addEventListener('touchend', (e) => {
    if (touchStartX === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40) {
      showSlide(galleryIndex + (dx < 0 ? 1 : -1));
      resetAutoplay();
    }
    touchStartX = null;
  }, { passive: true });

})();
