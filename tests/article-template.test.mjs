import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const articleTemplate = readFileSync(
  new URL("../templates/article.html", import.meta.url),
  "utf8"
);

test("kitchen and technology articles opt into shared media layout hooks", () => {
  assert.match(articleTemplate, /article\.category\.slug == 'kitchen'/);
  assert.match(articleTemplate, /article\.category\.slug == 'technology'/);
  assert.match(
    articleTemplate,
    /media_layout_categories = \['memos', 'photos', 'kitchen', 'technology'\]/
  );
  assert.match(
    articleTemplate,
    /article\.category\.slug in media_layout_categories/
  );
});
