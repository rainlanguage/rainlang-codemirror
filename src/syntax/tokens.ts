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
    while (check(input)) {
        if (input.next == 33) {
            while (check(input)) {
                input.advance();
            }
            input.acceptToken(ElisionMsg);
            break;
        }
        input.advance();
    }
});

function check(input: any) {
    // 33 = !
    // 47 = /
    // 42 = *
    // 35 = #
    // 64 = @
    return input.next >= 0 
        && input.next != 35 
        && input.next != 64 
        && !(input.next == 47 && input.peek(1) == 42);
}