import esbuild from 'esbuild';
import { cp, mkdir, rm } from 'node:fs/promises';

const production = process.argv[2] === 'production';

await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });

const common = {
  bundle: true,
  sourcemap: production ? false : 'inline',
  minify: production,
  logLevel: 'info',
};

await esbuild.build({
  ...common,
  entryPoints: ['src/main.tsx'],
  outfile: 'dist/main.js',
  platform: 'browser',
  format: 'cjs',
  target: 'es2022',
  external: ['obsidian'],
});

await esbuild.build({
  ...common,
  entryPoints: ['src/obsidian.css'],
  outfile: 'dist/styles.css',
  loader: { '.png': 'dataurl', '.svg': 'dataurl' },
});

await cp('manifest.json', 'dist/manifest.json');
