/* Trip expense splitting: pure functions shared by the calculator UI and the tests.
   Amounts are handled in paise (integer cents) so shares always add up exactly. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.TripSplit = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var TITLE_LIMIT = 60;
  var NAME_LIMIT = 40;
  var PEOPLE_LIMIT = 30;
  var EXPENSES_LIMIT = 200;

  function parseAmount(value) {
    if (typeof value !== "string") {
      if (typeof value === "number" && isFinite(value) && value >= 0) {
        return Math.round(value * 100);
      }
      return null;
    }
    var cleaned = value.replace(/[₹,\s]/g, "");
    if (cleaned === "") return null;
    if (!/^\d+(\.\d{0,2})?$/.test(cleaned)) return null;
    var rupees = parseFloat(cleaned);
    if (!isFinite(rupees)) return null;
    return Math.round(rupees * 100);
  }

  function formatMoney(cents) {
    var abs = Math.abs(cents);
    var fraction = abs % 100;
    var formatted = new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: fraction ? 2 : 0,
      maximumFractionDigits: 2
    }).format(abs / 100);
    return (cents < 0 ? "−" : "") + "₹" + formatted;
  }

  function splitCents(totalCents, count) {
    if (count <= 0) return [];
    var base = Math.floor(totalCents / count);
    var remainder = totalCents - base * count;
    var parts = [];
    for (var i = 0; i < count; i += 1) {
      parts.push(base + (i < remainder ? 1 : 0));
    }
    return parts;
  }

  function settle(nets) {
    var creditors = [];
    var debtors = [];
    nets.forEach(function (cents, index) {
      if (cents > 0) creditors.push({ index: index, cents: cents });
      else if (cents < 0) debtors.push({ index: index, cents: -cents });
    });
    creditors.sort(function (a, b) {
      return b.cents - a.cents || a.index - b.index;
    });
    debtors.sort(function (a, b) {
      return b.cents - a.cents || a.index - b.index;
    });

    var transfers = [];
    var ci = 0;
    var di = 0;
    while (ci < creditors.length && di < debtors.length) {
      var amount = Math.min(creditors[ci].cents, debtors[di].cents);
      if (amount > 0) {
        transfers.push({ from: debtors[di].index, to: creditors[ci].index, cents: amount });
      }
      creditors[ci].cents -= amount;
      debtors[di].cents -= amount;
      if (creditors[ci].cents === 0) ci += 1;
      if (debtors[di].cents === 0) di += 1;
    }
    return transfers;
  }

  function compute(state) {
    var people = (state && state.people) || [];
    var expenses = (state && state.expenses) || [];
    var paid = people.map(function () {
      return 0;
    });
    var share = people.map(function () {
      return 0;
    });
    var totalCents = 0;
    var errors = [];
    var counted = 0;

    expenses.forEach(function (expense, index) {
      var isBlank = expense.amountCents === null && !String(expense.desc || "").trim();
      if (isBlank) return;

      if (expense.amountCents === null || expense.amountCents <= 0) {
        errors.push({ index: index, message: "Add an amount for this expense." });
        return;
      }
      if (!expense.split || expense.split.length === 0) {
        errors.push({ index: index, message: "Choose at least one person to share this." });
        return;
      }
      var badPerson = expense.split.some(function (personIndex) {
        return !Number.isInteger(personIndex) || personIndex < 0 || personIndex >= people.length;
      });
      if (badPerson || !Number.isInteger(expense.payer) || expense.payer < 0 || expense.payer >= people.length) {
        errors.push({ index: index, message: "That expense points at someone who is no longer here." });
        return;
      }
      if (expense.mode === "exact") {
        var shares = expense.shares || [];
        var sum = shares.reduce(function (acc, value) {
          return acc + value;
        }, 0);
        if (shares.length !== expense.split.length || sum !== expense.amountCents) {
          errors.push({
            index: index,
            message:
              "Exact amounts add up to " +
              formatMoney(sum) +
              " instead of " +
              formatMoney(expense.amountCents) +
              "."
          });
          return;
        }
      }

      totalCents += expense.amountCents;
      counted += 1;
      paid[expense.payer] += expense.amountCents;

      if (expense.mode === "exact") {
        expense.split.forEach(function (personIndex, slot) {
          share[personIndex] += expense.shares[slot];
        });
      } else {
        var parts = splitCents(expense.amountCents, expense.split.length);
        expense.split.forEach(function (personIndex, slot) {
          share[personIndex] += parts[slot];
        });
      }
    });

    var nets = people.map(function (_, index) {
      return paid[index] - share[index];
    });
    /* shares can differ by a single paisa when an amount does not divide evenly,
       which is not the same as an uneven split */
    var lowestShare = share.length ? Math.min.apply(null, share) : 0;
    var highestShare = share.length ? Math.max.apply(null, share) : 0;
    var evenlyShared = share.length > 0 && highestShare - lowestShare <= 1;

    return {
      totalCents: totalCents,
      counted: counted,
      people: people.map(function (name, index) {
        return {
          name: name,
          paidCents: paid[index],
          shareCents: share[index],
          netCents: nets[index]
        };
      }),
      eachCents: evenlyShared ? lowestShare : null,
      transfers: settle(nets),
      errors: errors
    };
  }

  function toBase64Url(text) {
    var bytes = new TextEncoder().encode(text);
    var binary = "";
    for (var i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  function fromBase64Url(value) {
    var padded = value.replace(/-/g, "+").replace(/_/g, "/");
    while (padded.length % 4) padded += "=";
    var binary = atob(padded);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  function encodeState(state) {
    var payload = {
      t: String(state.title || "").slice(0, TITLE_LIMIT),
      n: state.people.map(function (name) {
        return String(name).slice(0, NAME_LIMIT);
      }),
      e: state.expenses.map(function (expense) {
        return [
          String(expense.desc || "").slice(0, NAME_LIMIT),
          expense.amountCents,
          expense.payer,
          expense.mode === "exact" ? 1 : 0,
          expense.split,
          expense.mode === "exact" ? expense.shares : null
        ];
      })
    };
    return toBase64Url(JSON.stringify(payload));
  }

  function isInt(value) {
    return Number.isInteger(value);
  }

  function decodeState(value) {
    if (!value) return null;
    var payload;
    try {
      payload = JSON.parse(fromBase64Url(value));
    } catch (error) {
      return null;
    }
    if (!payload || typeof payload !== "object") return null;
    if (!Array.isArray(payload.n) || payload.n.length === 0 || payload.n.length > PEOPLE_LIMIT) return null;
    if (!Array.isArray(payload.e) || payload.e.length > EXPENSES_LIMIT) return null;

    var people = payload.n.map(function (name) {
      return String(name == null ? "" : name).slice(0, NAME_LIMIT);
    });
    if (people.some(function (name) { return name.trim() === ""; })) return null;

    var expenses = [];
    for (var i = 0; i < payload.e.length; i += 1) {
      var row = payload.e[i];
      if (!Array.isArray(row) || row.length !== 6) return null;
      var amount = row[1];
      var payer = row[2];
      var mode = row[3] === 1 ? "exact" : "equal";
      var split = row[4];
      var shares = row[5];
      if (amount !== null && (!isInt(amount) || amount < 0)) return null;
      if (!isInt(payer) || payer < 0 || payer >= people.length) return null;
      if (!Array.isArray(split) || split.length === 0) return null;
      if (split.some(function (index) { return !isInt(index) || index < 0 || index >= people.length; })) return null;
      if (mode === "exact") {
        if (!Array.isArray(shares) || shares.length !== split.length) return null;
        if (shares.some(function (value) { return !isInt(value) || value < 0; })) return null;
      } else {
        shares = null;
      }
      expenses.push({
        desc: String(row[0] == null ? "" : row[0]).slice(0, NAME_LIMIT),
        amountCents: amount,
        payer: payer,
        mode: mode,
        split: split.slice(),
        shares: shares ? shares.slice() : null
      });
    }

    return {
      title: String(payload.t == null ? "" : payload.t).slice(0, TITLE_LIMIT),
      people: people,
      expenses: expenses
    };
  }

  function buildSummary(state, result, url) {
    var title = String(state.title || "").trim() || "Trip split";
    var people = result.people;
    var count = people.length;
    var lines = [];

    lines.push(
      "*" + title + " · " + count + (count === 1 ? " person" : " people") + " · " + formatMoney(result.totalCents) + "*"
    );

    if (result.errors.length) {
      lines.push("");
      lines.push(
        "_" +
          result.errors.length +
          (result.errors.length === 1 ? " expense is" : " expenses are") +
          " still incomplete, so this total may change._"
      );
    }

    lines.push("");
    if (result.totalCents === 0) {
      lines.push("No expenses yet.");
    } else if (result.transfers.length === 0) {
      lines.push("Nobody owes anything — you're all square.");
    } else {
      if (count <= 12) {
        lines.push("Shares");
        people.forEach(function (person) {
          lines.push("• " + person.name.trim() + " " + formatMoney(person.shareCents));
        });
        lines.push("");
      }
      lines.push("Settle up");
      result.transfers.forEach(function (transfer) {
        lines.push(
          "• " +
            people[transfer.from].name.trim() +
            " → " +
            people[transfer.to].name.trim() +
            " " +
            formatMoney(transfer.cents)
        );
      });
    }

    lines.push("");
    lines.push("Full breakdown: " + url);
    return lines.join("\n");
  }

  function emptyState() {
    return {
      title: "",
      people: ["You", "Person 2"],
      expenses: [{ desc: "", amountCents: null, payer: 0, mode: "equal", split: [0, 1], shares: null }]
    };
  }

  function exampleState() {
    return {
      title: "Goa trip",
      people: ["You", "Asha", "Rahul"],
      expenses: [
        { desc: "Hotel", amountCents: 900000, payer: 0, mode: "equal", split: [0, 1, 2], shares: null },
        { desc: "Cab", amountCents: 240000, payer: 1, mode: "equal", split: [0, 1, 2], shares: null },
        { desc: "Food", amountCents: 300000, payer: 2, mode: "equal", split: [0, 1, 2], shares: null }
      ]
    };
  }

  return {
    parseAmount: parseAmount,
    formatMoney: formatMoney,
    splitCents: splitCents,
    compute: compute,
    encodeState: encodeState,
    decodeState: decodeState,
    buildSummary: buildSummary,
    emptyState: emptyState,
    exampleState: exampleState
  };
});
