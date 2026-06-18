import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const articleTemplate = readFileSync(
  new URL("../templates/article.html", import.meta.url),
  "utf8"
);

test("all articles opt into shared media layout hooks regardless of category", () => {
  assert.match(articleTemplate, /article\.category\.slug == 'kitchen'/);
  assert.match(articleTemplate, /article\.category\.slug == 'technology'/);
  assert.match(
    articleTemplate,
    /<div class="entry-content" data-media-layouts="true">/
  );
  assert.doesNotMatch(articleTemplate, /media_layout_categories/);
});
