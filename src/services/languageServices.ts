// import { Facet } from '@codemirror/state';
import { EditorView, Tooltip } from "@codemirror/view";
import { setDiagnostics } from "@codemirror/lint";
import type { ViewUpdate, PluginValue } from "@codemirror/view";
import { getCompletion, getDiagnostics, getHoverTooltip } from "../utils/utils";
import { Position, RainDocument, TextDocument } from "@rainprotocol/rainlang";
import type {
    CompletionContext,
    CompletionResult,
} from "@codemirror/autocomplete";

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
    public version = 0;
    private rainDocument: RainDocument;
    private textDocument: TextDocument;

    // constructor of the class
    constructor(
        private view: EditorView,
        initOpMeta: Uint8Array | string = ""
    ) {
        (this.textDocument = TextDocument.create(
            this.uri,
            this.languageId,
            this.version,
            this.view.state.doc.toString()
        )),
        (this.rainDocument = new RainDocument(
            this.textDocument,
            initOpMeta
        ));
        this.processDiagnostics();
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
            this.rainDocument.update(this.textDocument);
            this.processDiagnostics();
        }
    }

    destroy() {}

    // update opmeta for instance of RainDocument
    public async updateOpmeta(opmeta: Uint8Array | string) {
        this.rainDocument.update(undefined, opmeta);
        this.processDiagnostics();
    }

    // handles calls for hover tooltip
    public async handleHoverTooltip(
        view: EditorView,
        position: Position
    ): Promise<Tooltip | null> {
        try {
            return getHoverTooltip(view.state.doc, this.rainDocument, position);
        } catch (err) {
            console.log(err);
            return null;
        }
    }

    // handles calls for code completion
    public async handleCompletion(
        context: CompletionContext,
        position: Position
    ): Promise<CompletionResult | null> {
        try {
            return getCompletion(context, this.rainDocument, position);
        } catch (err) {
            console.log(err);
            return null;
        }
    }

    // handles calls for docuement diagnostics
    public async processDiagnostics() {
        try {
            const diagnostics = await getDiagnostics(
                this.view.state.doc,
                this.rainDocument
            );
            this.view.dispatch(setDiagnostics(this.view.state, diagnostics));
            // return getDiagnostics(view.state.doc, this.rainDocument);
        } catch (err) {
            console.log(err);
            this.view.dispatch(setDiagnostics(this.view.state, []));
            // return [];
        }
    }
}
