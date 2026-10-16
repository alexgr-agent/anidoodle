# The review: four readings, one list, one gate

`working-method.md` says to review the whole film once, from the rendered file. This is how that
one review is run. It does not add rounds: four readings of the same frozen file, one ranked fix
list, one rebuild, one check that each fix landed.

The reason for four readings is that one reader looks for one kind of fault. Someone checking
for a popped frame does not notice that the film has no point, and someone following the story
forgives a hand with six fingers. Each reading below has one job, its own evidence and the
dimensions it scores. Do them in this order, and finish one before starting the next.

Freeze a copy of the file and note its hash first. Every reading is of that copy.

## The four readings

| Reading | Looks at | What it settles | Scores |
|---|---|---|---|
| **Director** | the contact sheet at one tile per beat, sound off; then each seam as a before/after pair | Whether someone who has never seen the brief could say what the film is about, and feel the payoff. | point, first second, pacing, seams |
| **Illustrator** | full-size stills of the hardest frames; crops of faces, hands, feet and joins at `--scale 2` | Whether a proud illustrator would sign it, or it is shapes assembled (`craft-bar.md`). | drawing, style |
| **Motion and finish** | `popscan.mjs`, `gate.mjs`, strips of consecutive frames across every seam and every fast move | Whether anything pops, stalls, jumps or smears that was not meant to. | motion, finish |
| **Sound and sync** | `music.mjs check` (with its ARC line), `verify-export.mjs`, `soundcheck.mjs` and its `soundsheet.mjs` picture, the cue table against the picture | Whether the sound is one piece with a shape, and lands on the picture. | sound |

Rules that make a reading worth having:

- **Evidence before opinion.** Every finding names a frame (or a second, for sound) and a cause.
  "The run feels slow" is an impression; "the ground travels 22 px a frame at 400 while her
  stride covers 60" is a finding.
- **Say what works first**, so it survives the fixes.
- **A picture that does not read is fixed in the picture.** Never by adding a caption.
- **The sound reading cannot hear.** Its findings are measurements; say so, and a human listens
  before the film ships.
- **A fresh reader is worth more than a second pass by the builder.** When a reading is handed
  to someone else, give them the file and the brief, never your own conclusions.

## Severity

| Level | Meaning | Examples |
|---|---|---|
| **P0** | seen on a key moment (the first second, the payoff, the last frame), or it breaks the story, a fact or the contract | the character changes between two shots; the payoff lands 3 frames off its sound; a frame differs between two renders |
| **P1** | noticed on a normal viewing | a one-frame pop mid-scene; two seconds where nothing changes; a seam where the travel reverses |
| **P2** | seen only on pause | a stroke a pixel short for three frames inside a fast move |

## The check before fixing

Before anything is changed, every P0 and P1 is looked at once more, at full size, by someone
trying to prove it wrong: it must be on the frame named, be what the finding says, and be
something a viewer would see. Some first-pass findings do not survive this, and each one that is "fixed" anyway
costs a rebuild and risks something that worked. What survives goes on the list, ranked by how
much the film gains for the time the fix takes.

## The scorecard

Score each line 1 to 5. The descriptions are for 1, 3 and 5. Where two readings disagree, the
lower score stands. A line with an open P0 cannot score above 3.

| | 1 | 3 | 5 |
|---|---|---|---|
| **Point** | a tour of nice things | one idea, but it drops out for a stretch | one idea that reads with the sound off, and something set up early that pays off |
| **First second** | a still or empty frame | moving, but the subject arrives late | frame 0 composed and already in motion; the subject known within a second |
| **Drawing** | subjects built from ellipses; rubber joints | sound, with weak hands, feet or joins | anatomy from named reference; survives a crop at twice the size |
| **Style** | one look recoloured | the medium's marks, used unevenly | the marks, the edge and the order of making all belong to the medium |
| **Motion** | everything fades and slides at one speed | good curves, with a pop or a stall | weight, anticipation, things that settle; nothing stops dead |
| **Seams** | dissolves between unrelated pictures | motivated, but one repeated until it is a preset | something carried across every seam; no designed seam used a third time (`checkSeamPlan`) |
| **Pacing** | dead holds, or everything at once | even, with no high point | one high point, calm either side of it, results held long enough to land |
| **Sound** | out of step with the picture, or wandering | in step, but flat or crowded | every cue on its frame, one clear loudest moment on the payoff, an ending that takes away |
| **Finish** | pops, banding, a frame that differs between renders | an explained flaw or two | gate and export checks pass; every flag from the scans answered |

A silent piece leaves Sound out. A still is scored on Point, Drawing, Style and Finish.

## The gate

The film ships when all of these hold:

- every line is 3 or more, Finish is 5, and the average is 4 or more;
- no P0 is open;
- `gate.mjs` and `verify-export.mjs` pass, and for a scored film `music.mjs check` passes and a
  human has listened.

After the rebuild, go down the fix list item by item against the new file and mark each one
**fixed**, **partly** or **still there**, with the frame looked at. Nothing is marked fixed from
the code alone.

Then say the scores to the person who asked, in plain words, with the one or two things you
would still change. "This is a 4 on Seams, because the brush wipe is used three times" is worth
more to them than "done".
