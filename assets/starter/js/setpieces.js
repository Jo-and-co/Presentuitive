/* Custom choreography the beat engine cannot express. A hook runs on every paint
   and must both fire the animation once on a forward entry and SNAP to the final
   state on back, jump or reduced motion:

     Deck.registerHook(sceneIndex, function (scene, bi, instant) {
       if (instant) { // snap to the state for bi, no animation
       } else { // play the transition into bi
       }
     });

   See references/motion.md in the presentuitive skill. */
(function () { 'use strict'; })();
