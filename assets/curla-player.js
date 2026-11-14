(function () {
  'use strict';

  const size = 240;
  const rate = 24;
  const clips = {
    idle: {frames: 121, columns: 12},
    wave: {frames: 97, columns: 11},
    point: {frames: 97, columns: 11},
    beg: {frames: 97, columns: 11},
    celebrate: {frames: 97, columns: 11},
    pat: {frames: 97, columns: 10}
  };
  const scenes = {index: 'wave', product: 'point', cart: 'beg'};
  const gestures = {
    idle: 'idle', wave: 'wave', point: 'point', celebrate: 'celebrate', pat: 'pat',
    answer: 'point', think: 'idle', curious: 'idle'
  };

  function mount(portrait, launcher, signal, avatar, {assets, stage, autoplay}) {
    const poster = document.createElement('img');
    poster.src = avatar.src = assets.poster;
    poster.width = poster.height = size;
    poster.alt = '';
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    canvas.hidden = true;
    const context = canvas.getContext('2d');
    const previous = document.createElement('canvas');
    previous.width = previous.height = size;
    const previousContext = previous.getContext('2d');
    portrait.append(poster, canvas);

    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const sheets = new Map();
    const pageLoop = autoplay !== false && (stage === 'product' || stage === 'cart') ? scenes[stage] : 'idle';
    let restingClip = pageLoop;
    let active, loading, requested;
    let interrupt = false;
    let raf = 0, last = 0, elapsed = 0, lastFrame = -1, visible = true;
    let pending = autoplay === false || !Object.hasOwn(scenes, stage) ? 'idle' : scenes[stage];

    function fetchSheet(name) {
      if (!sheets.has(name)) {
        const image = new Image();
        image.src = assets[name];
        const spec = clips[name];
        sheets.set(name, image.decode().then(() => {
          if (image.naturalWidth !== spec.columns * size ||
              image.naturalHeight !== Math.ceil(spec.frames / spec.columns) * size) {
            throw new Error('Invalid Curla animation sheet');
          }
          return {image, name, ...spec};
        }).catch(() => {
          sheets.delete(name);
          return null;
        }));
      }
      return sheets.get(name);
    }

    function schedule() {
      if (!raf && visible && !document.hidden && !reduced.matches && !signal.aborted && context && previousContext) {
        raf = requestAnimationFrame(draw);
      }
    }

    function request(name) {
      if (reduced.matches || loading === name || active?.name === name) return;
      loading = name;
      fetchSheet(name).then(sheet => {
        if (signal.aborted || loading !== name) return;
        loading = undefined;
        if (!sheet) {
          if (pending !== name || name === 'idle') return;
          if (restingClip === name) restingClip = 'idle';
          selectClip(restingClip);
          return;
        }
        if (pending === name) requested = sheet;
        schedule();
      });
    }

    function prepare() {
      if (pending !== active?.name && requested?.name !== pending) request(pending);
      schedule();
    }

    function selectClip(name, immediate = false) {
      pending = name;
      interrupt = immediate;
      requested = undefined;
      prepare();
    }

    function play(gesture, {immediate = false} = {}) {
      if (!Object.hasOwn(gestures, gesture) || reduced.matches) return;
      const next = gestures[gesture];
      if (next === active?.name && next !== 'idle') return;
      selectClip(next, immediate);
    }

    function setBrowsing(browsing) {
      const next = browsing ? 'point' : pageLoop;
      if (next === restingClip) return;
      const wasLooping = active?.name === restingClip;
      restingClip = next;
      // Let an explicitly requested reaction play before returning to the current scene.
      if (!interrupt) selectClip(restingClip, wasLooping);
    }

    function switchTo(sheet) {
      previousContext.clearRect(0, 0, size, size);
      previousContext.drawImage(active && !canvas.hidden ? canvas : poster.complete && poster.naturalWidth ? poster : sheet.image,
        0, 0, size, size, 0, 0, size, size);
      active = sheet;
      elapsed = 0;
      lastFrame = -1;
      requested = undefined;
      portrait.dataset.motion = active.name;
      interrupt = false;
      pending = restingClip;
      if (active.name !== restingClip) {
        // Prepare the scene loop while the reaction plays.
        prepare();
      }
    }

    function draw(now) {
      raf = 0;
      const delta = last ? Math.min(now - last, 100) : 0;
      last = now;
      elapsed += delta;
      const looping = active?.name === 'idle' || active?.name === restingClip;
      const ended = active && !looping && elapsed >= active.frames * 1000 / rate;
      if (requested && requested !== active && (!active || looping || ended || interrupt)) switchTo(requested);
      if (!active) return;

      const frameNumber = Math.floor(elapsed * rate / 1000);
      const repeat = active.name === 'idle' || active.name === restingClip;
      const frame = repeat ? frameNumber % active.frames : Math.min(frameNumber, active.frames - 1);
      const fade = Math.min(1, elapsed / 180);
      if (frame !== lastFrame || fade < 1) {
        context.clearRect(0, 0, size, size);
        context.globalAlpha = 1 - fade;
        context.drawImage(previous, 0, 0);
        // Add premultiplied pixel contributions to avoid dimming transparent edges.
        context.globalCompositeOperation = 'lighter';
        context.globalAlpha = fade;
        context.drawImage(active.image, frame % active.columns * size, Math.floor(frame / active.columns) * size,
          size, size, 0, 0, size, size);
        context.globalAlpha = 1;
        context.globalCompositeOperation = 'source-over';
        lastFrame = frame;
        portrait.dataset.frame = String(frame);
        canvas.hidden = false;
        poster.hidden = true;
      }
      if (repeat || frameNumber < active.frames) schedule();
    }

    function sync() {
      last = 0;
      if (reduced.matches || !visible || document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
      if (reduced.matches) {
        poster.hidden = false;
        canvas.hidden = true;
        lastFrame = -1;
        portrait.dataset.motion = 'poster';
      } else if (visible && !document.hidden) {
        if (!active && !loading) prepare();
        schedule();
      }
    }

    const observer = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      sync();
    });
    observer.observe(launcher);
    reduced.addEventListener('change', sync, {signal});
    document.addEventListener('visibilitychange', sync, {signal});
    signal.addEventListener('abort', () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    }, {once: true});
    launcher.addEventListener('pointerenter', event => {
      if (event.pointerType === 'mouse' && active?.name === 'idle') play('wave');
    }, {signal});
    sync();
    return {play, setBrowsing, refresh: sync};
  }

  window.CurlyGuideMotion = {mount};
}());
