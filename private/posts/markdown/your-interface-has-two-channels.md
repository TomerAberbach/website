---
title: 'Your Interface Has Two Channels'
tags:
  [
    'api',
    'bugs',
    'c',
    'c#',
    'code',
    'engineering',
    'java',
    'javascript',
    'libraries',
    'programming languages',
    'python',
    'rust',
    'typescript',
    'ux',
  ]
dates:
  published: 2026-06-11
---

This code would easily pass a cursory review:

<!-- eslint-disable stylistic/quotes -->

```ts
const response = await fetch('https://example.com/flags.json')
const flags = await response.json()
startServer(flags)
```

Then one day the endpoint returns a 500, `flags` becomes
`{ error: 'Internal Server Error' }`, no key matches a real option, and the
server silently starts with every default.

[`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch) doesn't
reject on HTTP errors. It resolves either way, and nothing in the interface
tells you to check
[`response.ok`](https://developer.mozilla.org/en-US/docs/Web/API/Response/ok).
The bug isn't that you _decided_ to skip error handling. You never realized
there was a decision.

Everyone has used an interface that threw them into the
[Pit of Despair](https://blog.codinghorror.com/falling-into-the-pit-of-success/)
like this. I've hit the bottom enough times to notice the pattern.

For each concern an interface exposes, it either forces you to confront it or
allows you to inadvertently ignore it. Ignoring a confronted concern is an
intentional decision, but ignoring an unknown one commits you to assumptions you
didn't know you made. That signaling determines how the interface fails: by
decision or by accident.

Once you see interfaces this way, many familiar design questions become the
same. Throw or return an error value? Required parameter or default? Object or
union type? Each asks how loudly the interface should signal a concern. Soon
you'll have principles for answering.

## Concern signaling

I'm borrowing the signaling terminology from
[telecommunications](<https://en.wikipedia.org/wiki/Signaling_(telecommunications)#In-band_and_out-of-band_signaling>).

In-band signaling means control information travels in the same channel as data.
Out-of-band signaling uses a separate channel for control information.

The distinction maps cleanly onto interface concerns. Every interface has the
same two channels, and each of its concerns travels on one of them: the channel
the user must confront to use the interface at all, or the channel off to the
side that they can miss.

## Error handling

Consider a function that returns a
[union](https://en.wikipedia.org/wiki/Tagged_union) of success and failure. The
caller cannot use the function without being aware of the possibility of an
error.

For example, returning Rust's
[`Result<T, E>`](https://doc.rust-lang.org/std/result/) type forces the caller
to explicitly handle the error:

```rust
fn parse_config(raw: &str) -> Result<Config, ParseError> { ... }

// Trying to use the result without unwrapping would trigger a type error.
// If the caller decides to ignore the error, then it's intentional.
let result = parse_config(raw);
match result {
    Ok(config) => start_server(config),
    Err(e) => eprintln!("{e}"),
}
```

In this case the error is _in-band_. Confronting it is inseparable from using
the interface.[^1]

Now consider a function that returns `Config` and _throws_ on failure. The
caller can use the `Config` directly because the exception requires no
acknowledgment.

For example, throwing JavaScript's
[`Error`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error#throwing_a_generic_error)
allows the caller to proceed without confronting the error:

```ts
/** @throws Error for invalid configs. */
function parseConfig(raw: string): Config {
  // ...
}

// The caller may inadvertently ignore the error if they did not read the
// function documentation and are unaware it can throw.
const config = parseConfig(raw)
startServer(config)
```

In this case the error is _out-of-band_. Confronting it requires discipline, and
a caller can slip past it without knowing it exists.

A function that throws a
[_checked_ exception](<https://en.wikipedia.org/wiki/Exception_handling_(programming)#Checked_exceptions>)
moves the error back in-band. The caller is forced to explicitly catch or
propagate the error.

For example, Java's
[`throws`](https://docs.oracle.com/javase/tutorial/essential/exceptions/declaring.html)
keyword makes error handling in-band:

```java
Config parseConfig(String raw) throws ParseException {
    // ...
}

// The caller is forced to handle the checked exception. This won't compile
// without either catching or declaring `throws ParseException`.
void start(String raw) throws ParseException {
    Config config = parseConfig(raw);
    startServer(config);
}
```

However, a concern that's more in-band than it deserves backfires because
acknowledgment becomes a reflex. Java programmers
[infamously](https://www.artima.com/articles/the-trouble-with-checked-exceptions)
silence checked exceptions using empty `catch` blocks, unchecked rethrows, or
`throws Exception` clauses.

That's worse than out-of-band. The code only _looks_ like it confronted the
concern.

Rust's success suggests Java's failure was ergonomics, not confrontation.
`Result` forces the same acknowledgment, but it's pleasant to
[handle or propagate](https://doc.rust-lang.org/book/ch09-02-recoverable-errors-with-result.html).

Checked exceptions also reveal that the channel carrying the _data_ is not the
same as the channel that carries the _concern_. A checked exception travels
outside the return value, yet the concern is in-band. The inverse mismatch
exists too: in-band data does not imply in-band concerns.

For example, C-style -1
[sentinel values](https://en.wikipedia.org/wiki/Sentinel_value) are in-band
data-wise, but out-of-band concern-wise because the user could overlook checking
for the sentinel:

```c
// `open` signals failure via a -1 return value. The caller may not check for -1
// if they're unaware it's a possible return value.
int fd = open("config.json", O_RDONLY);
// Undefined behavior if `fd == -1`.
read(fd, buf, sizeof(buf));
```

## Naming

Names can move concerns in-band or out-of-band.

For example, Java's
[`HashSet`](https://docs.oracle.com/javase/8/docs/api/java/util/HashSet.html)
has no guaranteed iteration order, but the name only describes the
implementation, not the ordering property. The iteration order can
coincidentally match insertion order for small sets, so a user could depend on
it without realizing:

```java
// May print in insertion order for small sets, tempting the user to depend on
// an ordering that is not guaranteed.
HashSet<Integer> set = new HashSet<>(List.of(3, 1, 4, 1, 5));
for (int value : set) {
    System.out.println(value);
}
```

Java's
[`TreeSet`](https://docs.oracle.com/javase/8/docs/api/java/util/TreeSet.html)
moves the ordering concern in-band. The name signals a tree structure, which
strongly implies sorted iteration, so the user can infer that ordering is part
of the contract:

```java
// The name hints at sorted order. The user is more likely to recognize that
// ordering is a deliberate property.
TreeSet<Integer> set = new TreeSet<>(List.of(3, 1, 4, 1, 5));
for (int value : set) {
    System.out.println(value);
}
```

## Union types

[Unions](https://en.wikipedia.org/wiki/Tagged_union) are the usual tool for
[making illegal states unrepresentable](https://vimeo.com/14313378), and that
moves concerns in-band as a byproduct because each variant is a case the user
must consider.

But legality and signaling are independent. A union can move a concern in-band
even when every state is already legal.

For example, every combination of property values on JavaScript's
[`KeyboardEvent`](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent)
type is valid, yet it hides a concern:

<!-- eslint-disable @typescript-eslint/consistent-type-definitions -->

```ts
interface KeyboardEvent extends UIEvent {
  // Which primary key is pressed.
  key: string

  // Secondary modifier key flags. All value combinations are valid.
  altKey: boolean
  ctrlKey: boolean
  metaKey: boolean
  shiftKey: boolean

  // Other irrelevant properties...
}
```

The primary property users look for and access is `key` because it's a
*key*board event. They could easily forget to check for modifier keys, resulting
in logic that's unintentionally broad. The modifier concern is out-of-band. The
flags are not the event's primary data, so they don't reliably capture the
user's attention.

A more in-band presentation of the modifier concern might look like this:

<!-- eslint-disable stylistic/quotes -->

```ts
type KeyboardEvent =
  | {
      kind: 'single-key'
      key: string
    }
  | {
      kind: 'modified-key'
      primaryKey: string
      altKey: boolean
      ctrlKey: boolean
      metaKey: boolean
      shiftKey: boolean
    }
```

In TypeScript, the user cannot access any data on this type other than `kind`.
They will be forced to consider the single and modified key cases individually.
There were no illegal states to eliminate, but switching to a union still
affected signaling.[^2]

:::note

It's important that `key` and `primaryKey` do not share a name in the TypeScript
example because
[properties common to all union variants are accessible on the union itself](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#working-with-union-types).
If they were both called `key`, then the concern would move out-of-band because
the user could access `key` without noticing the other properties.

:::

## Required parameters

Required parameters can move concerns in-band by removing assumptions.

For example, Java's
[`String(byte[], Charset)` constructor](https://docs.oracle.com/javase/8/docs/api/java/lang/String.html#String-byte:A-java.nio.charset.Charset-)
has an
[optional `Charset`](https://docs.oracle.com/javase/8/docs/api/java/lang/String.html#String-byte:A-)
parameter. When omitted, the platform's default charset, usually
[UTF-8](https://en.wikipedia.org/wiki/UTF-8), is used. If a user forgets to
specify a charset, then the default may corrupt the data during decoding. The
charset concern is out-of-band:

```java
// The caller may not realize the platform default charset is being used, which
// may corrupt the data during decoding.
String text = new String(bytes);
```

On the other hand, [Guava](https://github.com/google/guava), a popular Java
library, makes it impossible to produce a
[`CharSource` from a `ByteSource` without specifying a `Charset`](<https://guava.dev/releases/19.0/api/docs/com/google/common/io/ByteSource.html#asCharSource(java.nio.charset.Charset)>):

```java
String text = ByteSource.wrap(bytes)             // `byte[]` -> `ByteSource`
                        .asCharSource(charset)   // `Charset` required here
                        .read();                 // -> `String`
```

The required parameter in `asCharSource(Charset)` moves the charset concern
in-band.

## Randomization

Randomization can move a concern in-band by preventing users from implicitly
depending on deterministic observable behavior.

For example, like `HashSet`, Java's
[`HashMap`](https://docs.oracle.com/javase/8/docs/api/java/util/HashMap.html)
has an unspecified iteration order that users can accidentally depend on.

Google engineers moved this concern in-band by
[modifying their JDK to randomize hash iteration order](https://eaftan.github.io/hash-ordering/).
Users would observe the order change between runs of their code and could not
unknowingly depend on it. Go took the same step for its maps,
[randomizing iteration order starting with Go 1](https://go.dev/doc/go1#iteration).[^3]

## UI

Concern signaling applies to UIs too.

Slack's threading is out-of-band. When a new top-level message arrives in a
channel, the UI doesn't force you to decide between sending another top-level
message and replying in a thread. The path of least resistance is to type into
the top-level text input, which is always available. The result is that users
accidentally reply at the top level all the time.

Google Chat's threading _used_ to be in-band until Google
["upgraded"](https://workspaceupdates.googleblog.com/2023/05/google-chat-upgrading-conversations-grouped-by-topic-to-inline-threading.html)
to Slack's approach. The original UI forced you to decide between clicking a
button to start a new thread and replying in an existing thread's text input.
There was no always-available top-level text input. I never saw users
accidentally start a new thread with the original design.

Google Chat's original design with grouping by conversation topic:

![Google Chat space grouped by conversation topic]($space-by-topic.png)

And its new design matching Slack's inline threading:

![Google Chat inline threaded space]($inline-threaded-space.png)

## Signaling principles

At this point you might think every concern should be in-band, but that's
infeasible. An interface has many concerns and they're not equally relevant or
consequential.

Choosing between in-band and out-of-band signaling is more art than science[^4],
but a few principles help:

- **Sensible defaults**: If a default works for the vast majority of cases, then
  the concern should likely be out-of-band.

  Examples:
  - JavaScript's
    [`Array.prototype.indexOf(searchElement, fromIndex)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/indexOf)
    function defaults to searching from the first index if `fromIndex` is
    unspecified. This is almost always what the user wants.
  - A function that auto-paginates a paginated endpoint can default to a
    sensible page size. It may not be the most performant choice for all usages,
    but the result will always be correct.

- **Safe defaults**: Concerns pertaining to data integrity, privacy, or other
  security matters must be in-band unless the default is non-destructive,
  privacy-preserving, and secure.

  Example: Python's
  [`open`](https://docs.python.org/3/library/functions.html#open) function
  defaults to read mode, which is safe because it can't destroy data.

- **Actionability**: A concern should only be in-band if the user can usually
  respond meaningfully at the point of confrontation. Forcing the concern anyway
  produces a guess or a reflex.

  Examples:
  - Database query timeouts are best tuned after observing production behavior.
    Forcing the programmer to guess upfront adds noise, not safety.
  - Android originally asked the user to approve an app's entire permission list
    at install time, when they had no context for evaluating it, so they tapped
    through reflexively.
    [Android 6.0 moved the prompts to runtime](https://developer.android.com/training/permissions/requesting),
    confronting the user at the moment the app needs each permission, when they
    can respond meaningfully.

- **Self-revealing**: If a concern only matters in cases where the user will
  naturally discover it, then it should likely be out-of-band.

  Examples:
  - HTTP clients follow redirects by default. If redirects are a problem, then
    the programmer will notice and disable them. The concern surfaces itself
    when it becomes relevant.
  - PostgreSQL's default foreign key action on deletion is `NO ACTION`, causing
    deletion of referenced rows to fail. If this behavior turns out to be wrong,
    then the programmer will notice and specify the right action.

- **Audience expectations**: The level of rigor an interface's users have
  self-selected into can justify making concerns in-band or out-of-band.

  Examples:
  - If you're using a mutex library, then you've opted into caring about
    correctness edge cases. Rust returning `Result` from
    [`mutex.lock()`](https://doc.rust-lang.org/std/sync/struct.Mutex.html#method.lock)
    to surface poisoning in-band is appropriate for that audience.
  - A high-level scripting language like Python defaulting to buffered I/O
    without requiring the user to choose a buffer size is appropriate for that
    audience. Most Python users don't care about I/O performance tuning; they
    just want to read a file.

- **Proportionality**: If an interface has many concerns, then some of them
  should likely be out-of-band to avoid overwhelming the user.

  Example:
  [`tls.createServer`](https://nodejs.org/api/tls.html#tlscreateserveroptions-secureconnectionlistener)
  accepts ~40 options, almost all optional and therefore out-of-band.

## The tradeoff

Every in-band concern taxes the user's attention. Every out-of-band concern
risks a silent bug. Designing an interface means choosing which cost to pay for
each concern.

Get it wrong in the in-band direction and users drown in ceremony. Get it wrong
in the out-of-band direction and users ship latent bugs with confidence.

Get it _right_ and users will fall into the
[Pit of Success](https://blog.codinghorror.com/falling-into-the-pit-of-success/).

[^1]:
    This is the top of Rusty Russell's hard-to-misuse scale, which grades
    interfaces in
    [positive](https://ozlabs.org/~rusty/index.cgi/tech/2008-03-30.html) and
    [negative](https://ozlabs.org/~rusty/index.cgi/tech/2008-04-01.html) halves.

[^2]:
    Though the redesign has an illegal state of its own: a `modified-key` event
    with every flag set to `false`. A union of variants, each requiring a
    different flag to be `true`, would fix that, but it's orthogonal to the
    signaling change.

[^3]:
    This shows in-band design can defend against
    [Hyrum's Law](https://www.hyrumslaw.com/) by making unspecified behavior
    impossible to silently depend on.

[^4]:
    I tried to create a decision tree and failed. It increased in complexity
    until it was incomprehensible.
