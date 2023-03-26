// helper functions taken from https://github.com/FurqanSoftware/codemirror-languageserver 
// and modified for converting language server protocol's lang features to codemirror
// under BSD-3-Clause License, Copyright (c) 2021, Mahmud Ridwan, All rights reserved.

import { Text } from "@codemirror/state";
import { Tooltip } from "@codemirror/view";
import { Diagnostic } from "@codemirror/lint";
import { Completion, CompletionContext, CompletionResult } from "@codemirror/autocomplete";
import { 
    Position, 
    RainDocument, 
    getRainHover,
    MarkupContent, 
    getRainCompletion, 
    getRainDiagnostics, 
    DiagnosticSeverity, 
    CompletionItemKind, 
    LanguageServiceParams 
} from "@rainprotocol/rainlang/esm";


/**
 * @public Provides codemirror hover tooltips.
 * Original code from [codemirror-languageserver](https://github.com/FurqanSoftware/codemirror-languageserver),
 * BSD-3-Clause License, Copyright (c) 2021, Mahmud Ridwan, All rights reserved.
 * 
 * @see [LICENSE](./LICENSE) for license details.
 * 
 * @param doc - Codemirror Text object
 * @param rainDocument - The RainDocument
 * @param position - Position of the textDocument to get the completion items for
 * @param setting - (optional) Language service params
 * @returns Codemirror tooltip or null
 */
export function getHoverTooltip(
    doc: Text,
    rainDocument: RainDocument,
    position: Position,
    setting?: LanguageServiceParams
): Tooltip | null {
    const result = getRainHover(rainDocument, position, setting);
    if (!result) return null;
    const { contents, range } = result;
    let pos = posToOffset(doc, position)!;
    let end;
    if (range) {
        pos = posToOffset(doc, range.start)!;
        end = posToOffset(doc, range.end);
    }
    if (pos === null) return null;
    const dom = document.createElement("div");
    dom.classList.add("documentation");
    //if (this.allowHTMLContent) dom.innerHTML = formatContents(contents);
    //else 
    dom.textContent = (contents as MarkupContent).value;
    return { pos, end, create: (_view) => ({ dom }), above: true };
}

/**
 * @public Provides codemirror code completion items.
 * Original code from [codemirror-languageserver](https://github.com/FurqanSoftware/codemirror-languageserver),
 * BSD-3-Clause License, Copyright (c) 2021, Mahmud Ridwan, All rights reserved.
 * 
 * @see [LICENSE](./LICENSE) for license details.
 * 
 * @param context - Completion context
 * @param rainDocument - The RainDocument
 * @param position - Position of the textDocument to get the completion items for
 * @param setting - (optional) Language service params
 * @returns Codemirror completion result or null
 */
export function getCompletion(
    context: CompletionContext,
    rainDocument: RainDocument,
    position: Position,
    setting?: LanguageServiceParams
): CompletionResult | null {
    const CompletionItemKindMap = Object.fromEntries(
        Object.entries(CompletionItemKind).map(([key, value]) => [value, key])
    ) as Record<CompletionItemKind, string>;

    let { pos } = context;
    // const line = state.doc.lineAt(pos);
    // let trigKind: CompletionTriggerKind = CompletionTriggerKind.Invoked;
    // let trigChar: string | undefined;
    // if (
    //     !explicit &&
    //     plugin.client.capabilities?.completionProvider?.triggerCharacters?.includes(
    //         line.text[pos - line.from - 1]
    //     )
    // ) {
    //     trigKind = CompletionTriggerKind.TriggerCharacter;
    //     trigChar = line.text[pos - line.from - 1];
    // }
    if (
        // trigKind === CompletionTriggerKind.Invoked &&
        !context.matchBefore(/\w+$/)
    ) return null;

    const result = getRainCompletion(rainDocument, position, setting);
    if (!result) return null;

    let completions = result.map(
        ({
            detail,
            label,
            kind,
            insertText,
            documentation,
            sortText,
            filterText,
        }) => {
            const completion: Completion & {
                filterText: string;
                sortText?: string;
                // apply: string;
            } = {
                label,
                detail,
                apply: (view, _comp, from) => {
                    // re adjusting the cursor position for opcodes
                    const match = findMatch(context, label);
                    let insert = insertText ?? label;
                    if (match) insert = (insertText ?? label).replace(match.text, "");
                    if (insertText?.endsWith("()")) {
                        let cursorPos = from + insert.length - 1;
                        if (insertText.includes("<>")) cursorPos -= 2;
                        view.dispatch({
                            changes: { from, insert },
                            selection: { anchor: cursorPos, head: cursorPos }
                        });
                    }
                    else view.dispatch({
                        changes: { from, insert }
                    });
                },
                type: kind && CompletionItemKindMap[kind].toLowerCase(),
                sortText: sortText ?? label,
                filterText: filterText ?? label,
            };
            if (documentation) {
                completion.info = (documentation as MarkupContent).value;
            }
            return completion;
        }
    );

    const [_span, _match] = prefixMatch(completions);
    const token = context.matchBefore(_match);

    if (token) {
        pos = token.from;
        const word = token.text.toLowerCase();
        if (/^\w+$/.test(word)) {
            completions = completions
                .filter(({ filterText }) =>
                    filterText.toLowerCase().startsWith(word)
                )
                .sort(({ label: a }, { label: b }) => {
                    switch (true) {
                    case a.startsWith(token.text) && !b.startsWith(token.text):
                        return -1;
                    case !a.startsWith(token.text) && b.startsWith(token.text):
                        return 1;
                    }
                    return 0;
                });
        }
    }
    return {
        from: pos,
        options: completions,
    };
}

/**
 * @public Provides codemirror diagnostics.
 * Original code from [codemirror-languageserver](https://github.com/FurqanSoftware/codemirror-languageserver),
 * BSD-3-Clause License, Copyright (c) 2021, Mahmud Ridwan, All rights reserved.
 * 
 * @see [LICENSE](./LICENSE) for license details.
 * 
 * @param doc - Codemirror Text object
 * @param rainDocument - The RainDocument
 */
export async function getDiagnostics(
    doc: Text,
    rainDocument: RainDocument
): Promise<Diagnostic[]> {
    const diagnostics: Diagnostic[] = (await getRainDiagnostics(rainDocument))
        .map(({ range, message, severity }) => ({
            from: posToOffset(doc, range.start)!,
            to: posToOffset(doc, range.end)!,
            severity: ({
                [DiagnosticSeverity.Error]: "error",
                [DiagnosticSeverity.Warning]: "warning",
                [DiagnosticSeverity.Information]: "info",
                [DiagnosticSeverity.Hint]: "info",
            } as const)[severity!],
            message,
        }))
        .filter(
            ({ from, to }) => 
                from !== null && 
                to !== null && 
                from !== undefined && 
                to !== undefined
        )
        .sort((a, b) => {
            switch (true) {
            case a.from < b.from:
                return -1;
            case a.from > b.from:
                return 1;
            }
            return 0;
        });
    return diagnostics;
}

/**
 * @public Converts a position to offset of a character in a codemirror text.
 * Original code from [codemirror-languageserver](https://github.com/FurqanSoftware/codemirror-languageserver),
 * BSD-3-Clause License, Copyright (c) 2021, Mahmud Ridwan, All rights reserved.
 * 
 * @see [LICENSE](./LICENSE) for license details.
 * 
 * @param doc - Codemirror text
 * @param pos - The position to convert
 * @returns - The offset of the provided position
 */
export function posToOffset(doc: Text, pos: { line: number; character: number }) {
    if (pos.line >= doc.lines) return;
    const offset = doc.line(pos.line + 1).from + pos.character;
    if (offset > doc.length) return;
    return offset;
}

/**
 * @public Converts offset of a character in a codemirror text to a position.
 * Original code from [codemirror-languageserver](https://github.com/FurqanSoftware/codemirror-languageserver),
 * BSD-3-Clause License, Copyright (c) 2021, Mahmud Ridwan, All rights reserved.
 * 
 * @see [LICENSE](./LICENSE) for license details.
 * 
 * @param doc - Codemirror text
 * @param offset - The offset to convert
 * @returns - The position of the provided character offset
 */
export function offsetToPos(doc: Text, offset: number) {
    const line = doc.lineAt(offset);
    return {
        line: line.number - 1,
        character: offset - line.from,
    };
}

/**
 * @public Constructs regexp out of completion items.
 * Original code from [codemirror-languageserver](https://github.com/FurqanSoftware/codemirror-languageserver),
 * BSD-3-Clause License, Copyright (c) 2021, Mahmud Ridwan, All rights reserved.
 * 
 * @see [LICENSE](./LICENSE) for license details.
 * 
 * @param completions - Codemirror completion items
 * @returns Regexp of completion items
 */
export function prefixMatch(completions: Completion[]) {
    function toSet(chars: Set<string>) {
        let preamble = "";
        let flat = Array.from(chars).join("");
        const words = /\w/.test(flat);
        if (words) {
            preamble += "\\w";
            flat = flat.replace(/\w/g, "");
        }
        return `[${preamble}${flat.replace(/[^\w\s]/g, "\\$&")}]`;
    }
    const first = new Set<string>();
    const rest = new Set<string>();

    for (const { label } of completions) {
        const [initial, ...restStr] = label as string;
        first.add(initial);
        for (const char of restStr) {
            rest.add(char);
        }
    }

    const source = toSet(first) + toSet(rest) + "*$";
    return [new RegExp("^" + source), new RegExp(source)];
}

/**
 * @public finds match before cursor for specific word
 * 
 * @param context - completion context
 * @param str - the string to find match for
 * @returns Matched item or null if not found any match
 */
export function findMatch(context: CompletionContext, str: string) {
    for (let i = 0; i < str.length; i++) {
        const match = context.matchBefore(new RegExp(str));
        if (match) return match;
        else str = str.slice(0, -1);
    }
    return null;
}
