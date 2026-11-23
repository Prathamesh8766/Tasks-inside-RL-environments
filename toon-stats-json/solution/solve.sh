#!/usr/bin/env bash
set -e

cd /workspace/toon

node --input-type=module << 'EOF'
import fs from "node:fs";

//update index.ts
let indexFile= "packages/cli/src/index.ts";
let indexCode= fs.readFileSync(indexFile, "utf8");

indexCode = indexCode.replace(
  `  stats: {
    type: 'boolean',

    description: 'Show token statistics',
  },`,
  `  stats: {
    type: 'boolean',
    description:'Show token statistics',
  },

  'stats-json': {
    type: 'boolean',
    description: 'Output token statistics as JSON to stderr',
  },`
);

indexCode =indexCode.replace(
  `    const mode = detectMode(inputSource, args.encode, args.decode)`,
  `    let statsJson=Boolean(args['stats-json'])

    const mode = detectMode(inputSource, args.encode, args.decode)

    if (statsJson && !args.stats) {
       throw new CliError('--stats-json requires --stats')
    }
    if (statsJson && mode === 'decode') {
      throw new CliError('--stats-json only works in encode mode')
    }`
);

indexCode = indexCode.replace(
  `        shouldPrintStats: args.stats,`,
  `        shouldPrintStats: Boolean(args.stats),
        shouldPrintStatsJson: statsJson,`
);

fs.writeFileSync(indexFile, indexCode, "utf8");


//    update conversion.ts
let convFile = 'packages/cli/src/conversion.ts';

let convCode = fs.readFileSync(convFile, 'utf8');

convCode =convCode.replace(
  `  shouldPrintStats: boolean
}): Promise<void> {`,
  `  shouldPrintStats:boolean
  
  shouldPrintStatsJson?: boolean
}): Promise<void> {`

  );

convCode =convCode.replace(
  `    const jsonTokens = estimateTokenCount(jsonContent)
    const toonTokens = estimateTokenCount(toonOutput)`,
  `    const jsonTokens = estimateTokenCount(jsonContent)
    const toonTokens = estimateTokenCount(toonOutput)



    if (config.shouldPrintStatsJson) {
      let savedTokens = jsonTokens - toonTokens
      let savingsPercent = jsonTokens === 0 ? 0 : Number(((savedTokens / jsonTokens) * 100).toFixed(1))

      console.error(JSON.stringify({ jsonTokens, toonTokens, savedTokens, savingsPercent }))
      return
  }`
);

fs.writeFileSync(convFile, convCode, 'utf8');
EOF

pnpm build