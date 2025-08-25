---
title: 'Cursed Knowledge'
tags:
  [
    'bugs',
    'code',
    'c#',
    'dates',
    'engineering',
    'java',
    'javascript',
    'learning',
    'performance',
    'php',
    'python',
    'ruby',
    'typescript',
  ]
dates:
  published: 2025-08-25
---

Cursed knowledge I have learned over time that I wish I never knew. Inspired by
[Immich's Cursed Knowledge](https://immich.app/cursed-knowledge). The knowledge
is ordered from most to least recently learned.

## > PHP variables are cursed

PHP's `$` symbol is an operator that looks up a variable by name.

```php
$foo = "hi";
$bar = "foo";

echo $$bar;
//=> hi

$a = "hi";
$b = "a";
$c = "b";
$d = "c";
$e = "d";

echo $$$$$e;
//=> hi

$$$$$e = "bye";
echo $a;
//=> bye
```

This is cursed because it's an unnecessary feature that enables writing
incomprehensible code.

Credit goes to [Stephen Downward](https://www.scd31.com) for telling me about
it!

## > GitHub Actions's `sleep` command is cursed

GitHub Actions's
[`sleep` command](https://github.com/actions/runner/blob/main/src/Misc/layoutroot/safe_sleep.sh)
is implemented as a [busy wait](https://en.wikipedia.org/wiki/Busy_waiting).

This is cursed because it can result in
[100% CPU usage](https://github.com/actions/runner/issues/2380) or even
[looping forever](https://github.com/actions/runner/issues/3792), but sleeping
is supposed to allow other tasks to run.

Credit goes to [Hao Wang](https://github.com/ms-jpq) for telling me about it!

## > CSS margin collapse is cursed

CSS margins
[collapse vertically, but not horizontally](https://www.joshwcomeau.com/css/rules-of-margin-collapse#only-vertical-margins-collapse-1).

This is cursed because it's weirdly inconsistent and makes the rules of margin
collapse even more confusing than they already are.

Credit goes to [Samuel Foster](https://fostersamuel.com) for telling me about
it!

## > C# `JsonElement`'s `TryGet` methods are cursed

[`JsonElement`](https://learn.microsoft.com/en-us/dotnet/api/system.text.json.jsonelement#methods)
has `GetByte`/`TryGetByte`, `GetDateTime`/`TryGetDateTime`,
`GetDouble`/`TryGetDouble`, etc. However, `GetBoolean` and `GetString` have no
corresponding `TryGet` methods. What gives?

You'd expect `Get` methods to throw exceptions and `TryGet` methods to
gracefully handle type mismatches, but that's only half true. For example, the
`TryGetByte` method:

1. Returns `true` for JSON numbers that fit in a
   [`Byte`](https://learn.microsoft.com/en-us/dotnet/api/system.byte)
2. Returns `false` for JSON numbers that _don't_ fit in a `Byte`
3. Throws an exception for non-number JSON values (e.g. arrays and strings)

The `TryGet` methods are only graceful _after_ confirming the
[`JsonValueKind`](https://learn.microsoft.com/en-us/dotnet/api/system.text.json.jsonvaluekind)
matches. This means that `TryGetBoolean` and `TryGetString` would behave
identically to `GetBoolean` and `GetString`, respectively, because they have
nothing to validate after the `JsonValueKind`. The methods don't exist because
they'd be pointless.

This is cursed because the `TryGet` method names promise graceful error
handling, but the methods still throw exceptions. It's a misleading API that
provides no real benefit over wrapping a `Get` method in a `try-catch`.

## > TypeScript `readonly` properties are cursed

[Marking a property as `readonly`](https://www.typescriptlang.org/docs/handbook/2/objects.html#readonly-properties)
tells TypeScript to disallow writing to it during type-checking.

However, it's a meaningless guardrail because
[TypeScript allows assigning a type with a `readonly` property to a type with a writable property](https://github.com/microsoft/TypeScript/issues/13347).

<!-- eslint-skip -->

```ts
type Person = {
  name: string
}
type ReadonlyPerson = {
  readonly name: string
}

const readonlyPerson: ReadonlyPerson = { name: `Tomer` }
// Cannot assign to 'name' because it is a read-only property.
readonlyPerson.name = `Tumor`

// Typechecks! 😱
const writablePerson: Person = readonlyPerson
writablePerson.name = `Tumor`
```

This is cursed because `readonly` gives developers a false sense of security
while being trivial to bypass, even by accident.

Luckily there's an
[open PR that adds a flag for enforcing `readonly` properties](https://github.com/microsoft/TypeScript/pull/58296).

## > Maven dependency mediation is cursed

When multiples versions of a dependency appear in the dependency tree, Maven
[chooses the version closest to the project root](https://maven.apache.org/guides/introduction/introduction-to-dependency-mechanism.html#Transitive_Dependencies);
not the highest version.

This is cursed because it leads to unpredictable dependency resolution that
silently downgrades transitive dependencies.

This behavior even caused
[a bug in the OpenAI Java SDK](https://www.stainless.com/blog/escaping-maven-dependency-hell)!

## > RuboCop is cursed

[RuboCop](https://docs.rubocop.org), a popular Ruby formatter and linter, has
auto-fixable lint rules known as
["cops"](https://docs.rubocop.org/rubocop/cops.html). Every time a cop fixes a
problem in a file,
[every other cop reruns on that file](https://github.com/rubocop/rubocop/issues/6492#issuecomment-439306272).

This is cursed because it takes
[infinite time](https://github.com/rubocop/rubocop/issues/2280) to run in the
worst case.

Credit goes to [Hao Wang](https://github.com/ms-jpq) for telling me about it!

## > JavaScript `Date`'s `setMonth` method is cursed

Calling
[`setMonth(month)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/setMonth)
[doesn't always update the date to the given `month`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/setMonth#description).
For example, if the date is August 31, then setting the month to September will
update the date to October 1. September only has 30 days, so the 31st day
"overflows" to the next month.

This is cursed because it violates the fundamental expectation that calling a
setter method with a value actually sets that value.

This behavior even caused [a bug in Google Docs](/the-29-days-per-year-bug)!

## > Python default parameter values are cursed

A function's
[default parameter values are evaluated _once_](https://docs.python.org/3.13/reference/compound_stmts.html#:~:text=Default%20parameter%20values%20are%20evaluated%20from%20left%20to%20right%20when%20the%20function%20definition%20is%20executed);
not on each function call.

This means you shouldn't use mutable values for a parameter's default value:

```python
def append_fun(list=[]):
    list.append('fun')
    return list

print(append_fun())
#=> ['fun']
print(append_fun())
#=> ['fun', 'fun']
print(append_fun())
#=> ['fun', 'fun', 'fun']
```

You have to apply the default in the function body instead:

```python
def append_fun(list=None):
    if list is None:
        list = []
    list.append('fun')
    return list

print(append_fun())
#=> ['fun']
print(append_fun())
#=> ['fun']
print(append_fun())
#=> ['fun']
```

This is cursed because it creates invisible shared state between function calls,
turning what appears to be a pure function into something stateful.

## > Java `URL`'s identity methods are cursed

A call to
[`equals`](https://docs.oracle.com/javase/8/docs/api/java/net/URL.html#equals-java.lang.Object-)
or
[`hashCode`](https://docs.oracle.com/javase/8/docs/api/java/net/URL.html#hashCode--)
may perform a blocking DNS lookup so that two URLs corresponding to the same IP
address are considered equal.

This also means that using `URL` objects as
[`HashMap`](https://docs.oracle.com/javase/8/docs/api/java/util/HashMap.html)
keys will result in many DNS lookups.

This is cursed because identity methods are supposed to be stateless and
performant.
