// Exemple d'animation — Anime Flow
//
// Une animation est décrite en données (déclencheur + cible + keyframes),
// puis appliquée à un HTML existant via la Web Animations API (aucune dépendance).
//
// Usage dans une page : <script src="example.js"></script>
// Le HTML doit contenir les éléments ciblés (#hero-title, .card, #cta-button).

const animations = [
  {
    id: "hero-fade-in",
    trigger: "load",
    target: "#hero-title",
    keyframes: [
      { opacity: 0, transform: "translateY(24px)" },
      { opacity: 1, transform: "translateY(0)" },
    ],
    options: { duration: 600, easing: "ease-out", fill: "both" },
  },
  {
    id: "cards-stagger",
    trigger: "scroll", // joue quand l'élément entre dans le viewport
    target: ".card",
    stagger: 120, // décalage (ms) entre chaque élément ciblé
    keyframes: [
      { opacity: 0, transform: "scale(0.9)" },
      { opacity: 1, transform: "scale(1)" },
    ],
    options: { duration: 400, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)", fill: "both" },
  },
  {
    id: "cta-pulse",
    trigger: "hover",
    target: "#cta-button",
    keyframes: [
      { transform: "scale(1)" },
      { transform: "scale(1.08)" },
      { transform: "scale(1)" },
    ],
    options: { duration: 300, easing: "ease-in-out" },
  },
  {
    id: "cta-shake",
    trigger: "click",
    target: "#cta-button",
    keyframes: [
      { transform: "translateX(0)" },
      { transform: "translateX(-6px)" },
      { transform: "translateX(6px)" },
      { transform: "translateX(0)" },
    ],
    options: { duration: 250, iterations: 2 },
  },
];

function play(element, anim, index = 0) {
  return element.animate(anim.keyframes, {
    ...anim.options,
    delay: (anim.options.delay ?? 0) + index * (anim.stagger ?? 0),
  });
}

function bindAnimation(anim) {
  const elements = Array.from(document.querySelectorAll(anim.target));
  if (elements.length === 0) {
    console.warn(`[anime-flow] "${anim.id}" : aucune cible pour ${anim.target}`);
    return;
  }

  switch (anim.trigger) {
    case "load":
      elements.forEach((el, i) => play(el, anim, i));
      break;

    case "scroll": {
      // Masque les éléments jusqu'à leur apparition pour éviter un flash.
      elements.forEach((el) => (el.style.opacity = "0"));
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            play(el, anim, elements.indexOf(el)).finished.then(() => (el.style.opacity = ""));
            observer.unobserve(el);
          });
        },
        { threshold: 0.2 },
      );
      elements.forEach((el) => observer.observe(el));
      break;
    }

    case "hover":
      elements.forEach((el) => el.addEventListener("mouseenter", () => play(el, anim)));
      break;

    case "click":
      elements.forEach((el) => el.addEventListener("click", () => play(el, anim)));
      break;

    default:
      console.warn(`[anime-flow] "${anim.id}" : déclencheur inconnu "${anim.trigger}"`);
  }
}

function initAnimations(list = animations) {
  // Respecte la préférence système « réduire les animations ».
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  list.forEach(bindAnimation);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => initAnimations());
} else {
  initAnimations();
}
