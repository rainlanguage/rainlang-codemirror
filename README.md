# **Rain Language - Codemirror**
The Rain language (aka rainlang) implementaion for codemirror, which works as a codemirror extension.
This extention provides: 
- Syntax highlighting (written in lezer grammar)
- Diagnostics 
- Completion (through codemirror autocomplete extension)
- Hover (through codemirror hoverTooltip extension)

This repo uses and utilized original source code from [codemirror-languageserver](https://github.com/FurqanSoftware/codemirror-languageserver).

The primary goal of the Rain language is to make smart contract development accessible for as many people as possible. This is fundamentally grounded in our belief that accessibility is the difference between theoretical and practical decentralisation. There are many people who would like to participate in authoring and auditing crypto code but currently cannot. When someone wants/needs to do something but cannot, then they delegate to someone who can, this is by definition centralisation.

For more info and details about rainlang, please read this [article](https://hackmd.io/@REJeq0MuTUiqnjx9w5SsUA/HJj9s-nfi#Rainlang-has-a-spectrum-of-representations-from-concise-gtexplicit).

If you find an issue or you want to propose an improvement, please feel free to post it on: [issues](https://github.com/rainprotocol/rainlang-codemirror/issues)

## **Tutorial**
To get started, install the package:
```bash
yarn add codemirror-rainlang
or
npm install codemirror-rainlang
```
<br>

Then use `RainLanguage()` to get the `LanguageSupport` class object and use it as desired in editor:
```typescript
// import
import { RainLanguage, RainLanguageServicesFacet } from "codemirror-rainlang";

// get the `LanguageSupport` instance
const rainlangSupport = RainLanguage(config)

// for getting the MetaStore instance firts get the facet value of `RainLanguageServicesFacet` which is of type `ViewPlugin`:
const rainViewPlugin = editorView.state.facet(RainLanguageServicesFacet);

// then retrive the instance of the `RainLanguageServicesPlugin` by:
const rainPlugin = editorView.plugin(rainViewPlugin);

// lastly call the `getMetaStore()` method to get the MetaStore instance to interact with it manually:
rainPlugin.getMetaStore("0x1234..");
```
<br>

Alternativley you can instantiate the `RainlangExtension` object and use it directly as an extension:
```typescript
// import
import { RainlangExtension } from "codemirror-rainlang";

// instantiate the rainlang extension, store it for updating op meta easily in future
// `config` can be used to select specific language services to include/exclude
// this object can be used directly as an extension
const rainlangExt = new RainlangExtension(config)

// to get the MetaStore instance to intract with it manually:
rainlangExt.updateOpMeta(newOpMeta);
```
<br>
