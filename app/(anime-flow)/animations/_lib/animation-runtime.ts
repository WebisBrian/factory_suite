/**
 * Contenu de `animations.js` : script autonome (sans dépendance) qui lit la
 * config `animations.json` et joue les animations sur le site généré.
 *
 * Écrit en JavaScript simple dans une chaîne : il tourne sur le site final,
 * pas dans FactorySuite. Il doit rester compatible avec le format de
 * `animation-config.ts` (version 1).
 */

import { CONFIG_FILE, SCRIPT_FILE } from "@/app/(anime-flow)/animations/_lib/animation-config";

/** Les lignes à ajouter dans le <head> de page.html. */
export const INTEGRATION_SNIPPET = `<script src="${SCRIPT_FILE}" defer></script>`;

export const ANIMATION_RUNTIME_JS = `/*
 * ${SCRIPT_FILE} — généré par FactorySuite Animations (AnimFlow).
 *
 * Intégration : placez ${SCRIPT_FILE} et ${CONFIG_FILE} à côté de la page, puis
 * ajoutez dans son <head> :
 *
 *   ${INTEGRATION_SNIPPET}
 *
 * La config est lue dans cet ordre :
 *   1. un bloc <script type="application/json" id="anime-flow-config"> dans la page
 *      (à préférer si le site est ouvert en file://, où fetch est bloqué) ;
 *   2. sinon le fichier ${CONFIG_FILE}, à côté de ce script.
 * On peut aussi appeler AnimeFlow.init(config) soi-même.
 *
 * Accessibilité : rien n'est joué si l'utilisateur a demandé à réduire les
 * animations ; chaque animation est jouée une seule fois.
 */
(function () {
  "use strict";

  var script = document.currentScript;
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var running = new WeakMap();

  function play(element, animation) {
    if (reducedMotion.matches || typeof element.animate !== "function") return;
    // Pas de relance tant que l'animation précédente n'est pas finie.
    var current = running.get(element);
    if (current && current.playState === "running") return;
    var player = element.animate(animation.keyframes, {
      duration: animation.duration,
      delay: animation.delay,
      easing: animation.easing,
      iterations: 1,
      fill: "backwards"
    });
    running.set(element, player);
  }

  var triggers = {
    load: function (element, animation) {
      play(element, animation);
    },
    scroll: function (element, animation) {
      if (!("IntersectionObserver" in window)) return play(element, animation);
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          observer.disconnect();
          play(element, animation);
        });
      }, { threshold: 0.2 });
      observer.observe(element);
    },
    hover: function (element, animation) {
      var handler = function () { play(element, animation); };
      element.addEventListener("mouseenter", handler);
      // Le focus clavier compte comme un survol.
      element.addEventListener("focusin", handler);
    },
    click: function (element, animation) {
      element.addEventListener("click", function () { play(element, animation); });
    }
  };

  function init(config) {
    if (!config || config.version !== 1) {
      console.warn("[AnimeFlow] Config absente ou de version inconnue.");
      return;
    }
    config.elements.forEach(function (entry) {
      var element = document.getElementById(entry.elementId);
      var animation = config.animations[entry.animation];
      var trigger = triggers[entry.event];
      if (!element || !animation || !trigger) {
        console.warn("[AnimeFlow] Ignoré :", entry);
        return;
      }
      // Durée et délai propres à l'élément ; la durée de l'animation sert par défaut.
      trigger(element, {
        keyframes: animation.keyframes,
        easing: animation.easing,
        duration: typeof entry.duration === "number" ? entry.duration : animation.duration,
        delay: typeof entry.delay === "number" ? entry.delay : 0
      });
    });
  }

  function loadConfig() {
    var inline = document.getElementById("anime-flow-config");
    if (inline) return Promise.resolve(JSON.parse(inline.textContent));
    var url = new URL("${CONFIG_FILE}", script && script.src ? script.src : document.baseURI);
    return fetch(url).then(function (response) {
      if (!response.ok) throw new Error(response.status + " " + response.statusText);
      return response.json();
    });
  }

  function start() {
    loadConfig().then(init, function (error) {
      console.warn("[AnimeFlow] Impossible de lire ${CONFIG_FILE} :", error);
    });
  }

  window.AnimeFlow = { init: init };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
`;
