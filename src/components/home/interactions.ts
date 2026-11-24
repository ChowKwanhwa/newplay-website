const home = document.querySelector<HTMLElement>('.home');
if (home) {
  const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
  const sections = Array.from(home.querySelectorAll<HTMLElement>('[data-motion]'));
  const visibility = new Map<Element, boolean>();
  function updateVisibility(section: HTMLElement) {
    section.toggleAttribute('data-offscreen', document.hidden || visibility.get(section) === false);
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      visibility.set(entry.target, entry.isIntersecting);
      updateVisibility(entry.target as HTMLElement);
    });
  });
  sections.forEach(section => observer.observe(section));
  document.addEventListener('visibilitychange', () => sections.forEach(updateVisibility));

  const hero = home.querySelector<HTMLElement>('.home-hero')!;
  hero.addEventListener('animationend', event => {
    if (event.animationName === 'brush-stroke' && event.target === hero.querySelector('.mint')) {
      hero.removeAttribute('data-enter');
    }
  });
  motionPreference.addEventListener('change', () => {
    if (motionPreference.matches) hero.removeAttribute('data-enter');
  });

  const heroArt = hero.querySelector<HTMLElement>('.hero-art')!;
  const artObserver = new IntersectionObserver(([entry]) => {
    heroArt.toggleAttribute('data-out-of-view', !entry.isIntersecting);
    if (entry.isIntersecting) heroArt.setAttribute('data-arrived', '');
  }, { threshold: 0.12 });
  artObserver.observe(heroArt);

  // Observe each card at its resting position so the mobile tickets fall when they come into view.
  const tickets = home.querySelectorAll<HTMLAnchorElement>('.intro-art a');
  const ticketObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      (entry.target as HTMLElement).dataset.drop = 'playing';
      ticketObserver.unobserve(entry.target);
    }
  }, { threshold: 0.16 });
  tickets.forEach(ticket => {
    ticket.dataset.drop = 'waiting';
    ticketObserver.observe(ticket);
    ticket.addEventListener('focus', () => {
      ticketObserver.unobserve(ticket);
      delete ticket.dataset.drop;
    }, { once: true });
  });

  const menu = home.querySelector<HTMLButtonElement>('.menu-switch')!;
  const navigation = home.querySelector<HTMLElement>('#home-nav')!;
  function toggleMenu(open: boolean) {
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? '关闭导航' : '打开导航');
    navigation.toggleAttribute('data-open', open);
  }
  menu.addEventListener('click', () => toggleMenu(menu.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && navigation.hasAttribute('data-open')) {
      toggleMenu(false);
      menu.focus();
    }
  });
  document.addEventListener('click', event => {
    if (!(event.target as Element).closest('.home-header') || (event.target as Element).closest('#home-nav a')) toggleMenu(false);
  });

  home.querySelectorAll<HTMLDialogElement>('dialog').forEach(dialog => {
    dialog.querySelector('[data-dismiss]')?.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const box = dialog.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
    });
  });

  const premiere = home.querySelector<HTMLElement>('[data-premiere]')!;
  const room = premiere.querySelector<HTMLDialogElement>('dialog')!;
  const retryPanel = room.querySelector<HTMLElement>('[data-error]')!;
  const coverPause = Array.from(premiere.querySelectorAll<HTMLButtonElement>('[data-cover-pause]'));
  let cover = 0;
  let pausedCover = false;
  let failed = false;
  let onScreen = false;
  let rotation = 0;
  let mediaFailure = false;
  let cancelProbe: (() => void) | undefined;
  const checkOriginal = room.querySelector<HTMLButtonElement>('[data-check-original]')!;
  const playOriginal = room.querySelector<HTMLAnchorElement>('[data-play-original]')!;
  const mediaStatus = room.querySelector<HTMLElement>('.mv-status')!;
  function stopProbe() {
    cancelProbe?.();
    cancelProbe = undefined;
    checkOriginal.disabled = false;
  }
  function verifyOriginal() {
    stopProbe();
    const probe = document.createElement('video');
    checkOriginal.disabled = true;
    mediaStatus.textContent = '正在连接原片…';
    const finish = (ready: boolean) => {
      stopProbe();
      if (ready) {
        mediaStatus.textContent = '原片已就绪，可另开播放。';
        playOriginal.href = premiere.dataset.original!;
        playOriginal.hidden = false;
        checkOriginal.hidden = true;
        playOriginal.focus();
      } else {
        failed = true;
        mediaFailure = true;
        mediaStatus.textContent = '原片暂不可用，可重新连接。';
        renderCover();
        room.querySelector<HTMLButtonElement>('[data-retry]')!.focus();
      }
      scheduleCover();
    };
    const timer = window.setTimeout(() => finish(false), 8000);
    cancelProbe = () => {
      clearTimeout(timer);
      probe.onloadedmetadata = null;
      probe.onerror = null;
      probe.removeAttribute('src');
      probe.load();
    };
    probe.onloadedmetadata = () => finish(true);
    probe.onerror = () => finish(false);
    probe.preload = 'metadata';
    probe.src = premiere.dataset.original!;
  }
  checkOriginal.addEventListener('click', verifyOriginal);

  function renderCover() {
    premiere.querySelectorAll<HTMLElement>('[data-cover]').forEach(panel => {
      panel.hidden = Number(panel.dataset.cover) !== cover || (failed && !!panel.closest('dialog'));
    });
    premiere.querySelectorAll<HTMLElement>('[data-select-cover]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.selectCover) === cover)));
    retryPanel.hidden = !failed;
    room.querySelector<HTMLElement>('[data-show-error]')!.hidden = cover === 2 || failed;
    coverPause.forEach(button => {
      const paused = pausedCover || motionPreference.matches;
      const inRoom = !!button.closest('dialog');
      button.textContent = (paused ? '▷ 继续' : 'Ⅱ 暂停') + (inRoom ? '封面轮播' : '');
      button.hidden = inRoom && (cover === 2 || failed);
      button.disabled = motionPreference.matches || cover === 2;
      button.setAttribute('aria-pressed', String(paused));
    });
  }
  function scheduleCover() {
    window.clearTimeout(rotation);
    if (pausedCover || failed || cancelProbe || cover === 2 || motionPreference.matches || document.hidden || (!room.open && !onScreen)) return;
    rotation = window.setTimeout(() => {
      const active = document.activeElement;
      const interacting = room.open
        ? room.matches(':hover') || active?.matches('.room-list button, .room-foot button, .room-play')
        : premiere.matches(':hover') || premiere.contains(active);
      if (!interacting) {
        cover = cover === 0 ? 1 : 0;
        renderCover();
      }
      scheduleCover();
    }, 6500);
  }
  function selectCover(next: number) {
    stopProbe();
    mediaFailure = false;
    if (!checkOriginal.hidden) mediaStatus.textContent = '原片暂不可用，可重新连接。';
    cover = next;
    failed = false;
    renderCover();
    scheduleCover();
  }
  premiere.querySelectorAll<HTMLButtonElement>('[data-select-cover]').forEach(button => button.addEventListener('click', () => selectCover(Number(button.dataset.selectCover))));
  coverPause.forEach(button => button.addEventListener('click', () => {
    pausedCover = !pausedCover;
    renderCover();
    scheduleCover();
  }));
  premiere.querySelector('[data-open-room]')!.addEventListener('click', () => {
    failed = false;
    room.showModal();
    renderCover();
    scheduleCover();
  });
  room.addEventListener('close', () => selectCover(cover));
  room.querySelector('[data-show-error]')!.addEventListener('click', () => {
    failed = true;
    renderCover();
    scheduleCover();
    room.querySelector<HTMLButtonElement>('[data-retry]')!.focus();
  });
  room.querySelector('[data-retry]')!.addEventListener('click', () => {
    const retryOriginal = mediaFailure;
    selectCover(0);
    if (retryOriginal) verifyOriginal();
  });
  const previewObserver = new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; scheduleCover(); });
  previewObserver.observe(premiere.querySelector('.preview-card')!);
  motionPreference.addEventListener('change', () => { renderCover(); scheduleCover(); });
  document.addEventListener('visibilitychange', scheduleCover);
  renderCover();

  home.querySelectorAll<HTMLButtonElement>('[data-open-role]').forEach(opener => {
    const dialog = home.querySelector<HTMLDialogElement>(`[data-quiz="${opener.dataset.openRole}"]`)!;
    const answers = Array.from(dialog.querySelectorAll<HTMLButtonElement>('[data-answer]'));
    const action = dialog.querySelector<HTMLButtonElement>('.quiz-action');
    const headline = dialog.querySelector<HTMLElement>('.quiz-status strong');
    const detail = dialog.querySelector<HTMLElement>('.quiz-status p');
    function quizState(stage: 'register' | 'question' | 'answer', chosen = -1) {
      if (!action || !headline || !detail) return;
      const correct = chosen === 3;
      const text = stage === 'register' ? ['先注册，再来解锁答案。', '先看看注册后的竞猜效果。'] :
        stage === 'question' ? ['认出这位普莱，发现惊喜。', '注册后参与，选对答案可解锁奖励资格。'] :
        correct ? ['答对了，是普莱！', '已解锁奖励资格预览。正式 NC 发放由服务端确认。'] :
        ['差一点，再猜猜？', answers[chosen].textContent!.slice(1).trim() + ' 不是这题的答案。线索还在，再选一次试试。'];
      headline.textContent = text[0];
      detail.textContent = text[1];
      action.hidden = stage === 'question';
      action.textContent = stage === 'register' ? '预览已注册状态' : '再猜一次 ↻';
      answers.forEach((answer, i) => {
        answer.disabled = stage !== 'question';
        answer.setAttribute('aria-pressed', String(chosen === i));
      });
    }
    opener.addEventListener('click', () => { quizState('register'); dialog.showModal(); });
    action?.addEventListener('click', () => { quizState('question'); answers[0].focus(); });
    answers.forEach((answer, i) => answer.addEventListener('click', () => { quizState('answer', i); action?.focus(); }));
  });

}
