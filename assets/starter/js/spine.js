/* Deck spine and corner label. Change ZONES and TITLE_OF per deck.

   The spine changes STATE at slide transitions and never animates. Each scene
   declares data-zone. Segment widths are proportional to slide counts; if the deck
   grows, trim UNIT so the bar envelope stays near 290px.

   The corner label carries THIS slide's title, keyed by data-scene so it stays
   correct under back and jump. A title lives in one place: move it here and delete
   it from the slide body. Leave out slides that compose their own eyebrow. */
(function () {
  'use strict';

  const ZONES = [
    { key: 'part-a', label: 'PART A', slides: 2 },
    { key: 'part-b', label: 'PART B', slides: 3 },
  ];
  const UNIT = 58;   // px per slide -> proportional widths

  const TITLE_OF = {
    'morph-demo': 'A MORPH',
    'data-demo': 'A NUMBER AND A LINE',
    // title / turn / close intentionally absent -> no corner label.
  };

  // Fixed-width label box so the bars never shift when the zone word changes.
  function mount(hostSelector) {
    const host = document.querySelector(hostSelector);
    if (!host) return null;
    host.innerHTML =
      '<span class="spine-word"></span>' +
      ZONES.map((z) => `<span class="spine-seg" data-zone="${z.key}"
                              style="width:${z.slides * UNIT}px"></span>`).join('');
    return host;
  }
  const host = mount('#spine');

  function update(zoneKey) {
    if (!host || !zoneKey) return;
    const zone = ZONES.find((z) => z.key === zoneKey);
    host.querySelector('.spine-word').textContent = zone ? zone.label : '';
    host.querySelectorAll('.spine-seg').forEach((seg) => {
      seg.classList.toggle('on', seg.dataset.zone === zoneKey);
    });
  }

  // Working slide number, zero-based, matching notes.txt and conversation.
  // Remove #slide-no from index.html to switch it off for the final talk.
  const noEl = document.getElementById('slide-no');
  const ALL_SCENES = Array.prototype.slice.call(document.querySelectorAll('.scene'));
  function updateNo(scene, dark) {
    if (!noEl) return;
    const i = ALL_SCENES.indexOf(scene);
    noEl.textContent = i < 0 ? '' : i + ' / ' + (ALL_SCENES.length - 1);
    noEl.classList.toggle('on-dark', !!dark);
  }

  const actEl = document.getElementById('act-eyebrow');
  let currentAct = null, currentDark = null;
  function updateAct(scene) {
    if (!actEl) return;
    const label = TITLE_OF[scene?.dataset.scene] || '';
    const dark = scene?.hasAttribute('data-dark') || false;
    updateNo(scene, dark);
    if (label === currentAct && dark === currentDark) return;
    currentAct = label; currentDark = dark;
    actEl.textContent = label;
    actEl.classList.toggle('show', !!label);
    actEl.classList.toggle('on-dark', dark);
  }

  let currentZone = null;
  window.Spine = {
    sync(scene) {
      const z = scene?.dataset.zone;
      if (z && z !== currentZone) { currentZone = z; update(z); }
      updateAct(scene);
    },
  };
})();
