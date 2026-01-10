import esbuild from 'esbuild';
import process from 'process';

const isMinify = process.argv.includes('--minify');
const isWatch = process.argv.includes('--watch');

const ctx = await esbuild.context({
  entryPoints: ['main.ts'],
  bundle: true,
  outfile: 'main.js',
  format: 'cjs',
  platform: 'browser',
  target: 'es2018',
  sourcemap: !isMinify,
  minify: isMinify,
  external: ['obsidian'],
});

if (isWatch) {
  await ctx.watch();
} else {
  await ctx.rebuild();
  await ctx.dispose();
}
