import { Text, TransactionSpec } from "@codemirror/state";
import { Diagnostic, setDiagnostics } from "@codemirror/lint";
import { TextDocument } from "vscode-languageserver-textdocument";
import { ViewUpdate, PluginValue, EditorView, Tooltip } from "@codemirror/view";
import { CompletionContext, CompletionResult, Completion } from "@codemirror/autocomplete";
import { 
    Hover, 
    Problem, 
    Position, 
    MetaStore, 
    RainDocument, 
    MarkupContent, 
    CompletionItem,
    TextDocumentItem,  
    CompletionItemKind, 
    RainLanguageServices,
} from "@rainlanguage/dotrain";


/**
 * @public A function for calling the native parser and get back its errors as Problems
 */
export type NativeParserCallback = (dotrain: RainDocument) => Promise<Problem[]>;

/**
 * @public Converts TextDocument to TextDocumentItem
 */
export function toTextDocumentItem(textDocument: TextDocument): TextDocumentItem {
    return {
        text: textDocument.getText(),
        uri: textDocument.uri,
        version: textDocument.version,
        languageId: textDocument.languageId
    };
}

// const useLast = (values: readonly any[]) => values.reduce((_, v) => v, '');
// const documentUri = Facet.define<string, string>({ combine: useLast });
// const languageId = Facet.define<string, string>({ combine: useLast });

/**
 * @public A plugin that manages languages services processes.
 * Original code from [codemirror-languageserver](https://github.com/FurqanSoftware/codemirror-languageserver),
 * BSD-3-Clause License, Copyright (c) 2021, Mahmud Ridwan, All rights reserved.
 * 
 * @see [LICENSE](./LICENSE) for license details.
 */ 
export class RainLanguageServicesPlugin implements PluginValue {
    public readonly uri = "file:///untitled.rain";
    public readonly languageId = "rainlang";
    public metaStore: MetaStore;
    public version = 0;
    public langServices: RainLanguageServices;
    private textDocument: TextDocument;

    /**
     * @public constructor of the class
     * @param view - The editor view instance
     * @param metaStore - (optional) The meta store object to use
     * @param callback - (optional) The callback to run fork calls on native parser,
     * this will be called everytime there are no active diagnostics, so as a result, 
     * errors from calling onchain parser will be shown as diagnostics
     */
    constructor(
        public view: EditorView, 
        metaStore?: MetaStore, 
        public callback?: NativeParserCallback
    ) {
        this.metaStore = metaStore ? metaStore : new MetaStore(true);
        this.textDocument = TextDocument.create(
            this.uri,
            this.languageId,
            this.version,
            this.view.state.doc.toString()
        );
        this.langServices = new RainLanguageServices(this.metaStore);
        this.processDiagnostics(this.view.state.doc.toString(), this.version).then(
            v => this.view.dispatch(v[0])
        );
    }

    // update the instance of TexTdocument and RainDocument
    update(update: ViewUpdate) {
        if (!update.docChanged) return;
        else {
            TextDocument.update(
                this.textDocument,
                [{ text: this.view.state.doc.toString() }],
                ++this.version
            );
            this.processDiagnostics(this.view.state.doc.toString(), this.version).then(
                v => v[1] === this.version ? this.view.dispatch(v[0]) : {}
            );
        }
    }

    destroy() {}

    /**
     * @public Handles calls for hover tooltip
     */
    public async handleHoverTooltip(offset: number): Promise<Tooltip | null> {
        try {
            const hover = this.langServices.doHover(
                toTextDocumentItem(this.textDocument),
                this.textDocument.positionAt(offset)
            );
            if (!hover) return null;
            else {
                let end;
                if (hover.range) {
                    offset = this.textDocument.offsetAt(hover.range.start);
                    end = this.textDocument.offsetAt(hover.range.end);
                }
                return getHoverTooltip(hover, offset, end);
            }
        }
        catch (err) {
            console.log(err);
            return null;
        }
    }

    /**
     * @public Handles calls for code completion
     */
    public async handleCompletion(context: CompletionContext): Promise<CompletionResult | null> {
        try {
            const completions = this.langServices.doComplete(
                toTextDocumentItem(this.textDocument),
                this.textDocument.positionAt(context.pos)
            );
            if (!completions) return null;
            else return getCompletion(
                context, 
                completions
            );
        }
        catch (err) {
            console.log(err);
            return null;
        }
    }


    /**
     * @public Handles calls for docuement diagnostics
     */
    public async processDiagnostics(
        text: string,
        version: number
    ): Promise<[TransactionSpec, number]> {
        try {
            const textDocument = TextDocumentItem.create("file:///temp.rain", "rainlang", 0, text);
            const rainDocument = this.langServices.newRainDocument(textDocument);
            const diagnostics = getDiagnostics(rainDocument.allProblems);
            if (diagnostics.length === 0 && this.callback) {
                const npErrors = await this.callback(rainDocument);
                return [setDiagnostics(this.view.state, getDiagnostics(npErrors)), version];
            } else {
                return [setDiagnostics(this.view.state, diagnostics), version];
            }
        }
        catch (err) {
            console.log(err);
            return [setDiagnostics(this.view.state, []), version];
        }
    }
}

/**
 * @public Defines the raw language services callbacks signature
 */
export type RawLanguageServicesCallbacks = {
    diagnostics: (textDocument: TextDocumentItem) => Promise<Problem[]>;
    hover?: (textDocument: TextDocumentItem, position: Position) => Promise<Hover | null>;
    completion?: (
        textDocument: TextDocumentItem, 
        position: Position
    ) => Promise<CompletionItem[] | null>;
}

/**
 * @public A plugin that gets all lang services through provided callbacks.
 * So all the logic behind suppliying the lang services results can be out-sources
 * on the callbacks implementations.
 * Each callback is triggered when the services is on demand in the text editor 
 * through use input/actions
 */ 
export class RawRainLanguageServicesPlugin implements PluginValue {
    public readonly uri = "file:///untitled.rain";
    public readonly languageId = "rainlang";
    public version = 0;
    private textDocument: TextDocument;

    constructor(
        public view: EditorView, 
        public callbacks: RawLanguageServicesCallbacks,
    ) {
        this.textDocument = TextDocument.create(
            this.uri,
            this.languageId,
            this.version,
            this.view.state.doc.toString()
        );
        this.processDiagnostics(this.view.state.doc.toString(), this.version).then(
            v => this.view.dispatch(v[0])
        );
    }

    // update the instance of TexTdocument and RainDocument
    update(update: ViewUpdate) {
        if (!update.docChanged) return;
        else {
            TextDocument.update(
                this.textDocument,
                [{ text: this.view.state.doc.toString() }],
                ++this.version
            );
            this.processDiagnostics(this.view.state.doc.toString(), this.version).then(
                v => v[1] === this.version ? this.view.dispatch(v[0]) : {}
            );
        }
    }

    destroy() {}

    /**
     * @public Handles calls for hover tooltip
     */
    public async handleHoverTooltip(offset: number): Promise<Tooltip | null> {
        if (this.callbacks.hover) {
            try {
                const hover = await this.callbacks.hover(
                    toTextDocumentItem(this.textDocument),
                    this.textDocument.positionAt(offset)
                );
                if (!hover) return null;
                else {
                    let end;
                    if (hover.range) {
                        offset = this.textDocument.offsetAt(hover.range.start);
                        end = this.textDocument.offsetAt(hover.range.end);
                    }
                    return getHoverTooltip(hover, offset, end);
                }
            }
            catch (err) {
                console.log(err);
                return null;
            }
        }
        else return null;
    }

    /**
     * @public Handles calls for code completion
     */
    public async handleCompletion(context: CompletionContext): Promise<CompletionResult | null> {
        if (this.callbacks.completion) {
            try {
                const completions = await this.callbacks.completion(
                    toTextDocumentItem(this.textDocument),
                    this.textDocument.positionAt(context.pos)
                );
                if (!completions) return null;
                else return getCompletion(
                    context, 
                    completions
                );
            }
            catch (err) {
                console.log(err);
                return null;
            }
        }
        else return null;
    }


    /**
     * @public Handles calls for docuement diagnostics
     */
    public async processDiagnostics(
        text: string,
        version: number
    ): Promise<[TransactionSpec, number]> {
        try {
            const textDocument = TextDocumentItem.create("file:///temp.rain", "rainlang", 0, text);
            const diagnostics = await this.callbacks.diagnostics(textDocument);
            return [setDiagnostics(this.view.state, getDiagnostics(diagnostics)), version];
        }
        catch (err) {
            console.log(err);
            return [setDiagnostics(this.view.state, []), version];
        }
    }
}

/**
 * @public Converts LSP hover to codemirror hover tooltips.
 * Original code from [codemirror-languageserver](https://github.com/FurqanSoftware/codemirror-languageserver),
 * BSD-3-Clause License, Copyright (c) 2021, Mahmud Ridwan, All rights reserved.
 * 
 * @see [LICENSE](./LICENSE) for license details.
 * 
 * @param hover - The LSP hover item
 * @param pos - Offset of the textDocument to get the completion items for
 * @param end - The end offset of the requested hiver item
 * @returns Codemirror tooltip or null
 */
export function getHoverTooltip(
    hover: Hover,
    pos: number,
    end?: number
): Tooltip | null {
    const { contents } = hover;
    if (pos === null) return null;
    const dom = document.createElement("div");
    dom.classList.add("documentation");
    //if (this.allowHTMLContent) dom.innerHTML = formatContents(contents);
    //else 
    dom.textContent = (contents as MarkupContent).value;
    return { pos, end, create: (_view) => ({ dom }), above: true };
}

/**
 * @public Converts LSP CompletionItem to codemirror code completions.
 * Original code from [codemirror-languageserver](https://github.com/FurqanSoftware/codemirror-languageserver),
 * BSD-3-Clause License, Copyright (c) 2021, Mahmud Ridwan, All rights reserved.
 * 
 * @see [LICENSE](./LICENSE) for license details.
 * 
 * @param context - Completion context
 * @param completionItems - The LSP completion items
 * @returns Codemirror completion result or null
 */
export function getCompletion(
    context: CompletionContext,
    completionItems: CompletionItem[]
): CompletionResult | null {
    const CompletionItemKindMap = Object.fromEntries(
        Object.entries(CompletionItemKind).map(([key, value]) => [value, key])
    ) as Record<CompletionItemKind, string>;

    let { pos } = context;
    if (!context.matchBefore(/['\w-]+$/)) return null;

    let completions = completionItems.map(
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
            } = {
                label,
                detail,
                apply: insertText ? insertText : label,
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
        if (/^['\w-]+$/.test(word)) {
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
 * @public Converts RainDocument Problems to codemirror diagnostics
 * @param problems - RainDocument problems
 */
export function getDiagnostics(problems: Problem[]): Diagnostic[] {
    return problems.map(({ msg, position }) => ({
        message: msg,
        from: position[0],
        to: position[1],
        severity: "error"
        // ({
        //     [DiagnosticSeverity.Error]: "error",
        //     [DiagnosticSeverity.Warning]: "warning",
        //     [DiagnosticSeverity.Information]: "info",
        //     [DiagnosticSeverity.Hint]: "info",
        // } as const)[severity!]
    }));
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
    if (pos.line >= doc.lines) return doc.length;
    const offset = doc.line(pos.line + 1).from + pos.character;
    if (offset > doc.length) return doc.length;
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
 * @public Reduces an array to its last element
 * @param values - Values to reduce
 */
export const useLast = (values: readonly any[]) => values.reduce((_, v) => v, "");
