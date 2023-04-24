import { Extension, Facet } from "@codemirror/state";
import { RainLRLanguage } from "./syntax/highlighter";
import { autocompletion } from "@codemirror/autocomplete";
import { ViewPlugin, hoverTooltip } from "@codemirror/view";
import { LanguageSupport, LanguageDescription } from "@codemirror/language";
import { RainLanguageServicesPlugin, offsetToPos, useLast } from "./services/languageServices";

export * from "./services/languageServices";
export { RainLRLanguage };


/**
 * @public The facet used to store and retrive RainLanguageServicesPlugin instance from a EditorView.plugin().
 * By getting the facet value from the state associated with that EditoreView instance, you then can intract 
 * with the plugin directly to get the MetaStore instance and update its subgraph and metas manually, however, 
 * this is not recommended as the meta storage and management is handled automatically by every meta hash that
 * is specified in an Rain document, so using this will not be needed in most of the cases unless some custom
 * behavior is intended.
 * This combination is provided for `rainlang` LanguageSupport class object and not for `RainlangExtention` class.
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
 * rainPlugin.getMetaStore();
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
     * Additional subgraph endpoint URLs
     */
    subgraphs?: string[];
    /**
     * Initial meta hash and meta bytes k/v pairs
     */
    metas?: { [hash: string]: string };
} 

/**
 * @public Rainlang as a codemirror extention
 * @example
 * ```typescript
 * // instantiate the extension that can be directly used as codemirror extention
 * const rainlangExtension = new RainlangExtention(options);
 *
 * // to get the MetaStore instance of this extention instance
 * rainlangExtension.getMetaStore();
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
                async(view) => 
                    this.plugin = await RainLanguageServicesPlugin.create(
                        view, 
                        {
                            subgraphs: config?.subgraphs,
                            metas: config?.metas
                        }
                    )
            )
        );
        if (!config) this.extension.push(this.hover, this.completion);
        else {
            if (config?.hover) this.extension.push(this.hover);
            if (config?.completion) this.extension.push(this.completion);
        }
    }

    /**
     * @public Get the MetaStore object instance in order to manualy update its subgraphs or metas
     * Using this method is nor recommended as meta management is handled completely automatically 
     * from specified meta hashes in a Rain document and doesn't need any manual interference unless 
     * some custom behavior is intended.
     */
    public getMetaStore() {
        if (this.plugin) return this.plugin.getMetaStore();
    }
}

/**
 * @public 
 * Provides Rainlang implementation for codemirror as LanguageSupport
 * This is the standard implementation of rainlang for codemirror. 
 * 
 * @example
 * ```typescript
 * const rainLanguageSupport = rainlang(config);
 * ```
 * in order to get the MetaStore instance, it should be done through getting the plugin instance 
 * from the EditorView with providing it the result of getting the `RainLanguageServicesFacet` 
 * facet and then calling `getMetaStore()` for it, however this is nor recommended as meta management
 * is done automatically from specified meta hashes in a Rain document:
 * ```typescript
 * // get the `RainLanguageServicesFacet` value from editor view
 * const rainViewPlugin = view.state.facet(RainLanguageServicesFacet);
 * 
 * // retrive the `RainLanguageServicesPlugin` instance
 * const rainPlugin = view.plugin(rainViewPlugin);
 * 
 * // get the MetaStore instance
 * rainPlugin.getMetaStore()
 * ```
 * 
 * @param config - options to for language services to include
 * @returns rainlang LanguageSupport
 */
export function rainlang(config?: RainLanguageConfig): LanguageSupport {
    let plugin: RainLanguageServicesPlugin | undefined;
    const rainViewPlugin: ViewPlugin<RainLanguageServicesPlugin> = ViewPlugin.define(
        async(view) => plugin = await RainLanguageServicesPlugin.create(
            view, 
            {
                subgraphs: config?.subgraphs,
                metas: config?.metas
            }
        )
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
