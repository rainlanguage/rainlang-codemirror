import { Extension, Facet } from "@codemirror/state";
import { RainLRLanguage } from "./syntax/highlighter";
import { autocompletion } from "@codemirror/autocomplete";
import { ViewPlugin, hoverTooltip } from "@codemirror/view";
import { LanguageSupport, LanguageDescription } from "@codemirror/language";
import { RainLanguageServicesPlugin, offsetToPos, useLast } from "./services/languageServices";

export * from "./services/languageServices";
export { RainLRLanguage };


/**
 * @public The facet used to store and retrive RainLanguageServicesPlugin instance from a EditorView.plugin()
 * after getting the facet value from the state associated with that EditoreView instance, so then can intract 
 * with the plugin directly to update op meta for example.
 * This combination is provided for `rainlang` LanguageSupport class objectand not for `RainlangExtention` class.
 * 
 * @example
 * ```typescript
 * // get value of the facet
 * const rainViewPlugin = editorView.state.facet(RainLanguageServicesFacet);
 * 
 * // get the plugin instance
 * const rainPlugin = editorView.plugin(rainViewPlugin);
 * 
 * // update op meta from plugin
 * rainPlugin.updateOpMeta("0x123...");
 * ```
 */
export const RainLanguageServicesFacet = Facet.define<
    ViewPlugin<RainLanguageServicesPlugin>,
    ViewPlugin<RainLanguageServicesPlugin>
>({ combine: useLast });

/**
 * @public Options to choose language services and define initial op meta
 */
export type RainLanguageConfig = {
    /**
     * Provides hover tooltips
     */
    hover?: boolean;
    /**
     * Provides code completion suggestions
     */
    completion?: boolean;
    /**
     * Initial op meta to pass
     */
    initialOpMeta?: Uint8Array | string;
} 

/**
 * @public Rainlang as a codemirror extention
 * @example
 * ```typescript
 * // instantiate the extension that can be directly used as codemirror extention
 * // it is instantiated so that opmeta can be updated easily
 * const rainlangExtension = new RainlangExtention(options);
 *
 * // to update op meta
 * rainlangExtension.updateOpMeta("ox456...");
 * ```
 */
export class RainlangExtension {
    public extension: Extension[] = [];
    private plugin: RainLanguageServicesPlugin | undefined;
    private hover = hoverTooltip(
        (view, pos) => this.plugin?.handleHoverTooltip(
            view,
            offsetToPos(view.state.doc, pos)
        ) ?? null
    );
    private completion = autocompletion({
        override: [
            async (context) => {
                if (this.plugin == null) return null;
                return await this.plugin?.handleCompletion(
                    context,
                    offsetToPos(context.state.doc, context.pos)
                );
            },
        ],
    });

    /**
     * @public Constructor of the RainlangCodemirror class
     * @param config - options to for language services to include
     */
    constructor(config?: RainLanguageConfig) {
        this.extension.push(
            RainLRLanguage,
            ViewPlugin.define(
                view => this.plugin = new RainLanguageServicesPlugin(view, config?.initialOpMeta)
            )
        );
        if (!config) this.extension.push(this.hover, this.completion);
        else {
            if (config?.hover) this.extension.push(this.hover);
            if (config?.completion) this.extension.push(this.completion);
        }
    }

    /**
     * @public Updates the op meta of this instance
     * @param opmeta - The new op meta
     */
    public updateOpMeta(opmeta: Uint8Array | string) {
        if (this.plugin) this.plugin.updateOpmeta(opmeta);
    }
}

/**
 * @public provides Rainlang implementation for codemirror as LanguageSupport
 * This is the standard implementation of rainlang for codemirror. 
 * 
 * @example
 * in order to update opmeta for it, it should be done through getting the plugin instance 
 * from the EditorView with providing it the result of getting the `RainLanguageServicesFacet` 
 * facet and then calling `updateOpMeta()` for it:
 * ```typescript
 * // get the `RainLanguageServicesFacet` value from editor view
 * const rainViewPlugin = view.state.facet(RainLanguageServicesFacet);
 * 
 * // retrive the `RainLanguageServicesPlugin` instance
 * const rainPlugin = view.plugin(rainViewPlugin);
 * 
 * // update op meta
 * rainPlugin.updateOpMeta("0x123...")
 * ```
 * 
 * @param config - options to for language services to include
 * @returns rainlang LanguageSupport
 */
export function rainlang(config?: RainLanguageConfig): LanguageSupport {
    let plugin: RainLanguageServicesPlugin | undefined;
    const rainViewPlugin: ViewPlugin<RainLanguageServicesPlugin> = ViewPlugin.define(
        view => plugin = new RainLanguageServicesPlugin(view, config?.initialOpMeta)
    );
    const services: Extension[] = [];
    const hover = hoverTooltip(
        (view, pos) => plugin?.handleHoverTooltip(
            view,
            offsetToPos(view.state.doc, pos)
        ) ?? null
    );
    const completion = autocompletion({
        override: [
            async (context) => {
                if (plugin == null) return null;
                return await plugin?.handleCompletion(
                    context,
                    offsetToPos(context.state.doc, context.pos)
                );
            },
        ],
    });
    if (!config) services.push(hover, completion);
    else {
        if (config?.hover) services.push(hover);
        if (config?.completion) services.push(completion);
    }
    return new LanguageSupport(
        RainLRLanguage,
        [
            RainLanguageServicesFacet.of(rainViewPlugin),
            rainViewPlugin,
            ...services
        ]
    );
}

/**
 * @public Provides LanguageDescription class object for rainlang
 */
export const RainlangDescription = LanguageDescription.of({
    name: "rainlang",
    alias: [ "Rain Language", "Rainlang", "RainLang", "rain" ],
    extensions: [ ".rain", ".rainlang", ".rl" ],
    load: (config?: RainLanguageConfig) => Promise.resolve(rainlang(config)),
    support: rainlang()
});
