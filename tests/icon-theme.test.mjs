import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const baseTemplate = readFileSync(
  new URL("../templates/base.html", import.meta.url),
  "utf8"
);
const articleInfoTemplate = readFileSync(
  new URL("../templates/article_infos.html", import.meta.url),
  "utf8"
);
const paginationTemplate = readFileSync(
  new URL("../templates/partials/pagination.html", import.meta.url),
  "utf8"
);
const githubTemplate = readFileSync(
  new URL("../templates/partials/github.html", import.meta.url),
  "utf8"
);
const baseTemplateHtml = readFileSync(
  new URL("../templates/base.html", import.meta.url),
  "utf8"
);
const footerBadgesTemplate = readFileSync(
  new URL("../templates/partials/footer_badges.html", import.meta.url),
  "utf8"
);
const mainCss = readFileSync(
  new URL("../static/css/main.css", import.meta.url),
  "utf8"
);
const memoMediaLayouts = readFileSync(
  new URL("./fixtures/memo-media-sample.md", import.meta.url),
  "utf8"
);

test("article info uses lucide-style inline icon containers", () => {
  assert.match(articleInfoTemplate, /post-info-icon/);
  assert.match(articleInfoTemplate, /icon-calendar/);
  assert.match(articleInfoTemplate, /icon-tag/);
  assert.match(articleInfoTemplate, /icon-languages/);
  assert.match(articleInfoTemplate, /icon-eye/);
});

test("pagination includes inline arrow icons", () => {
  assert.match(paginationTemplate, /page-btn-icon/);
  assert.match(paginationTemplate, /icon-chevron-left/);
  assert.match(paginationTemplate, /icon-chevron-right/);
});

test("github entry no longer uses the legacy ribbon image", () => {
  assert.doesNotMatch(githubTemplate, /s3\.amazonaws\.com\/github\/ribbons/);
  assert.match(githubTemplate, /github-corner/);
  assert.match(githubTemplate, /icon-github/);
});

test("footer badges only keep not-by-ai, rss, and site status icons", () => {
  assert.match(footerBadgesTemplate, /badge-icon/);
  assert.match(footerBadgesTemplate, /icon-rss/);
  assert.match(footerBadgesTemplate, /icon-chart-line/);
  assert.match(footerBadgesTemplate, /viewBox="0 0 131 42"/);
  assert.doesNotMatch(footerBadgesTemplate, /nonbot\.org/);
  assert.doesNotMatch(footerBadgesTemplate, /icon-creative-commons/);
  assert.doesNotMatch(footerBadgesTemplate, /badge-link badge-link-moe/);
  assert.doesNotMatch(footerBadgesTemplate, /icon-train/);
  assert.doesNotMatch(footerBadgesTemplate, /foreverblog\.cn/);
});

test("theme css defines shared icon styling hooks", () => {
  assert.match(mainCss, /\.lucide-icon/);
  assert.match(mainCss, /\.post-info-icon/);
  assert.match(mainCss, /\.badge-icon/);
  assert.match(mainCss, /\.github-corner/);
});

test("base template no longer loads legacy photosuite assets", () => {
  assert.doesNotMatch(baseTemplateHtml, /photosuite\.css/);
  assert.doesNotMatch(baseTemplateHtml, /photosuite\.js/);
});

test("navigation uses the restored full-width dark bar styling", () => {
  assert.match(mainCss, /#banner nav\s*\{[\s\S]*background-color:\s*var\(--color-text\)\s*!important;/);
  assert.match(mainCss, /#banner nav\s*\{[\s\S]*width:\s*100%\s*!important;/);
  assert.match(mainCss, /#banner nav a\s*\{[\s\S]*background-color:\s*var\(--color-text\)\s*!important;/);
  assert.match(mainCss, /#banner nav a\s*\{[\s\S]*background-color:\s*transparent\s*!important;/);
  assert.match(mainCss, /#banner nav a\s*\{[\s\S]*color:\s*(#fff|white)\s*!important;/);
  assert.match(mainCss, /#banner nav a:hover,\s*[\s\S]*background:\s*var\(--color-accent\)\s*!important;/);
  assert.match(mainCss, /#banner nav li:first-child a:hover,\s*[\s\S]*border-radius:\s*4px 0 0 4px\s*!important;/);
});

test("theme css centers the article view counter with its icon", () => {
  assert.match(mainCss, /\.post-info-magazine \.post-info-views\s*\{/);
  assert.match(mainCss, /#busuanzi_container_page_pv\s*\{[\s\S]*display:\s*inline-flex\s*!important;/);
  assert.match(mainCss, /#busuanzi_container_page_pv #busuanzi_value_page_pv\s*\{/);
  assert.doesNotMatch(articleInfoTemplate, /次阅读/);
  assert.match(mainCss, /\.post-info\.post-info-magazine\s*\{[\s\S]*align-items:\s*center\s*!important;/);
  assert.match(mainCss, /#busuanzi_container_page_pv \.post-info-icon\s*\{[\s\S]*line-height:\s*1;/);
  assert.match(mainCss, /\.post-info\.post-info-magazine \.post-info-views #busuanzi_value_page_pv\s*\{[\s\S]*color:\s*#666\s*!important;/);
});

test("footer css keeps the rectangular first badge sizing for not-by-ai", () => {
  assert.match(mainCss, /\.badge-link:first-child\s*\{/);
  assert.match(mainCss, /\.badge-link:first-child > img,\s*[\s\S]*\.badge-link:first-child > svg\s*\{/);
});

test("series directory suppresses article link underline effects and supports pending entries", () => {
  assert.match(
    mainCss,
    /\.series-dir__link:link,\s*[\s\S]*\.series-dir__link:active\s*\{[\s\S]*text-decoration:\s*none\s*!important;/
  );
  assert.match(
    mainCss,
    /\.series-dir__link:link,\s*[\s\S]*\.series-dir__link:active\s*\{[\s\S]*padding:\s*0\s*!important;/
  );
  assert.doesNotMatch(
    mainCss,
    /\.series-dir__item:not\(\.is-active\) \.series-dir__icon::before/
  );
  assert.match(
    mainCss,
    /\.series-dir__link--pending,\s*[\s\S]*cursor:\s*default;/
  );
  assert.match(
    mainCss,
    /\.series-dir__item\.is-pending\s+\.series-dir__link:not\(\.series-dir__link--pending\):hover\s*\{[\s\S]*color:\s*var\(--color-accent\)\s*!important;/
  );
});

test("single-image media layout supports width presets and memo example", () => {
  assert.match(
    mainCss,
    /\.media-single\s*\{[\s\S]*display:\s*flex;[\s\S]*justify-content:\s*center;[\s\S]*align-items:\s*center;/
  );
  assert.match(
    mainCss,
    /\.media-w-90\s*\{[\s\S]*--media-single-width:\s*90%;/
  );
  assert.match(
    mainCss,
    /\.media-single\s*>\s*img,\s*[\s\S]*width:\s*min\(100%, var\(--media-single-width\)\);/
  );
  assert.match(
    mainCss,
    /\.media-single\s*>\s*a\.glightbox[\s\S]*display:\s*flex;[\s\S]*align-items:\s*center;/
  );
  assert.match(
    mainCss,
    /\.media-single\s*>\s*a\.glightbox img[\s\S]*width:\s*100%;/
  );
  assert.match(
    mainCss,
    /@media screen and \(max-width:\s*768px\)\s*\{[\s\S]*\.media-single[\s\S]*--media-single-width:\s*100%;/
  );
  assert.match(memoMediaLayouts, /### 单图宽度控制/);
  assert.match(memoMediaLayouts, /<div class="media-single media-w-\d+">/);
});

test("portrait row supports height presets and memo example", () => {
  assert.match(
    mainCss,
    /\.media-portrait-row[\s\S]*display:\s*flex;[\s\S]*justify-content:\s*flex-start;/
  );
  assert.match(
    mainCss,
    /\.media-portrait-h-220[\s\S]*--media-portrait-height:\s*220px;/
  );
  assert.match(
    mainCss,
    /\.media-portrait-h-240[\s\S]*--media-portrait-height:\s*240px;/
  );
  assert.match(
    mainCss,
    /\.media-portrait-h-280[\s\S]*--media-portrait-height:\s*280px;/
  );
  assert.match(
    mainCss,
    /\.media-portrait-h-360[\s\S]*--media-portrait-height:\s*360px;/
  );
  assert.match(
    mainCss,
    /\.media-portrait-h-480[\s\S]*--media-portrait-height:\s*480px;/
  );
  assert.match(memoMediaLayouts, /### 左对齐竖图排列（可设置高度）/);
  assert.match(
    memoMediaLayouts,
    /<div class="media-portrait-row media-portrait-h-240">/
  );
  assert.match(memoMediaLayouts, /https:\/\/example\.com\/images\/sample-02\.jpg/);
  assert.match(memoMediaLayouts, /https:\/\/example\.com\/images\/sample-04\.jpg/);
});
