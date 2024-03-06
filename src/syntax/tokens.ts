import { ExternalTokenizer } from "@lezer/lr";
import { FrontMatter, ElisionMsg } from "./parser.terms.js";

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

export const elisionMsg = new ExternalTokenizer((input, _stack) => {
    // 33 = !
    // 47 = /
    // 42 = *
    while (input.next >= 0 ) {
        if (input.next == 33) {
            while (
                input.next >= 0 
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                && input.next != 35 
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                && !(input.next == 47 && input.peek(1) == 42)
            ) {
                input.advance();
            }
            input.acceptToken(ElisionMsg);
            break;
        }
        input.advance();
    }
});