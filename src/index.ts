import { offsetToPos, useLast } from "./utils/utils";
import { Extension, Facet } from "@codemirror/state";
import { RainLRLanguage } from "./syntax/highlighter";
import { LanguageSupport } from "@codemirror/language";
import { autocompletion } from "@codemirror/autocomplete";
import { ViewPlugin, hoverTooltip } from "@codemirror/view";
import { RainLanguageServicesPlugin } from "./services/languageServices";

export * from "./utils/utils";
export * from "./services/languageServices";
export { RainLRLanguage, RainLanguageServicesPlugin };


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
 * const plugin = editorView.plugin(rainViewPlugin);
 * 
 * // update op meta from plugin
 * plugin.updateOpMeta("0x123...");
 * ```
 */
export const RainLanguageServicesFacet = Facet.define<
    ViewPlugin<RainLanguageServicesPlugin>,
    ViewPlugin<RainLanguageServicesPlugin>
>({ combine: useLast });

/**
 * @public Options to choose language services 
 */
export type RainLanguageServicesOptions = {
    /**
     * Provides hover tooltips
     */
    hover?: boolean;
    /**
     * Provides code completion suggestions
     */
    completion?: boolean;
} 

/**
 * @public Rainlang as a codemirror extention
 * @example
 * ```typescript
 * // instantiate the extension that can be directly used as codemirror extention
 * // it is instantiated so that opmeta can be updated easily
 * const rainlangExtension = new RainlangExtention("0x123...", options);
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
     * @param initialOpMeta - Initial op meta
     * @param options - options to for language services to include
     */
    constructor(initialOpMeta: Uint8Array | string = "", options?: RainLanguageServicesOptions) {
        this.extension.push(
            RainLRLanguage,
            ViewPlugin.define(
                view => this.plugin = new RainLanguageServicesPlugin(view, initialOpMeta)
            )
        );
        if (!options) this.extension.push(this.hover, this.completion);
        else {
            if (options?.hover) this.extension.push(this.hover);
            if (options?.completion) this.extension.push(this.completion);
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

/**
 * @public provides Rainlang implementation for codemirror as LanguageSupport
 * This is the standard implementation of rainlang for codemirror and in order 
 * to update opmeta for it, it should be done through getting the plugin instance 
 * from the EditorView with providing it the result of getting the `RainLanguageServicesFacet` 
 * facet and then call updateOpMeta() for it:
 * ```typescript
 * // get the `RainLanguageServicesFacet` value from editor view
 * const rainServicesViewPlugin = view.state.facet(RainLanguageServicesFacet);
 * 
 * // retrive the `RainLanguageServicesPlugin` instance
 * const rainPlugin = view.plugin(rainServicesViewPlugin);
 * 
 * // update op meta
 * rainPlugin.updateOpMeta("0x123...")
 * ```
 * 
 * @param initialOpMeta - Initial op meta
 * @param options - options to for language services to include
 * @returns rainlang LanguageSupport
 */
export function rainlang(
    initialOpMeta: Uint8Array | string = "", 
    options?: RainLanguageServicesOptions
): LanguageSupport {
    let plugin: RainLanguageServicesPlugin | undefined;
    const rainViewPlugin: ViewPlugin<RainLanguageServicesPlugin> = ViewPlugin.define(
        view => plugin = new RainLanguageServicesPlugin(view, initialOpMeta)
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
    if (!options) services.push(hover, completion);
    else {
        if (options?.hover) services.push(hover);
        if (options?.completion) services.push(completion);
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
