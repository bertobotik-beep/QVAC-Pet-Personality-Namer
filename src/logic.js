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
    .filter((line) => line.length > 0 && line.length < 30 && !line.includes(" "));
}

function fallbackNames(animal, trait) {
  const t = trait ? trait.trim() : "";
  const cap = (w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : "");
  return [`${cap(t)}bo`, "Biscuit", "Pepper", "Nugget", `Sir ${cap(t) || "Wiggles"}`].filter(Boolean);
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
