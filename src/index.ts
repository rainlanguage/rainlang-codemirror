import { linter } from '@codemirror/lint';
import { offsetToPos } from './utils/utils';
import { Extension } from '@codemirror/state';
import { autocompletion } from '@codemirror/autocomplete';
import { ViewPlugin, hoverTooltip } from '@codemirror/view';
import { RainSyntaxHighlighter } from './syntax/highlighter';
import { RainLanguageServicesPlugin } from './services/languageServices';

export { RainSyntaxHighlighter, RainLanguageServicesPlugin };


/**
 * @public Options to choose language services 
 */
export type RainLanguageServicesOptions = {
    /**
     * Provides hover tooltips
     */
    hover?: boolean;
    /**
     * Provides diagnostics
     */
    diagnotics?: boolean;
    /**
     * Provides code completion suggestions
     */
    completion?: boolean;
} 

/**
 * @public Rainlang codemirror class that acts as a codemirror extention
 */
export class RainlangCodemirror {
    private plugin: RainLanguageServicesPlugin | undefined;
    public extension: Extension[] = [];

    /**
     * @public Constructor of the RainlangCodemirror class
     * @param initialOpMeta - Initial op meta
     * @param options - options to for language services to include
     */
    constructor(initialOpMeta: Uint8Array | string = "", options?: RainLanguageServicesOptions) {
        this.extension.push(
            RainSyntaxHighlighter,
            ViewPlugin.define((view) => {
                this.plugin = new RainLanguageServicesPlugin(view, initialOpMeta);
                return this.plugin;
            })
        );
        if (!options) {
            this.extension.push(
                linter(async(view) => await this.plugin?.handleDiagnostics(view) ?? []),
                hoverTooltip(
                    (view, pos) => this.plugin?.handleHoverTooltip(
                        view,
                        offsetToPos(view.state.doc, pos)
                    ) ?? null
                ),
                autocompletion({
                    override: [
                        async (context) => {
                            if (this.plugin == null) return null;
                            return await this.plugin?.handleCompletion(
                                context,
                                offsetToPos(context.state.doc, context.pos)
                            );
                        },
                    ],
                })
            );
        }
        else {
            if (options?.diagnotics) this.extension.push(
                linter(async(view) => await this.plugin?.handleDiagnostics(view) ?? []),
            );
            if (options?.hover) this.extension.push(
                hoverTooltip(
                    (view, pos) => this.plugin?.handleHoverTooltip(
                        view,
                        offsetToPos(view.state.doc, pos)
                    ) ?? null
                ),
            );
            if (options?.completion) this.extension.push(
                autocompletion({
                    override: [
                        async (context) => {
                            if (this.plugin == null) return null;
                            return await this.plugin?.handleCompletion(
                                context,
                                offsetToPos(context.state.doc, context.pos)
                            );
                        },
                    ],
                }),
            );
        }
    }

    /**
     * @public Updates the op meta ofr this instance
     * @param opmeta - The new op meta
     */
    public updateOpMeta(opmeta: Uint8Array | string) {
        if (this.plugin) this.plugin.updateOpmeta(opmeta);
    }
}