const daisyui = require("daisyui");

/** @type {import('tailwindcss').Config}*/
const config = {
    content: ["./src/**/*.{html,js,svelte,ts}"],

    theme: {
        extend: {}
    },
    daisyui: {
        themes: ["lemonade", "forest"],
    },

    plugins: [daisyui]
};

module.exports = config;