# **Rain Language - Codemirror**
The Rain language (aka rainlang) implementaion for codemirror, which works as a codemirror extension.
This extention provides: 
- Syntax highlightinh (written in lezer)
- Diagnostics (through codemirror linter extension)
- Completion (through codemirror autocomplete extension)
- Hover (through codemirror hoverTooltip extension)

This repo uses and utilized original source code from [codemirror-languageserver](https://github.com/FurqanSoftware/codemirror-languageserver).

The primary goal of the Rain language is to make smart contract development accessible for as many people as possible. This is fundamentally grounded in our belief that accessibility is the difference between theoretical and practical decentralisation. There are many people who would like to participate in authoring and auditing crypto code but currently cannot. When someone wants/needs to do something but cannot, then they delegate to someone who can, this is by definition centralisation.

For more info and details, please read this [article](https://hackmd.io/@REJeq0MuTUiqnjx9w5SsUA/HJj9s-nfi#Rainlang-has-a-spectrum-of-representations-from-concise-gtexplicit)

If you find an issue or you want to propose an improvement, please feel free to post it on: [issues](https://github.com/rainprotocol/rainlang-codemirror/issues)

## **Tutorial**
To get started, install the package:
```bash
yarn add 'rainprotocol/rainlang-codemirror.git'
or
npm install 'rainprotocol/rainlang-codemirror.git'
```

Then instantiate the `RainlangCodemirror` object:
```typescript
// import
import { RainlangCodemirror } from "rainprotocol/rainlang-codemirror";

// instantiate the rainlang codemirror extension which can be fed to codemirror browser plugins
// options can be used to select specific language services to include/exclude
const rainlangCodemirror = new RainlangCodemirror(initialOpMeta, options)

// for updating the opmeta of the instance
rainlangCodemirror.updateOpMeta(newOpMeta);
```
<br>