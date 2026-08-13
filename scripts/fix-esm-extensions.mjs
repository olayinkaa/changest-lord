// scripts/fix-esm-extensions.mjs
// Post-build: append `.js` to relative import/export specifiers under `dist/`.
// This makes the TypeScript output runnable under Node's native ESM resolver.
//
// Why custom: `tsc-esm-fix` rewrites `__dirname` string references
// (e.g. `globalThis['__dirname']`) into a malformed template literal in the
// generated Prisma client. We only need a surgical "add .js" pass, no other
// transforms.

import { existsSync } from "node:fs"
import { readFile, readdir, stat, writeFile } from "node:fs/promises"
import { dirname, extname, join, relative, resolve, sep } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, "..")
const TARGET = resolve(ROOT, process.argv[2] ?? "dist")

// Match every quote-delimited string in the file. We narrow to relative
// specifiers by post-checking the captured value. This is robust against
// every import/export shape: side-effect, default, named, dynamic, type-only,
// re-exports — because we only look at string literals.
const STRING_RE = /(["'])((?:\\.|(?!\1)[\s\S])*?)\1/g

const RELATIVE_PREFIX = /^\.{1,2}(\/|$)/

async function walk(dir, files = []) {
	const entries = await readdir(dir, { withFileTypes: true })
	for (const entry of entries) {
		const full = join(dir, entry.name)
		if (entry.isDirectory()) {
			await walk(full, files)
		} else if (entry.isFile() && extname(entry.name) === ".js") {
			files.push(full)
		}
	}
	return files
}

function resolveRelative(fromFile, spec) {
	// Mirror Node ESM resolution. Try file form first, then directory form.
	// Falls back to file form so the output is at least valid syntax even
	// when the spec is unresolvable on disk (which would already be a build error).
	if (/\.(?:c?js|mjs|jsx)$/i.test(spec)) return spec
	const fromDir = dirname(fromFile)
	const fileTarget = `${spec}.js`
	const dirTarget = `${spec.replace(/\/$/, "")}/index.js`
	if (existsSync(resolve(fromDir, fileTarget))) return fileTarget
	if (existsSync(resolve(fromDir, dirTarget))) return dirTarget
	return spec.endsWith("/") ? dirTarget : fileTarget
}

/**
 * Determine whether a string literal at offset `idx` in `src` is the
 * specifier of an import/export statement (vs. some other string in the file).
 * Heuristic: the previous non-whitespace character on the line is `from`,
 * or the literal is the *only* thing after a leading `import`/`export` token.
 */
function isImportSpecifier(src, idx, quote) {
	// Scan backwards to start-of-line; look for the keywords `from`, `import`,
	// `export`, `require(`, or `import(`.
	const lineStart = src.lastIndexOf("\n", idx) + 1
	const prefix = src.slice(lineStart, idx)
	// Strip line comments — they can't contain a string literal but the regex
	// would still match safely because we only look backwards on the same line.
	if (/(?:^|\s)(?:from|import|export|require)\s*$/.test(prefix)) return true
	if (/(?:^|\s)(?:import|require)\(\s*$/.test(prefix)) return true
	// `export * from "..."` — `from` is preceded by `*`; the regex above
	// already covers that case via the `(?:^|\s)from\s*$` branch.
	return false
}

async function processFile(file) {
	const src = await readFile(file, "utf8")
	let out = ""
	let last = 0
	let changed = false
	STRING_RE.lastIndex = 0
	let m
	while ((m = STRING_RE.exec(src)) !== null) {
		const [whole, quote, spec] = m
		if (!RELATIVE_PREFIX.test(spec)) continue
		if (/\.(?:c?js|mjs|jsx)$/i.test(spec)) continue
		if (!isImportSpecifier(src, m.index, quote)) continue
		const replacement = resolveRelative(file, spec)
		out += src.slice(last, m.index) + quote + replacement + quote
		last = m.index + whole.length
		changed = true
	}
	if (!changed) return
	out += src.slice(last)
	await writeFile(file, out, "utf8")
	process.stdout.write(`+ ${relative(ROOT, file)}\n`)
}

async function main() {
	const targetStat = await stat(TARGET).catch(() => null)
	if (!targetStat || !targetStat.isDirectory()) {
		console.error(`Target directory not found: ${TARGET}`)
		process.exit(1)
	}
	const files = await walk(TARGET)
	await Promise.all(files.map(processFile))
	console.log(
		`Patched ${files.length} files under ${relative(ROOT, TARGET)}${sep}`,
	)
}

main().catch((err) => {
	console.error(err)
	process.exit(1)
})
