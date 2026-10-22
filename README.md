# Owenmore Gaels Stats – Demo

A no-login demo of the club stats app. Nothing to set up: no PINs, no server, no database.

## Put it online (2 minutes)
1. Go to https://app.netlify.com/drop
2. Drag the **public** folder onto the page.
3. Netlify gives you a link. Open it on a phone; "Add to Home Screen" makes it look like an app..

## What's in it
| Page | What to try |
|---|---|
| `index.html` – coach app | Stats tab (form, shot map, 45s, kick-outs), Club tab overview, Fixtures calendar, and **Start match** on the U20 fixture to score live |
| `live.html` – parents' page | Live score, clock in minutes with 1st/2nd half, subs, club updates, fixtures, results |
| `me.html` – player page | Pick a player (or enter a code from the coach app's Squads tab) to see their own stats and shot map |

Scoring a match in the coach app shows up on the parents' page **on the same phone or browser**. On another device the parents' page shows an example live match that loops. The full version (with sign-in and a server) shares it with everyone.

**Reset demo** (Squads tab) puts the example season back.

## The data
- **Real** (2026 season): every scoreline, date, opponent and venue below, plus the upcoming U20 B championship game v Geevagh/St Michaels (Sat 24 Oct, Connolly Park).
  - Senior: Div 2 League final v Geevagh 1-18 to 1-17 (aet, Bunninadden); Junior A v Coolera/Strandhill 2-21 to 3-6; v Tourlestrane 6-15 to 0-7; Junior A final v St Michael's 1-14 to 0-16 (Markievicz Park)
  - Ladies Junior B v St John's 4-16 to 2-6 and 8-19 to 4-4 (Eastern Harps)
  - U16 Girls v St Molaise Gaels 5-14 to 3-6; U13 Girls v CT Gaels 1-7 to 4-15
- **Invented**: all player names, and the events behind each score (who scored, from where, wides, turnovers, kick-outs, cards, subs). They're generated to add up exactly to the real scorelines.
- **Examples**: four upcoming fixtures marked "Example", to fill the calendar.
- Crests: Owenmore Gaels' crest is built in; other clubs' crests load from the Sligo LGFA club list.

Sources: Ocean FM match reports and results round-ups (July–October 2026), sligolgfa.com/results, sligogaa.ie fixtures.

## Editing
Source is in `src/`. Run `sh src/build.sh` to rebuild `public/`. Demo data lives in `src/demo-data.js`.
