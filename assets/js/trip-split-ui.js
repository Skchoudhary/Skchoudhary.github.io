/* Wires the trip calculator form to TripSplit. The DOM is the source of truth:
   every input event re-reads it, recomputes, and repaints the result. */
(function () {
  "use strict";

  var TS = window.TripSplit;
  var root = document.getElementById("split-tool");
  if (!TS || !root) return;

  var titleInput = document.getElementById("trip-title");
  var peopleList = document.getElementById("people-list");
  var expenseList = document.getElementById("expense-list");
  var resultTotal = document.getElementById("result-total");
  var resultBody = document.getElementById("result-body");
  var shareActions = document.getElementById("share-actions");
  var shareNote = document.getElementById("share-note");
  var shareStatus = document.getElementById("share-status");
  var addPersonBtn = document.getElementById("add-person");
  var addExpenseBtn = document.getElementById("add-expense");

  var rowSeq = 0;
  var statusTimer = null;
  var hashTimer = null;

  function make(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function defaultName(index) {
    return index === 0 ? "You" : "Person " + (index + 1);
  }

  /* ---------- people ---------- */

  function personChip(name, index) {
    var chip = make("div", "person-chip");
    chip.dataset.index = String(index);

    var input = make("input", "person-name");
    input.type = "text";
    input.value = name;
    input.autocomplete = "off";
    input.spellcheck = false;
    input.setAttribute("aria-label", "Name of person " + (index + 1));
    input.size = Math.max(3, name.length);
    chip.appendChild(input);

    var remove = make("button", "person-remove", "×");
    remove.type = "button";
    remove.dataset.action = "remove-person";
    remove.setAttribute("aria-label", "Remove " + name);
    chip.appendChild(remove);

    return chip;
  }

  function expenseRow(expense) {
    rowSeq += 1;
    var id = "expense-" + rowSeq;

    var row = make("div", "expense-row");
    row.dataset.id = id;

    var fields = make("div", "expense-fields");

    var desc = make("input", "expense-desc");
    desc.type = "text";
    desc.placeholder = "Hotel, cab, dinner…";
    desc.setAttribute("aria-label", "What was this expense for?");
    desc.autocomplete = "off";
    fields.appendChild(desc);

    var amountField = make("div", "amount-field");
    var rupee = make("span", null, "₹");
    rupee.setAttribute("aria-hidden", "true");
    amountField.appendChild(rupee);
    var amount = make("input", "expense-amount");
    amount.type = "text";
    amount.inputMode = "decimal";
    amount.placeholder = "0";
    amount.setAttribute("aria-label", "Amount in rupees");
    amount.autocomplete = "off";
    amountField.appendChild(amount);
    fields.appendChild(amountField);

    var payerField = make("label", "payer-field");
    payerField.appendChild(make("span", "field-label", "Paid by"));
    var payer = make("select", "expense-payer");
    payer.setAttribute("aria-label", "Who paid");
    payerField.appendChild(payer);
    fields.appendChild(payerField);

    var remove = make("button", "expense-remove", "×");
    remove.type = "button";
    remove.dataset.action = "remove-expense";
    remove.setAttribute("aria-label", "Remove this expense");
    fields.appendChild(remove);

    row.appendChild(fields);

    var error = make("p", "expense-error");
    error.hidden = true;
    row.appendChild(error);

    var details = make("details", "expense-split");
    var summary = make("summary", "expense-split-summary");
    details.appendChild(summary);

    var body = make("div", "expense-split-body");

    var mode = make("div", "split-mode");
    mode.setAttribute("role", "radiogroup");
    mode.setAttribute("aria-label", "How to split this expense");

    ["equal", "exact"].forEach(function (value, position) {
      var label = make("label", "mode-option");
      var radio = document.createElement("input");
      radio.type = "radio";
      radio.name = "mode-" + id;
      radio.value = value;
      radio.checked = (expense.mode || "equal") === value;
      if (position === 0) radio.setAttribute("aria-label", "Split equally");
      label.appendChild(radio);
      label.appendChild(make("span", null, value === "equal" ? "Split equally" : "Exact amounts"));
      mode.appendChild(label);
    });
    body.appendChild(mode);

    var list = make("ul", "split-people");
    body.appendChild(list);
    details.appendChild(body);
    row.appendChild(details);

    /* seed the select and the participant list */
    fillPeople(row);
    desc.value = expense.desc || "";
    amount.value = expense.amountCents == null ? "" : String(expense.amountCents / 100);
    payer.value = String(expense.payer || 0);

    var items = list.querySelectorAll("li");
    var selected = expense.split || [];
    items.forEach(function (item, index) {
      var check = item.querySelector(".split-check");
      check.checked = selected.indexOf(index) !== -1;
      var exact = item.querySelector(".exact-input");
      if (expense.mode === "exact" && expense.shares && selected.indexOf(index) !== -1) {
        var slot = selected.indexOf(index);
        exact.value = String((expense.shares[slot] || 0) / 100);
      }
    });

    syncRowState(row);
    return row;
  }

  function fillPeople(row) {
    var select = row.querySelector(".expense-payer");
    var previous = select.selectedIndex;
    select.textContent = "";
    peopleList.querySelectorAll(".person-name").forEach(function (input, index) {
      var option = document.createElement("option");
      option.value = String(index);
      option.textContent = input.value.trim() || defaultName(index);
      select.appendChild(option);
    });
    select.selectedIndex = previous >= 0 && previous < select.options.length ? previous : 0;

    var list = row.querySelector(".split-people");
    var checkedBefore = Array.prototype.map.call(list.querySelectorAll(".split-check"), function (box) {
      return box.checked;
    });
    list.textContent = "";
    peopleList.querySelectorAll(".person-name").forEach(function (input, index) {
      var item = document.createElement("li");

      var label = make("label", "split-check-label");
      var box = document.createElement("input");
      box.type = "checkbox";
      box.className = "split-check";
      box.checked = checkedBefore.length ? checkedBefore[index] !== false : true;
      label.appendChild(box);
      label.appendChild(make("span", "split-name", input.value.trim() || defaultName(index)));
      item.appendChild(label);

      var exact = make("input", "exact-input");
      exact.type = "text";
      exact.inputMode = "decimal";
      exact.placeholder = "0";
      exact.setAttribute("aria-label", "Exact share for " + (input.value.trim() || defaultName(index)));
      item.appendChild(exact);

      list.appendChild(item);
    });
  }

  function syncRowState(row) {
    var mode = row.querySelector('input[type="radio"]:checked').value;
    var boxes = row.querySelectorAll(".split-people li");
    var selected = 0;

    boxes.forEach(function (item) {
      var box = item.querySelector(".split-check");
      var exact = item.querySelector(".exact-input");
      exact.hidden = mode !== "exact" || !box.checked;
      if (box.checked) selected += 1;
    });

    var summary = row.querySelector(".expense-split-summary");
    if (selected === 0) summary.textContent = "Split between: nobody";
    else if (selected === boxes.length) summary.textContent = "Split between: everyone";
    else summary.textContent = "Split between: " + selected + " of " + boxes.length;

    row.classList.toggle("is-exact", mode === "exact");
  }

  /* ---------- reading the form ---------- */

  function readState() {
    var people = Array.prototype.map.call(peopleList.querySelectorAll(".person-name"), function (input, index) {
      return input.value.trim() || defaultName(index);
    });

    var expenses = Array.prototype.map.call(expenseList.querySelectorAll(".expense-row"), function (row) {
      var mode = row.querySelector('input[type="radio"]:checked').value;
      var split = [];
      var shares = [];

      row.querySelectorAll(".split-people li").forEach(function (item, index) {
        if (!item.querySelector(".split-check").checked) return;
        split.push(index);
        shares.push(TS.parseAmount(item.querySelector(".exact-input").value) || 0);
      });

      return {
        desc: row.querySelector(".expense-desc").value,
        amountCents: TS.parseAmount(row.querySelector(".expense-amount").value),
        payer: Number(row.querySelector(".expense-payer").value),
        mode: mode,
        split: split,
        shares: mode === "exact" ? shares : null
      };
    });

    return { title: titleInput.value, people: people, expenses: expenses };
  }

  /* ---------- painting the result ---------- */

  function render() {
    var state = readState();
    var result = TS.compute(state);

    Array.prototype.forEach.call(expenseList.querySelectorAll(".expense-row"), function (row, index) {
      var field = row.querySelector(".expense-error");
      var match = result.errors.filter(function (error) {
        return error.index === index;
      })[0];
      field.hidden = !match;
      field.textContent = match ? match.message : "";
      row.classList.toggle("has-error", Boolean(match));
    });

    resultBody.textContent = "";

    if (result.totalCents === 0) {
      resultTotal.hidden = true;
      resultTotal.textContent = "";
      var empty = make(
        "p",
        "result-empty",
        result.errors.length ? "Finish the expenses above to see the split." : "Add an expense to see who owes whom."
      );
      resultBody.appendChild(empty);
      if (!result.errors.length) {
        var example = make("button", "share-link", "Try an example");
        example.type = "button";
        example.addEventListener("click", loadExample);
        resultBody.appendChild(example);
      }
      shareActions.hidden = true;
      shareNote.hidden = true;
      scheduleHash(state, result.errors.length > 0);
      return;
    }

    resultTotal.hidden = false;
    resultTotal.textContent = TS.formatMoney(result.totalCents);
    var meta = make("span", null, " · " + result.people.length + (result.people.length === 1 ? " person" : " people"));
    if (result.eachCents !== null) {
      meta.textContent += " · " + TS.formatMoney(result.eachCents) + " each";
    }
    resultTotal.appendChild(meta);

    var table = make("table", "balance-table");
    var caption = make("caption", "visually-hidden", "What each person paid, owes, and is owed");
    table.appendChild(caption);

    var thead = document.createElement("thead");
    var headRow = document.createElement("tr");
    ["Person", "Paid", "Share", "Balance"].forEach(function (label) {
      headRow.appendChild(make("th", null, label));
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    var tbody = document.createElement("tbody");
    result.people.forEach(function (person, index) {
      var tr = document.createElement("tr");
      if (index === 0) tr.className = "is-you";

      var name = document.createElement("th");
      name.scope = "row";
      name.textContent = person.name;
      tr.appendChild(name);

      tr.appendChild(make("td", null, TS.formatMoney(person.paidCents)));
      tr.appendChild(make("td", null, TS.formatMoney(person.shareCents)));

      var balance = make("td");
      if (person.netCents > 0) {
        balance.className = "net-positive";
        balance.textContent = "gets back " + TS.formatMoney(person.netCents);
      } else if (person.netCents < 0) {
        balance.className = "net-negative";
        balance.textContent = "owes " + TS.formatMoney(-person.netCents);
      } else {
        balance.className = "net-zero";
        balance.textContent = "settled";
      }
      tr.appendChild(balance);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    resultBody.appendChild(table);

    var settle = make("div", "settle");
    settle.appendChild(make("h3", null, "Settle up"));
    if (result.transfers.length === 0) {
      settle.appendChild(make("p", "settle-empty", "Nobody owes anything — you're all square."));
    } else {
      var list = make("ul", "settle-list");
      result.transfers.forEach(function (transfer) {
        var li = document.createElement("li");
        li.setAttribute(
          "aria-label",
          result.people[transfer.from].name +
            " pays " +
            result.people[transfer.to].name +
            " " +
            TS.formatMoney(transfer.cents)
        );
        li.appendChild(
          make("span", null, result.people[transfer.from].name + " → " + result.people[transfer.to].name)
        );
        li.appendChild(make("span", "settle-amount", TS.formatMoney(transfer.cents)));
        list.appendChild(li);
      });
      settle.appendChild(list);
    }
    resultBody.appendChild(settle);

    shareActions.hidden = false;
    shareNote.hidden = false;
    scheduleHash(state, true);
  }

  function scheduleHash(state, active) {
    clearTimeout(hashTimer);
    hashTimer = setTimeout(function () {
      if (!active) {
        if (window.location.hash) {
          history.replaceState(null, "", window.location.pathname + window.location.search);
        }
        return;
      }
      var next = "#d=" + TS.encodeState(state);
      if (window.location.hash !== next) {
        history.replaceState(null, "", next);
      }
    }, 200);
  }

  function currentUrl() {
    return window.location.origin + window.location.pathname + "#d=" + TS.encodeState(readState());
  }

  /* ---------- sharing ---------- */

  function flash(message) {
    shareStatus.textContent = message;
    clearTimeout(statusTimer);
    statusTimer = setTimeout(function () {
      shareStatus.textContent = "";
    }, 2600);
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.top = "-1000px";
      document.body.appendChild(area);
      area.select();
      try {
        document.execCommand("copy") ? resolve() : reject(new Error("copy failed"));
      } catch (error) {
        reject(error);
      } finally {
        document.body.removeChild(area);
      }
    });
  }

  function summaryText() {
    var state = readState();
    return TS.buildSummary(state, TS.compute(state), currentUrl());
  }

  function shareSummary() {
    var text = summaryText();
    if (navigator.share) {
      navigator.share({ title: "Trip split", text: text }).catch(function () {
        /* the user dismissed the sheet, or the platform refused */
      });
      return;
    }
    copyText(text).then(
      function () {
        flash("Summary copied — paste it into the group.");
      },
      function () {
        flash("Couldn't copy automatically. Select the summary and copy it.");
      }
    );
  }

  /* ---------- structure changes ---------- */

  function addPerson(name) {
    var index = peopleList.querySelectorAll(".person-name").length;
    var chip = personChip(name || defaultName(index), index);
    peopleList.appendChild(chip);
    var label = chip.querySelector(".person-name").value || defaultName(index);

    expenseList.querySelectorAll(".expense-row").forEach(function (row) {
      var select = row.querySelector(".expense-payer");
      var option = document.createElement("option");
      option.value = String(index);
      option.textContent = label;
      select.appendChild(option);

      var mode = row.querySelector('input[type="radio"]:checked').value;
      var list = row.querySelector(".split-people");
      var item = document.createElement("li");

      var checkLabel = make("label", "split-check-label");
      var box = document.createElement("input");
      box.type = "checkbox";
      box.className = "split-check";
      /* in exact mode a new person starts out of the split, so the row is not
         forced into a mismatch until they get an amount */
      box.checked = mode !== "exact";
      checkLabel.appendChild(box);
      checkLabel.appendChild(make("span", "split-name", label));
      item.appendChild(checkLabel);

      var exact = make("input", "exact-input");
      exact.type = "text";
      exact.inputMode = "decimal";
      exact.placeholder = "0";
      exact.setAttribute("aria-label", "Exact share for " + label);
      item.appendChild(exact);
      list.appendChild(item);

      syncRowState(row);
    });

    var input = chip.querySelector(".person-name");
    input.focus();
    input.select();
    render();
  }

  function removePerson(index) {
    var chips = peopleList.querySelectorAll(".person-chip");
    if (chips.length <= 1) {
      flash("Keep at least one person.");
      return;
    }
    var chip = chips[index];
    var name = chip.querySelector(".person-name").value || defaultName(index);
    chip.remove();

    expenseList.querySelectorAll(".expense-row").forEach(function (row) {
      var select = row.querySelector(".expense-payer");
      var wasSelected = Number(select.value);
      if (select.options[index]) select.remove(index);
      if (wasSelected === index) select.selectedIndex = 0;
      else if (wasSelected > index) select.value = String(wasSelected - 1);

      var list = row.querySelector(".split-people");
      if (list.children[index]) list.children[index].remove();
      syncRowState(row);
    });

    render();
    flash(name + " removed.");
  }

  function addExpense() {
    var row = expenseRow({ desc: "", amountCents: null, payer: 0, mode: "equal", split: null, shares: null });
    expenseList.appendChild(row);
    row.querySelector(".expense-desc").focus();
    render();
  }

  function removeExpense(row) {
    row.remove();
    render();
  }

  function loadExample() {
    applyState(TS.exampleState());
    flash("Example loaded — edit anything.");
  }

  function applyState(state) {
    titleInput.value = state.title || "";
    peopleList.textContent = "";
    expenseList.textContent = "";

    state.people.forEach(function (name, index) {
      peopleList.appendChild(personChip(name, index));
    });

    state.expenses.forEach(function (expense) {
      expenseList.appendChild(expenseRow(expense));
    });

    render();
  }

  /* ---------- events ---------- */

  root.addEventListener("submit", function (event) {
    event.preventDefault();
  });

  titleInput.addEventListener("input", render);

  addPersonBtn.addEventListener("click", function () {
    addPerson("");
  });

  addExpenseBtn.addEventListener("click", addExpense);

  peopleList.addEventListener("input", function (event) {
    var input = event.target.closest(".person-name");
    if (!input) return;
    input.size = Math.max(3, input.value.length);
    var index = Array.prototype.indexOf.call(peopleList.querySelectorAll(".person-name"), input);
    var name = input.value.trim() || defaultName(index);

    expenseList.querySelectorAll(".expense-payer").forEach(function (select) {
      if (select.options[index]) select.options[index].textContent = name;
    });
    expenseList.querySelectorAll(".split-people").forEach(function (list) {
      var item = list.children[index];
      if (item) {
        item.querySelector(".split-name").textContent = name;
        item.querySelector(".exact-input").setAttribute("aria-label", "Exact share for " + name);
      }
    });

    render();
  });

  peopleList.addEventListener("click", function (event) {
    var button = event.target.closest("[data-action='remove-person']");
    if (!button) return;
    var chip = button.closest(".person-chip");
    var index = Array.prototype.indexOf.call(peopleList.querySelectorAll(".person-chip"), chip);
    if (index !== -1) removePerson(index);
  });

  expenseList.addEventListener("input", function (event) {
    if (event.target.classList.contains("expense-amount")) {
      event.target.value = event.target.value.replace(/[^\d.,]/g, "");
    }
    if (event.target.classList.contains("exact-input")) {
      event.target.value = event.target.value.replace(/[^\d.,]/g, "");
    }
    render();
  });

  expenseList.addEventListener("change", function (event) {
    var row = event.target.closest(".expense-row");
    if (!row) return;
    if (event.target.matches("input[type='radio'], .split-check, .expense-payer")) {
      syncRowState(row);
    }
    render();
  });

  expenseList.addEventListener("click", function (event) {
    var button = event.target.closest("[data-action='remove-expense']");
    if (!button) return;
    removeExpense(button.closest(".expense-row"));
  });

  document.getElementById("share-summary").addEventListener("click", shareSummary);
  document.getElementById("copy-summary").addEventListener("click", function () {
    copyText(summaryText()).then(
      function () {
        flash("Summary copied — paste it into the group.");
      },
      function () {
        flash("Couldn't copy automatically.");
      }
    );
  });
  document.getElementById("copy-link").addEventListener("click", function () {
    copyText(currentUrl()).then(
      function () {
        flash("Link copied.");
      },
      function () {
        flash("Couldn't copy automatically.");
      }
    );
  });

  /* ---------- boot ---------- */

  var shared = null;
  if (window.location.hash.indexOf("#d=") === 0) {
    shared = TS.decodeState(window.location.hash.slice(3));
  }
  applyState(shared || TS.emptyState());

  if (shared) {
    flash("Loaded the shared split.");
  }
})();
