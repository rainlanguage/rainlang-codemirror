/* eslint-disable no-cond-assign */
import { parser } from "./syntax.grammar";
import { styleTags, tags } from "@lezer/highlight";
// import { parseMixed, Parser, ParseWrapper } from "@lezer/common";
import { LRLanguage, indentNodeProp, foldNodeProp, foldInside, delimitedIndent } from "@codemirror/language";
// import { OpcodeOpening } from "./parser.terms";

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
                FrontMatter: tags.keyword,
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
                Semi: tags.punctuation,
                Import: tags.meta,
                Binding: tags.className,
                Quote: tags.string
            }),
            foldNodeProp.add({
                Expression: foldInside,
                BlockComment(tree) { return {from: tree.from + 2, to: tree.to - 2}; }
            })
        ]
    }),
    languageData: {
        closeBrackets: {brackets: ["(", "<", "["]},
        commentTokens: {block: {open: "/*", close: "*/"}}
    }
});

// export const htmlLanguage = RainlangLR.configure({
//     wrap: configureNesting(defaultNesting, defaultAttrs)
// });

// type NestedLang = {
//     tag: string,
//     attrs?: (attrs: {[attr: string]: string}) => boolean,
//     parser: Parser
// }

// type NestedAttr = {
//     name: string,
//     tagName?: string,
//     parser: Parser
// }

// export function configureNesting(
//     tags: NestedLang[] = [], 
//     attributes: NestedAttr[] = []
// ): ParseWrapper {
//     const script = [];
//     const style = [];
//     const textarea = [];
//     const other = [];
//     for (const tag of tags) {
//         const array = tag.tag == "script" 
//             ? script 
//             : tag.tag == "style" 
//                 ? style 
//                 : tag.tag == "textarea" 
//                     ? textarea 
//                     : other;
//         array.push(tag);
//     }
//     const attrs = attributes.length ? Object.create(null) : null;
//     for (const attr of attributes) (attrs[attr.name] || (attrs[attr.name] = [])).push(attr);
  
//     return parseMixed((node, input) => {
//         const id = node.type.id;
//         if (id == ScriptText) return maybeNest(node, input, script);
//         if (id == StyleText) return maybeNest(node, input, style);
//         if (id == TextareaText) return maybeNest(node, input, textarea);
  
//         if (id == Element && other.length) {
//             let n = node.node;
//             let open = n.firstChild;
//             let tagName = open && findTagName(open, input);
//             let attrs;
//             if (tagName) for (const tag of other) {
//                 if (
//                     tag.tag == tagName && 
//                     (!tag.attrs || tag.attrs(attrs || (attrs = getAttrs(n, input))))
//                 ) {
//                     const close = n.lastChild;
//                     const to = close?.type.id == CloseTag ? close?.from : n.to;
//                     if (to > open.to)
//                         return {parser: tag.parser, overlay: [{from: open.to, to}]};
//                 }
//             }
//         }
  
//         if (attrs && id == Attribute) {
//             const n = node.node;
//             let nameNode;
//             if (nameNode = n.firstChild) {
//                 const matches = attrs[input.read(nameNode.from, nameNode.to)];
//                 if (matches) for (const attr of matches) {
//                     if (attr.tagName && attr.tagName != findTagName(n.parent, input)) continue;
//                     const value = n.lastChild;
//                     if (value?.type.id == AttributeValue) {
//                         const from = value.from + 1;
//                         const last = value.lastChild;
//                         const to = value.to - (last && last.isError ? 0 : 1);
//                         if (to > from) return { 
//                             parser: attr.parser, 
//                             overlay: [{from, to}] 
//                         };
//                     } else if (value?.type.id == UnquotedAttributeValue) {
//                         return { 
//                             parser: attr.parser, 
//                             overlay: [{from: value?.from, to: value?.to}] 
//                         };
//                     }
//                 }
//             }
//         }
//         return null;
//     });
// }