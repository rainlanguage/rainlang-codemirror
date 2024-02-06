import { ExternalTokenizer } from "@lezer/lr";
import { FrontMatter } from "./parser.terms.js";

export const frontMatter = new ExternalTokenizer((input, _stack) => {
    // 45 = -
    // 47 = /
    // 42 = *
    while (input.next >= 0 ) {
        if (input.next == 45 && input.peek(1) == 45 && input.peek(2) == 45) {
            input.acceptToken(FrontMatter);
            break;
        }
        else if (input.next == 42 && input.peek(1) == 47) {
            break;
        }
        input.advance();
    }
});