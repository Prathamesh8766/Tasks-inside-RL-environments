# TOON CLI Coding Tasks

Two Docker-based coding tasks built on [`toon-format/toon`](https://github.com/toon-format/toon) at commit `22caca377f08d737789a2ca60ab02c425a3aa947`:

1. `tasks/toon-stats-json` - Adds a `--stats-json` flag to output token stats as JSON to `stderr` while keeping `stdout` clean.
2. `tasks/toon-safe-decode` - Prevents `-o` output files from getting wiped out when conversion fails, rejects `--encode` and `--decode` together, and rejects empty decode input.

## Folder Structure
[prathamesh@ANJALI tasks]$ tree
.
├── NOTES.md
├── README.md
├── toon-safe-decode
│   ├── environment
│   │   └── Dockerfile
│   ├── instruction.md
│   ├── solution
│   │   └── solve.sh
│   ├── task.toml
│   └── tests
│       ├── grader.mjs
│       └── test.sh
├── toon-stats-json
│   ├── environment
│   │   └── Dockerfile
│   ├── instruction.md
│   ├── solution
│   │   └── solve.sh
│   ├── task.toml
│   └── tests
│       ├── grader.mjs
│       └── test.sh
└── web
    ├── index.html
    └── server.mjs

10 directories, 16 files
