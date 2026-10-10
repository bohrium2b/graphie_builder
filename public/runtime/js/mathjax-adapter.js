// Bridge from MathJax v3 (open-source, SVG output) to the KaTeX-compatible
// API consumed by Khan Exercises' `tex.js`.
//
// graphie-to-png's `tex.js` expects a global `katex` object with:
//   katex.render(tex, container)  -> renders math into container
//   katex.ParseError              -> thrown on bad TeX
//
// We provide that using MathJax v3's SVG output so the resulting diagrams
// contain real, scalable SVG math (not CHTML) that survives export to
// PNG/SVG/PDF without re-rendering.

(function () {
  "use strict";

  // Configure MathJax BEFORE the bundle loads. MathJax v3 reads
  // window.MathJax as its configuration object at startup, so we
  // set it here. We must NOT use Object.assign on the MathJax
  // object after load: it has getter-only properties (e.g.
  // "Package") and assigning to them throws.
  window.MathJax = {
    tex: {
      inlineMath: [["$", "$"], ["\\(", "\\)"]],
      displayMath: [["$$", "$$"], ["\\[", "\\]"]],
    },
    options: {
      enableMenu: false,
    },
    startup: {
      // Typeset on load so the page is ready.
      typeset: true,
    },
  };

  // Load the MathJax v3 es5 bundle. It is vendored under
  // runtime/js/mathjax. The bundle reads window.MathJax above
  // as its configuration and then starts up.
  var script = document.createElement("script");
  script.src = "runtime/js/mathjax/tex-mml-svg.js";
  script.async = true;
  script.onload = initMathJax;
  script.onerror = function () {
    var msg =
      "Graphie Builder: failed to load MathJax. Math typesetting will be unavailable.";
    console.error(msg);
    window.katex = {
      render: function () {
        throw new Error(msg);
      },
      ParseError: Error,
    };
  };
  document.head.appendChild(script);

  function initMathJax() {
    if (typeof window.MathJax === "undefined" || !window.MathJax.tex2svg) {
      // MathJax auto-configures on load; retry briefly.
      setTimeout(initMathJax, 50);
      return;
    }

    // Wait for MathJax's startup sequence to finish. The SVG
    // font data (this.font.params) is loaded during startup;
    // calling tex2svg before startup.promise resolves throws
    // "can't access property x_height, this.font.params is
    // undefined". Only expose the KaTeX API once startup is
    // complete so tex.js's synchronous katex.render() works.
    var startup = window.MathJax.startup;
    if (startup && startup.promise && typeof startup.promise.then === "function") {
      startup.promise.then(
        function () {
          window.__mathjaxReady = true;
          window.dispatchEvent(new Event("mathjax-ready"));
          exposeKatex();
        },
        function () {
          // Startup failed; still expose the API so errors
          // surface as ParseError rather than undefined.
          window.__mathjaxReady = true;
          window.dispatchEvent(new Event("mathjax-ready"));
          exposeKatex();
        }
      );
    } else {
      window.__mathjaxReady = true;
      window.dispatchEvent(new Event("mathjax-ready"));
      exposeKatex();
    }
  }

  function exposeKatex() {
    // Expose the KaTeX-compatible API. MathJax v3's tex2svg
    // returns an array whose first element is the <svg> node.
    window.katex = {
      render: function (tex, container) {
        if (!container) {
          return;
        }
        try {
          var result = window.MathJax.tex2svg(tex, {
            display: false,
            throwOnError: false,
          });
          container.innerHTML = "";
          // tex2svg returns [svgNode, ...]; append the SVG node
          // so the graphie label contains real SVG math.
          if (result && result[0]) {
            container.appendChild(result[0]);
          }
        } catch (err) {
          // Surface TeX errors as ParseError so tex.js's fallback
          // path is exercised consistently.
          var e = new Error(err && err.message ? err.message : String(err));
          e.name = "ParseError";
          throw e;
        }
      },
      ParseError: function (message) {
        var err = new Error(message);
        err.name = "ParseError";
        return err;
      },
    };
  }
})();