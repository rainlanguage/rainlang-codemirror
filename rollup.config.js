import ts from "rollup-plugin-ts";
// import babel from "@rollup/plugin-babel";
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
        "@rainprotocol/rainlang/esm", 
    ]
};

// .babelrc file
// {
// 	"presets": [
// 		"@babel/env"
// 	]
// }