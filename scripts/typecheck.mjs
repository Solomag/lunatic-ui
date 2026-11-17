// Type-check the Lunatic plugins.
//
// tsc follows @luna/* into the TidaLuna sources pinned in node_modules/luna. Those sources do not
// type-check outside their own repo (different TypeScript/MUI versions, Electron globals), and we
// cannot fix them here. So this runs tsc over the whole project but fails only on errors in
// files under plugins/, and reports the rest as a count.
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const tsc = require.resolve("typescript/bin/tsc");
const { stdout, stderr, status } = spawnSync(process.execPath, [tsc, "--noEmit", "-p", "."], { encoding: "utf8" });
if (status !== 0 && !stdout) {
	process.stderr.write(stderr);
	process.exit(status ?? 1);
}

const errors = stdout.split(/\r?\n/).filter((line) => /error TS\d+/.test(line));
const ours = errors.filter((line) => line.startsWith("plugins/"));
const upstream = errors.length - ours.length;

for (const line of ours) console.error(line);
console.log(`${ours.length} error(s) in plugins/, ${upstream} in pinned TidaLuna sources (not checked)`);
process.exit(ours.length > 0 ? 1 : 0);
