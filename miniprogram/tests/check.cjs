const fs = require("node:fs"),
  path = require("node:path"),
  vm = require("node:vm"),
  assert = require("node:assert/strict");
const root = path.resolve(__dirname, "..");
let bytes = 0,
  files = 0;
function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const f = path.join(dir, name),
      rel = path.relative(root, f);
    if (fs.statSync(f).isDirectory()) {
      if (name !== "tests") walk(f);
      continue;
    }
    if (name === "README.md" || name === "package.json") continue;
    bytes += fs.statSync(f).size;
    files++;
    if (name.endsWith(".json")) JSON.parse(fs.readFileSync(f, "utf8"));
    if (name.endsWith(".js"))
      new vm.Script(fs.readFileSync(f, "utf8"), { filename: rel });
  }
}
walk(root);
const app = require("../app.json");
for (const p of app.pages)
  for (const ext of ["js", "json", "wxml", "wxss"])
    assert.ok(fs.existsSync(path.join(root, p + "." + ext)), p + "." + ext);
for (const page of app.pages) {
  const config = require(path.join(root, page + ".json"));
  for (const p of Object.values(config.usingComponents || {}))
    for (const ext of ["js", "json", "wxml", "wxss"])
      assert.ok(fs.existsSync(path.join(root, p.slice(1) + "." + ext)), p);
}
const { ariaAudio, vocabulary } = require("../data/content.js");
for (const v of vocabulary) {
  const source = ariaAudio[v.en.replace("look/stand", "look")];
  assert.ok(source, "Missing audio " + v.en);
  assert.ok(fs.existsSync(path.join(root, source.slice(1))));
}
assert.ok(bytes < 2 * 1024 * 1024, "Main package exceeds 2 MiB: " + bytes);
console.log(
  `Static checks passed: ${files} files, ${vocabulary.length} questions, ${bytes} bytes main package.`,
);
