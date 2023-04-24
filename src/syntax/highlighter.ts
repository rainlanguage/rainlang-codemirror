import { parser } from "./syntax.grammar";
import { styleTags, tags } from "@lezer/highlight";
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
            styleTags({
                Number: tags.number,
                Placeholder: tags.unit,
                VariableName: tags.variableName,
                Opcode: tags.keyword,
                OpcodeWithOperand: tags.keyword,
                BlockComment: tags.comment,
                AngleBracketOpen: tags.keyword,
                AngleBracketClose: tags.keyword,
                ParenOpen: tags.keyword,
                ParenClose: tags.keyword,
                Assignment: tags.separator,
                Comma: tags.punctuation,
                Semi: tags.punctuation
            }),
            foldNodeProp.add({
                Expression: foldInside,
                BlockComment(tree) { return {from: tree.from + 2, to: tree.to - 2}; }
            })
        ]
    }),
    languageData: {
        closeBrackets: {brackets: ["(", "<"]},
        commentTokens: {block: {open: "/*", close: "*/"}}
    }
});
