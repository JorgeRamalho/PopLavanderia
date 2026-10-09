(function () {
  if (window.__popHeaderScrollInit) return;
  window.__popHeaderScrollInit = true;

  function start() {
    const header = document.querySelector(".site-header");
    if (!header) return;

    const sync = () => {
      const offset =
        window.scrollY ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0;
      header.classList.toggle("is-scrolled", offset > 0);
    };

    sync();
    window.addEventListener("scroll", sync, { passive: true });
    document.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync, { passive: true });
    window.addEventListener("load", sync);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
