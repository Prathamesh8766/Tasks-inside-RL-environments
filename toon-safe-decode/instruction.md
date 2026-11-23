## Statement
Fix the `toon` CLI flag checks and output file writing so bad commands or broken inputs don't wipe out existing files or exit with 0 silently:

1. If someone passes both encode (`--encode` / `-e`) and decode (`--decode` / `-d`) flags at the same time, the CLI must fail right away with exit code `1`, print an error message to `stderr`, and leave any `-o <output-path>` file completely untouched.
2. When converting bad or broken input to a file using `-o <output-path>` (for example, invalid TOON in strict decode mode or broken JSON in encode mode), the CLI must exit with code `1`, print an error to `stderr`, keep any existing file at `<output-path>` intact with its exact original bytes, and not leave any partial or temp file behind if `<output-path>` did not exist before.
3. Passing empty or whitespace-only input in decode mode (`--decode` / `-d`) must fail with exit code `1` and print an error message to `stderr` instead of succeeding silently.
4. Normal encode and decode commands (both to `stdout` and via `-o <output-path>`) must keep working the exact same way, and `pnpm build` must finish cleanly so the compiled CLI gets your changes.

## Environment
- Linux container (`node:24-slim`) with `pnpm@12.16.1` enabled via Corepack.
- Repo `toon-format/toon` pinned at commit `22caca377f08d737789a2ca60ab02c425a3aa947` in `/workspace/toon` (packages already installed and built).
- CLI entrypoint: `node /workspace/toon/packages/cli/bin/toon.mjs`.

## Difficulty Note
Medium (~30-40 mins). This is an outcome-driven task, so no internal file names or function names are given. You need to figure out why failed conversions overwrite `-o` output files early and fix both the file writing and input checks.