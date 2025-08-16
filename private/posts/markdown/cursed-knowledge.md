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
    'python',
  ]
dates:
  published: 2025-08-16
---

Cursed knowledge I have learned over time that I wish I never knew. Inspired by
[Immich's Cursed Knowledge](https://immich.app/cursed-knowledge). The knowledge
is ordered from most to least recently learned.

## > C# [`JsonElement`'s `TryGet` methods](https://learn.microsoft.com/en-us/dotnet/api/system.text.json.jsonelement#methods) are cursed

`JsonElement` has `GetByte`/`TryGetByte`, `GetDateTime`/`TryGetDateTime`,
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

This behavior makes the `TryGet` methods almost always useless. You're better
off wrapping the `Get` methods in a `try-catch`.

## > Maven dependency mediation is cursed

When multiples versions of a dependency appear in the dependency tree, Maven
[chooses the version closest to the project root](https://maven.apache.org/guides/introduction/introduction-to-dependency-mechanism.html#Transitive_Dependencies);
not the highest version.

This behavior caused
[a bug in the OpenAI Java SDK](https://www.stainless.com/blog/escaping-maven-dependency-hell).

## > JavaScript [`Date`'s `setMonth`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/setMonth) method is cursed

Calling `setMonth(month)`
[doesn't always update the date to the given `month`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/setMonth#description).
For example, if the date is August 31, then setting the month to September will
actually update the date to October 1. September only has 30 days, so the 31st
day "overflows" to the next month.

This behavior caused [a bug in Google Docs](/the-29-days-per-year-bug).

## > Python [default parameter values](https://docs.python.org/3.13/reference/compound_stmts.html#:~:text=Default%20parameter%20values%20are%20evaluated%20from%20left%20to%20right%20when%20the%20function%20definition%20is%20executed) are cursed

A function's default parameter values are evaluated _once_; not on each function
call.

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

## > Java [`URL`'s identity methods](https://docs.oracle.com/javase/8/docs/api/java/net/URL.html) are cursed

A call to
[`equals`](https://docs.oracle.com/javase/8/docs/api/java/net/URL.html#equals-java.lang.Object-)
or
[`hashCode`](https://docs.oracle.com/javase/8/docs/api/java/net/URL.html#hashCode--)
may perform a blocking DNS lookup so that two URLs corresponding to the same IP
address are considered equal.

This also means that using `URL` objects as
[`HashMap`](https://docs.oracle.com/javase/8/docs/api/java/util/HashMap.html)
keys will result in many DNS lookups.
