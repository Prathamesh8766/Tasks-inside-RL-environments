## Statement
Add a `--stats-json` boolean flag to the CLI in `packages/cli` (`@toon-format/cli`) for encode mode:

1. When running in encode mode with both `--stats` and `--stats-json` (for example: `node packages/cli/bin/toon.mjs input.json --stats --stats-json`), print a single valid JSON line to `stderr` with these exact keys:

   `{"jsonTokens": <number>, "toonTokens": <number>, "savedTokens": <number>, "savingsPercent": <number>}`
   - `savedTokens` = `jsonTokens - toonTokens`
   - `savingsPercent` = rounded to 1 decimal place (`Number(((savedTokens / jsonTokens) * 100).toFixed(1))`), or `0` if `jsonTokens === 0`
   - Do not print the normal human-readable logs (`log.info` / `log.success`, including the `Encoded ...` line when `-o` is used) so `stderr` only has that single JSON line.

2. Keep normal TOON output on `stdout` (or in `-o <file>`) the same as before, without any stats JSON mixed in.

3. If someone passes `--stats-json` without `--stats`, or uses `--stats-json` in decode mode (`--decode`, `-d`, or with a `.toon` input file), exit with code `1` and print an error message to `stderr`.

4. Run `pnpm build` at the end so the built CLI in `packages/cli` uses your updated code.

## Environment
- Linux container (`node:24-slim`) with `pnpm@12.16.1` enabled via Corepack.
- Repo `toon-format/toon` pinned at commit `22caca377f08d737789a2ca60ab02c425a3aa947` at `/workspace/toon` (package dependencies already installed and built).
- CLI entrypoint: `node /workspace/toon/packages/cli/bin/toon.mjs`.

## Difficulty Note
Easy-Medium (~20-30 mins). Check the CLI flag definitions in `packages/cli/src/index.ts` and the stats printing code in `packages/cli/src/conversion.ts`, add the flag validation and JSON output, and rebuild with `pnpm build`.