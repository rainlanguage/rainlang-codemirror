import { parser } from "./syntax.grammar";
import { parseMixed } from "@lezer/common";
import { FrontMatter } from "./parser.terms";
import { LRLanguage } from "@codemirror/language";
import { yamlLanguage } from "@codemirror/lang-yaml";

/**
 * @public Rainlang syntax highlighter
 */
export const RainlangLR = LRLanguage.define({
    name: "rainlang",
    parser: parser.configure({
        wrap: parseMixed((node, _input) => 
            node.type.id == FrontMatter
                ? { parser: yamlLanguage.parser, overlay: [{ from: node.from, to: node.to }] } 
                : null
        )
    }),
    languageData: {
        closeBrackets: { brackets: ["(", "<", "[", "\"", "{", "`"] },
        commentTokens: {block: {open: "/*", close: "*/"}},
        wordChars: "-"
    }
});
