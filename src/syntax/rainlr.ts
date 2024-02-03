/* eslint-disable no-cond-assign */
import { parser } from "./syntax.grammar";
import { parseMixed } from "@lezer/common";
import { FrontMatterSplitter } from "./parser.terms";
import { yamlLanguage } from "@codemirror/lang-yaml";
import { LRLanguage, indentNodeProp, foldNodeProp, foldInside, delimitedIndent } from "@codemirror/language";

/**
 * @public Rainlang syntax highlighter
 */
export const RainlangLR = LRLanguage.define({
    name: "rainlang",
    parser: parser.configure({
        props: [
            indentNodeProp.add({
                Expression: delimitedIndent({closing: ")", align: false}),
            }),
            foldNodeProp.add({
                Expression: foldInside,
                BlockComment(tree) { return {from: tree.from + 2, to: tree.to - 2}; }
            })
        ],
        wrap: parseMixed((node, _input) => {
            const id = node.type.id;
            if (id == FrontMatterSplitter) {
                const from = 0;
                const to = node.node.from;
                return {parser: yamlLanguage.parser, overlay: [{from, to}]};
            }
            return null;
        }),
    }),
    languageData: {
        closeBrackets: {brackets: ["(", "<", "["]},
        commentTokens: {block: {open: "/*", close: "*/"}}
    }
});