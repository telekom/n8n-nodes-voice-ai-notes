// Local mirror of the ruleset that `@n8n/scan-community-package` runs during
// the n8n community-node review. Keeping this in sync with that scanner's
// `buildScanConfig` lets us catch violations before publishing instead of
// after. Run with `npm run lint:local`.
//
// Source: node_modules/@n8n/scan-community-package/scanner/scanner.mjs

import { defineConfig } from 'eslint/config';
import { n8nCommunityNodesPlugin } from '@n8n/eslint-plugin-community-nodes';
import n8nNodesPlugin from 'eslint-plugin-n8n-nodes-base';
import * as tsParser from '@typescript-eslint/parser';

const parser = tsParser.default ?? tsParser;

export default defineConfig(
	n8nCommunityNodesPlugin.configs.recommended,
	{
		rules: { 'no-console': 'error' },
	},
	{ plugins: { 'n8n-nodes-base': n8nNodesPlugin } },
	{
		files: ['package.json'],
		rules: { ...n8nNodesPlugin.configs.community.rules },
	},
	{
		files: ['**/credentials/**/*.ts'],
		rules: {
			...n8nNodesPlugin.configs.credentials.rules,
			'n8n-nodes-base/cred-class-field-documentation-url-miscased': 'off',
			'n8n-nodes-base/cred-class-field-type-options-password-missing': 'off',
		},
	},
	{
		files: ['**/nodes/**/*.ts'],
		rules: {
			...n8nNodesPlugin.configs.nodes.rules,
			'n8n-nodes-base/node-class-description-inputs-wrong-regular-node': 'off',
			'n8n-nodes-base/node-class-description-outputs-wrong': 'off',
			'n8n-nodes-base/node-param-type-options-max-value-present': 'off',
		},
	},
	{
		files: ['**/*.json'],
		languageOptions: { parser },
	},
	{
		files: ['**/*.ts'],
		languageOptions: { parser },
	},
);
