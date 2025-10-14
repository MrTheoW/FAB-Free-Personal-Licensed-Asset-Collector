// ==UserScript==
// @name         FAB Free Personal Licensed Asset Collector (Paged Scroll + Manual Trigger)
// @namespace    http://tampermonkey.net/
// @copyright    2025, MrTheoW (https://github.com/MrTheoW)
// @version      1.0
// @description  Scrolls down up to 5 times, scans for claimable assets and claims them using the Personal License. (Not compatible with Firefox)
// @match        https://www.fab.com/search?sort_by=price&licenses=personal&is_free=1*
// @license      MIT
// @run-at       document-end
// @grant        none
// @author       Theo Willemse
// @description  Automates the hassle of getting the free personal licensed Assets from fab.com using TemperMonkey
// @downloadURL  https://github.com/MrTheoW/FAB-Free-Personal-Licensed-Asset-Collector
// ==/UserScript==

(function() {
  'use strict';

  // Scroll down up to maxTimes times, then resolve
  async function scrollPage(maxTimes = 5) {
    let lastHeight = document.body.scrollHeight;
    let count = 0;
    while (count < maxTimes) {
      window.scrollTo(0, document.body.scrollHeight);
      await new Promise(r => setTimeout(r, 800));
      const newHeight = document.body.scrollHeight;
      if (newHeight === lastHeight) break;
      lastHeight = newHeight;
      count++;
    }
  }

  // Claim all loaded free personal items with per-item progress
  async function claimBatch() {
    triggerBtn.textContent = 'Loading new batch...';
    console.log('🔄 Scrolling for new items…');
    await scrollPage(5);
    console.log('✅ Scrolling complete.');

    const buttons = Array.from(
      document.querySelectorAll(
        'button[aria-label="Add listing to cart"]:not([aria-disabled="true"])'
      )
    );
    const total = buttons.length;
    console.log(`Found ${total} unclaimed items.`);

    if (total === 0) {
      triggerBtn.textContent = 'No unclaimed items';
      triggerBtn.disabled = false;
      return;
    }

    for (let i = 0; i < total; i++) {
      const btn = buttons[i];
      btn.click();

      // update trigger button text
      triggerBtn.textContent = `Processing ${i+1} of ${total}`;

      await new Promise(r => setTimeout(r, 500));

      // select personal license
      const radio = Array.from(
        document.querySelectorAll('input[type="radio"][name="License"]')
      ).find(input => {
        const label = document.querySelector(`label[for="${input.id}"]`);
        return label && label.textContent.trim() === "Personal";
      });
      if (radio) radio.click();

      await new Promise(r => setTimeout(r, 300));
      const confirm = Array.from(document.querySelectorAll('button'))
        .find(b => b.textContent.trim() === "Add to My Library");
      if (confirm) {
        confirm.click();
        console.log(`➕ Claimed item ${i+1}/${total}`);
      }

      await new Promise(r => setTimeout(r, 1000));
    }

    triggerBtn.textContent = 'Get all Free / Unclaimed assets';
    triggerBtn.disabled = false;
    console.log("✅ Batch complete. Click again for next batch.");
  }

  let triggerBtn;

  // Create the manual trigger button
  function createTriggerButton() {
    if (triggerBtn) return;
    triggerBtn = document.createElement('button');
    triggerBtn.id = 'fab-trigger-btn';
    triggerBtn.textContent = 'Get all Free / Unclaimed assets';
    triggerBtn.style.cssText = `
      position: fixed;
      top: 2cm;
      left: 50%;
      transform: translateX(-50%);
      z-index: 10000;
      padding: 8px 14px;
      background-color: #007bff;
      color: #fff;
      border: none;
      border-radius: 4px;
      font-size: 14px;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(0,0,0,0.2);
    `;
    triggerBtn.addEventListener('click', () => {
      triggerBtn.disabled = true;
      claimBatch();
    });
    document.body.appendChild(triggerBtn);
    console.log('[FAB Script] Trigger button added.');
  }

  window.addEventListener('load', () => {
    setTimeout(createTriggerButton, 1000);
  });
})();
