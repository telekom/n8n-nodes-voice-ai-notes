'use strict';

/**
 * Copies non-TypeScript assets (icons and codex `*.node.json` files) into the
 * compiled `dist` tree, mirroring the source folder layout. `tsc` only emits
 * JS, so without this step the published package would ship without the icon
 * files the `icon: 'file:…'` references point at, and n8n would not discover
 * the codex metadata (which it looks up next to the compiled `.node.js`).
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const sourceDirs = ['nodes', 'credentials'];

function isAssetFile(name) {
	const ext = path.extname(name).toLowerCase();
	if (ext === '.svg' || ext === '.png') return true;
	return name.endsWith('.node.json');
}

function copyAssetsFrom(sourceDir) {
	const absoluteSource = path.join(rootDir, sourceDir);
	if (!fs.existsSync(absoluteSource)) return;

	for (const entry of fs.readdirSync(absoluteSource, { withFileTypes: true, recursive: true })) {
		if (!entry.isFile()) continue;
		if (!isAssetFile(entry.name)) continue;

		const parentDir = entry.parentPath ?? entry.path;
		const from = path.join(parentDir, entry.name);
		const to = path.join(rootDir, 'dist', path.relative(rootDir, from));

		fs.mkdirSync(path.dirname(to), { recursive: true });
		fs.copyFileSync(from, to);
		console.log(`copied ${path.relative(rootDir, from)} -> ${path.relative(rootDir, to)}`);
	}
}

for (const sourceDir of sourceDirs) {
	copyAssetsFrom(sourceDir);
}
