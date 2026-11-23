#!/usr/bin/env bash
set -e

cd /workspace/toon

node --input-type=module << 'EOF'
import fs from "node:fs"

// check if both encode and decode flags are passed
let utilsFile = "packages/cli/src/utils.ts"
let utilsCode = fs.readFileSync(utilsFile, 'utf8');

utilsCode = utilsCode.replace(
  `export function detectMode(
  input: InputSource,
  encodeFlag?: boolean,
  decodeFlag?: boolean,
): 'encode' | 'decode' {
  if (encodeFlag)
    return 'encode'`,
  `export function detectMode(
  input: InputSource,
  encodeFlag?: boolean,
  decodeFlag?: boolean,
): 'encode' | 'decode' {
  if (encodeFlag && decodeFlag) {
    throw new CliError('Cannot use --encode and --decode together')
  }
  if (encodeFlag)
    return 'encode'`
)

fs.writeFileSync(utilsFile, utilsCode, "utf8")


// update conversion.ts for empty input check and safe file write
let convFile = 'packages/cli/src/conversion.ts'
let convCode = fs.readFileSync(convFile, "utf8");

convCode = convCode.replace(
  `  const lineSource = readLinesFromSource(config.input)`,
  `  const lineSource = checkNotEmpty(readLinesFromSource(config.input))`
)

convCode = convCode.replace(
  `async function writeStream(
  pieces: AsyncIterable<string> | Iterable<string>,
  options: { outputPath?: string, separator: string },
): Promise<void> {
  const { outputPath, separator } = options
  let fileHandle: FileHandle | undefined

  try {
    if (outputPath)
      fileHandle = await fsp.open(outputPath, 'w')

    const handle = fileHandle
    const write = handle
      ? (text: string) => handle.write(text)
      : (text: string) => { process.stdout.write(text) }

    let isFirst = true
    for await (const piece of pieces) {
      if (!isFirst && separator)
        await write(separator)

      await write(piece)
      isFirst = false
    }

    await write('\\n')
  }
  finally {
    await fileHandle?.close()
  }
}`,
  `async function* checkNotEmpty(lines: AsyncIterable<string>): AsyncIterable<string> {
  let hasData = false
  for await (const line of lines) {
    if (!hasData && line.trim().length > 0) {
      hasData = true
    }
    yield line
  }
  if (!hasData) {
    throw new CliError('Input is empty')
  }
}

// write to temp file first and rename at the end so original file stays safe
async function writeStream(
  pieces: AsyncIterable<string> | Iterable<string>,
  options: { outputPath?: string, separator: string },
): Promise<void> {
  const { outputPath, separator } = options
  let fileHandle: FileHandle | undefined
  let tempFile: string | undefined

  try {
    if (outputPath) {
      await fsp.mkdir(path.dirname(outputPath), { recursive: true })
      tempFile = \`\${outputPath}.tmp-\${Date.now()}-\${Math.floor(Math.random() * 100000)}\`
      fileHandle = await fsp.open(tempFile, 'w')
    }

    const handle = fileHandle
    const write = handle
      ? (text: string) => handle.write(text)
      : (text: string) => { process.stdout.write(text) }

    let isFirst = true
    for await (const piece of pieces) {
      if (!isFirst && separator)
        await write(separator)

      await write(piece)
      isFirst = false
    }

    await write('\\n')

    if (fileHandle && tempFile && outputPath) {
      await fileHandle.close()
      fileHandle = undefined
      await fsp.rename(tempFile, outputPath)
      tempFile = undefined
    }
  }
  finally {
    if (fileHandle) {
      await fileHandle.close().catch(() => {})
    }
    if (tempFile) {
      await fsp.rm(tempFile, { force: true }).catch(() => {})
    }
  }
}`
)

fs.writeFileSync(convFile, convCode, 'utf8')
EOF

pnpm build