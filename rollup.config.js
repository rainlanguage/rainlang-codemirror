import ts from 'rollup-plugin-ts';
// import babel from '@rollup/plugin-babel';
import { lezer } from "@lezer/generator/rollup";

export default {
    input: 'src/index.ts',
    output: {
        dir: 'dist',
        format: 'es'
    },
    plugins: [
        ts(),
        lezer(),
        // babel({
        //     babelHelpers: 'bundled'
        // })
    ],
    external: [
        '@codemirror/autocomplete',
        '@codemirror/lint',
        '@codemirror/state',
        '@codemirror/tooltip',
        '@codemirror/view',
        '@rainprotocol/rainlang/esm',
        "@lezer/highlight",
        "@codemirror/language",
        "@lezer/lr"
    ]
};

// .babelrc file
// {
// 	"presets": [
// 		"@babel/env"
// 	]
// }