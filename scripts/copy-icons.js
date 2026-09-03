'use strict';

/**
 * Copies node/credential icon assets (*.svg, *.png) into the compiled `dist`
 * tree, mirroring the source folder layout. `tsc` only emits JS, so without
 * this step the published package would ship without the icon files the
 * `icon: 'file:…'` references point at.
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const sourceDirs = ['nodes', 'credentials'];
const iconExtensions = new Set(['.svg', '.png']);

function copyIconsFrom(sourceDir) {
	const absoluteSource = path.join(rootDir, sourceDir);
	if (!fs.existsSync(absoluteSource)) return;

	for (const entry of fs.readdirSync(absoluteSource, { withFileTypes: true, recursive: true })) {
		if (!entry.isFile()) continue;
		if (!iconExtensions.has(path.extname(entry.name).toLowerCase())) continue;

		const parentDir = entry.parentPath ?? entry.path;
		const from = path.join(parentDir, entry.name);
		const to = path.join(rootDir, 'dist', path.relative(rootDir, from));

		fs.mkdirSync(path.dirname(to), { recursive: true });
		fs.copyFileSync(from, to);
		console.log(`copied ${path.relative(rootDir, from)} -> ${path.relative(rootDir, to)}`);
	}
}

for (const sourceDir of sourceDirs) {
	copyIconsFrom(sourceDir);
}
