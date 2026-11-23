import assert from "node:assert/strict"
import { spawnSync } from 'node:child_process';
import fs from "node:fs"
import os from 'node:os'
import path from "node:path";
import test from 'node:test'

// paths for repo and cli
let repoPath ="/workspace/toon";

let cliPath= path.join(repoPath,'packages/cli/bin/toon.mjs')

function runCli(args , input) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    cwd: repoPath,
    input: input,
    encoding: "utf8"
  }) ;}


//test 1:check when both encode and decode flags are passed

test("fails when both --encode and --decode are passed and keeps -o file safe", () => {
  let tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "toon-flags-"))
  let outFile = path.join(tmpDir, 'saved.json');
  let oldText = `{"id":"${Math.random().toString(36).substring(2, 12)}"}\n`
  fs.writeFileSync(outFile, oldText)

  let flagPairs = [['--encode', '--decode'], ["-e", "-d"]]
  for (let flags of flagPairs) {
    let res = runCli([...flags,"-o", outFile], '{"a":1}')

    assert.equal(res.status, 1)
    assert.ok(res.stderr.trim().length > 0)

    assert.equal(fs.readFileSync(outFile, "utf8"), oldText)
  }
})


// test 2: bad toon input should not wipe old file or leave temp files

test('keeps existing -o file and leaves no temp files on bad toon decode', () => {
  let tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'toon-dec-'))
  
  let existingFile = path.join(tmpDir, "existing.json");
  let newFile = path.join(tmpDir, 'new.json')
  let oldData = `{"keep":"${Math.random().toString(36).substring(2, 14)}"}\n`
  fs.writeFileSync(existingFile, oldData)

  // header says 3 rows of 2 cols, but row 1 has 3 cols so it fails mid stream
  let badToon = "[3]{id,name}:\n  1,alice,extra_col\n"


  // check when file already exists
  let res1 = runCli(['--decode', '-o', existingFile], badToon)
  assert.equal(res1.status, 1)

  assert.ok(res1.stderr.trim().length > 0);
  assert.equal(fs.readFileSync(existingFile, 'utf8'), oldData)

  // check when output file does not exist yet
  let res2 = runCli(["--decode", "-o", newFile], badToon)
  assert.equal(res2.status, 1)

  assert.equal(fs.existsSync(newFile), false)

  assert.deepEqual(fs.readdirSync(tmpDir), ['existing.json'])
})

// test 3: broken json in encode mode should not overwrite -o file
test("keeps existing -o file on invalid json encode", () => {
  let tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "toon-enc-"))
  let existingFile = path.join(tmpDir, 'existing.toon');

  let oldData = `token: ${Math.random().toString(36).substring(2, 12)}\n`
  fs.writeFileSync(existingFile, oldData)

  let res = runCli(['--encode', '-o', existingFile], "{ broken json")
  assert.equal(res.status, 1)

  assert.ok(res.stderr.trim().length > 0);
  assert.equal(fs.readFileSync(existingFile, "utf8"), oldData)
})


// test 4: empty input in decode mode
test('fails when decode input is empty or only spaces', () => {
  let emptyInputs = ["", '   \n\t\n  ']
  for (let text of emptyInputs) {
    let res = runCli(["--decode"], text)
    assert.equal(res.status, 1)
    assert.ok(res.stderr.trim().length > 0)
  }
})


// test 5: make sure normal encode and decode still work fine
test("normal encode and decode round trip works", () => {
  let tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'toon-ok-'))
  let toonFile= path.join(tmpDir, "data.toon")

  let jsonFile = path.join(tmpDir, 'out.json');

  let sampleObj = {
    project: "proj-" + Math.random().toString(36).substring(2, 8),
    items: [
      { id: 1, score: 95 },
      { id: 2, score: 88 }
    ]
  }

  let encRes = runCli(['--encode','-o', toonFile], JSON.stringify(sampleObj))
  assert.equal(encRes.status, 0)

  assert.equal(fs.existsSync(toonFile), true)

  let decRes = runCli([toonFile, "-o", jsonFile])
  assert.equal(decRes.status, 0)
  assert.deepEqual(JSON.parse(fs.readFileSync(jsonFile, "utf8")), sampleObj)
})