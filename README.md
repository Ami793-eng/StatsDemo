# Owenmore Gaels Stats – Demo (v2, built to the planning brief)

A no-login demo of the full club app. No server, no database: everything is saved on the device.

## Put it online
1. Go to https://app.netlify.com/drop
2. Drag the **public** folder onto the page.
3. Open the link on a phone and "Add to Home Screen" – it installs like an app and works with no signal.

## Pages
| Page | Who | Try this |
|---|---|---|
| `index.html` | Admin, coaches, scorers | Use **Viewing as** at the top to switch role. As **Áine (scorer)**, open the U20 game, tap Throw-in and score it. |
| `live.html` | Public / parents | Live score and clock, subs, sin-bins, club updates, fixtures with map links, season form, results with share cards, score alerts, Join / Renew on Foireann |
| `me.html` | Player / parent | Pick a player (stands in for their private login code): minutes, appearances, own stats, shot map |

## What's in it (from the brief)
- **Scorer screen:** clock, big buttons, Undo, "Add player" after quick taps, subs incl. blood subs, cards with sin-bin countdown, half time / full time / extra time, time-stamped notes (keyboard mic for dictation). No passes.
- **Roles:** admin (all teams, settings), coach (own team only), scorer (assigned matches only), player/parent, public.
- **One scorer per match** with handover; coaches/admin can take over. Every change is in the audit trail.
- **Team privacy tiers:** Adult (full names public), Minor (first name + number publicly; stats behind player login), Go Games (no scores, results or tables; minutes and participation only).
- **Coaches:** minutes played (from starting team + subs log), appearances and scorers leaderboards, automatic match reports (full + public versions), CSV export (match and season).
- **Parents:** score alerts, shareable result card, venue map link, throw-in time, referee, results archive, season form, Join / Renew on Foireann.
- **Admin:** Foireann numbers on players, registrar-export import, Foireann API key placeholder (Sligo GAA site is the fallback), Join / Renew link (foireann.ie), optional lotto link, minutes rules (blood subs, sin-bin time).
- **Rules built in:** GAA football black card = 10 min sin-bin; LGFA yellow card = sin-bin from U14 up (10 min with 30-min halves, 5 min shorter, none to U13); 2-point arc; 45s/65s.

## Demo limits (the full version fixes these)
- Data lives on one device: scoring shows on the public page in the same browser only. Other devices see an example live match.
- Score alerts only fire while the public page is open; the full version uses push.
- CSV and image saves ask you to confirm; the CSV is also shown so you can copy it.

## The data
Real 2026 results (scorelines, dates, opponents, venues) from Ocean FM, Sligo LGFA and Sligo GAA. The U20 fixture v Geevagh/St Michaels (Sat 24 Oct, Connolly Park, Ref M. Duffy) is real. Players, Foireann numbers and the events behind each score are invented and generated to add up exactly to the real scores. Fixtures marked "Example" are made up.

## Editing
Source is in `src/`; run `sh src/build.sh` to rebuild `public/`. Demo data is in `src/demo-data.js`.
