# rawdog

> why use many token when few token do trick?

optimized for local llm usage

you don't need a harness to do things

personal collecction of tools (opinionated)

zero config (fork to configure, i made it easy i hope)

## usage

llama.cpp on port 1234 running qwen3.5-9

## autoCommit

```sh
> rd commit
chore(tools): configure deno compiler options and lint rules
Commit? [Y/n] y
[main aded6a2] chore(tools): configure deno compiler options and lint rules
 1 file changed, 12 insertions(+)
```

## autoResearch

````sh
rd research "describe hello world and where it comes from"
[search 1/5] hello world programming history origin meaning
  0. The History of Hello World: A Brief Overview - CodeInterview Blog
     https://codeinterview.io/blog/the-history-of-hello-world-a-brief-overview/
  1. The History of 'Hello, World' - HackerRank Blog
     https://www.hackerrank.com/blog/the-history-of-hello-world/
  2. "Hello, World!" program - Wikipedia
     https://en.wikipedia.org/wiki/%22Hello,_World!%22_program
  3. Where does 'Hello world' come from? - Stack Overflow
     https://stackoverflow.com/questions/602237/where-does-hello-world-come-from
  4. Hello, World! - The History and Significance of the Iconic First Program
     https://www.techtextures.com/hello-world-the-history-and-significance-of-the-iconic-first-program/
  5. How 'Hello World' Became the Universal First Step for Programming
     https://www.howtogeek.com/hello-world-universal-first-step-for-programming/
  6. "Hello, World!": The Story of the Legendary First Step in Programming
     https://akkologlu.medium.com/hello-world-the-story-of-the-legendary-first-step-in-programming-bb06a623f7f7
  7. Hello, World: Exploring Programming's Iconic Phrase - Tuple
     https://www.tuple.nl/en/blog/hello-world-exploring-programming-s-iconic-phrase
  8. Why do we use Hello World? - the history behind it
     https://dev.to/just5moreminutes/why-hello-world-5c0g
  -> fetching: "Hello, World!" program - Wikipedia
  -> fetching: The History of Hello World: A Brief Overview - CodeInterview Blog
  -> fetching: Hello, World! - The History and Significance of the Iconic First Program

--- answer ---

The "Hello, World!" program is a simple computer program that prints the text "Hello, World!" to the console. It is traditionally used as the first example in a programming language tutorial to illustrate basic syntax, verify that a compiler or runtime is installed correctly, and serve as a sanity check for developers.\n\n**Origins and History**\n\nWhile small test programs existed early in computing, the specific tradition of using "Hello, World!" was popularized by **Brian Kernighan**. The phrase first appeared in Kernighan's 1972 book *A Tutorial Introduction to the Language B* (often referred to as *Language B*), where he used it to demonstrate external variables because the language limited character constants to four ASCII characters. Kernighan later carried the tradition into his 1978 seminal book, *The C Programming Language*, where the canonical C example was published:\n\n```c\nmain( ) {\n    printf("hello, world");\n}\n```\n\nKernighan's work was influenced by earlier examples in **BCPL** (1967) and possibly the 1974 Bell Labs memorandum *Programming in C: A Tutorial*. Outside of computing, the exact phrase was a catchphrase of New York radio disc jockey **William B. Williams** starting in the 1950s.\n\n**Purpose and Significance**\n\n1.  **Syntax Illustration:** It demonstrates the minimal code required to produce output in a new language.\n2.  **Sanity Check:** It verifies that the development environment (compiler, interpreter, libraries) is correctly installed and functional.\n3.  **Educational Benchmark:** It serves as a "rite of passage" for beginners, providing an immediate sense of accomplishment.\n4.  **Language Comparison:** The complexity of the "Hello, World!" program in different languages (e.g., one line in Python vs. multiple lines in C++) is often used to compare the ease of use and verbosity of different languages.\n\n**Variations and Adaptations**\n\n*   **Functional Languages:** Languages like Lisp, ML, and Haskell often replace "Hello, World!" with a factorial calculation to avoid side effects (I/O) in pure functional paradigms.\n*   **Embedded Systems:** On microcontrollers or devices without screens, "Hello, World!" is often replaced by blinking an LED to demonstrate timing and hardware interaction.\n*   **Graphics:** In computer graphics, rendering a triangle (the "Hello Triangle") is sometimes used instead of text.\n*   **Package Management:** The `hello` command in Debian/Ubuntu distributions provides a pre-packaged "Hello, World!" program to test package manager functionality.\n*   **Time to Hello World (TTHW):** This metric measures how long it takes to write a "Hello, World!" program in a given language, serving as an indicator of a language's approachability.\n\n**Key Figures**\n\n*   **Brian Kernighan:** Co-author of *The C Programming Language* and primary figure in popularizing the tradition.\n*   **Larry Wall:** Creator of Perl, who developed the "Howdy Neighbor" program as an early precursor.\n*   **Ira W. Cotton:** University of Hawaii professor who developed the "Aloha" program in PL/I, another early greeting example.\n\nThe tradition has evolved from simple text output in mainframes to graphical outputs, 3D rendering, and even automated generation by AI, but its core purpose as a universal introduction to programming remains unchanged."}
````
