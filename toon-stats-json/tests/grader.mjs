import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";

import os from 'node:os';
import path from 'node:path';

import test from "node:test";


//path for repo and CLI


let repoPath= "/workspace/toon";
let cliPath = path.join(repoPath, 'packages/cli/bin/toon.mjs')

function runCli(args,input) {
  return spawnSync(process.execPath, [cliPath, ...args],{
    cwd: repoPath,
    input: input,

    encoding: "utf8"
})}

// 
// test1: check json stats on stderr and normal toon on stdout


test("emits json stats on stderr and keeps stdout as toon", () => {
  let tmpDir= fs.mkdtempSync(path.join(os.tmpdir(), "toon-test-") );

  let inputFile = path.join(tmpDir, 'data.json');

  let count = 6 +Math.floor(Math.random() * 10);
  let rows= [];

  for (let i = 0; i < count; i++) {
    rows.push({

       id: i + 1,
      token: Math.random().toString(36).substring(2, 12),
      active: i % 2 === 0
    });}

  fs.writeFileSync(inputFile,JSON.stringify(rows, null, 2));

  let res = runCli([inputFile, "--stats", "--stats-json"])

  assert.equal(res.status , 0);
  assert.ok(res.stdout.includes(`[${count}]{id,token,active}:`));

  assert.ok(!res.stdout.includes('"jsonTokens"'))


  let lines = res.stderr.trim().split("\n").filter(Boolean);
  assert.equal(lines.length, 1);



  let stats = JSON.parse(lines[0]);
  assert.deepEqual(Object.keys(stats).sort(), [
    'jsonTokens',
    'savedTokens',
    'savingsPercent',
    'toonTokens'
  ]);

  assert.equal(typeof stats.jsonTokens, "number");

  assert.equal(typeof stats.toonTokens, "number");

  assert.equal(stats.savedTokens, stats.jsonTokens - stats.toonTokens);

  let expectedPercent = stats.jsonTokens > 0
    ? Number(((stats.savedTokens / stats.jsonTokens) * 100).toFixed(1))
    : 0;
  assert.equal(stats.savingsPercent, expectedPercent);
  assert.ok(stats.jsonTokens > stats.toonTokens);
});


// test 2: when -o is used dont print extra text in stdErr

test('hides human readable log on stderr when -o is passed', () => {
  let tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'toon-out-'));

  let inputFile =path.join(tmpDir, "items.json");

  let outputFile = path.join(tmpDir, "items.toon");

  let secret= Math.random().toString(36).substring(2, 12)

  let sampleData = [
    { id: 1, secret: secret },
    { id: 2, secret: secret }
  ];
  fs.writeFileSync(inputFile, JSON.stringify(sampleData));

  let res = runCli([inputFile, '-o', outputFile, '--stats', '--stats-json']);
  assert.equal( res.status , 0);
  assert.equal(res.stdout.trim(), "");
  assert.ok(fs.readFileSync(outputFile, "utf8").includes(secret));


  let lines = res.stderr.trim().split('\n').filter(Boolean);
  assert.equal(lines.length, 1);
  let stats = JSON.parse(lines[0]);
  assert.equal(typeof stats.jsonTokens, 'number');
}
);

// test 3: error cases

test("fails with exit code 1 when --stats-json is used without --stats", () => {
  let res = runCli(["--stats-json"], '{"a":1}');
  assert.equal(res.status, 1);
  assert.ok(res.stderr.trim().length > 0);});



test('fails with exit code 1 when --stats-json is used in decode mode', () => {
  let res = runCli(['--decode', '--stats', '--stats-json'], "a: 1\n");
  assert.equal(res.status, 1);
  assert.ok(res.stderr.trim().length > 0);
});