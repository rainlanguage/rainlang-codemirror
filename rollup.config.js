// import path from "path";
import ts from "rollup-plugin-ts";
// import babel from "@rollup/plugin-babel";
// import license from 'rollup-plugin-license';
import { lezer } from "@lezer/generator/rollup";


export default {
    input: "src/index.ts",
    output: [
        { file: "./dist/index.cjs", format: "cjs" },
        { dir: "dist", format: "es" }
    ],
    plugins: [
        ts(),
        lezer(),
        // license({
        //     sourcemap: true,
        //     cwd: process.cwd(), // The default
        // banner: {
        //     commentStyle: 'regular', // The default
        //     content: {
        //         file: path.join(__dirname, 'src/services/LICENSE'),
        //         encoding: 'utf-8', // Default is utf-8
        //     },
        // },
        // thirdParty: {
        //     // includePrivate: true, // Default is false.
        //     output: {
        //         file: path.join(__dirname, 'dist', 'dependencies.txt'),
        //         encoding: 'utf-8', // Default is utf-8.
        //     },
        // },
        // }),
        // babel({
        //     babelHelpers: "bundled"
        // })
    ],
    external: [
        "@lezer/lr",
        "@lezer/highlight",
        "@codemirror/view",
        "@codemirror/lint",
        "@codemirror/state",
        "@codemirror/tooltip",
        "@codemirror/language",
        "@codemirror/autocomplete",
        "@rainprotocol/rainlang", 
    ]
};

// .babelrc file
// {
// 	"presets": [
// 		"@babel/env"
// 	]
// }