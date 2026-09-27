# QVAC Pet Personality Namer

Enter an animal type (e.g. "dog", "cat", "parrot") and a personality trait (e.g. "lazy", "mischievous"), and an on-device AI suggests pet name ideas that fit both. No cloud call, no API key.

## Run

```bash
npm install
npm start
```

Then open http://localhost:31009

## QVAC SDK version

`@qvac/sdk` ^0.19.0 (see `package.json`).

## How it works

Built on [Tether's QVAC SDK](https://www.npmjs.com/package/@qvac/sdk) — all inference runs on-device, no cloud call, no API key. The app loads `LLAMA_3_2_1B_INST_Q4_0` locally with `loadModel()`, generates with `completion()` (streamed via `tokenStream`), and releases the model with `unloadModel()` on shutdown.

`src/logic.js` sends a one-shot example conversation ("dog, lazy" -> a real name list) in the `completion()` history so the small 1B model reliably returns a plain list of short names instead of prose. Results are filtered to single-word-or-hyphenated candidates under 30 characters, deduplicated, and capped at 5. If the model returns fewer than 3 usable names (or refuses), deterministic fallback names built from the trait word are used to top up the list.

## Example

- **Animal:** `dog`, **Personality:** `lazy`
- **Names returned:** something like `Noodle`, `Waffles`, `Sir Naps-a-Lot`, `Pudge`, `Biscuit`.

## Setup

Requires Node.js and a machine that can run the QVAC on-device runtime (see the QVAC SDK docs for platform support). `npm install` pulls in `@qvac/sdk`; `npm start` loads the `LLAMA_3_2_1B_INST_Q4_0` model on first run, which can take a moment.

## License

MIT
