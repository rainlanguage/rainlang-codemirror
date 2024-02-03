import {styleTags, tags} from "@lezer/highlight";

export const rainHighlight = styleTags({
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
});