const INTERVAL = 6800;
const SWIPE_THRESHOLD = 48;

export function mountCarousel(root) {
  if (!(root instanceof HTMLElement)) return () => {};

  const track = root.querySelector("[data-carousel-track]");
  const slides = [...root.querySelectorAll("[data-slide]")];
  const thumbs = [...root.querySelectorAll("[data-thumb]")];
  const status = root.querySelector("[data-carousel-status]");
  const progress = root.querySelector("[data-carousel-progress]");
  const prev = root.querySelector("[data-carousel-prev]");
  const next = root.querySelector("[data-carousel-next]");
  const pauseBtn = root.querySelector("[data-carousel-pause]");
  const counter = root.querySelector("[data-carousel-count]");

  if (!(track instanceof HTMLElement) || slides.length === 0) return () => {};

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const total = slides.length;
  let index = 0;
  let timer = 0;
  let pausedByUser = reduced;
  let dragging = false;
  let originX = 0;
  let originIndex = 0;

  root.style.setProperty("--gallery-ms", `${INTERVAL}ms`);

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function restartProgress() {
    if (!(progress instanceof HTMLElement)) return;
    progress.replaceChildren();
    if (pausedByUser || dragging || reduced || document.hidden) return;
    progress.append(document.createElement("span"));
  }

  function moveTo(slideIndex, animate) {
    const offset = `${-slideIndex * 100}%`;
    track.style.transition = animate && !reduced ? "" : "none";
    track.style.transform = `translate3d(${offset}, 0, 0)`;
  }

  function paint(announce, animate) {
    slides.forEach((slide, slideIndex) => {
      const active = slideIndex === index;
      slide.classList.toggle("is-active", active);
      slide.setAttribute("aria-hidden", active ? "false" : "true");
      slide.setAttribute("aria-label", `${slideIndex + 1} de ${total}`);
    });

    thumbs.forEach((thumb, thumbIndex) => {
      const active = thumbIndex === index;
      if (active) thumb.setAttribute("aria-current", "true");
      else thumb.removeAttribute("aria-current");
      thumb.tabIndex = active ? 0 : -1;
      if (active && thumb.parentElement instanceof HTMLElement) {
        const rail = thumb.parentElement;
        const left = thumb.offsetLeft - rail.clientWidth / 2 + thumb.clientWidth / 2;
        rail.scrollTo({ left, behavior: reduced ? "auto" : "smooth" });
      }
    });

    if (counter) counter.textContent = `${pad(index + 1)} / ${pad(total)}`;

    const title = slides[index]?.querySelector("h3")?.textContent?.trim() ?? "";
    if (status instanceof HTMLElement && announce) {
      status.textContent = `Cena ${index + 1} de ${total}: ${title}`;
    }

    moveTo(index, animate);
    restartProgress();
  }

  function go(nextIndex, announce) {
    index = (nextIndex + total) % total;
    paint(announce, true);
  }

  function stop() {
    window.clearInterval(timer);
    timer = 0;
  }

  function start() {
    stop();
    root.classList.toggle("is-paused", pausedByUser || reduced);
    if (pauseBtn instanceof HTMLButtonElement) {
      pauseBtn.setAttribute("aria-pressed", pausedByUser ? "true" : "false");
      pauseBtn.textContent = pausedByUser ? "Retomar" : "Pausar";
    }
    restartProgress();
    if (pausedByUser || dragging || reduced || document.hidden) return;
    timer = window.setInterval(() => {
      go(index + 1, false);
    }, INTERVAL);
  }

  function onPrev() {
    go(index - 1, true);
    start();
  }

  function onNext() {
    go(index + 1, true);
    start();
  }

  function onPause() {
    pausedByUser = !pausedByUser;
    start();
  }

  function onKeydown(event) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      onNext();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      onPrev();
    }
  }

  function onPointerDown(event) {
    if (!(event instanceof PointerEvent) || event.button !== 0) return;
    dragging = true;
    originX = event.clientX;
    originIndex = index;
    track.style.transition = "none";
    track.setPointerCapture(event.pointerId);
    stop();
    restartProgress();
  }

  function onPointerMove(event) {
    if (!dragging || !(event instanceof PointerEvent)) return;
    const width = track.clientWidth || 1;
    const shift = event.clientX - originX;
    track.style.transform = `translate3d(calc(${-originIndex * 100}% + ${shift}px), 0, 0)`;
  }

  function onPointerUp(event) {
    if (!dragging || !(event instanceof PointerEvent)) return;
    dragging = false;
    const shift = event.clientX - originX;
    if (shift <= -SWIPE_THRESHOLD) go(originIndex + 1, true);
    else if (shift >= SWIPE_THRESHOLD) go(originIndex - 1, true);
    else go(originIndex, false);
    start();
  }

  function onResize() {
    moveTo(index, false);
  }

  prev?.addEventListener("click", onPrev);
  next?.addEventListener("click", onNext);
  pauseBtn?.addEventListener("click", onPause);
  thumbs.forEach((thumb, thumbIndex) => {
    thumb.addEventListener("click", () => {
      go(thumbIndex, true);
      start();
    });
  });
  root.addEventListener("keydown", onKeydown);
  track.addEventListener("pointerdown", onPointerDown);
  track.addEventListener("pointermove", onPointerMove);
  track.addEventListener("pointerup", onPointerUp);
  track.addEventListener("pointercancel", onPointerUp);
  window.addEventListener("resize", onResize);
  document.addEventListener("visibilitychange", start);

  slides.forEach((slide) => {
    slide.setAttribute("role", "group");
    slide.setAttribute("aria-roledescription", "slide");
  });

  paint(false, false);
  start();

  return () => {
    stop();
    prev?.removeEventListener("click", onPrev);
    next?.removeEventListener("click", onNext);
    pauseBtn?.removeEventListener("click", onPause);
    root.removeEventListener("keydown", onKeydown);
    track.removeEventListener("pointerdown", onPointerDown);
    track.removeEventListener("pointermove", onPointerMove);
    track.removeEventListener("pointerup", onPointerUp);
    track.removeEventListener("pointercancel", onPointerUp);
    window.removeEventListener("resize", onResize);
    document.removeEventListener("visibilitychange", start);
  };
}
