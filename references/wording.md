# Wording

How to check slide text, speaker notes and spoken lines for the habits that make writing sound generated. Run it on every draft before the user sees it.

Two rules outrank everything below:

- **The speaker's sample wins.** If their own writing uses dashes, triplets or long sentences, keep those habits at about the sample's rate. Matching the person beats scrubbing a tell.
- **Never add a fact.** A rewrite keeps every claim and adds none. A vague line may become specific only with a figure, name or date from the facts ledger or the user. If no such detail exists, write the plain version or ask.

## The tells

Single hits mean little. Look for clusters: three or four of these in one note block is a rewrite.

### Inflation

| Tell | Sounds like | Plain |
|---|---|---|
| Puffed significance | "This marked a pivotal moment for the team." "A testament to our commitment." | Say what happened: "After that, the team stopped double-checking every form." |
| A trailing "-ing" clause that adds a meaning | "The queue fell by half, highlighting the value of the second desk." | Stop at the fact, or give the point its own sentence. |
| Promotional words | vibrant, seamless, robust, stunning, groundbreaking, world-class | The thing it does, or the number. |
| Chatbot vocabulary | delve, crucial, pivotal, key (as an adjective), landscape, tapestry, underscore, showcase, foster, enhance, intricate, align with | The everyday word. `audit.js` flags some of these on slides as `SLOP_WORD`. |
| Dodging "is" and "has" | "The dashboard serves as our single source." "The tool boasts three modes." | "The dashboard is..." "The tool has three modes." |
| Vague authority | "Experts agree." "Studies show." "Many teams find." | Name the source from the ledger, or cut the claim. |
| An upbeat send-off | "Exciting times lie ahead." "The future looks bright." | End on the last real point. |

### Shape and rhythm

| Tell | Sounds like | Plain |
|---|---|---|
| Not X but Y | "It's not just a checklist, it's a mindset." | Say the one true thing: "The checklist caught two errors a week." |
| A clipped tail | "Every form goes through one desk. No exceptions." | Fold it in, or drop it if it adds nothing. |
| Triplets by reflex | "Faster, simpler, safer." "People, process and technology." | Keep the one that matters and give its evidence. Three is fine when there really are three. |
| Staccato drama | "Then the numbers came in. Flat. Again. Nobody spoke." | One short line for emphasis is fine. A run of them sounds staged. |
| Aphorisms | "Trust is the currency of operations." "Speed becomes a trap." | The concrete claim underneath it. |
| Fake-candid openers | "Here's the thing." "Honestly?" "The result?" "Let's be real." | Just say it. |
| Announcing instead of saying | "Let's dive in." "Now let's take a look at..." | Start with the content. Telling the room where they are ("Two things went wrong") is fine; that is navigation, not filler. |
| Deep-truth framing | "At its core..." "The real question is..." "What really matters is..." | Drop the frame and keep the point. |
| False ranges | "From the first form to the final sign-off..." when there is no scale between them | List the two things, or the steps. |
| One thing, three names | "the backlog", then "the queue", then "the pile" | One name throughout. On slides a new word reads as a new thing. |
| Hidden actor | "Mistakes were made." "The decision was taken." | Who did it, if the speaker is willing to say. |
| Stacked hedges | "This could potentially help to some extent." | One hedge, where the doubt is real: "This may help." |
| Filler | "in order to", "due to the fact that", "it is important to note that", "at this point in time" | to, because, (cut), now |

### On the page

| Tell | Do instead |
|---|---|
| Em and en dashes in visible text | Default is none, enforced by `audit.js` as `DASH`. Use a full stop, comma, colon or brackets. In notes, follow the sample. |
| Title Case For Every Heading | Sentence case, unless the brand or theme sets otherwise. |
| Bold lead-ins, emoji, icons on every line | See "Words on the slide" in `references/anti-slop.md`. |
| Chatbot leftovers in notes: "Certainly!", "I hope this helps", "Here is a script for..." | Delete. Notes are the speaker's words, not a reply to them. |
| Gap-filling: "While details are limited, it likely..." | Say it isn't known, or cut it. Never guess and present it as fact. |

Curly quotes and apostrophes are the typographic default on slides (`references/design-system.md` §6), not a tell.

## Spoken lines

Notes are read aloud, so check them by ear.

- Read every block aloud at talking pace. Where you stumble or run out of breath, rewrite.
- Mix sentence lengths. Generated speech tends toward an even, mid-length beat.
- Contractions are normal speech. "We didn't" over "we did not", unless the sample says otherwise.
- Round numbers for speech (`references/dataviz.md`): "about one in five", not 19.6%, unless exactness is the point.
- Keep what sounds like a person: an odd specific detail, a mixed feeling, an aside, a self-correction. These are the first things an over-eager edit removes.

## Don't over-correct

Plain, dry text with none of the tells above is just plain text. Leave it. These are not tells on their own:

- One dash, one "however", one short sentence for emphasis.
- Formal or technical words that are the right word ("ostensibly", "reconcile", "latency").
- Terms of art and quoted text: "landscape" orientation, a "key" in a database, a quote, a product name, a title.
- Polished grammar. People edit.

## The check

1. Mark every tell in the draft.
2. Rewrite. Keep every claim, add none, keep the speaker's habits.
3. Ask two questions and answer them briefly: "What in this still sounds generated?" and "Does the rewrite state any fact, name, number or date that isn't in the ledger or the user's words?"
4. Fix what they find. Scan visible text for dashes. Read the notes aloud against the sample.
5. Report in a line what changed, not the whole diff, unless the user asks.

Adapted from the `humanizer` skill (MIT), which draws on Wikipedia's "Signs of AI writing" page.
