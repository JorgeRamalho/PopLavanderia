export function mountBubbles(canvas) {
  if (!canvas) return () => {};
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return () => {};

  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};

  const bubbles = Array.from({ length: 32 }, (_, index) => ({
    x: Math.random(),
    y: Math.random(),
    r: 5 + Math.random() * 20,
    s: 0.14 + Math.random() * 0.38,
    a: 0.14 + Math.random() * 0.2,
    hue: index % 3,
  }));

  let frame = 0;
  let running = true;

  const colors = [
    "45, 230, 208",
    "79, 140, 255",
    "255, 79, 152",
  ];

  function resize() {
    const { width, height } = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function draw() {
    if (!running) return;
    const { width, height } = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, width, height);
    bubbles.forEach((bubble) => {
      bubble.y -= bubble.s / 180;
      if (bubble.y < -0.08) {
        bubble.y = 1.08;
        bubble.x = Math.random();
      }
      const x = bubble.x * width;
      const y = bubble.y * height;
      const radius = bubble.r;
      ctx.beginPath();
      ctx.fillStyle = `rgba(${colors[bubble.hue]}, ${bubble.a * 0.55})`;
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.strokeStyle = `rgba(${colors[bubble.hue]}, ${bubble.a})`;
      ctx.lineWidth = 1.2;
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.fillStyle = `rgba(255, 255, 255, ${bubble.a * 0.9})`;
      ctx.arc(x - radius * 0.28, y - radius * 0.32, radius * 0.22, 0, Math.PI * 2);
      ctx.fill();
    });
    frame = window.requestAnimationFrame(draw);
  }

  resize();
  draw();
  window.addEventListener("resize", resize);
  return () => {
    running = false;
    window.cancelAnimationFrame(frame);
    window.removeEventListener("resize", resize);
  };
}
