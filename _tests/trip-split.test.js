const test = require("node:test");
const assert = require("node:assert/strict");
const TS = require("../assets/js/trip-split.js");

test("parseAmount accepts the shapes people actually type", () => {
  assert.equal(TS.parseAmount("9000"), 900000);
  assert.equal(TS.parseAmount("9,000"), 900000);
  assert.equal(TS.parseAmount("₹9,000.50"), 900050);
  assert.equal(TS.parseAmount(" 2400 "), 240000);
  assert.equal(TS.parseAmount(""), null);
  assert.equal(TS.parseAmount("abc"), null);
  assert.equal(TS.parseAmount("-10"), null);
  assert.equal(TS.parseAmount("9.999"), null);
});

test("formatMoney uses Indian grouping and drops whole paise", () => {
  assert.equal(TS.formatMoney(1440000), "₹14,400");
  assert.equal(TS.formatMoney(15000000), "₹1,50,000");
  assert.equal(TS.formatMoney(3334), "₹33.34");
  assert.equal(TS.formatMoney(0), "₹0");
  assert.equal(TS.formatMoney(-240000), "−₹2,400");
});

test("splitCents never loses a paisa", () => {
  assert.deepEqual(TS.splitCents(100, 3), [34, 33, 33]);
  assert.deepEqual(TS.splitCents(900000, 3), [300000, 300000, 300000]);
  assert.deepEqual(TS.splitCents(0, 2), [0, 0]);
  assert.deepEqual(TS.splitCents(500, 0), []);
});

test("compute splits a simple trip equally", () => {
  const state = TS.exampleState();
  const result = TS.compute(state);

  assert.equal(result.totalCents, 1440000);
  assert.deepEqual(
    result.people.map((person) => person.paidCents),
    [900000, 240000, 300000]
  );
  assert.deepEqual(
    result.people.map((person) => person.shareCents),
    [480000, 480000, 480000]
  );
  assert.deepEqual(
    result.people.map((person) => person.netCents),
    [420000, -240000, -180000]
  );
  assert.deepEqual(result.transfers, [
    { from: 1, to: 0, cents: 240000 },
    { from: 2, to: 0, cents: 180000 }
  ]);
  assert.equal(result.eachCents, 480000);
  assert.equal(result.errors.length, 0);
});

test("one payer covers a whole trip", () => {
  const result = TS.compute({
    title: "",
    people: ["A", "B", "C"],
    expenses: [{ desc: "Hotel", amountCents: 900000, payer: 0, mode: "equal", split: [0, 1, 2], shares: null }]
  });

  assert.deepEqual(result.transfers, [
    { from: 1, to: 0, cents: 300000 },
    { from: 2, to: 0, cents: 300000 }
  ]);
});

test("a subset split handles someone who joined for one expense", () => {
  const result = TS.compute({
    title: "",
    people: ["You", "Asha", "Rahul"],
    expenses: [
      { desc: "Hotel", amountCents: 800000, payer: 0, mode: "equal", split: [0, 1], shares: null },
      { desc: "Cab", amountCents: 90000, payer: 2, mode: "equal", split: [0, 1, 2], shares: null }
    ]
  });

  assert.deepEqual(
    result.people.map((person) => person.shareCents),
    [430000, 430000, 30000]
  );
  assert.equal(
    result.people.reduce((sum, person) => sum + person.netCents, 0),
    0
  );
});

test("exact amounts are respected and validated", () => {
  const ok = TS.compute({
    title: "",
    people: ["A", "B"],
    expenses: [{ desc: "Hotel", amountCents: 100000, payer: 0, mode: "exact", split: [0, 1], shares: [70000, 30000] }]
  });
  assert.deepEqual(
    ok.people.map((person) => person.shareCents),
    [70000, 30000]
  );

  const broken = TS.compute({
    title: "",
    people: ["A", "B"],
    expenses: [{ desc: "Hotel", amountCents: 100000, payer: 0, mode: "exact", split: [0, 1], shares: [70000, 20000] }]
  });
  assert.equal(broken.errors.length, 1);
  assert.match(broken.errors[0].message, /add up to ₹900/);
  assert.equal(broken.totalCents, 0);
});

test("blank rows are ignored until they have an amount", () => {
  const result = TS.compute({
    title: "",
    people: ["A", "B"],
    expenses: [
      { desc: "", amountCents: null, payer: 0, mode: "equal", split: [0, 1], shares: null },
      { desc: "Dinner", amountCents: 100000, payer: 0, mode: "equal", split: [0, 1], shares: null }
    ]
  });
  assert.equal(result.errors.length, 0);
  assert.equal(result.totalCents, 100000);
});

test("a row with a description but no amount is flagged", () => {
  const result = TS.compute({
    title: "",
    people: ["A", "B"],
    expenses: [{ desc: "Cab", amountCents: null, payer: 0, mode: "equal", split: [0, 1], shares: null }]
  });
  assert.equal(result.errors.length, 1);
  assert.match(result.errors[0].message, /Add an amount/);
});

test("balances always sum to zero and transfers stay at n-1", () => {
  const people = ["A", "B", "C", "D", "E"];
  const expenses = [
    { desc: "a", amountCents: 12345, payer: 0, mode: "equal", split: [0, 1, 2], shares: null },
    { desc: "b", amountCents: 98765, payer: 3, mode: "equal", split: [0, 1, 2, 3, 4], shares: null },
    { desc: "c", amountCents: 777, payer: 4, mode: "equal", split: [2, 4], shares: null }
  ];
  const result = TS.compute({ title: "", people, expenses });

  assert.equal(
    result.people.reduce((sum, person) => sum + person.netCents, 0),
    0
  );
  assert.ok(result.transfers.length <= people.length - 1);
  assert.equal(
    result.transfers.reduce((sum, transfer) => sum + transfer.cents, 0),
    result.people
      .filter((person) => person.netCents > 0)
      .reduce((sum, person) => sum + person.netCents, 0)
  );
});

test("an empty state computes without throwing", () => {
  const result = TS.compute(TS.emptyState());
  assert.equal(result.totalCents, 0);
  assert.equal(result.transfers.length, 0);
  assert.equal(result.errors.length, 0);
});

test("state survives a URL round trip", () => {
  const state = TS.exampleState();
  state.people[1] = "आशा";
  const decoded = TS.decodeState(TS.encodeState(state));
  assert.deepEqual(decoded, state);
});

test("decode rejects garbage instead of throwing", () => {
  assert.equal(TS.decodeState(""), null);
  assert.equal(TS.decodeState("not-base64"), null);
  assert.equal(TS.decodeState(TS.encodeState(TS.exampleState()).slice(0, 10)), null);
});

test("decode clamps a payload pointing at missing people", () => {
  const state = TS.exampleState();
  state.expenses[0].payer = 9;
  assert.equal(TS.decodeState(TS.encodeState(state)), null);
});

test("summary reads well in a group chat", () => {
  const state = TS.exampleState();
  const result = TS.compute(state);
  const text = TS.buildSummary(state, result, "https://example.test/#d=abc");

  assert.match(text, /^\*Goa trip · 3 people · ₹14,400\*$/m);
  assert.match(text, /^• Asha → You ₹2,400$/m);
  assert.match(text, /^• Rahul → You ₹1,800$/m);
  assert.match(text, /^Full breakdown: https:\/\/example\.test\/#d=abc$/m);
  assert.match(text, /^Shares$/m);
});

test("summary says so when everyone is settled", () => {
  const state = {
    title: "Coffee",
    people: ["A", "B"],
    expenses: [
      { desc: "One", amountCents: 10000, payer: 0, mode: "equal", split: [0, 1], shares: null },
      { desc: "Two", amountCents: 10000, payer: 1, mode: "equal", split: [0, 1], shares: null }
    ]
  };
  const text = TS.buildSummary(state, TS.compute(state), "https://example.test/");
  assert.match(text, /Nobody owes anything/);
  assert.doesNotMatch(text, /Settle up/);
});

test("summary warns when an expense is unfinished", () => {
  const state = TS.exampleState();
  state.expenses.push({ desc: "Tolls", amountCents: null, payer: 0, mode: "equal", split: [0, 1, 2], shares: null });
  const text = TS.buildSummary(state, TS.compute(state), "https://example.test/");
  assert.match(text, /1 expense is still incomplete/);
});
