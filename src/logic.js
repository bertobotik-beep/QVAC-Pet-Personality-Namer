// QVAC Pet Personality Namer — core logic.
// completion() suggests pet name ideas that fit an animal type + personality trait.

import { completion } from "@qvac/sdk";

function looksUnusable(text) {
  if (!text || text.trim().length === 0) return true;
  const bad = ["i cannot", "i can't", "as an ai", "i'm not able", "i am not able"];
  const lower = text.toLowerCase();
  return bad.some((phrase) => lower.includes(phrase));
}

function parseLines(raw) {
  return raw
    .split("\n")
    .map((line) =>
      line
        .trim()
        .replace(/^[-*\d.)\s]+/, "")
        .replace(/^["']|["']$/g, "")
        .trim()
    )
    .filter((line) => line.length > 0 && line.length < 30 && line.split(/\s+/).length <= 3);
}

// When no trait is given, `cap(t)` is "" and the first fallback used to be
// just "bo" — a name with no connection to the animal at all. Fall back to
// the animal word itself in that case so the name is still grounded in the
// user's input.
function fallbackNames(animal, trait) {
  const cap = (w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : "");
  // Use only the first word of a multi-word trait/animal string, since the
  // fallback names glue this onto suffixes like "bo" — using the full phrase
  // produced garbled results like "Lazy and dramaticbo" for "lazy and dramatic".
  const firstWord = (s) => (s ? s.trim().split(/\s+/)[0] : "");
  const t = cap(firstWord(trait));
  const a = cap(firstWord(animal));
  const base = t || a || "Bud";
  return [`${base}bo`, "Biscuit", "Pepper", "Nugget", `Sir ${t || "Wiggles"}`].filter(Boolean);
}

export async function generatePetNames(modelId, animal, trait) {
  const traitText = trait ? trait : "fun-loving";
  const run = completion({
    modelId,
    history: [
      {
        role: "system",
        content:
          "You brainstorm pet name ideas that match an animal type and a personality trait. " +
          "Suggest 5 short, real name ideas (single words or short two-word names) that fit " +
          "the vibe. Reply with ONLY a plain list, one name per line, no numbering, no " +
          "explanation.",
      },
      { role: "user", content: "Animal: dog. Personality: lazy" },
      { role: "assistant", content: "Noodle\nWaffles\nSir Naps-a-Lot\nPudge\nBiscuit" },
      { role: "user", content: `Animal: ${animal}. Personality: ${traitText}` },
    ],
    stream: true,
    completionOpts: { temperature: 0.9, maxTokens: 120 },
  });

  let raw = "";
  for await (const token of run.tokenStream) raw += token;

  let names = looksUnusable(raw) ? [] : parseLines(raw);

  if (names.length < 3) {
    names = names.concat(fallbackNames(animal, trait).filter((f) => !names.includes(f)));
  }
  names = [...new Set(names)].slice(0, 5);
  if (names.length < 3) names = fallbackNames(animal, trait).slice(0, 5);

  return { animal, trait, names };
}
