// Lazy-load giscus comments on demand.
(function () {
  "use strict";

  function initLazyComments() {
    var button = document.getElementById("loadCommentsBtn");
    if (!button || button.dataset.loaded === "1") {
      return;
    }

    var containerId = button.dataset.containerId;
    var container = containerId ? document.getElementById(containerId) : null;
    if (!container) {
      return;
    }

    button.addEventListener("click", function () {
      if (button.dataset.loaded === "1") {
        return;
      }

      var script = document.createElement("script");
      var attrs = [
        "repo",
        "repoId",
        "category",
        "categoryId",
        "mapping",
        "strict",
        "reactionsEnabled",
        "emitMetadata",
        "inputPosition",
        "theme",
        "lang"
      ];

      script.src = button.dataset.giscusSrc || "https://giscus.app/client.js";
      script.crossOrigin = "anonymous";
      script.async = true;

      attrs.forEach(function (key) {
        var dataKey = "data-" + key.replace(/[A-Z]/g, function (match) {
          return "-" + match.toLowerCase();
        });
        var value = button.dataset[key];
        if (value) {
          script.setAttribute(dataKey, value);
        }
      });

      container.appendChild(script);
      button.dataset.loaded = "1";
      button.style.display = "none";
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initLazyComments);
  } else {
    initLazyComments();
  }
})();
