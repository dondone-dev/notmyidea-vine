import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

test("removed built-in crypto tools and their vendored dependencies are absent", () => {
  const removedPaths = [
    "templates/tools_aes_page.html",
    "templates/tools_md5_page.html",
    "templates/tools_qrcode_page.html",
    "templates/tools_sha2_page.html",
    "templates/tools_sha3_page.html",
    "templates/tools_blake_page.html",
    "templates/tools_xxhash3_page.html",
    "static/js/tools-aes-core.js",
    "static/js/tools-aes-page.js",
    "static/js/tools-md5-core.js",
    "static/js/tools-md5-page.js",
    "static/js/tools-md5-gbk.js",
    "static/js/tools-qrcode-core.js",
    "static/js/tools-qrcode-page.js",
    "static/js/tools-sha2-core.js",
    "static/js/tools-sha2-page.js",
    "static/js/tools-sha3-core.js",
    "static/js/tools-sha3-page.js",
    "static/js/tools-blake-core.js",
    "static/js/tools-blake-page.js",
    "static/js/tools-xxhash3-core.js",
    "static/js/tools-xxhash3-page.js",
    "static/js/vendor/crypto-js.js",
    "static/js/vendor/spark-md5.min.js",
    "static/js/vendor/qrcode.js",
    "static/js/vendor/jsQR.js",
    "static/js/vendor/sha3.min.js",
    "static/js/vendor/blake2b.umd.min.js",
    "static/js/vendor/blake3.umd.min.js",
    "static/js/vendor/xxhash3.umd.min.js",
    "static/js/vendor/xxhash128.umd.min.js",
    "static/js/vendor/cp936.json"
  ];

  for (const path of removedPaths) {
    assert.equal(existsSync(join(root, path)), false, `${path} should be removed`);
  }
});

test("open-source templates avoid personal hardcoded services and asset roots", () => {
  const adsense = read("templates/partials/adsense.html");
  const morePage = read("templates/page_more.html");
  const reading = read("templates/category_reading.html");

  assert.doesNotMatch(adsense, /ca-pub-\d+/);
  assert.match(adsense, /GOOGLE_ADSENSE_CLIENT/);

  assert.doesNotMatch(morePage, /url\('\/static\//);
  assert.doesNotMatch(morePage, /url\('\/theme\//);

  assert.doesNotMatch(reading, /pages\/books\.html/);
  assert.match(reading, /READING_NOTICE_HTML/);
});

test("repository exposes a local test command without external app files", () => {
  const packageJson = read("package.json");
  const customTest = read("tests/custom.test.mjs");

  assert.match(packageJson, /"test"/);
  assert.doesNotMatch(packageJson, /crypto-js|iconv-lite|spark-md5|qrcode/);
  assert.doesNotMatch(customTest, /pelicanconf\.py|content\/markdown/);
});
