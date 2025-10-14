// ==UserScript==
// @name         FAB Free Personal Licensed Asset Collector (Paged Scroll + Manual Trigger)
// @namespace    http://tampermonkey.net/
// @copyright    2025, MrTheoW (https://github.com/MrTheoW)
// @version      1.2
// @description  (Not compatible with Firefox) Automates the hassle of getting the free personal licensed Assets from fab.com using TemperMonkey
// @match        https://www.fab.com/search?sort_by=price&licenses=personal&is_free=1*
// @license      MIT
// @run-at       document-end
// @grant        none
// @author       Theo Willemse
// ==/UserScript==

(function() {
  'use strict';

  // CONFIGURATION: number of scrolls per batch
  const SCROLL_TIMES = 5;

  // Add pulsing brightness CSS
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulseBrightness {
      0% { filter: brightness(100%); }
      50% { filter: brightness(75%); }
      100% { filter: brightness(100%); }
    }
    #fab-trigger-btn.idle {
      animation: pulseBrightness 2s infinite ease-in-out;
    }
  `;
  document.head.appendChild(style);

  // Scroll down up to maxTimes times, then resolve
  async function scrollPage(maxTimes) {
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
    triggerBtn.classList.remove('idle');
    triggerBtn.textContent = 'Loading new batch...';
    triggerBtn.disabled = true;

    console.log(`🔄 Scrolling up to ${SCROLL_TIMES} times for new items…`);
    await scrollPage(SCROLL_TIMES);
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
      triggerBtn.classList.add('idle');
      return;
    }

    for (let i = 0; i < total; i++) {
      buttons[i].click();
      triggerBtn.textContent = `Processing ${i+1} of ${total}`;
      await new Promise(r => setTimeout(r, 500));

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
      if (confirm) confirm.click();

      console.log(`➕ Claimed item ${i+1}/${total}`);
      await new Promise(r => setTimeout(r, 1000));
    }

    triggerBtn.textContent = 'Get all Free / Unclaimed assets';
    triggerBtn.disabled = false;
    triggerBtn.classList.add('idle');
    console.log("✅ Batch complete. Click again for next batch.");
  }

  let triggerBtn;

  // Create the manual trigger button
  function createTriggerButton() {
    if (triggerBtn) return;
    triggerBtn = document.createElement('button');
    triggerBtn.id = 'fab-trigger-btn';
    triggerBtn.textContent = 'Get all Free / Unclaimed assets';
    triggerBtn.classList.add('idle');
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
    `;
    triggerBtn.addEventListener('click', () => {
      claimBatch();
    });
    document.body.appendChild(triggerBtn);
    console.log('[FAB Script] Trigger button added.');
  }

  window.addEventListener('load', () => {
    setTimeout(createTriggerButton, 1000);
  });
})();
