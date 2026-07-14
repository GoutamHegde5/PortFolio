const sideRail = document.getElementById("side-rail");
const intro = document.getElementById("intro");
const scrollPanels = document.querySelectorAll(".scroll-panel");
const projectTiles = document.querySelectorAll(".project-tile");
const photoActions = document.getElementById("photo-actions");
const photoYesButton = document.getElementById("photo-yes-btn");
const photoNoButton = document.getElementById("photo-no-btn");
const photoStatus = document.getElementById("photo-status");
const galleryLaunchOverlay = document.getElementById("gallery-launch-overlay");
const leetcodeHeatmap = document.getElementById("leetcode-heatmap");
const leetcodePanel = document.getElementById("leetcode");
const leetcodeStatus = document.getElementById("leetcode-status");
const textPopTargets = document.querySelectorAll(
  "h1, h2, h3, h4, a, .headline-chip, .intro-notes span, .art-banner, .card-kicker, .eyebrow, .timeline-mark, .identity-name, .rail-label, .leetcode-card-head strong"
);
const revealTargets = document.querySelectorAll(
  ".panel-head, .identity-strip, .intro-copy, .intro-notes, .info-card, .skill-group, .leetcode-copy, .leetcode-card, .project-tile, .timeline-row, .contact-grid a, .photo-tease-box"
);
const liquidCards = document.querySelectorAll(".floating-card, .info-card, .leetcode-copy, .leetcode-card, .project-tile, .quote-block");
const leetcodeDays = [];
const cursorTrailCount = 14;
const cursorState = {
  x: window.innerWidth / 2,
  y: window.innerHeight / 2,
  targetX: window.innerWidth / 2,
  targetY: window.innerHeight / 2,
  lastX: window.innerWidth / 2,
  lastY: window.innerHeight / 2,
  angle: 0,
  speed: 0,
  isVisible: false,
  isResting: true
};
let cursorAura = null;
let cursorTrails = [];
let cursorAnimationFrame = null;
let cursorIdleTimer = null;

function buildLeetcodeHeatmap() {
  if (!leetcodeHeatmap) {
    return;
  }

  leetcodeHeatmap.textContent = "";
  leetcodeDays.length = 0;

  for (let index = 90; index >= 0; index -= 1) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - index);
    const dateKey = date.toISOString().slice(0, 10);
    const square = document.createElement("span");
    square.dataset.level = "0";
    square.dataset.date = dateKey;
    square.title = `${dateKey}: loading`;
    leetcodeHeatmap.appendChild(square);
    leetcodeDays.push({ date, dateKey, square });
  }
}

function getLeetcodeLevel(count) {
  if (count <= 0) {
    return 0;
  }

  if (count === 1) {
    return 1;
  }

  if (count <= 3) {
    return 2;
  }

  if (count <= 5) {
    return 3;
  }

  return 4;
}

function normalizeSubmissionCalendar(calendar) {
  if (!calendar) {
    return {};
  }

  if (typeof calendar === "string") {
    try {
      return JSON.parse(calendar);
    } catch (error) {
      return {};
    }
  }

  return calendar;
}

function applyLeetcodeCalendar(calendar) {
  const normalizedCalendar = normalizeSubmissionCalendar(calendar);
  let activeDays = 0;
  let totalSubmissions = 0;

  leetcodeDays.forEach(({ dateKey, square }) => {
    const [year, month, day] = dateKey.split("-").map(Number);
    const utcSeconds = Math.floor(Date.UTC(year, month - 1, day) / 1000);
    const localSeconds = Math.floor(new Date(`${dateKey}T00:00:00`).getTime() / 1000);
    const count = Number(normalizedCalendar[utcSeconds] || normalizedCalendar[localSeconds] || 0);
    const level = getLeetcodeLevel(count);

    if (count > 0) {
      activeDays += 1;
      totalSubmissions += count;
    }

    square.dataset.level = String(level);
    square.title = `${dateKey}: ${count} submission${count === 1 ? "" : "s"}`;
  });

  if (leetcodeStatus) {
    leetcodeStatus.textContent = `${activeDays} active days, ${totalSubmissions} submissions in the last 91 days`;
  }
}

async function loadLeetcodeActivity() {
  if (!leetcodeHeatmap || !leetcodePanel) {
    return;
  }

  const username = leetcodePanel.dataset.leetcodeUser || "Goutam__Hegde";
  const endpoints = [
    `https://alfa-leetcode-api.onrender.com/${username}/calendar`,
    `https://leetcode-api-faisalshohag.vercel.app/${username}`
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, { cache: "no-store" });

      if (!response.ok) {
        continue;
      }

      const data = await response.json();
      const calendar = data.submissionCalendar || data.calendar;

      if (calendar) {
        applyLeetcodeCalendar(calendar);
        return;
      }
    } catch (error) {
      // Try the next public API; LeetCode does not expose a stable browser API directly.
    }
  }

  if (leetcodeStatus) {
    leetcodeStatus.textContent = "Live LeetCode activity could not load right now";
  }
}

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

function setupCursorEffects() {
  if (window.matchMedia("(pointer: coarse), (prefers-reduced-motion: reduce)").matches) {
    return;
  }

  cursorAura = document.createElement("span");
  cursorAura.className = "cursor-aura";
  cursorAura.setAttribute("aria-hidden", "true");
  document.body.appendChild(cursorAura);

  cursorTrails = Array.from({ length: cursorTrailCount }, (_, index) => {
    const trail = document.createElement("span");
    trail.className = "cursor-trail";
    trail.style.transitionDelay = `${index * 12}ms`;
    trail.style.setProperty("--snake-size", `${Math.max(8, 30 - index * 1.45)}px`);
    trail.style.setProperty("--snake-opacity", `${Math.max(0.16, 0.7 - index * 0.035)}`);
    trail.setAttribute("aria-hidden", "true");
    document.body.appendChild(trail);
    return {
      element: trail,
      x: cursorState.x,
      y: cursorState.y
    };
  });

  const interactiveSelector = "a, button, input, textarea, .project-tile, .info-card, .skill-group, .leetcode-card, .project-shot";

  document.addEventListener("pointerover", (event) => {
    if (event.target.closest(interactiveSelector) && cursorAura) {
      cursorAura.classList.add("is-active");
    }
  });

  document.addEventListener("pointerout", (event) => {
    if (event.target.closest(interactiveSelector) && cursorAura) {
      cursorAura.classList.remove("is-active");
    }
  });

  document.addEventListener("pointerleave", () => {
    cursorState.isVisible = false;
    cursorState.isResting = true;

    if (cursorAura) {
      cursorAura.style.opacity = "0";
    }

    cursorTrails.forEach((trail) => trail.element.classList.remove("is-visible"));
  });

  animateCursorEffects();
}

function animateCursorEffects() {
  const previousX = cursorState.x;
  const previousY = cursorState.y;

  cursorState.x += (cursorState.targetX - cursorState.x) * 0.22;
  cursorState.y += (cursorState.targetY - cursorState.y) * 0.22;
  const velocityX = cursorState.x - previousX;
  const velocityY = cursorState.y - previousY;
  cursorState.speed = Math.min(Math.hypot(velocityX, velocityY), 34);

  if (cursorState.speed > 0.08) {
    cursorState.angle = Math.atan2(velocityY, velocityX);
  }

  if (cursorAura) {
    cursorAura.style.opacity = cursorState.isVisible && !cursorState.isResting ? "1" : "0";
    const auraStretch = 1 + cursorState.speed * 0.012;
    const auraSquash = Math.max(0.82, 1 - cursorState.speed * 0.006);
    cursorAura.style.transform = `translate3d(${cursorState.x}px, ${cursorState.y}px, 0) rotate(${cursorState.angle}rad) scale(${auraStretch}, ${auraSquash})`;
  }

  let followX = cursorState.x;
  let followY = cursorState.y;

  cursorTrails.forEach((trail, index) => {
    const pull = Math.max(0.16, 0.34 - index * 0.011);
    trail.x += (followX - trail.x) * pull;
    trail.y += (followY - trail.y) * pull;
    const trailStretch = 1 + cursorState.speed * 0.02;
    const trailSquash = Math.max(0.68, 1 - cursorState.speed * 0.006);
    const trailScale = 1 - index * 0.018;
    trail.element.style.transform = `translate3d(${trail.x}px, ${trail.y}px, 0) rotate(${cursorState.angle}rad) scale(${trailStretch * trailScale}, ${trailSquash * trailScale})`;
    trail.element.classList.toggle("is-visible", cursorState.isVisible && !cursorState.isResting);
    trail.element.classList.toggle("is-resting", cursorState.isResting);
    followX = trail.x;
    followY = trail.y;
  });

  cursorAnimationFrame = window.requestAnimationFrame(animateCursorEffects);
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
  cursorState.targetX = event.clientX;
  cursorState.targetY = event.clientY;
  cursorState.isVisible = true;
  cursorState.isResting = false;

  window.clearTimeout(cursorIdleTimer);
  cursorIdleTimer = window.setTimeout(() => {
    cursorState.isResting = true;
  }, 520);
});

window.addEventListener("scroll", updateScene, { passive: true });
window.addEventListener("resize", updateScene);

enableTextPop();
buildLeetcodeHeatmap();
loadLeetcodeActivity();
triggerReturnAnimation();
updateScene();
setupPhotoPrompt();
setupAirReveal();
setupLiquidCardDrift();
setupCursorEffects();
