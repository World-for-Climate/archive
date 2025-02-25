import { vitePreprocess } from "@sveltejs/kit/vite";
import adapter from '@sveltejs/adapter-static';

const dev = process.argv.includes('dev');

/** @type {import('@sveltejs/kit').Config} */
const config = {
    kit: {
        adapter: adapter({
            // default options are shown. On some platforms
            // these options are set automatically — see below
            pages: 'build',
            assets: 'build',
            precompress: true,
            strict: true
        }),
        paths: {
            base: dev ? '' : '/archive'
        }
    },

    preprocess: [vitePreprocess({})]
};

export default config;
