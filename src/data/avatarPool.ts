/**
 * Master registry of distinct portrait photos. Every named person in the
 * application (lawyer, citizen, admin) has a unique, stable photo id, so the
 * SAME person shows the EXACT SAME photo on every screen — landing page,
 * directory, dashboards, profiles, top app bar, case list, chat, etc.
 *
 * Keep this in sync with `src/data/mock.ts`: one entry per lawyer (plus an
 * "Adv. " alias) and one per citizen. Unknown names fall back to a small
 * hashed pool.
 */

export const PEOPLE_AVATARS: Record<string, string> = {
  // ── Lawyers (l_001 – l_026) ──
  "Swathi Reddy": "photo-1659355894099-b2c2b2884322",
  "Srinivas Chowdary": "photo-1637589274742-8d4c152720a2",
  "Sailaja Naidu": "photo-1770626899426-baed57609a30",
  "Venkatesh Rao": "photo-1659353220482-554773c2f7fa",
  "Haritha Sarma": "photo-1646032540224-4ab44f77e6f2",
  "Krishna Murthy": "photo-1655048424687-29c152741a90",
  "Rohan Iyer": "photo-1566492031773-4f4e44671857",
  "Priya Subramaniam": "photo-1573496359142-b8d87734a5a2",
  "Aditya Deshmukh": "photo-1568602471122-7832951cc4c5",
  "Kavya Reddy": "photo-1580489944761-15a19d654956",
  "Nikhil Chandra": "photo-1519085360753-af0119f7cbe7",
  "Ananya Deshpande": "photo-1531123897727-8f129e1688ce",
  "Rajesh Varma": "photo-1600180758890-6b94519a8ba6",
  "N. V. Ramana Rao": "photo-1552058544-f2b08422138a",
  "Sunitha Reddy": "photo-1487412720507-e7ab37603c6f",
  "K. Pattabhi Ramaiah": "photo-1622253692010-333f2da6031d",
  "Ramesh Varma": "photo-1560250097-0b93528c311a",
  "Suresh Kumar": "photo-1618077360395-f3068be8e001",
  "Aditya Verma": "photo-1615109398623-88e1f13ce70a",
  "Radhika Sen": "photo-1594744803329-e58b31de8bf5",
  "B. Suryanarayana": "photo-1541752290-98b19d0bb628",
  "Balaji Rao": "photo-1600275669439-14e40452d20b",
  "Vijay Kumar": "photo-1506794778202-cad84cf45f1d",
  "Tarun Mehta": "photo-1507003211169-0a1dd7228f2d",
  "Meghana Iyer": "photo-1589571894960-20bbe2828d0a",
  "Farhan Qureshi": "photo-1633332755192-727a05c4013d",

  // ── Citizens (u_001 – u_008) ──
  "Sai Teja Reddy": "photo-1607346256330-dee7af15f7c5",
  "Lakshmi Prasanna": "photo-1533128361669-69c065857a13",
  "Divya Sri Chowdary": "photo-1758599543125-0a927f1d7a3b",
  "Venkata Ramana Naidu": "photo-1552642986-ccb41e7059e7",
  "Padmavathi Rao": "photo-1463335361701-e90f4c5045d0",
  "Arjun Mehta": "photo-1500648767791-00dcc994a43e",
  "Fatima Sheikh": "photo-1544005313-94ddf0286df2",
  "Manoj Kulkarni": "photo-1527980965255-d3b416303d12",

  // ── Admin ──
  "Platform Ops": "photo-1508341591423-4347099e1f19",
};

// Build "Adv. <name>" aliases for every lawyer automatically.
const LAWYER_NAMES = [
  "Swathi Reddy",
  "Srinivas Chowdary",
  "Sailaja Naidu",
  "Venkatesh Rao",
  "Haritha Sarma",
  "Krishna Murthy",
  "Rohan Iyer",
  "Priya Subramaniam",
  "Aditya Deshmukh",
  "Kavya Reddy",
  "Nikhil Chandra",
  "Ananya Deshpande",
  "Rajesh Varma",
  "N. V. Ramana Rao",
  "Sunitha Reddy",
  "K. Pattabhi Ramaiah",
  "Ramesh Varma",
  "Suresh Kumar",
  "Aditya Verma",
  "Radhika Sen",
  "B. Suryanarayana",
  "Balaji Rao",
  "Vijay Kumar",
  "Tarun Mehta",
  "Meghana Iyer",
  "Farhan Qureshi",
];
for (const name of LAWYER_NAMES) {
  PEOPLE_AVATARS[`Adv. ${name}`] = PEOPLE_AVATARS[name];
}

const FALLBACK_AVATAR_POOL = [
  "photo-1631005436794-ccaa79de61ba",
  "photo-1512310604669-443f26c35f52",
  "photo-1618559850638-2aed8a8e8cdc",
  "photo-1729157661483-ed21901ed892",
  "photo-1616002851413-ebcc9611139d",
  "photo-1607081692251-d689f1b9af84",
];

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) hash = value.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash);
}

export function pickAvatarPhotoId(seed: string) {
  if (PEOPLE_AVATARS[seed]) {
    return PEOPLE_AVATARS[seed];
  }
  // Try matching the trimmed name without an "Adv." prefix.
  const cleanSeed = seed.replace(/^(Adv\.\s*)/i, "").trim();
  if (PEOPLE_AVATARS[cleanSeed]) {
    return PEOPLE_AVATARS[cleanSeed];
  }
  return FALLBACK_AVATAR_POOL[hashString(seed) % FALLBACK_AVATAR_POOL.length];
}

export function avatarUrlFor(seed: string, px = 128) {
  const photoId = pickAvatarPhotoId(seed);
  return `https://images.unsplash.com/${photoId}?w=${px}&h=${px}&fit=crop&crop=faces&q=80`;
}
