---
title: 'The Making of Polykey'
tags: ['code', 'data structures', 'gc', 'javascript', 'performance', 'tries']
dates:
  published: 2023-06-19
---

Have you ever wanted to use [tuples](https://www.typescriptlang.org/docs/handbook/2/objects.html#tuple-types) for the keys of a [`Map`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) or the values of a [`Set`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set)? It's a [very](https://stackoverflow.com/questions/43592760/typescript-javascript-using-tuple-as-key-of-map) [common](https://stackoverflow.com/questions/21838436/map-using-tuples-or-objects) [question](https://stackoverflow.com/questions/63179867/set-of-tuples-in-javascript) because the following doesn't work:

```js
const map = new Map()
map.set([1, 2], 3)
console.log(map.get([1, 2]))
//=> undefined

const set = new Set()
set.add([1, 2])
console.log(set.has([1, 2]))
//=> false
```

The reason is because a `Map`'s keys and a `Set`'s values are compared using reference equality, as specified by the [SameValueZero algorithm](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map#key_equality), and in the code above each `[1, 2]` is a separate array:

<!-- eslint-skip -->

```js
console.log([1, 2] === [1, 2])
//=> false
```

The following would work:

```js
// A reference to a single array instance!
const tuple = [1, 2]

const map = new Map()
map.set(tuple, 3)
console.log(map.get(tuple))
//=> 3

const set = new Set()
set.add(tuple)
console.log(set.has(tuple))
//=> true
```

But that's not particularly useful because typically you're constructing tuples on the fly using values from some external source:

```js
const f = (x, y) => {
  // This will return undefined because and `[x, y]` is a new array!
  const value = map.get([x, y])

  // ...
}
```

A common solution is to [`JSON.stringify`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify) the tuples because strings are primitives and are therefore compared by value rather than by reference:

```js
const map = new Map()
map.set(JSON.stringify([1, 2]), 3)
console.log(map.get(JSON.stringify([1, 2])))
//=> 3

const set = new Set()
set.add(JSON.stringify([1, 2]))
console.log(set.has(JSON.stringify([1, 2])))
//=> true
```

But that means the tuple values must be stringifiable by `JSON.stringify`. If they're not, then you're forced to write a custom serialization function for them. Plus, sometimes you _do_ want reference equality, but per tuple value:

```js
const person1 = { name: `Tomer`, occupation: `Software Engineer` }
const person2 = { name: `Tomer`, occupation: `Software Engineer` }

const salaryApplications = new Map()
salaryApplications.set(JSON.stringify([person1, Number.MAX_VALUE]), `approved`)

// Oh no! Two different software engineers named Tomer are considered the same due to stringifying!
console.log(salaryApplications.get(JSON.stringify([person2, Number.MAX_VALUE])))
//=> approved
```

But serialization doesn't preserve reference equality.

Surely there must be a better way!

## Introducing Polykey

[`polykey`](https://github.com/TomerAberbach/polykey) is a module that returns the same key for the same sequence of values[^1]. That makes it perfect for this use case:

<!-- eslint-skip -->

```js
const person1 = { name: `Tomer`, occupation: `Software Engineer` }
const person2 = { name: `Tomer`, occupation: `Software Engineer` }

const map = new Map()
map.set(polykey([1, 2]), 3)
map.set(polykey([2, `b`, 3]), 4)
map.set(polykey([person1, Number.MAX_VALUE]), `approved`)
map.set(polykey([person2, Number.MAX_VALUE]), `totally approved`)

console.log(map.get(polykey([1, 2])))
//=> 3

console.log(map.get(polykey([2, `b`, 3])))
//=> 4

console.log(map.get(polykey([person1, Number.MAX_VALUE])))
//=> approved

console.log(map.get(polykey([person2, Number.MAX_VALUE])))
//=> totally approved

const set = new Set()
set.add(polykey([1, 2, 3, 4, 5]))
set.add(polykey([3, 3, 2, 2, 1]))

console.log(set.has(polykey([1, 2, 3, 4, 5])))
//=> true

console.log(set.has(polykey([3, 3, 2, 2, 1])))
//=> true

console.log(polykey([1, 2, 3, 4, 5]) === polykey([1, 2, 3, 4, 5]))
//=> true
```

[^1] Two sequences of values are equal if each of their values are equal using the [SameValueZero algorithm](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map#key_equality).
