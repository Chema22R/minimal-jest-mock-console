'use strict';

class MockConsole {
    constructor(level = 'error', regexList = [/.*/u]) {
        this.originalConsole = { ...console };
        this.errors = { expected: regexList.length, handled: 0, matches: 0, unhandled: 0 };

        jest.spyOn(console, level).mockImplementation((msg, ...args) => {
            let match = false;

            msg = msg.replace(/%s/g, () => args.splice(0, 1));

            for (const regex of regexList) {
                if (regex.test(msg)) {
                    match = true;
                    this.errors.matches += 1;
                    break;
                }
            }

            if (match) {
                this.errors.handled += 1;
            } else {
                this.errors.unhandled += 1;
                console[level] = this.originalConsole[level](msg);
            }
        });
    }

    expected(key, alt) {
        switch (key) {
            case '':
            case null:
            case undefined:
                return this.expected('errors', alt) && this.expected('handled', alt) && this.expected('matches', alt) && this.expected('unhandled', alt);
            case 'errors':
                return (this.errors.handled + this.errors.unhandled) === (alt >= 0 ? alt : this.errors.expected);
            case 'handled':
                return this.errors.handled === (alt >= 0 ? alt : this.errors.expected);
            case 'matches':
                return this.errors.matches === (alt >= 0 ? alt : this.errors.expected);
            case 'unhandled':
                return this.errors.unhandled === (alt >= 0 ? alt : 0);
            default: return false;
        }
    }

    restore() {
        console = this.originalConsole;
    }
}

module.exports = MockConsole;