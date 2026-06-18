// Theme-level JS helpers.
const LightboxHelpers = {
  getMediaLayoutScopes: function () {
    return Array.from(document.querySelectorAll('[data-media-layouts="true"]'));
  },

  getThemeStaticDir: function () {
    return (document.body.dataset.themeStatic || "/theme").replace(/\/+$/, "");
  },

  createGroupId: function (prefix) {
    return prefix + "-" + Math.random().toString(36).slice(2, 8);
  },

  createChevronIconMarkup: function (direction) {
    var iconClass = direction === "right" ? "icon-chevron-right" : "icon-chevron-left";
    var path = direction === "right"
      ? '<path d="m9 18 6-6-6-6" />'
      : '<path d="m15 18-6-6 6-6" />';

    return '<svg class="lucide-icon ' + iconClass + '" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + path + "</svg>";
  },

  buildLightboxConfig: function (img) {
    var title = (img.alt || "").trim();
    return title ? "type: image; title: " + title : "type: image";
  },

  resolveLightboxHref: function (img) {
    if (!img) {
      return "";
    }

    var fullSrc = img.getAttribute && img.getAttribute("data-fullsrc");
    if (fullSrc) {
      return fullSrc;
    }

    var src = img.src || "";
    return src.replace(/_w\d+(?=\.[^.\/?#]+(?:[?#].*)?$)/, "") || src;
  },

  loadGLightbox: function (themeStatic, cb) {
    if (typeof GLightbox !== "undefined") {
      cb();
      return;
    }

    var css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = themeStatic + "/css/glightbox.min.css";
    document.head.appendChild(css);

    var script = document.createElement("script");
    script.src = themeStatic + "/js/glightbox.min.js";
    script.onload = cb;
    document.head.appendChild(script);
  },

  ensureLightboxLink: function (img, groupId) {
    if (!img || !img.parentElement) {
      return null;
    }

    if (img.parentElement.tagName.toLowerCase() === "a") {
      return img.parentElement;
    }

    var link = document.createElement("a");
    link.href = this.resolveLightboxHref(img);
    link.className = "glightbox";
    link.setAttribute("data-gallery", groupId);
    link.setAttribute("data-glightbox", this.buildLightboxConfig(img));
    img.parentElement.insertBefore(link, img);
    link.appendChild(img);
    return link;
  },

  wrapImagesWithLightbox: function (container, prefix, excludedSelectors) {
    if (!container) {
      return [];
    }

    var blockedSelectors = excludedSelectors || [
      ".media-carousel",
      ".media-gallery",
      ".gallery"
    ];
    var images = Array.from(container.querySelectorAll("img")).filter(function (img) {
      return !blockedSelectors.some(function (selector) {
        return img.closest(selector);
      });
    });

    if (!images.length) {
      return [];
    }

    var groupId = this.createGroupId(prefix);
    var links = [];
    images.forEach(function (img) {
      var link = LightboxHelpers.ensureLightboxLink(img, groupId);
      if (!link) {
        return;
      }

      if (!link.classList.contains("glightbox")) {
        link.classList.add("glightbox");
      }
      if (!link.getAttribute("data-gallery")) {
        link.setAttribute("data-gallery", groupId);
      }
      if (!link.getAttribute("data-glightbox")) {
        link.setAttribute("data-glightbox", LightboxHelpers.buildLightboxConfig(img));
      }
      links.push(link);
    });

    return links;
  }
};

const CustomJS = {
  imageSkeleton: {
    init: function () {
      var images = document.querySelectorAll(".js-image-skeleton");
      if (!images.length) {
        return;
      }

      images.forEach(function (img) {
        var onReady = function () {
          img.classList.add("is-loaded");
        };

        if (img.complete) {
          onReady();
          return;
        }

        img.addEventListener("load", onReady, { once: true });
        img.addEventListener("error", onReady, { once: true });
      });
    }
  },

  mediaGallery: {
    init: function () {
      var themeStatic = LightboxHelpers.getThemeStaticDir();
      var hasLightbox = false;
      var scopes = LightboxHelpers.getMediaLayoutScopes();
      if (!scopes.length) return;

      scopes.forEach(function (scope) {
        var sources = scope.querySelectorAll(".media-gallery");
        sources.forEach(function (source) {
          var imgs = Array.from(source.querySelectorAll(":scope > img"));
          if (!imgs.length) return;

          var n = imgs.length;
          var current = 0;
          var groupId = LightboxHelpers.createGroupId("mg");

          var wrap = document.createElement("div");
          wrap.className = "media-gallery-wrap";
          source.parentNode.insertBefore(wrap, source);

          // 为每张图创建 mg-item，内嵌 glightbox 链接
          var items = imgs.map(function (img, i) {
            var item = document.createElement("div");
            item.className = "mg-item";

            var link = document.createElement("a");
            link.href = img.src;
            link.className = "glightbox";
            link.setAttribute("data-gallery", groupId);
            link.setAttribute("data-glightbox", LightboxHelpers.buildLightboxConfig(img));
            link.style.display = "block";
            link.style.width = "100%";
            link.style.height = "100%";

            link.appendChild(img);
            item.appendChild(link);
            wrap.appendChild(item);
            return item;
          });
          hasLightbox = true;

          var prevBtn = document.createElement("button");
          prevBtn.className = "mg-btn prev";
          prevBtn.innerHTML = LightboxHelpers.createChevronIconMarkup("left");
          prevBtn.setAttribute("aria-label", "上一张");

          var nextBtn = document.createElement("button");
          nextBtn.className = "mg-btn next";
          nextBtn.innerHTML = LightboxHelpers.createChevronIconMarkup("right");
          nextBtn.setAttribute("aria-label", "下一张");

          wrap.appendChild(prevBtn);
          wrap.appendChild(nextBtn);
          source.parentNode.removeChild(source);

          // 根据首张图的真实宽高比动态调整容器
          var refImg = imgs[0];
          function applyRatio() {
            if (refImg.naturalWidth && refImg.naturalHeight) {
              wrap.style.aspectRatio = refImg.naturalWidth + "/" + refImg.naturalHeight;
            }
          }
          if (refImg.complete && refImg.naturalWidth) {
            applyRatio();
          } else {
            refImg.addEventListener("load", applyRatio);
          }

          function update() {
            items.forEach(function (item, i) {
              var link = item.querySelector("a");
              item.classList.remove("mg-center", "mg-left", "mg-right");
              var offset = i - current;
              if (offset > n / 2) offset -= n;
              if (offset < -n / 2) offset += n;

              if (offset === 0) {
                item.classList.add("mg-center");
                link.style.pointerEvents = "auto";
              } else if (offset === -1) {
                item.classList.add("mg-left");
                link.style.pointerEvents = "none";
              } else if (offset === 1) {
                item.classList.add("mg-right");
                link.style.pointerEvents = "none";
              } else {
                link.style.pointerEvents = "none";
              }
            });
          }

          function goTo(idx) {
            current = (idx + n) % n;
            update();
          }

          update();

          prevBtn.addEventListener("click", function (e) { e.stopPropagation(); goTo(current - 1); });
          nextBtn.addEventListener("click", function (e) { e.stopPropagation(); goTo(current + 1); });

          items.forEach(function (item, i) {
            item.addEventListener("click", function (e) {
              if (i !== current) {
                e.preventDefault();
                goTo(i);
              }
            });
          });
        });
      });

      if (hasLightbox) {
        LightboxHelpers.loadGLightbox(themeStatic, function () {
          GLightbox({ selector: '[data-media-layouts="true"] .media-gallery-wrap .glightbox', touchNavigation: true, loop: true });
        });
      }
    }
  },

  carousel: {
    init: function () {
      var themeStatic = LightboxHelpers.getThemeStaticDir();
      var hasLightbox = false;
      var scopes = LightboxHelpers.getMediaLayoutScopes();
      if (!scopes.length) return;

      scopes.forEach(function (scope) {
        var containers = scope.querySelectorAll(".media-carousel");
        containers.forEach(function (container) {
          var imgs = Array.from(container.querySelectorAll(":scope > img"));
          if (!imgs.length) return;

          var n = imgs.length;
          var groupId = LightboxHelpers.createGroupId("mc");

        // 构建 glightbox 链接
        var links = imgs.map(function (img) {
          var link = document.createElement("a");
          link.href = img.src;
          link.className = "glightbox";
          link.setAttribute("data-gallery", groupId);
          link.setAttribute("data-glightbox", LightboxHelpers.buildLightboxConfig(img));
          link.appendChild(img);
          return link;
        });
        hasLightbox = true;

        // 克隆首尾：轨道结构为 [clone-last, 1, 2, …, n, clone-first]
        var clonePrev = links[n - 1].cloneNode(true);
        var cloneNext = links[0].cloneNode(true);
        // 克隆节点不参与灯箱
        clonePrev.classList.remove("glightbox");
        cloneNext.classList.remove("glightbox");

        var track = document.createElement("div");
        track.className = "media-carousel-track";
        track.appendChild(clonePrev);
        links.forEach(function (l) { track.appendChild(l); });
        track.appendChild(cloneNext);

        // current 指向真实帧的 track 索引（1 ~ n），从 1 开始
        var current = 1;
        var sliding = false;

        function setPos(idx, animate) {
          if (!animate) track.style.transition = "none";
          track.style.transform = "translateX(-" + (idx * 100) + "%)";
          if (!animate) {
            // 强制重绘后恢复 transition
            track.getBoundingClientRect();
            track.style.transition = "";
          }
        }

        // 初始定位到真实第一帧（无动画）
        setPos(current, false);

        container.appendChild(track);

        if (n < 2) return;

        // 圆点（对应真实帧 1~n）
        var dotsBar = document.createElement("div");
        dotsBar.className = "media-carousel-dots";
        var dots = imgs.map(function (_, i) {
          var dot = document.createElement("button");
          dot.className = "media-carousel-dot" + (i === 0 ? " active" : "");
          dot.setAttribute("aria-label", "第 " + (i + 1) + " 张");
          dotsBar.appendChild(dot);
          return dot;
        });
        container.appendChild(dotsBar);

        function updateDots(trackIdx) {
          var realIdx = (trackIdx - 1 + n) % n;
          dots.forEach(function (d, i) { d.classList.toggle("active", i === realIdx); });
        }

        function goTo(trackIdx) {
          if (sliding) return;
          sliding = true;
          current = trackIdx;
          setPos(current, true);
          updateDots(current);
        }

        // transitionend：到达克隆帧时无感跳回真实帧
        track.addEventListener("transitionend", function () {
          sliding = false;
          if (current === 0) {
            current = n;
            setPos(current, false);
            updateDots(current);
          } else if (current === n + 1) {
            current = 1;
            setPos(current, false);
            updateDots(current);
          }
        });

        dots.forEach(function (dot, i) {
          dot.addEventListener("click", function (e) {
            e.stopPropagation();
            goTo(i + 1);
          });
        });

        var prevBtn = document.createElement("button");
        prevBtn.className = "media-carousel-btn prev";
        prevBtn.innerHTML = LightboxHelpers.createChevronIconMarkup("left");
        prevBtn.setAttribute("aria-label", "上一张");
        prevBtn.addEventListener("click", function (e) {
          e.stopPropagation();
          goTo(current - 1);
        });

        var nextBtn = document.createElement("button");
        nextBtn.className = "media-carousel-btn next";
        nextBtn.innerHTML = LightboxHelpers.createChevronIconMarkup("right");
        nextBtn.setAttribute("aria-label", "下一张");
        nextBtn.addEventListener("click", function (e) {
          e.stopPropagation();
          goTo(current + 1);
        });

          container.appendChild(prevBtn);
          container.appendChild(nextBtn);
        });
      });

      if (hasLightbox) {
        LightboxHelpers.loadGLightbox(themeStatic, function () {
          GLightbox({ selector: '[data-media-layouts="true"] .media-carousel .glightbox', touchNavigation: true, loop: true });
        });
      }
    }
  },

  contentLightbox: {
    init: function () {
      var scopes = Array.from(document.querySelectorAll(".entry-content, .memo-content-text"));
      if (!scopes.length) {
        return;
      }

      var themeStatic = LightboxHelpers.getThemeStaticDir();
      var hasLightbox = false;

      scopes.forEach(function (scope, scopeIndex) {
        var containers = scope.querySelectorAll(".media-pair, .media-grid, .media-split, .media-single");
        containers.forEach(function (container, index) {
          var links = LightboxHelpers.wrapImagesWithLightbox(container, "content-" + scopeIndex + "-" + index);
          if (links.length) {
            hasLightbox = true;
          }
          if (container.classList.contains("media-pair")) {
            CustomJS.mediaPair.enhance(container);
          }
        });

        var standaloneLinks = LightboxHelpers.wrapImagesWithLightbox(
          scope,
          "content-scope-" + scopeIndex,
          [
            ".media-carousel",
            ".media-gallery",
            ".gallery",
            ".media-pair",
            ".media-grid",
            ".media-split",
            ".media-single"
          ]
        );
        if (standaloneLinks.length) {
          hasLightbox = true;
        }
      });

      if (hasLightbox) {
        LightboxHelpers.loadGLightbox(themeStatic, function () {
          GLightbox({
            selector: '.entry-content .glightbox, .memo-content-text .glightbox',
            touchNavigation: true,
            loop: true
          });
        });
      }
    }
  },

  mediaPair: {
    enhance: function (container) {
      if (!container || container.classList.contains("is-carousel")) {
        return;
      }

      var items = Array.from(container.children).filter(function (child) {
        if (!child.tagName) {
          return false;
        }
        var tagName = child.tagName.toLowerCase();
        return tagName === "a" || tagName === "img";
      });

      if (items.length <= 2) {
        return;
      }

      var visibleCount = 2;
      var current = 0;
      var maxStart = items.length - visibleCount;

      container.classList.add("is-carousel");

      var viewport = document.createElement("div");
      viewport.className = "media-pair-viewport";

      var track = document.createElement("div");
      track.className = "media-pair-track";

      items.forEach(function (item) {
        var slot = document.createElement("div");
        slot.className = "media-pair-item";
        track.appendChild(slot);
        slot.appendChild(item);
      });

      viewport.appendChild(track);
      container.appendChild(viewport);

      var prevBtn = document.createElement("button");
      prevBtn.className = "media-pair-btn prev";
      prevBtn.innerHTML = LightboxHelpers.createChevronIconMarkup("left");
      prevBtn.setAttribute("aria-label", "向左查看图片");

      var nextBtn = document.createElement("button");
      nextBtn.className = "media-pair-btn next";
      nextBtn.innerHTML = LightboxHelpers.createChevronIconMarkup("right");
      nextBtn.setAttribute("aria-label", "向右查看图片");

      function update() {
        track.style.transform = "translateX(calc(-" + current + " * ((100% + var(--media-pair-gap)) / 2)))";
        prevBtn.disabled = current === 0;
        nextBtn.disabled = current >= maxStart;
        prevBtn.classList.toggle("is-hidden", prevBtn.disabled);
        nextBtn.classList.toggle("is-hidden", nextBtn.disabled);
      }

      prevBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        if (current === 0) {
          return;
        }
        current -= 1;
        update();
      });

      nextBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        if (current >= maxStart) {
          return;
        }
        current += 1;
        update();
      });

      container.appendChild(prevBtn);
      container.appendChild(nextBtn);
      update();
    }
  },

  gallery: {
    init: function () {
      var themeStatic = LightboxHelpers.getThemeStaticDir();
      var scopes = LightboxHelpers.getMediaLayoutScopes();
      if (!scopes.length) return;

      scopes.forEach(function (scope) {
        var containers = scope.querySelectorAll(".gallery");
        containers.forEach(function (container) {
          var groupId = LightboxHelpers.createGroupId("gallery");
          var imgs = container.querySelectorAll("img");
          imgs.forEach(function (img) {
            if (img.parentElement && img.parentElement.tagName.toLowerCase() === "a") return;
            var link = document.createElement("a");
            link.href = img.src;
            link.className = "glightbox";
            link.setAttribute("data-gallery", groupId);
            link.setAttribute("data-glightbox", LightboxHelpers.buildLightboxConfig(img));
            img.parentElement.insertBefore(link, img);
            link.appendChild(img);
          });
        });
      });

      function initGLightbox() {
        GLightbox({ selector: '[data-media-layouts="true"] .gallery .glightbox', touchNavigation: true, loop: true });
      }

      LightboxHelpers.loadGLightbox(themeStatic, initGLightbox);
    }
  },

  masonryGrid: {
    getColumnCount: function (grid) {
      if (window.matchMedia("(max-width: 768px)").matches) {
        return 1;
      }
      if (grid.classList.contains("cols-4")) return 4;
      if (grid.classList.contains("cols-3")) return 3;
      if (grid.classList.contains("cols-1")) return 1;
      return 2;
    },

    ensureStructure: function (grid, columnsCount) {
      var wrap = grid.querySelector(".media-grid-masonry-columns");
      if (!wrap) {
        wrap = document.createElement("div");
        wrap.className = "media-grid-masonry-columns";
        grid.appendChild(wrap);
      }

      var columns = Array.from(
        wrap.querySelectorAll(".media-grid-masonry-column")
      );

      while (columns.length < columnsCount) {
        var col = document.createElement("div");
        col.className = "media-grid-masonry-column";
        wrap.appendChild(col);
        columns.push(col);
      }

      while (columns.length > columnsCount) {
        wrap.removeChild(columns[columns.length - 1]);
        columns.pop();
      }

      return columns;
    },

    relayout: function (grid) {
      if (!grid._masonryItems) {
        grid._masonryItems = Array.from(grid.children).filter(function (child) {
          if (!child.tagName) {
            return false;
          }
          var tagName = child.tagName.toLowerCase();
          return tagName === "img" || (tagName === "a" && child.classList.contains("glightbox"));
        });
      }
      if (!grid._masonryItems.length) {
        return;
      }

      var columnsCount = this.getColumnCount(grid);
      grid.style.setProperty("--media-js-columns", String(columnsCount));
      var columns = this.ensureStructure(grid, columnsCount);

      columns.forEach(function (col) {
        col.innerHTML = "";
      });

      grid._masonryItems.forEach(function (item, idx) {
        columns[idx % columnsCount].appendChild(item);
      });
    },

    init: function () {
      var self = this;
      var grids = Array.from(document.querySelectorAll('[data-media-layouts="true"] .media-grid.masonry-js'));
      if (!grids.length) {
        return;
      }

      grids.forEach(function (grid) {
        self.relayout(grid);
        if (grid._masonryBound) {
          return;
        }

        var imgs = Array.from(grid.querySelectorAll("img"));
        imgs.forEach(function (img) {
          if (!img.complete) {
            img.addEventListener(
              "load",
              function () {
                self.relayout(grid);
              },
              { once: true }
            );
          }
        });
        grid._masonryBound = true;
      });

      window.addEventListener("resize", function () {
        grids.forEach(function (grid) {
          self.relayout(grid);
        });
      });
    }
  },

  recentArticles: {
    init: function () {
      var toggle = document.getElementById("recentToggle");
      var list = document.getElementById("recentList");
      if (!toggle || !list) return;
      toggle.addEventListener("click", function () {
        var expanded = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", String(!expanded));
        list.hidden = expanded;
      });
    }
  },

  init: function () {
    this.imageSkeleton.init();
    this.mediaGallery.init();
    this.carousel.init();
    this.gallery.init();
    this.contentLightbox.init();
    this.masonryGrid.init();
    this.recentArticles.init();
  }
};

globalThis.__customJsTestHooks = {
  wrapImagesWithLightbox: function (container, prefix) {
    return LightboxHelpers.wrapImagesWithLightbox(container, prefix);
  },
  enhanceMediaPair: function (container) {
    return CustomJS.mediaPair.enhance(container);
  }
};

document.addEventListener("DOMContentLoaded", function () {
  CustomJS.init();
});
