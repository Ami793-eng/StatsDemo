// Club crests from the Sligo LGFA club list (https://sligolgfa.com/clublist/), hosted on Sportlomo.
// Crest images are hotlinked from the Sportlomo-hosted Sligo LGFA club list.
const BASE = "https://sportlomo-userupload.s3.amazonaws.com/clubLogos/";
export const CRESTS = [
  { id: 90947, n: "Ballymote", f: "Ballymote.png" },
  { id: 81475, n: "CT Gaels", f: "CT Gesls Crest.jpg" },
  { id: 81473, n: "Calry/St Josephs", f: "Calry crest.jpg" },
  { id: 81474, n: "Coolera/Strandhill", f: "coolera crest.jpg" },
  { id: 81476, n: "Curry", f: "Curry crest.jpg" },
  { id: 81477, n: "Drumcliffe/Rosses Point", f: "drumcliffe crest.jpg", a: ["Drumcliffe/RP"] },
  { id: 81478, n: "Eastern Harps", f: "Eastern Harps Crest.png" },
  { id: 81479, n: "Eoghan Rua", f: "eoghan rua crest.jpg", a: ["Easkey", "Eoghan Rua Easkey"] },
  { id: 81480, n: "Geevagh", f: "Geevgh GAA Crest.jpg" },
  { id: 81481, n: "Owenmore Gaels", f: "owenmore gaels crest.jpg", a: ["Owenmore"] },
  { id: 81482, n: "Shamrock Gaels", f: "Shamrock Gaels Crest.png" },
  { id: 81483, n: "St Farnans", f: "farnans crest.jpg", a: ["St Farnans/St Patricks"] },
  { id: 81485, n: "St Johns", f: "Johns Crest.jpg" },
  { id: 81486, n: "St Marys", f: "Marys crest.jpg" },
  { id: 81487, n: "St Michaels", f: "michaels crest.jpg" },
  { id: 81488, n: "St Molaise Gaels", f: "st molaise crest.jpg" },
  { id: 81489, n: "St Nathys", f: "St Nathys Crest.jpg" },
  { id: 81490, n: "St Patricks", f: "St Patrick crest.jpg", a: ["St Patricks/St Farnans"] },
  { id: 81492, n: "Tourlestrane", f: "tourlestrane crest.jpg" },
];
export const crestUrl = (c) => BASE + c.id + "/" + encodeURIComponent(c.f);

// Normalise a club name for matching: "St. Mary's" -> "st marys", "Calry/St. Joseph's" -> "calry/st josephs"
export const norm = (s) => String(s || "").toLowerCase().replace(/[’'`.]/g, "").replace(/\b(gaa|gfc|lgfa|club|cumann)\b/g, "")
  .replace(/[^a-z0-9/ ]+/g, " ").replace(/\s*\/\s*/g, "/").replace(/\s+/g, " ").trim();

// Find the crest for a team name as written on fixtures (amalgamations use the first club).
export function crestFor(name) {
  const n = norm(name); if (!n) return null;
  const names = (c) => [c.n, ...(c.a || [])].map(norm);
  for (const c of CRESTS) if (names(c).includes(n)) return c;
  const first = n.split("/")[0].trim();
  for (const c of CRESTS) if (names(c).includes(first)) return c;
  let best = null;
  for (const c of CRESTS) for (const cn of names(c).map((x) => x.split("/")[0].trim()))
    if (cn.length > 3 && (first.startsWith(cn) || cn.startsWith(first)) && (!best || cn.length > best.l)) best = { c, l: cn.length };
  return best ? best.c : null;
}
