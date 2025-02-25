import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

const dev = process.argv.includes('dev');

export default defineConfig({
    plugins: [sveltekit()],
    base: dev ? '' : '/archive'
});
