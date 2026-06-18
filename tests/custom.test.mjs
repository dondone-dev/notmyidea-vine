import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const CUSTOM_JS = readFileSync(
  new URL("../static/js/custom.js", import.meta.url),
  "utf8"
);
const CUSTOM_CSS = readFileSync(
  new URL("../static/css/main.css", import.meta.url),
  "utf8"
);

class FakeClassList {
  constructor(node) {
    this.node = node;
  }

  add(...tokens) {
    const set = new Set(this.node.className.split(/\s+/).filter(Boolean));
    tokens.forEach((token) => set.add(token));
    this.node.className = Array.from(set).join(" ");
  }

  remove(...tokens) {
    const removeSet = new Set(tokens);
    this.node.className = this.node.className
      .split(/\s+/)
      .filter((token) => token && !removeSet.has(token))
      .join(" ");
  }

  contains(token) {
    return this.node.className.split(/\s+/).includes(token);
  }

  toggle(token, force) {
    if (force === undefined) {
      if (this.contains(token)) {
        this.remove(token);
        return false;
      }
      this.add(token);
      return true;
    }
    if (force) {
      this.add(token);
      return true;
    }
    this.remove(token);
    return false;
  }
}

class FakeElement {
  constructor(tagName, ownerDocument) {
    this.tagName = tagName.toUpperCase();
    this.ownerDocument = ownerDocument;
    this.parentElement = null;
    this.children = [];
    this.attributes = new Map();
    this.style = {};
    this.dataset = {};
    this.className = "";
    this.classList = new FakeClassList(this);
    this.eventHandlers = new Map();
  }

  appendChild(child) {
    if (child.parentElement) {
      child.parentElement.removeChild(child);
    }
    child.parentElement = this;
    this.children.push(child);
    return child;
  }

  insertBefore(child, referenceNode) {
    if (!referenceNode) {
      return this.appendChild(child);
    }
    if (child.parentElement) {
      child.parentElement.removeChild(child);
    }
    const index = this.children.indexOf(referenceNode);
    if (index === -1) {
      throw new Error("reference node not found");
    }
    child.parentElement = this;
    this.children.splice(index, 0, child);
    return child;
  }

  removeChild(child) {
    const index = this.children.indexOf(child);
    if (index === -1) {
      throw new Error("child not found");
    }
    this.children.splice(index, 1);
    child.parentElement = null;
    return child;
  }

  setAttribute(name, value) {
    const stringValue = String(value);
    this.attributes.set(name, stringValue);
    if (name === "class") {
      this.className = stringValue;
    } else if (name === "href") {
      this.href = stringValue;
    } else if (name.startsWith("data-")) {
      const dataKey = name
        .slice(5)
        .replace(/-([a-z])/g, (_, char) => char.toUpperCase());
      this.dataset[dataKey] = stringValue;
    }
  }

  getAttribute(name) {
    if (name === "class") {
      return this.className || null;
    }
    return this.attributes.get(name) ?? null;
  }

  addEventListener(type, handler) {
    this.eventHandlers.set(type, handler);
  }

  cloneNode(deep = false) {
    const clone = new FakeElement(this.tagName, this.ownerDocument);
    clone.className = this.className;
    clone.style = { ...this.style };
    clone.dataset = { ...this.dataset };
    clone.href = this.href;
    clone.src = this.src;
    clone.alt = this.alt;
    clone.complete = this.complete;
    clone.naturalWidth = this.naturalWidth;
    clone.naturalHeight = this.naturalHeight;
    this.attributes.forEach((value, key) => clone.attributes.set(key, value));
    if (deep) {
      this.children.forEach((child) => clone.appendChild(child.cloneNode(true)));
    }
    return clone;
  }

  matches(selector) {
    if (selector === "img") {
      return this.tagName === "IMG";
    }
    if (selector === "a") {
      return this.tagName === "A";
    }
    if (selector.startsWith(".")) {
      return this.classList.contains(selector.slice(1));
    }
    return false;
  }

  closest(selector) {
    let current = this;
    while (current) {
      if (current.matches(selector)) {
        return current;
      }
      current = current.parentElement;
    }
    return null;
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }

  querySelectorAll(selector) {
    const results = [];
    const matcher = buildMatcher(selector);

    function visit(node) {
      node.children.forEach((child) => {
        if (matcher(child)) {
          results.push(child);
        }
        visit(child);
      });
    }

    visit(this);
    return results;
  }
}

class FakeDocument {
  constructor() {
    this.body = new FakeElement("body", this);
    this.head = new FakeElement("head", this);
    this.eventHandlers = new Map();
  }

  createElement(tagName) {
    return new FakeElement(tagName, this);
  }

  querySelector(selector) {
    return this.body.querySelector(selector);
  }

  querySelectorAll(selector) {
    return this.body.querySelectorAll(selector);
  }

  addEventListener(type, handler) {
    this.eventHandlers.set(type, handler);
  }
}

function buildMatcher(selector) {
  const normalized = selector.trim();

  if (normalized === "img" || normalized === "a") {
    return (node) => node.matches(normalized);
  }

  if (normalized.startsWith(".")) {
    return (node) => node.matches(normalized);
  }

  throw new Error(`Unsupported selector in fake DOM: ${selector}`);
}

function createImage(document, src) {
  const img = document.createElement("img");
  img.src = src;
  img.alt = src;
  img.complete = true;
  img.naturalWidth = 1200;
  img.naturalHeight = 800;
  return img;
}

function loadHooks() {
  const document = new FakeDocument();
  const context = {
    console,
    document,
    window: { document, matchMedia: () => ({ matches: false }), addEventListener() {} },
    Math,
    Array,
    Object,
    Set,
    Map,
    String,
    Number,
    Boolean,
    RegExp,
    globalThis: {}
  };

  context.globalThis = context;
  vm.runInNewContext(CUSTOM_JS, context, { filename: "custom.js" });
  return context.__customJsTestHooks;
}

test("shared helper wraps plain layout images into grouped glightbox links", () => {
  const hooks = loadHooks();
  assert.ok(hooks, "expected custom.js to expose test hooks");

  const document = new FakeDocument();
  const pair = document.createElement("div");
  pair.className = "media-pair";
  pair.appendChild(createImage(document, "/a.jpg"));
  pair.appendChild(createImage(document, "/b.jpg"));

  hooks.wrapImagesWithLightbox(pair, "pair");

  const links = pair.querySelectorAll(".glightbox");
  assert.equal(links.length, 2);
  assert.equal(links[0].getAttribute("data-gallery"), links[1].getAttribute("data-gallery"));
  assert.equal(links[0].querySelector("img").src, "/a.jpg");
});

test("shared helper also wraps single-image layout into glightbox links", () => {
  const hooks = loadHooks();
  assert.ok(hooks, "expected custom.js to expose test hooks");

  const document = new FakeDocument();
  const single = document.createElement("div");
  single.className = "media-single media-w-45";
  single.appendChild(createImage(document, "/single.jpg"));

  const links = hooks.wrapImagesWithLightbox(single, "single");

  assert.equal(links.length, 1);
  assert.equal(single.querySelectorAll(".glightbox").length, 1);
  assert.equal(links[0].querySelector("img").src, "/single.jpg");
});

test("shared helper wraps standalone article images without media container", () => {
  const hooks = loadHooks();
  assert.ok(hooks, "expected custom.js to expose test hooks");

  const document = new FakeDocument();
  const article = document.createElement("div");
  article.className = "entry-content";
  article.appendChild(createImage(document, "/plain.jpg"));

  const links = hooks.wrapImagesWithLightbox(article, "plain");

  assert.equal(links.length, 1);
  assert.equal(article.querySelectorAll(".glightbox").length, 1);
  assert.equal(links[0].querySelector("img").src, "/plain.jpg");
});

test("shared helper skips images that are already wrapped in links", () => {
  const hooks = loadHooks();
  assert.ok(hooks, "expected custom.js to expose test hooks");

  const document = new FakeDocument();
  const split = document.createElement("div");
  split.className = "media-split";

  const linked = document.createElement("a");
  linked.className = "glightbox";
  linked.href = "/existing.jpg";
  linked.appendChild(createImage(document, "/existing.jpg"));
  split.appendChild(linked);
  split.appendChild(createImage(document, "/new.jpg"));

  hooks.wrapImagesWithLightbox(split, "split");

  const links = split.querySelectorAll("a");
  assert.equal(links.length, 2);
  assert.equal(links[0].querySelectorAll("a").length, 0, "should not nest anchors");
});

test("shared helper uses explicit data-fullsrc for lightbox targets", () => {
  const hooks = loadHooks();
  assert.ok(hooks, "expected custom.js to expose test hooks");

  const document = new FakeDocument();
  const grid = document.createElement("div");
  grid.className = "media-grid";

  const img = createImage(document, "/photos/01_w240.JPG");
  img.setAttribute("data-fullsrc", "/photos/01.JPG");
  grid.appendChild(img);

  const links = hooks.wrapImagesWithLightbox(grid, "grid");

  assert.equal(links.length, 1);
  assert.equal(links[0].href, "/photos/01.JPG");
  assert.equal(links[0].querySelector("img").src, "/photos/01_w240.JPG");
});

test("shared helper falls back from width-suffixed thumbnails to originals", () => {
  const hooks = loadHooks();
  assert.ok(hooks, "expected custom.js to expose test hooks");

  const document = new FakeDocument();
  const grid = document.createElement("div");
  grid.className = "media-grid";
  grid.appendChild(createImage(document, "/photos/01_w240.JPG"));

  const links = hooks.wrapImagesWithLightbox(grid, "grid");

  assert.equal(links.length, 1);
  assert.equal(links[0].href, "/photos/01.JPG");
});

test("shared helper preserves explicit anchor href for original images", () => {
  const hooks = loadHooks();
  assert.ok(hooks, "expected custom.js to expose test hooks");

  const document = new FakeDocument();
  const grid = document.createElement("div");
  grid.className = "media-grid";

  const link = document.createElement("a");
  link.href = "/photos/01.JPG";
  link.appendChild(createImage(document, "/photos/01_w240.JPG"));
  grid.appendChild(link);

  const links = hooks.wrapImagesWithLightbox(grid, "grid");

  assert.equal(links.length, 1);
  assert.equal(links[0].href, "/photos/01.JPG");
  assert.equal(links[0].querySelector("img").src, "/photos/01_w240.JPG");
});

test("media pair with more than two images is enhanced into a two-up carousel", () => {
  const hooks = loadHooks();
  assert.ok(hooks, "expected custom.js to expose test hooks");
  assert.equal(typeof hooks.enhanceMediaPair, "function");

  const document = new FakeDocument();
  const pair = document.createElement("div");
  pair.className = "media-pair";

  for (const src of ["/a.jpg", "/b.jpg", "/c.jpg", "/d.jpg"]) {
    const link = document.createElement("a");
    link.className = "glightbox";
    link.href = src;
    link.appendChild(createImage(document, src));
    pair.appendChild(link);
  }

  hooks.enhanceMediaPair(pair);

  assert.ok(pair.classList.contains("is-carousel"));
  assert.equal(pair.querySelectorAll(".media-pair-viewport").length, 1);
  assert.equal(pair.querySelectorAll(".media-pair-track").length, 1);
  assert.equal(pair.querySelectorAll(".media-pair-item").length, 4);

  const buttons = pair.querySelectorAll(".media-pair-btn");
  const prevBtn = buttons.find((button) => button.classList.contains("prev"));
  const nextBtn = buttons.find((button) => button.classList.contains("next"));
  assert.ok(prevBtn);
  assert.ok(nextBtn);
  assert.equal(prevBtn.disabled, true);
  assert.equal(nextBtn.disabled, false);
});

test("clickable article image areas use pointer cursor instead of zoom-in", () => {
  assert.match(CUSTOM_CSS, /\.entry-content \.media-carousel-track img[\s\S]*cursor: pointer;/);
  assert.match(CUSTOM_CSS, /\.entry-content \.mg-item\.mg-center[\s\S]*cursor: pointer;/);
  assert.match(CUSTOM_CSS, /\.entry-content \.media-single a\.glightbox img[\s\S]*cursor: pointer;/);
  assert.match(CUSTOM_CSS, /\.entry-content a\.glightbox img[\s\S]*cursor: pointer;/);
  assert.doesNotMatch(CUSTOM_CSS, /\.entry-content \.media-carousel-track img[\s\S]*cursor: zoom-in;/);
  assert.doesNotMatch(CUSTOM_CSS, /\.entry-content \.mg-item\.mg-center[\s\S]*cursor: zoom-in;/);
});

test("content lightbox links suppress theme hover underline styling", () => {
  assert.match(
    CUSTOM_CSS,
    /\.entry-content \.media-grid a\.glightbox:hover,[\s\S]*text-decoration: none !important;/
  );
  assert.match(
    CUSTOM_CSS,
    /\.entry-content \.media-grid a\.glightbox:hover,[\s\S]*border-bottom: none !important;/
  );
  assert.match(
    CUSTOM_CSS,
    /\.entry-content \.media-grid a\.glightbox:hover,[\s\S]*background: none !important;/
  );
  assert.match(
    CUSTOM_CSS,
    /\.entry-content \.media-single a\.glightbox:hover,[\s\S]*text-decoration: none !important;/
  );
  assert.match(
    CUSTOM_CSS,
    /\.entry-content a\.glightbox:hover,[\s\S]*text-decoration: none !important;/
  );
});

test("enhanced media pair CSS defines viewport and controls", () => {
  assert.match(
    CUSTOM_CSS,
    /\.media-pair\.is-carousel[\s\S]*display: block;/
  );
  assert.match(
    CUSTOM_CSS,
    /\.media-pair-viewport[\s\S]*overflow: hidden;/
  );
  assert.match(
    CUSTOM_CSS,
    /\.media-pair-btn\.prev[\s\S]*left: 10px;/
  );
});

test("portrait row CSS defines dedicated preset height utilities", () => {
  assert.match(
    CUSTOM_CSS,
    /\.media-portrait-row[\s\S]*display:\s*flex;[\s\S]*justify-content:\s*flex-start;[\s\S]*align-items:\s*flex-start;[\s\S]*flex-wrap:\s*nowrap;/
  );
  assert.match(
    CUSTOM_CSS,
    /\.media-portrait-h-220[\s\S]*--media-portrait-height:\s*220px;/
  );
  assert.match(
    CUSTOM_CSS,
    /\.media-portrait-h-240[\s\S]*--media-portrait-height:\s*240px;/
  );
  assert.match(
    CUSTOM_CSS,
    /\.media-portrait-h-280[\s\S]*--media-portrait-height:\s*280px;/
  );
  assert.match(
    CUSTOM_CSS,
    /\.media-portrait-h-360[\s\S]*--media-portrait-height:\s*360px;/
  );
  assert.match(
    CUSTOM_CSS,
    /\.media-portrait-h-480[\s\S]*--media-portrait-height:\s*480px;/
  );
});

test("portrait row keeps narrow portrait images left-aligned without carousel behavior", () => {
  assert.match(
    CUSTOM_CSS,
    /\.media-portrait-row img[\s\S]*width:\s*auto;[\s\S]*height:\s*var\(--media-portrait-height\);[\s\S]*object-fit:\s*contain;/
  );
  assert.match(
    CUSTOM_CSS,
    /\.media-portrait-row > a\.glightbox[\s\S]*display:\s*flex;[\s\S]*justify-content:\s*flex-start;/
  );
  assert.match(
    CUSTOM_JS,
    /if \(items.length <= 2\)/
  );
  assert.match(
    CUSTOM_JS,
    /container\.classList\.add\("is-carousel"\)/
  );
});

test("image lightbox hides the bottom description area", () => {
  assert.match(
    CUSTOM_CSS,
    /\.glightbox-container \.gslide-description[\s\S]*display: none !important;/
  );
});

test("media split reverse keeps wrapped lightbox image on the right side", () => {
  assert.match(
    CUSTOM_CSS,
    /\[data-media-layouts="true"\]\.entry-content \.media-split\.reverse > a\.glightbox[\s\S]*order: 2;/
  );
});

test("media layout JS only initializes inside feature-flagged containers", () => {
  assert.match(
    CUSTOM_JS,
    /querySelectorAll\('\[data-media-layouts="true"\]'\)/
  );
});

test("media layout CSS is scoped to feature-flagged containers", () => {
  assert.match(
    CUSTOM_CSS,
    /\[data-media-layouts="true"\]\.entry-content \.media-grid/
  );
  assert.match(
    CUSTOM_CSS,
    /\[data-media-layouts="true"\]\.memo-content-text \.media-grid/
  );
});

test("gallery initializer does not re-bind every scoped glightbox element", () => {
  assert.match(
    CUSTOM_JS,
    /selector: '\[data-media-layouts="true"\] \.gallery \.glightbox'/
  );
});

test("content lightbox initializer includes single-image layouts", () => {
  assert.match(
    CUSTOM_JS,
    /querySelectorAll\("\.media-pair, \.media-grid, \.media-split, \.media-single"\)/
  );
  assert.match(
    CUSTOM_JS,
    /selector: '\.entry-content \.glightbox, \.memo-content-text \.glightbox'/
  );
});

test("media navigation buttons use lucide chevrons instead of text glyphs", () => {
  assert.match(CUSTOM_JS, /createChevronIconMarkup/);
  assert.match(CUSTOM_JS, /icon-chevron-left/);
  assert.match(CUSTOM_JS, /icon-chevron-right/);
  assert.doesNotMatch(CUSTOM_JS, /&#8249;|&#8250;/);
  assert.match(CUSTOM_CSS, /\.media-pair-btn \.lucide-icon[\s\S]*width: 18px;/);
});

test("details code blocks override entry-content shiki margins", () => {
  assert.match(
    CUSTOM_CSS,
    /\.entry-content details pre\.shiki,[\s\S]*margin: 0;/
  );
  assert.match(
    CUSTOM_CSS,
    /\.entry-content details pre\.shiki,[\s\S]*border-radius: 0;/
  );
});

test("rich details define padded content styling", () => {
  assert.match(
    CUSTOM_CSS,
    /\.entry-content details\.details-rich,\s*[\s\S]*\.memo-content-text details\.details-rich/
  );
  assert.match(
    CUSTOM_CSS,
    /\.entry-content details\.details-rich\[open\] > :not\(summary\),[\s\S]*padding:/
  );
});
