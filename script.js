const sideRail = document.getElementById("side-rail");
const intro = document.getElementById("intro");
const scrollPanels = document.querySelectorAll(".scroll-panel");
const projectTiles = document.querySelectorAll(".project-tile");
const textPopTargets = document.querySelectorAll(
  "h1, h2, h3, h4, a, .headline-chip, .intro-notes span, .art-banner, .card-kicker, .eyebrow, .timeline-mark, .identity-name, .rail-label"
);

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function enableTextPop() {
  textPopTargets.forEach((element) => {
    if (element.dataset.textPopApplied === "true") {
      return;
    }

    if (element.children.length > 0) {
      return;
    }

    const text = element.textContent;

    if (!text || !text.trim()) {
      return;
    }

    element.dataset.textPopApplied = "true";
    element.classList.add("text-pop-ready");
    element.setAttribute("aria-label", text.trim());
    element.textContent = "";

    Array.from(text).forEach((character) => {
      const span = document.createElement("span");
      span.className = character === " " ? "text-pop-char space" : "text-pop-char";
      span.textContent = character === " " ? "\u00A0" : character;
      span.setAttribute("aria-hidden", "true");
      element.appendChild(span);
    });
  });
}

function updateIntroState() {
  const rect = intro.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const progress = clamp((-rect.top + 30) / (rect.height - viewportHeight * 0.22), 0, 1);
  const opacity = Math.max(1 - progress * 1.06, 0);
  const shift = progress * 72;

  intro.querySelectorAll(".panel-layer").forEach((layer, index) => {
    const offset = shift * (index + 1) * 0.18;
    layer.style.opacity = `${opacity}`;
    layer.style.transform = `translateY(${offset}px)`;
  });
}

function updatePanelStates() {
  const viewportHeight = window.innerHeight;
  const focusLine = viewportHeight * 0.64;

  scrollPanels.forEach((panel) => {
    const rect = panel.getBoundingClientRect();
    const progress = clamp((focusLine - rect.top) / (viewportHeight + rect.height * 0.22), 0, 1);
    const opacity = 0.72 + progress * 0.28;
    const shift = (1 - progress) * 18;

    panel.style.opacity = `${opacity}`;
    panel.style.transform = `translateY(${shift}px)`;
  });
}

function updateProjectSequence() {
  const viewportHeight = window.innerHeight;
  const baseThreshold = viewportHeight * 0.9;

  projectTiles.forEach((tile, index) => {
    const rect = tile.getBoundingClientRect();
    const staggerThreshold = baseThreshold - index * 70;
    const isVisible = rect.top <= staggerThreshold && rect.bottom >= viewportHeight * 0.08;

    tile.classList.toggle("is-visible", isVisible);
  });
}

function updateScene() {
  updateIntroState();
  updatePanelStates();
  updateProjectSequence();
}

window.addEventListener("pointermove", (event) => {
  document.body.style.setProperty("--cursor-x", `${event.clientX}px`);
  document.body.style.setProperty("--cursor-y", `${event.clientY}px`);
});

window.addEventListener("scroll", updateScene, { passive: true });
window.addEventListener("resize", updateScene);

enableTextPop();
updateScene();
