# rawdog

> why use many token when few token do trick?

local llm tools. opinionated. zero config. fork to configure

llama.cpp on port 1234 running qwen3.5-9B Q4_K_M

## config

optional `rd.config.json` in the project root. all fields have defaults

```json
{
  "commit": {
    "types": ["feat", "fix", "build", "chore", "ci", "docs", "style", "refactor", "perf", "test", "revert"],
    "scopes": [],
    "maxLength": 96
  },
  "research": {
    "userAgent": "Mozilla/5.0 ...",
    "maxTextLength": 8000,
    "ddgUrl": "https://html.duckduckgo.com/html/",
    "googleUrl": "https://www.google.com/search"
  }
}
```

## tools

- `ask` - streaming Q&A
- `commit` - conventional commit from staged diff
- `search` - ddg search
- `research` - multi-round search + fetch + summarize
- `rewrite` - rewrite markdown files in place
- `toSchema` - description to JSON Schema
- `fromSchema` - JSON Schema + stdin to structured JSON
- `json` - toSchema then unconstrained extraction + zod validation
- `jsonStrict` - toSchema then grammar-constrained extraction

## ask

```sh
> rd ask "what is deno in one sentence"
Deno is a modern, secure JavaScript and TypeScript runtime built on V8
with native TypeScript support, ES modules, and permissions-based security.
```

accepts stdin too:

```sh
> echo "explain this error" | rd ask
```

## commit

```sh
> rd commit
chore(tools): configure deno compiler options and lint rules
Commit? [Y/n] y
[main aded6a2] chore(tools): configure deno compiler options and lint rules
 1 file changed, 12 insertions(+)
```

reads `git diff --cached`, generates a conventional commit message via structured output, asks for confirmation

## search

```sh
> rd search "deno runtime"
Deno, the next-generation JavaScript runtime
  https://deno.com/
  Deno is the open-source JavaScript runtime for the modern web.

GitHub - denoland/deno: A modern runtime for JavaScript and TypeScript.
  https://github.com/denoland/deno
  Deno is a JavaScript, TypeScript, and WebAssembly runtime with secure defaults.

Deno (software) - Wikipedia
  https://en.wikipedia.org/wiki/Deno_(software)
  Deno is a runtime for JavaScript, TypeScript, and WebAssembly based on V8 and Rust.
```

ddg html search, no api key needed

## research

```sh
> rd research "where does hello world come from"
[search 1/3] hello world programming history origin
  0. The History of Hello World - CodeInterview Blog
     https://codeinterview.io/blog/the-history-of-hello-world/
  1. "Hello, World!" program - Wikipedia
     https://en.wikipedia.org/wiki/%22Hello,_World!%22_program
  ...

--- answer ---

The phrase was popularized by Brian Kernighan in his 1972 tutorial
on the B programming language...
```

runs multiple search rounds, fetches pages, summarizes with citations. 3 iterations by default

## rewrite

```sh
> rd rewrite rules.md
parsing rules.md...
rewrote rules.md (24 rules, mode: balanced)

> rd rewrite rules.md --mode concise
parsing rules.md...
rewrote rules.md (24 rules, mode: concise)
```

rewrites markdown files in place. modes: verbose, balanced, concise

## json

four tools, pick your tradeoff

- `toSchema` - description to JSON Schema (~2s, unconstrained)
- `fromSchema` - JSON Schema + stdin to structured JSON (~3s, grammar-constrained)
- `json` - toSchema then unconstrained extraction + zod validation (~5s)
- `jsonStrict` - toSchema then grammar-constrained extraction (~5s, guaranteed valid)

`json` is the default. it runs toSchema first, then passes that schema to unconstrained extraction, then validates with zod. same order as jsonStrict but without grammar overhead. unconstrained extraction can still produce malformed JSON or miss fields, but the zod validation will tell you

`jsonStrict` runs toSchema first, then feeds that schema into grammar-constrained extraction. the output always matches the schema

### toSchema

```sh
> rd toSchema '{ name: string, age: number }'
{"type":"object","properties":{"name":{"type":"string"},"age":{"type":"number"}}}

> rd toSchema 'an object with day, time, and attendees array'
{"type":"object","properties":{"day":{"type":"string"},"time":{"type":"string"},"attendees":{"type":"array","items":{"type":"object"}}}}
```

### fromSchema

```sh
> echo "Meeting on Friday at 3pm with Alice and Bob" | rd fromSchema '{"type":"object","properties":{"day":{"type":"string"},"time":{"type":"string"},"attendees":{"type":"array","items":{"type":"string"}}}}'
{
  "day": "Friday",
  "time": "3pm",
  "attendees": [
    "Alice",
    "Bob"
  ]
}
```

### json

```sh
> echo "Meeting on Friday at 3pm with Alice and Bob" | rd json 'an object with day, time, and attendees array'
{"day":"Friday","time":"3pm","attendees":[{"name":"Alice"},{"name":"Bob"}]}
```

### jsonStrict

```sh
> echo "Meeting on Friday at 3pm with Alice and Bob" | rd jsonStrict 'an object with day, time, and attendees array'
{
  "day": "Friday",
  "time": "3pm",
  "attendees": [
    {
      "name": "Alice"
    },
    {
      "name": "Bob"
    }
  ]
}
```

no validation errors. the grammar forces the output to match the schema exactly

benchmarks on qwen3.5-9B Q4_K_M, RTX 2080, 32k context (cold, single run):

```
toSchema     ~2s   (1 unconstrained call)
fromSchema   ~3s   (1 grammar-constrained call)
json         ~5s   (2 unconstrained calls + zod)
jsonStrict   ~5s   (1 unconstrained + 1 grammar-constrained)
```

times degrade with back-to-back runs due to KV cache pressure on single-slot servers
