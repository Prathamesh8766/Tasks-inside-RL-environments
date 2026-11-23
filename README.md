# TOON CLI Coding Tasks

Two Docker-based coding tasks built on [`toon-format/toon`](https://github.com/toon-format/toon) at commit `22caca377f08d737789a2ca60ab02c425a3aa947`:

1. **`toon-stats-json`** — Adds a `--stats-json` flag to output token stats as JSON to `stderr` while keeping `stdout` clean.
2. **`toon-safe-decode`** — Prevents `-o` output files from getting wiped out when conversion fails, rejects `--encode` and `--decode` together, and rejects empty decode input.

## Folder Structure

```text
.
├── NOTES.md
├── README.md
├── toon-safe-decode
│   ├── environment
│   │   └── Dockerfile
│   ├── instruction.md
│   ├── solution
│   │   └── solve.sh
│   ├── task.toml
│   └── tests
│       ├── grader.mjs
│       └── test.sh
├── toon-stats-json
│   ├── environment
│   │   └── Dockerfile
│   ├── instruction.md
│   ├── solution
│   │   └── solve.sh
│   ├── task.toml
│   └── tests
│       ├── grader.mjs
│       └── test.sh
└── web
    ├── index.html
    └── server.mjs
```

## Run Task 1 (`toon-stats-json`) in Docker

### 1. Build the Docker image

```bash
docker build -t toon-stats-json toon-stats-json/environment
```

### 2. Check that the base repo fails (Reward: 0)

```bash
docker run --rm -v "$PWD/toon-stats-json/tests:/tests:ro" toon-stats-json bash /tests/test.sh
```

### 3. Apply the solution and verify tests pass (Reward: 1)

```bash
docker run --rm \
  -v "$PWD/toon-stats-json/solution:/solution:ro" \
  -v "$PWD/toon-stats-json/tests:/tests:ro" \
  toon-stats-json bash -c "bash /solution/solve.sh && bash /tests/test.sh && echo 'Reward:' $(cat /logs/verifier/reward.txt)"
```

## Run Task 2 (`toon-safe-decode`) in Docker

### 1. Build the Docker image

```bash
docker build -t toon-safe-decode toon-safe-decode/environment
```

### 2. Check that the base repo fails (Reward: 0)

```bash
docker run --rm -v "$PWD/toon-safe-decode/tests:/tests:ro" toon-safe-decode bash /tests/test.sh
```

### 3. Apply the solution and verify tests pass (Reward: 1)

```bash
docker run --rm \
  -v "$PWD/toon-safe-decode/solution:/solution:ro" \
  -v "$PWD/toon-safe-decode/tests:/tests:ro" \
  toon-safe-decode bash -c "bash /solution/solve.sh && bash /tests/test.sh && echo 'Reward:' $(cat /logs/verifier/reward.txt)"
```

## Run the Web Inspector

```bash
node web/server.mjs
# Open http://localhost:3000 in your browser (or use PORT=3001 node web/server.mjs)
```