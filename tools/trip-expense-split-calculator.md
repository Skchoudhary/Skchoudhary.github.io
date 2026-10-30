---
layout: portfolio
title: Trip Expense Split Calculator | Sandeep Choudhary
description: Free trip expense split calculator for India. Add who paid for what and see exactly who owes whom, with a summary you can paste into the group chat.
permalink: /tools/trip-expense-split-calculator/
image:
  path: /assets/images/trip-split-preview.png
  width: 1200
  height: 630
  alt: Trip expense split calculator by Sandeep Choudhary
---

<div class="portfolio-home">
  <div class="portfolio-shell">
    {% include site-header.html %}

    <div class="portfolio-content">
      <article class="tool-page">
        <p class="eyebrow">Free tool · India</p>
        <h1>Trip expenses,<br /><span>split cleanly.</span></h1>
        <p class="writing-intro">Add who paid for what. Get exactly who owes whom, and a summary you can drop into the group chat. No signup, no accounts — the maths happens in your browser.</p>

        <form class="split-tool" id="split-tool" novalidate>
          <div class="split-title">
            <label for="trip-title">Trip name <span>optional</span></label>
            <input id="trip-title" type="text" placeholder="Goa trip" autocomplete="off" maxlength="60" />
          </div>

          <div class="split-block">
            <div class="split-block-head">
              <h2 id="people-heading">People</h2>
              <button type="button" class="split-add" id="add-person">+ Add person</button>
            </div>
            <div class="people-list" id="people-list" role="group" aria-labelledby="people-heading"></div>
          </div>

          <div class="split-block">
            <div class="split-block-head">
              <h2 id="expenses-heading">Expenses</h2>
              <button type="button" class="split-add" id="add-expense">+ Add expense</button>
            </div>
            <div class="expense-list" id="expense-list" role="group" aria-labelledby="expenses-heading"></div>
          </div>

          <div class="split-result" id="split-result">
            <p class="result-total" id="result-total" aria-live="polite"></p>
            <div id="result-body"></div>
            <div class="share-actions" id="share-actions" hidden>
              <button type="button" class="try-link" id="share-summary">Share summary <span aria-hidden="true">↗</span></button>
              <button type="button" class="share-link" id="copy-summary">Copy summary</button>
              <button type="button" class="share-link" id="copy-link">Copy link</button>
            </div>
            <p class="share-note" id="share-note" hidden>Anyone with this link can see these amounts. Nothing is stored on a server.</p>
            <p class="share-status" id="share-status" role="status" aria-live="polite"></p>
          </div>
        </form>

        <section class="tool-section" aria-labelledby="how-it-works">
          <h2 id="how-it-works">How the split works</h2>
          <p>Every expense has a payer and a set of people sharing it. For each person the calculator adds up what they paid, adds up their share, and the difference is their balance.</p>
          <ol class="tool-steps">
            <li><strong>Add the people.</strong> Rename them to whatever the group actually calls them.</li>
            <li><strong>Add each expense.</strong> Who paid, how much, and who shares it. A cab someone joined late is one row with three people ticked instead of four.</li>
            <li><strong>Read the settlement.</strong> The smallest set of transfers that clears every balance.</li>
          </ol>
          <p>Amounts are held in paise while calculating, so a ₹100 bill split three ways becomes ₹33.34, ₹33.33 and ₹33.33 — not three numbers that quietly lose a rupee.</p>
        </section>

        <section class="tool-section" aria-labelledby="worked-example">
          <h2 id="worked-example">A worked example</h2>
          <p>Three friends, one long weekend. Hotel ₹9,000 paid by you, cab ₹2,400 paid by Asha, food ₹3,000 paid by Rahul. That is ₹14,400 across three people, so ₹4,800 each.</p>
          <ul class="tool-example">
            <li><span>You</span><span>paid ₹9,000 → gets back ₹4,200</span></li>
            <li><span>Asha</span><span>paid ₹2,400 → owes ₹2,400</span></li>
            <li><span>Rahul</span><span>paid ₹3,000 → owes ₹1,800</span></li>
          </ul>
          <p>Two transfers clear it: Asha pays you ₹2,400 and Rahul pays you ₹1,800. Nobody has to make four separate payments to four different people.</p>
          <p>Tap <em>Try an example</em> above to load exactly this trip and change it around.</p>
        </section>

        <section class="tool-section tool-faq" aria-labelledby="faq">
          <h2 id="faq">Questions people ask</h2>
          <h3>Is splitting everything equally fair?</h3>
          <p>Usually, and it is the fastest. It stops being fair when one person drinks the expensive whisky or takes the only single room. Switch that one expense to exact amounts rather than changing the whole trip.</p>
          <h3>What if someone joins for only part of the trip?</h3>
          <p>Open that expense and untick them. They stay in the group for the expenses they shared and are excluded from the rest.</p>
          <h3>Who pays for fuel and tolls?</h3>
          <p>Treat them as expenses like any other. If you are driving your own car, many groups split fuel and tolls but not the car itself. If you want to cover wear, agree a per-kilometre rate and add that as a line.</p>
          <h3>How should a couple sharing one room be counted?</h3>
          <p>Add them as two people and split the room between both, or as one person if they are paying as a pair. The calculator follows whichever you pick — it only splits the rows you give it.</p>
          <h3>Is any of this sent anywhere?</h3>
          <p>No. The calculation runs in your browser. The share link puts the trip into the URL itself, nothing is stored on a server, and the page keeps working offline once loaded.</p>
        </section>

        <aside class="tool-cta">
          <p><strong>This handles one trip.</strong> SplitX keeps a group running across trips, tracks who actually paid, and reminds the people who forget.</p>
          <a class="try-link" href="https://splitx.org/" target="_blank" rel="noopener noreferrer" data-goatcounter-click="splitx-from-trip-calculator" data-goatcounter-title="Try SplitX after the calculator">Try SplitX <span aria-hidden="true">↗</span></a>
        </aside>
      </article>

      <footer class="about-footer">
        <div class="writing-links" aria-label="More">
          <span class="writing-label">More</span>
          <a href="/tools/" data-goatcounter-click="tools" data-goatcounter-title="Free tools">Free tools <span aria-hidden="true">↗</span></a>
          <a href="/work/" data-goatcounter-click="work" data-goatcounter-title="Work history">Work history <span aria-hidden="true">↗</span></a>
          <a href="/writing/" data-goatcounter-click="writing" data-goatcounter-title="Writing">Writing <span aria-hidden="true">↗</span></a>
          <a href="mailto:work@sandeepk.dev" data-goatcounter-click="email" data-goatcounter-title="Email">Say hello <span aria-hidden="true">↗</span></a>
        </div>
        <p class="copyright">© 2026 Sandeep Choudhary · <a href="/">Back home</a></p>
      </footer>
    </div>
  </div>
</div>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Trip Expense Split Calculator",
  "url": "https://www.sandeepk.dev/tools/trip-expense-split-calculator/",
  "applicationCategory": "FinanceApplication",
  "operatingSystem": "Any",
  "description": "Work out who owes whom after a group trip. Add expenses, choose who shared each one, and get a settlement plan you can paste into the group chat.",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "INR" },
  "author": { "@type": "Person", "name": "Sandeep Choudhary", "url": "https://www.sandeepk.dev/" }
}
</script>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Is splitting everything equally fair?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Usually, and it is the fastest. It stops being fair when one person drinks the expensive whisky or takes the only single room. Switch that one expense to exact amounts rather than changing the whole trip."
      }
    },
    {
      "@type": "Question",
      "name": "What if someone joins for only part of the trip?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Open that expense and untick them. They stay in the group for the expenses they shared and are excluded from the rest."
      }
    },
    {
      "@type": "Question",
      "name": "Who pays for fuel and tolls?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Treat them as expenses like any other. If you are driving your own car, many groups split fuel and tolls but not the car itself. If you want to cover wear, agree a per-kilometre rate and add that as a line."
      }
    },
    {
      "@type": "Question",
      "name": "How should a couple sharing one room be counted?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Add them as two people and split the room between both, or as one person if they are paying as a pair. The calculator follows whichever you pick."
      }
    },
    {
      "@type": "Question",
      "name": "Is any of this sent anywhere?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "No. The calculation runs in your browser. The share link puts the trip into the URL itself, nothing is stored on a server, and the page keeps working offline once loaded."
      }
    }
  ]
}
</script>
<script src="/assets/js/trip-split.js" defer></script>
<script src="/assets/js/trip-split-ui.js" defer></script>
