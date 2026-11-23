
import http from "node:http"
import fs from "node:fs"
import path from "node:path"
import { spawn } from "node:child_process"
import { fileURLToPath } from "node:url"

let __dirname = path.dirname(fileURLToPath(import.meta.url))
let baseDir = fs.existsSync(path.join(__dirname, "..", "toon-stats-json"))
  ? path.join(__dirname, "..")
  : path.join(__dirname, "..", "tasks")

let port = process.env.PORT || 3000

// Simple helper to read key="value" fields from task.toml
function parseTomlInfo(text) {
  let info = {}
  for (let line of text.split("\n")) {
    let match = line.trim().match(/^([a-z_]+)\s*=\s*"([^"]*)"$/)
    if (match) {
      info[match[1]] = match[2]
    }
  }
  return info
}

// Plain-English project summary shown at the top of the UI
let projectOverview = {
  existingProject:
    "The existing project is TOON (toon-format/toon), a TypeScript CLI tool that converts data between JSON and TOON (a compact data format designed to use fewer tokens than JSON). Out of the box, it supports encoding/decoding, custom separators and indentation, strict validation, and a basic --stats flag that prints human-readable token savings.",
  whatIDid:
    "I built two Docker-verified coding tasks on top of commit 22caca37: (1) toon-stats-json, which adds a --stats-json flag to output clean JSON token metrics to stderr while keeping stdout pure TOON; and (2) toon-safe-decode, which prevents failed conversions from wiping out existing -o output files by writing to a temp file first, blocks conflicting --encode and --decode flags, and rejects empty decode input.",
  benefits:
    "Automation scripts and CI pipelines can now read token savings reliably as JSON without parsing text logs. Users never lose or corrupt existing files when a conversion fails halfway through, and invalid flag combinations or blank inputs fail immediately with clear error messages."
}

let taskDetails = {
  "toon-stats-json": {
    summary:
      "Adds --stats-json for encode mode so token counts (jsonTokens, toonTokens, savedTokens, savingsPercent) print as a single JSON line on stderr while human-readable logs are hidden.",
    baseStatus: "FAIL (2/4 tests failed — Unknown option '--stats-json')",
    solveStatus: "PASS (4/4 tests passed — Reward: 1)"
  },
  "toon-safe-decode": {
    summary:
      "Fixes file truncation on failed -o runs using atomic temp-file renames, stops simultaneous --encode and --decode flags, and rejects blank decode input.",
    baseStatus: "FAIL (3/5 tests failed — overwrote existing -o file with '[' on bad input)",
    solveStatus: "PASS (5/5 tests passed — Reward: 1)"
  }
}

function getTasks() {
  let entries = fs.readdirSync(baseDir, { withFileTypes: true })
  let folders = entries.filter((item) => {
    return item.isDirectory() && fs.existsSync(path.join(baseDir, item.name, "task.toml"))
  })

  return folders.map((dir) => {
    let taskPath = path.join(baseDir, dir.name)
    let tomlText = fs.readFileSync(path.join(taskPath, "task.toml"), "utf8")
    let meta = parseTomlInfo(tomlText)
    let extra = taskDetails[dir.name] || {}

    return {
      id: dir.name,
      title: meta.title || dir.name,
      category: meta.category || "task",
      difficulty: meta.difficulty || "medium",
      repo: meta.repo || "https://github.com/toon-format/toon",
      commit: meta.commit || "22caca377f08d737789a2ca60ab02c425a3aa947",
      summary: extra.summary || "",
      baseStatus: extra.baseStatus || "Pending",
      solveStatus: extra.solveStatus || "Pending",
      commands: {
        step1Build: `docker build -t ${dir.name} ${dir.name}/environment`,
        step2TestBase: `docker run --rm -v "$PWD/${dir.name}/tests:/tests:ro" ${dir.name} bash /tests/test.sh`,
        step3RunSolve: `docker run --rm -v "$PWD/${dir.name}/solution:/solution:ro" -v "$PWD/${dir.name}/tests:/tests:ro" ${dir.name} bash -c "bash /solution/solve.sh && bash /tests/test.sh && echo 'Reward:' \\$(cat /logs/verifier/reward.txt)"`,
        step4Shell: `docker run --rm -it ${dir.name} bash`
      },
      files: {
        "instruction.md": fs.readFileSync(path.join(taskPath, "instruction.md"), "utf8"),
        "task.toml": tomlText,
        "environment/Dockerfile": fs.readFileSync(path.join(taskPath, "environment", "Dockerfile"), "utf8"),
        "solution/solve.sh": fs.readFileSync(path.join(taskPath, "solution", "solve.sh"), "utf8"),
        "tests/grader.mjs": fs.readFileSync(path.join(taskPath, "tests", "grader.mjs"), "utf8"),
        "tests/test.sh": fs.readFileSync(path.join(taskPath, "tests", "test.sh"), "utf8")
      }
    }
  })
}

// Run Docker verification for a task when requested from the UI
function runDockerTask(taskId, mode, callback) {
  let taskPath = path.join(baseDir, taskId)
  if (!fs.existsSync(path.join(taskPath, "task.toml"))) {
    callback(400, { ok: false, output: "Invalid task id" })
    return
  }

  let dockerArgs = []
  if (mode === "base") {
    dockerArgs = [
      "run", "--rm",
      "-v", `${path.join(taskPath, "tests")}:/tests:ro`,
      taskId,
      "bash", "/tests/test.sh"
    ]
  } else {
    dockerArgs = [
      "run", "--rm",
      "-v", `${path.join(taskPath, "solution")}:/solution:ro`,
      "-v", `${path.join(taskPath, "tests")}:/tests:ro`,
      taskId,
      "bash", "-c", "bash /solution/solve.sh && bash /tests/test.sh && echo 'Reward:' $(cat /logs/verifier/reward.txt)"
    ]
  }

  let child = spawn("docker", dockerArgs)
  let output = ""

  child.stdout.on("data", (chunk) => {
    output += chunk.toString()
  })
  child.stderr.on("data", (chunk) => {
    output += chunk.toString()
  })
  child.on("error", (err) => {
    callback(500, { ok: false, output: "Docker error: " + err.message })
  })
  child.on("close", (code) => {
    callback(200, {
      ok: code === 0,
      exitCode: code,
      output: output.trim() || "(no output)"
    })
  })
}

let server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/api/data") {
    let payload = {
      overview: projectOverview,
      tasks: getTasks()
    }
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" })
    res.end(JSON.stringify(payload))
    return
  }

  if (req.method === "POST" && req.url === "/api/run") {
    let body = ""
    req.on("data", (chunk) => {
      body += chunk.toString()
    })
    req.on("end", () => {
      try {
        let parsed = JSON.parse(body || "{}")
        runDockerTask(parsed.taskId, parsed.mode, (status, result) => {
          res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" })
          res.end(JSON.stringify(result))
        })
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" })
        res.end(JSON.stringify({ ok: false, output: "Invalid JSON body" }))
      }
    })
    return
  }

  if (req.method === "GET" && (req.url === "/" || req.url === "/index.html")) {
    let html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8")
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" })
    res.end(html)
    return
  }

  res.writeHead(404, { "Content-Type": "text/plain" })
  res.end("Not found")
})

server.listen(port, () => {
  console.log("Server running on http://localhost:" + port)
})
