# Site art: a picture that works on someone's page

A hero beside a headline, a feature tile, a row of spots, a share card. The picture no longer owns its
canvas: a headline does, a page colour does, a brand does. Kit: `engine/src/canvas-core/assetKit.ts`.
Worked example: `siteHero.ts` (light page) and `siteHeroDark.ts` (dark page), one source.

## 1. The brief, before any drawing

Write five lines, from the request or as defaults you say out loud:

1. **Where it goes:** product, page, section, shown size, what sits beside it.
2. **The one thing it says:** a promise ("ships in a minute"), a feeling ("unhurried"), or a fact ("works offline").
3. **Who looks:** engineers read instruments and machines; a family app wants warm, soft, homely things.
4. **The page:** its exact colour, light or dark or both, and the brand colours.
5. **The style:** any of the 32. Style is free; craft is not.

## 2. One real object that says it

Three kinds, and write one concept of each before choosing:

- **Literal:** the product as a fine object (a camera for a photo app).
- **Metaphor:** a real thing whose working is the promise. Software has no body, so this is usually the strongest.
- **Scene:** a small world on a tray or a shelf, one hero object among a few supporting ones. Good for wide heroes and for sets.

Choose with five quick tests: **glance** (named in a second at its shown size), **promise** (its working says
it, no caption), **parts** (fifty real parts, not a smooth blob), **page** (its silhouette suits the slot:
wide and low beside a headline, tall in a column), **brand** (material and era match the mood). Say which
you pick and why in one line, then build it. If the user already named the object, skip the round.

| The promise | A thing that does it |
|---|---|
| Nothing gets lost | A post-office sorting frame, every letter in its slot, one being placed |
| Fast setup | A flat-pack chair half assembled, the last dowel going in |
| Team chat | A switchboard, one cable mid-plug, a lamp lit |
| Privacy | A letterbox with a combination dial, its flap shut |
| Automation | A marble run: one marble on the track, the next waiting at the gate |
| Insights | A weather station: anemometer turning, barometer needle, a logbook |
| Translation | A typewriter with two type baskets, one key mid-strike |
| Savings | A coin sorter with tubes by size, one coin rolling down the ramp |
| Learning | A desk globe on a brass meridian, a pin in one city |
| Music | A cylinder music box, the drum turning, the governor a blur |

## 3. The moment

A picture shown once gets one place for the eye: a drawer half out, a key mid-strike, a lamp lit, a
coin in the slot. Exactly one, carried by the accent, about a third of the way into the art region on
the side nearest the text (`strongPoint`). If the accent lands on structure, the eye lands on structure.

## 4. Placement

`PLACEMENTS` holds the canvas, the art region and the headline zone for each slot (heroRight, heroLeft,
heroCentre, art, tile, spot, banner, social, slide). `Cam.fit(A, E, points, fitBox(p))` fits the object
into its region; pass every extreme point, lifted parts included. The object leads toward the text: pick
the azimuth that turns its long face and its moment that way. Nothing enters the headline zone, not a
shadow, not a sheen; prove it with `node tools/placement.mjs still.png --W <meta.W> --safe x,y,w,h`.
Keep a few units of air at every edge the object does not deliberately bleed off.

## 5. Page colour, light and dark

`setPalette(pagePalette({ paper, accent, colours, tint }))` moves every material onto the page: on a
light page the neutrals shift by the page's difference in lightness and, by `tint`, its colour cast; on
a dark page the parts sit just above the page, the lit top lightest, the lines lighter than the faces.
The fill colour of the page and of `paper` must be identical, or every part shows a pale halo. A site
with both themes gets both films from one source (`heroOn(title, paper, accent)`).

## 6. Brand colour

`accent: "#hex"` puts the brand on the part to watch (`accent: true`); `colours: { wood: "#7a5536" }`
recolours any material by name, which is also how brass, walnut or ebony are made. Mode **body** makes
the part of the colour (a five-step ramp in its own hue, lightness set so four tones read and nothing
glares on dark). Mode **ink** keeps the part neutral and colours only its lines and dots (an LED, a
pointer, an engraved mark). Default to one brand family: the subject in body, one or two small echoes.
Colour the moment, never the base or the biggest faces, unless the product is that colour.

## 7. Motion is the object working

Loop one full cycle of the machine so it repeats without a seam. Anything that would turn in life turns;
fast spinners get `spin(angle, sweep, draw, { disc })`, a sheen disc and fading trails, because bare blades
read as a paper cut-out. At most three or four kinds of motion, out of step. Beside a headline, calm wins:
if the real machine moves little, declare it with a `meta.holds` reason instead of inventing motion. Frame 0
is what a reduced-motion visitor sees, so compose it as the hero frame.

## 8. Sets and small sizes

Spots in a row share one family of parts (the same screws, feet, bevels, label plates) and similar
weight: add parts to the sparse one, never strip the dense one. Under about 320 px cut detail instead of
shrinking it: bigger screws, fewer ticks, no knurls. Check every piece at its shown size and at 390 px
wide (`placement.mjs --phone out.png`), and look.

| Mood | Shape and parts | Colour |
|---|---|---|
| Precise | Thin plates, fine bevels, rulers, many small screws | Greys and one sharp accent |
| Friendly | Big radii, chunky buttons, rubber feet, few large screws | Warm page, a soft accent on the body |
| Crafted | Wood cheeks, brass fittings, label plates, hinges | Cream page, a deep accent |
| Calm | Few objects with air between, low heights, one slow motion | Low contrast, a muted accent |
| Launch | A diagonal, something lifted or in flight | The accent on the moving thing |
