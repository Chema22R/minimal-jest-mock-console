![CodeQL](https://github.com/Chema22R/minimal-jest-mock-console/workflows/CodeQL/badge.svg)
[![Total alerts](https://img.shields.io/lgtm/alerts/g/Chema22R/minimal-jest-mock-console.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/Chema22R/minimal-jest-mock-console/alerts/)
[![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/Chema22R/minimal-jest-mock-console.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/Chema22R/minimal-jest-mock-console/context:javascript)
[![dependencies Status](https://david-dm.org/chema22r/minimal-jest-mock-console/status.svg)](https://david-dm.org/chema22r/minimal-jest-mock-console)
[![devDependencies Status](https://david-dm.org/chema22r/minimal-jest-mock-console/dev-status.svg)](https://david-dm.org/chema22r/minimal-jest-mock-console?type=dev)
[![MIT License](https://camo.githubusercontent.com/d59450139b6d354f15a2252a47b457bb2cc43828/68747470733a2f2f696d672e736869656c64732e696f2f6e706d2f6c2f7365727665726c6573732e737667)](LICENSE)

# Minimal Jest Mock Console
Minimal Jest utility to mock the console.

If you use console or prop-types in your app, and you use jest to test more than just the correct behavior, then you probably end up with tests that pass and look like this:

![Screenshot](https://i.postimg.cc/1XnBhrY1/pre.png)

This could be very annoying and unhelpful. Specially if there is an actual failure and you have to search through all the red to find the actual failed test.

This package aims to solve this, mocking the console and intercepting all the expected errors we don't want to see, but letting pass the unexpected ones! Isn't it great?

## Installation

```
npm install --save-dev minimal-jest-mock-console
```

# Examples

## Most Basic Example: Intercept All the Errors

```js
import MockConsole from 'minimal-jest-mock-console';

describe(...
    it(...
        const mockConsole = new MockConsole();

        ...

        mockConsole.restore(); // Always restore the console after each test
    );
);
```

This example mocks the console without any configuration, intercepting all the calls to `console.error`. This implementation will catch and suppress the expected and **unexpected** errors, so, despite being the most basic way of doing it, it is **not** the recommended one.

The default configuration is to intercept the console error level, but we can do the same with any other console level (`error|warn|log|debug`):

```js
import MockConsole from 'minimal-jest-mock-console';

describe(...
    it(...
        const mockConsole = new MockConsole('warn');

        ...

        mockConsole.restore(); // Always restore the console after each test
    );
);
```
This will intercept all the calls to `console.warn` (expected and **unexpected**, so also **not** recommended).

> `new MockConsole()` is equivalent to `new MockConsole('error', [/.*/u])`

> `new MockConsole('warn')` is equivalent to `new MockConsole('warn', [/.*/u])`

## Intercept Only The Expected

The `MockConsole` class (`new MockConsole(level: string, regexList: RegExp[])`) receives two parameters:
- level: the console level in which to look for calls (`error|warn|log|debug`)
- regexList: the list of regular expressions against which to test console calls

```js
import MockConsole from 'minimal-jest-mock-console';

describe(...
    it(...
        const mockConsole = new MockConsole('error', [/Failed prop type:/]);

        ...

        mockConsole.restore(); // Always restore the console after each test
    );
);
```

This example will intercept all the calls to `console.error` with the text "Failed prop type:".

With this implementation, looking at the image above, the suite `/src/components/LinkList/test.js` would pass and the suite `/src/components/LinkListItem/test.js` would fail with only one error. To intercept all the errors, we could implement something like this:

```js
import MockConsole from 'minimal-jest-mock-console';

describe(...
    it(...
        const mockConsole = new MockConsole('error', [
            /Failed prop type:/,
            /LinkListItem components should be rendered within a LinkList component/
        ]);

        ...

        mockConsole.restore(); // Always restore the console after each test
    );
);
```

## Check Under the Hood and Catch Some Extra Errors

This package allows us to do some extra checks to ensure everything was as expected.

```js
import MockConsole from 'minimal-jest-mock-console';

describe(...
    it(...
        const mockConsole = new MockConsole('error', [/Failed prop type:/]);

        ...

        expect(mockConsole.expected('matches')).toBeTruthy();
        expect(mockConsole.expected('handled')).toBeTruthy();
        expect(mockConsole.expected('unhandled')).toBeTruthy();
        expect(mockConsole.expected('errors')).toBeTruthy();
        expect(mockConsole.expected()).toBeTruthy();

        mockConsole.restore(); // Always restore the console after each test
    );
);
```

Let's see what is happening here:
- `mockConsole.expected('matches')` returns `true` if the number of matches using the list of regular expressions (`regexList`) is equal to its length. This is very useful if we want to ensure each error matches with one and only one regex. If there is an error that matches with zero or more than one of the regular expressions, the test suite will fail.
- `mockConsole.expected('handled')` returns `true` if the number of intercepted calls to `console.<level>` is equal to the length of the list of regular expressions (`regexList`). This is useful if we want to ensure each regex matches at least one error. If we specify one regex per expected error and one of them matches zero, the test suite will fail.
- `mockConsole.expected('unhandled')` returns `true` if the number of non-intercepted calls to `console.<level>` is zero. This is useful to force the test suite to fail if there are unhandled errors (without this, console errors would be displayed but the test suite would pass like in the image above). This is equivalent to `expect(console.error).not.toBeCalled()`.
- `mockConsole.expected('errors')` is a wrapper of the last two. This is useful using the second parameter (next example).
- `mockConsole.expected()` is a wrapper of all these checks. This is recommended to check everything with just one line, but could be difficult to debug using only this. This is a good option for production, but not for development.

All the checks perform comparisons against the length of the list of regular expressions (`regexList`). If we have only one regex to only one expected error, this behavior is perfect, but, if not, some of these checks would be useless. To solve this, use the second argument to define the number against which to do the comparisons:

```js
import MockConsole from 'minimal-jest-mock-console';

describe(...
    it(...
        const mockConsole = new MockConsole('error', [
            /Failed prop type:/,
            /Failed prop/
        ]);

        ...

        expect(mockConsole.expected('matches', 2)).toBeTruthy();
        expect(mockConsole.expected('handled', 1)).toBeTruthy();
        expect(mockConsole.expected('unhandled', 1)).toBeTruthy();
        expect(mockConsole.expected('errors', 2)).toBeTruthy();

        mockConsole.restore(); // Always restore the console after each test
    );
);
```

With this implementation, if there are two errors (one expected with the text "Failed prop type:" and one unexpected without that text), the suite will pass:
- The expected error will match with both regular expressions (matches: 0 -> 2) and will be intercepted (handled: 0 -> 1, errors: 0 -> 1)
- The unexpected error will not match with any of the regular expressions and will not be intercepted (unhandled: 0 -> 1, errors: 1 -> 2)

**With the default implementation (without the second parameter), the suite will fail, indicating that there is one non-intercepted error and one redundant regular expression.**
