import { styleTags, tags } from "@lezer/highlight";
import { indentNodeProp, foldNodeProp, foldInside, delimitedIndent } from "@codemirror/language";

export const highlight = styleTags({
    FrontMatterSplitter: tags.comment,
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
    Quote: tags.string,
    StringLiteral: tags.string,
    SubParser: tags.string,
});

export const indent = indentNodeProp.add({
    Expression: delimitedIndent({closing: ")", align: false}),
});

export const fold = foldNodeProp.add({
    Expression: foldInside,
    BlockComment(tree) { return {from: tree.from + 2, to: tree.to - 2}; }
});