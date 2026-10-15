# Machines: explain an idea by building it, in any style

A machine is a subject, not a look. The kit (`engine/src/canvas-core/mechanismKit.ts`) builds real
parts in 3D, sorts them, takes them apart and folds them back; a **hand** marks them in a style's
own medium. The same music box draws as cyanotype, coloured pencil, stipple or flat iso planes.
Worked example: `mechanism.ts` (the 18-note movement), `mechanismHands.ts`, `mechanismExplorer.ts`.

## 1. Turn the idea into a machine

1. **State the truth.** Ledger the concept's real quantities: counts, sizes, rates, limits (`explainer.md`).
2. **Find its verbs** (fills, waits, matches, rejects, decays) and **its nouns with quantities**.
3. **Find a physical mechanism that performs those verbs on those nouns**, one a general reader can
   name: a lock for "every condition must match", drawers sized by bytes, a sluice for a queue.
4. **Say it in one sentence:** "X moves, and its motion means Y." If you cannot, the mapping is wrong.
5. **Give every part a meaning**, and mark where the metaphor stops being literal.
6. **Pick the one part to watch.** It alone gets the accent (`accent: true` on its material).
7. **Add an instrument that reads the quantity** (a dial, a ruler, a counter, a readout corner).
8. **Choose the view** so the mechanism faces the viewer: `Cam.fit(A, E, points, box)`, A 35 to 60.

Two failures, one fix: too abstract (floating slabs, labelled boxes) or too flat (one big plate
with a few lines). Fix both with a recognisable machine of many small, purposeful parts.

## 2. Parts list before geometry

Write the parts by group: base (plate, feet, screws, label, ruler), structure (posts, bridges,
rails, stops), mechanism, controls (crank, knob), and the subject. Every part rests on another
and has a job. A figure is 40 to 80 parts; a hero 80 to 150; past that, propose a smaller version
that keeps the core. Detail comes from structure (a boss under a shaft, holes in a bedplate, a
stop lever), never from texture noise. A bare face or an empty corner is unfinished, not calm.

## 3. One model drives everything

The film's moving parts, the readout and any caption all read one pure model of `(frame)` or of
the input state. In the music box, `play(rot)` places the pins, bends the teeth and names the pin,
the tooth and the pitch in the readout; nothing is typed twice. Read words from where parts ARE
(the readout says "TAKING APART" while any spring is moving), and build counts from the list that
draws them ("8 ASSEMBLIES APART" is `PLAN.order.length`).

## 4. Build with the kit

| Need | Use |
|---|---|
| Camera, depth, a world offset on screen | `Cam`, `Cam.fit`, `c.depth`, `c.dv` |
| Slabs, plates, boxes with rounded plans, seams, bevels | `prism`, `box`, `rrect`, `circle` |
| Drums, posts, knobs, domes: any surface of revolution | `turned` with `cyl`, `cone`, `sphere`; bands are exact, never staircased |
| A lever, a vane, a bracket in any plane | `slab` with `leverRing` or any convex outline |
| Pipes, wires, cables along a route | `tubeAlong` (filleted bends, end caps) |
| Screws, pins, ticks, ribs that fade as they turn away | `screw`, `facingAt` + `smooth` for alpha |
| Many parts in the right order | `paintAll(items)`; each item has `at`, `bias`, `ride` (its assembly) |
| An exploded view | `ExplodePlan` + `sharesAt(plan, cues, t)`: staggered out, last-out first-home, reversals cancel pending moves |
| A frame in a card with four corners (figure, title, hint, live readout) | `card` |

Rules that keep it clean: split a part that wraps another (back half, inner, front half); every
part is held by something; explode real assemblies along their true direction, the outside ones
first; draw a chain line along each path of travel; fit the figure to 55 to 65 percent of the card.

## 5. Draw it in a style: the hand

The kit never chooses a colour. It calls the current hand with meaning: a region and its tone `q`
(0 darkest side, 4 top), a line and its role (`out`, `lit`, `in`, `crease`, `seam`, `hair`,
`light`, `chain`), a dot, the card's sheet, rule and lettering. `setHand(h)` before painting,
`setHand(flatHand())` after. Shipped hands: `isometric` (fast, the default), `blueprint`, `colouredPencil`,
`stipple`. To add one, read the style's recipe in `references/styles/<id>.md` and answer five
questions in code:

1. **Is there light?** Blueprint has none (tone is section lining, only on the part to watch);
   stipple's light is dot density; pencil's is pressure and stacked passes.
2. **What is an edge?** A ruled line, a broken pencil contour heavier on the shade side, a denser
   row of dots, or nothing at all (iso planes meet tone to tone).
3. **How is the accent made?** A colour, section lining, or density.
4. **What is the ground?** Draw it once into a cached layer; `knock` paints it back over a part.
5. **Are the marks anchored?** Anchor hatching and dots to `offset()`, never to the screen, and
   seed them from the part, so a still part never boils and a moving one carries its marks.

## 6. Films and interactive pieces

Two films, not one: the making (`kind: "drawing"`, each part inked then toned in assembly order
with `setReveal(ink, tone, paper)`, then the words) and the run (`kind: "explainer"`: play close on
the part to watch, explode, tour, home). One film holding both fails the dead-air gate, because a
build's slow strokes are measured against an explainer's floor. While apart, let each assembly
breathe a little along its own path, out of step with the others, so the tour never freezes. An interactive piece (`interactive.md`): one
spring per assembly with `zeta` 0.8 to 0.9 so parts land with weight, outer ones faster; a fixed
camera so the card and the bench bake once; the part nearest the pointer lights and the readout
says what it does; reduced motion holds the drum still.

## 7. Check it

Render at `--scale 2` or 3 and crop every joint (flange, bridge, crank, wire end, tooth tips); the
fault list, in order: a line that stops in the air, a part sunk into or floating off another, a
nearer part drawn behind, a texture cut at full strength mid-surface, a doubled edge. Then
`node tools/test.mjs mechanism` and, for a page, `emit-interactive.mjs` and `replay.mjs` (22 checks,
including 6 ms a frame at DPR 2). Measured, not assumed: say which of these you ran.
