const sideRail = document.getElementById("side-rail");
const intro = document.getElementById("intro");
const scrollPanels = document.querySelectorAll(".scroll-panel");
const projectTiles = document.querySelectorAll(".project-tile");
const photoActions = document.getElementById("photo-actions");
const photoYesButton = document.getElementById("photo-yes-btn");
const photoNoButton = document.getElementById("photo-no-btn");
const photoStatus = document.getElementById("photo-status");
const galleryLaunchOverlay = document.getElementById("gallery-launch-overlay");
const textPopTargets = document.querySelectorAll(
  "h1, h2, h3, h4, a, .headline-chip, .intro-notes span, .art-banner, .card-kicker, .eyebrow, .timeline-mark, .identity-name, .rail-label"
);
const revealTargets = document.querySelectorAll(
  ".panel-head, .identity-strip, .intro-copy, .intro-notes, .info-card, .skill-group, .project-tile, .timeline-row, .contact-grid a, .photo-tease-box"
);
const liquidCards = document.querySelectorAll(".floating-card, .info-card, .project-tile, .quote-block");

function triggerReturnAnimation() {
  const params = new URLSearchParams(window.location.search);
  const cameFromPhotography = params.get("from") === "photography";
  const hasReturnFlag = sessionStorage.getItem("portfolioReturnAnimation") === "photography";

  if (!cameFromPhotography && !hasReturnFlag) {
    return;
  }

  document.body.classList.add("returning-from-gallery");
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  sessionStorage.removeItem("portfolioReturnAnimation");

  if (cameFromPhotography) {
    params.delete("from");
    const query = params.toString();
    const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
    window.history.replaceState({}, "", nextUrl);
  }

  window.setTimeout(() => {
    document.body.classList.remove("returning-from-gallery");
  }, 1100);
}

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

function setupAirReveal() {
  if (!revealTargets.length) {
    return;
  }

  revealTargets.forEach((target) => target.classList.add("air-float-reveal"));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      root: null,
      threshold: 0.14,
      rootMargin: "0px 0px -8% 0px"
    }
  );

  revealTargets.forEach((target) => observer.observe(target));
}

function setupLiquidCardDrift() {
  if (!liquidCards.length || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  liquidCards.forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const relX = (event.clientX - rect.left) / rect.width - 0.5;
      const relY = (event.clientY - rect.top) / rect.height - 0.5;
      const driftX = relX * 8;
      const driftY = relY * 8;

      card.style.setProperty("--drift-x", `${driftX}px`);
      card.style.setProperty("--drift-y", `${driftY}px`);
      card.style.transform = `translate(${driftX}px, ${driftY}px)`;
    });

    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--drift-x", "0px");
      card.style.setProperty("--drift-y", "0px");
      card.style.transform = "";
    });
  });
}

function moveNoButton() {
  if (!photoActions || !photoNoButton) {
    return;
  }

  const areaRect = photoActions.getBoundingClientRect();
  const buttonWidth = photoNoButton.offsetWidth;
  const buttonHeight = photoNoButton.offsetHeight;
  const maxX = Math.max(areaRect.width - buttonWidth - 12, 12);
  const maxY = Math.max(areaRect.height - buttonHeight - 12, 12);

  const randomX = Math.floor(Math.random() * maxX);
  const randomY = Math.floor(Math.random() * maxY);
  const tilt = Math.floor(Math.random() * 16) - 8;
  const scale = 0.94 + Math.random() * 0.14;
  const r1 = 38 + Math.floor(Math.random() * 24);
  const r2 = 38 + Math.floor(Math.random() * 24);
  const r3 = 38 + Math.floor(Math.random() * 24);
  const r4 = 38 + Math.floor(Math.random() * 24);

  photoNoButton.style.left = `${randomX}px`;
  photoNoButton.style.top = `${randomY}px`;
  photoNoButton.style.transform = `rotate(${tilt}deg) scale(${scale})`;
  photoNoButton.style.borderRadius = `${r1}% ${r2}% ${r3}% ${r4}% / ${r3}% ${r4}% ${r1}% ${r2}%`;
}

function trapNoButton(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  moveNoButton();

  if (photoStatus) {
    photoStatus.textContent = "No is not available. You need to pick Yes.";
  }
}

function setupPhotoPrompt() {
  if (!photoActions || !photoNoButton || !photoYesButton) {
    return;
  }

  moveNoButton();

  ["mouseenter", "pointerdown", "touchstart", "click", "focus"].forEach((eventName) => {
    photoNoButton.addEventListener(eventName, trapNoButton, { passive: false });
  });

  photoNoButton.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      trapNoButton(event);
    }
  });

  photoYesButton.addEventListener("click", (event) => {
    event.preventDefault();
    const targetUrl = photoYesButton.getAttribute("href") || "photography.html";

    photoYesButton.classList.add("launching");
    document.body.style.overflow = "hidden";

    if (galleryLaunchOverlay) {
      galleryLaunchOverlay.classList.add("is-active");
    }

    if (photoStatus) {
      photoStatus.textContent = "Launching photography page...";
    }

    window.setTimeout(() => {
      window.location.href = targetUrl;
    }, 720);
  });
}

window.addEventListener("pointermove", (event) => {
  document.body.style.setProperty("--cursor-x", `${event.clientX}px`);
  document.body.style.setProperty("--cursor-y", `${event.clientY}px`);
});

window.addEventListener("scroll", updateScene, { passive: true });
window.addEventListener("resize", updateScene);

enableTextPop();
triggerReturnAnimation();
updateScene();
setupPhotoPrompt();
setupAirReveal();
setupLiquidCardDrift();
