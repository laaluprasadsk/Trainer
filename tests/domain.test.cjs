const { test } = require("node:test");
const assert = require("node:assert/strict");
const ts = require("typescript");
const fs = require("node:fs");
const Module = require("node:module");
const source = ts.transpileModule(
  fs.readFileSync("src/lib/booking-domain.ts", "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;
const m = new Module("domain");
m._compile(source, "domain.js");
const { validWindow, overlaps, pricing, slotInstant } = m.exports;
test("IST midnight crosses UTC date correctly", () =>
  assert.equal(
    slotInstant("2030-01-02", "00:15").toISOString(),
    "2030-01-01T18:45:00.000Z",
  ));
test("invalid dates, past dates, reversed windows are rejected", () => {
  for (const [d, a, b] of [
    ["2030-02-30", "09:00", "10:00"],
    ["bad", "09:00", "10:00"],
    ["2030-01-01", "25:00", "26:00"],
    ["2030-01-01", "10:00", "09:00"],
    ["2020-01-01", "09:00", "10:00"],
  ])
    assert.equal(validWindow(d, a, b), false);
});
test("adjacent windows are allowed; partial and contained overlap rejected", () => {
  const a = { startTime: "09:00", endTime: "10:00" };
  assert.equal(overlaps(a, { startTime: "10:00", endTime: "11:00" }), false);
  assert.equal(overlaps(a, { startTime: "09:30", endTime: "10:30" }), true);
  assert.equal(overlaps(a, { startTime: "09:15", endTime: "09:45" }), true);
});
test("pricing prorates duration and conserves paise", () => {
  assert.deepEqual(pricing(1000, "09:00", "09:30"), {
    totalAmount: 500,
    platformFee: 75,
    trainerPayout: 425,
  });
  const p = pricing(999.99, "09:00", "10:30");
  assert.equal(
    Math.round((p.platformFee + p.trainerPayout) * 100),
    Math.round(p.totalAmount * 100),
  );
});
