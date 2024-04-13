---
title: 'Checking for the Absence of a Value in JavaScript'
tags: ['code', 'javascript', 'nodejs']
dates:
  published: 2018-08-16
  updated: 2023-01-11
---

JavaScript has a lot of similar-looking ways to check for the absence of a
value:

<!-- eslint-skip -->

```js
console.log(value == null)
console.log(value === null)
console.log(value == undefined)
console.log(value === undefined)
console.log(value === undefined || value === null)
console.log(typeof value === 'undefined')
console.log(typeof value == 'undefined')
console.log(typeof value === 'undefined' || value === null)
console.log(typeof value === 'undefined' || value == null)
console.log(typeof value == 'undefined' || value == null)
console.log(typeof value == 'undefined' || value === null)
console.log(!value)
```

Which one is right?

## Absent values

JavaScript has two representations of an absent value.

### Undefined

[`undefined`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/undefined)
is a JavaScript primitive type. The
[`typeof`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof)
operator returns `'undefined'` for `undefined`:

<!-- eslint-skip -->

```js
console.log(typeof undefined)
//=> undefined
```

The value of a declared unassigned variable is `undefined`:

<!-- eslint-skip -->

```js
let x
console.log(x)
//=> undefined
```

The access of an absent object property returns `undefined`:

<!-- eslint-skip -->

```js
const object = {}
console.log(object.absentProperty)
//=> undefined
```

The return value of a function that doesn't explicitly return is `undefined`:

<!-- eslint-skip -->

```js
function f() {}
console.log(f())
//=> undefined
```

The
[`void`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/void)
operator always returns `undefined`[^1]:

<!-- eslint-skip -->

```js
console.log(void 0)
//=> undefined

console.log(void 'hello')
//=> undefined

console.log(void (3 + 2))
//=> undefined

console.log(void (/* any expression */))
//=> undefined
```

Lastly, `undefined` is not a literal! It is a property of the
[global object](https://developer.mozilla.org/en-US/docs/Glossary/Global_object),
which always exists in the global scope.

### Null

[`null`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/null)
is also a JavaScript primitive type, but `typeof` returns something unexpected
for `null`:

<!-- eslint-skip -->

```js
console.log(typeof null)
//=> object
```

Ideally `typeof null` would return `'null'`, but
[`typeof null` has returned `'object'` since JavaScript's inception](https://2ality.com/2013/10/typeof-null.html)
and it would
[break existing code if the behavior were changed now](https://web.archive.org/web/20160331031419/http://wiki.ecmascript.org:80/doku.php?id=harmony:typeof_null).

`null` does not appear as a "default" value in JavaScript in the same way that
`undefined` does. Instead, developers typically make functions return `null`
when an object can't be found or constructed. For example, in browsers
[`document.getElementById`](https://developer.mozilla.org/en-US/docs/Web/API/Document/getElementById)
returns `null` if there's no element in the document with the given ID:

<!-- eslint-skip -->

```js
console.log(document.getElementById('some-id-that-no-element-has'))
//=> null
```

Unlike `undefined`, `null` _is_ a literal. It is not a property of the global
object.

## Equality

Now that we've covered `undefined` and `null`, let's address the difference
between `==` and `===`.

### Strict

Strict equality is invoked using `===`. For two values, `a` and `b`, `a === b`
evaluates to `true` if `a` and `b` have the same type and their values are
equal. Otherwise, `a === b` evaluates to `false`:

<!-- eslint-skip -->

```js
console.log(0 === 0)
//=> true

console.log('hello!' === 'hello!')
//=> true

console.log(null === null)
//=> true

console.log(undefined === undefined)
//=> true

console.log(0 === 5)
//=> false (same types, but different values)

console.log(0 === '0')
//=> false (different types)

console.log(0 === 'hello!')
//=> false (different types)

console.log(null === undefined)
//=> false (different types)

const object = {}

console.log(object === {})
//=> false (because objects are compared by reference)

console.log(object === object)
//=> true (because the object is referentially equal to itself)
```

### Loose

Loose equality is invoked using `==` and often produces unexpected results. For
two values of the same type, `a` and `b`, `a == b` behaves like `a === b`. If
`a` and `b` have different types, then JavaScript coerces the values to the same
type and strictly equates them:

<!-- eslint-skip -->

```js
console.log(1 == 1)
//=> true

console.log(1 == '1')
//=> true (because the string was converted to a number)

console.log('1' == 1)
//=> true (because the string was converted to a number)

console.log(0 == false)
//=> true (because the boolean was converted to a number)

console.log(0 == null)
//=> false (because absent values are not considered equal to non-absent values)

console.log({} == {})
//=> false (because objects are compared by reference)

console.log(0 == undefined)
//=> false (because absent values are not considered equal to non-absent values)

console.log(null == undefined)
//=> true (because both are absent values)

console.log(undefined == null)
//=> true (because both are absent values)

console.log('hello!' == false)
//=> false

console.log('' == false)
//=> true (because the string was converted to a boolean and an empty string sort of represents false in the realm of strings I guess)

console.log([] == false)
// true (because the array was converted to a boolean and an empty array sort of represents false in the realm of arrays I guess)
```

If you're feeling confused, then you wouldn't be the only one. This
[operand conversion table](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Equality_comparisons_and_sameness#Loose_equality_using)
and
[article about "truthy" and "falsy" values](https://www.sitepoint.com/javascript-truthy-falsy)
explain loose equality more fully. For a handy reference on the behavior of `==`
and `===`, look no further than this
[JavaScript equality table](https://dorey.github.io/JavaScript-Equality-Table/unified).

## The right way to check for an absent value

Now we can check which expressions from the beginning of the post work! Let's
take a look at the first expression:

<!-- eslint-skip -->

```js
console.log(value == null)
```

- _Does it evaluate to `true` for `undefined`?_ Yes, because `undefined` and
  `null` are loosely equal.

- _Does it evaluate to `true` for `null`?_ Yes, because `null` is equal to
  itself.

- _Does it evaluate to `false` for everything else?_ Yes, because `null` is only
  loosely equal to itself and `undefined`.

`value == undefined` would also work for roughly the same reasons, but
`value == null` is safer because
[`undefined` could be shadowed](<https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/undefined#:~:text=Note%3A%20While%20you%20can%20use%20undefined%20as%20an%20identifier%20(variable%20name)%20in%20any%20scope%20other%20than%20the%20global%20scope%20(because%20undefined%20is%20not%20a%20reserved%20word)%2C%20doing%20so%20is%20a%20very%20bad%20idea%20that%20will%20make%20your%20code%20difficult%20to%20maintain%20and%20debug.>)
or reassigned in pre-ES5 JavaScript environments. This can't happen with `null`
because it is a literal.

### Undeclared variables

These methods work except for one lurking issue. If `value` is undeclared, then
our code would throw a
[`ReferenceError`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ReferenceError).

That may sound like a nonissue, but consider that some JavaScript needs to be
compatible with both the browser and Node.js, and that the two environments
differ in which global variables are declared. For example, in the browser the
global variable
[`window`](https://developer.mozilla.org/en-US/docs/Web/API/Window) is declared,
but there's no such variable in Node.js. Can we access the `window` variable
only if it exists and avoid a `ReferenceError`?

It turns out that
[the `typeof` operator returns `'undefined'` for an undeclared variable instead of throwing a `ReferenceError`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof#interaction_with_undeclared_and_uninitialized_variables).
This is convenient because `typeof undefined` also returns `'undefined'` so
`typeof value === 'undefined'` checks for both undeclared variables and
`undefined`. To check for `null` as well we can add an additional check using
[logical "or"](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Logical_OR).

<!-- eslint-skip -->

```js
console.log(typeof value === 'undefined' || value === null)
```

- _Does it evaluate to `true` when `value` is undeclared?_ Yes, because the
  `typeof` operator returns `'undefined'` for an undeclared variable.

- _Does it evaluate to `true` for `undefined`?_ Yes, because `typeof undefined`
  returns `'undefined'`.

- _Does it evaluate to `true` for `null`?_ Yes, the first condition evaluates to
  `false`, but the second condition evaluates to `true` because `null` is equal
  to itself.

- _Does it evaluate to `false` for everything else?_ Yes, the `typeof` operator
  only returns `'undefined'` for undeclared variables and `undefined`, and
  `null` is only strictly equal to itself.

This method works in every situation, but it is only preferable over
`value == null` when you don't know if `value` has been declared[^2].

### The problems with the other expressions

A few of the expressions at the beginning of the post look almost identical to
the expression we just evaluated. In fact, the following expressions are
equivalent to `typeof value === 'undefined' || value === null`:

<!-- eslint-skip -->

```js
console.log(typeof value === 'undefined' || value === null)
console.log(typeof value === 'undefined' || value == null)
console.log(typeof value == 'undefined' || value == null)
console.log(typeof value == 'undefined' || value === null)
```

So why choose the expression that uses strict equality for both conditions? I
prefer to avoid loose equality because it's confusing and in this case it's not
required for correct behavior.

Let's evaluate the rest of the expressions from the beginning of the post:

<!-- eslint-skip -->

```js
// Doesn't account for undefined
console.log(value === null)

// Doesn't account for null
console.log(value === undefined)

// Works, but is much more verbose than value == null
console.log(value === undefined || value === null)

// Doesn't account for null
console.log(typeof value === 'undefined')

// Doesn't account for null
console.log(typeof value == 'undefined')

// Erroneously evaluates to true for falsy values such as false, '', [], and 0
console.log(!value)
```

## Absent object properties

An object property can be set to an absent value, but the property itself can
also be absent:

<!-- eslint-skip -->

```js
const object1 = {}
const object2 = { property: undefined }

console.log(object1.property == null)
//=> true

console.log(object2.property == null)
//=> true
```

The result for the two objects is the same because the access of an absent
property returns `undefined`. This makes `value == null` a good solution when
checking for `null`, `undefined`, _and_ absent properties. However, specifically
checking for an absent property requires a different method.

One way is to use the
[`in`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/in)
operator:

<!-- eslint-skip -->

```js
const object1 = {}
const object2 = { property: undefined }

console.log('property' in object1)
//=> false

console.log('property' in object2)
//=> true
```

Note that the left-hand side of the `in` operator must be a `string` or
`Symbol`, not an identifier. This may seem like a good solution, but consider
the following case:

<!-- eslint-skip -->

```js
const object1 = {}
const object2 = { constructor: undefined }

console.log('constructor' in object1)
//=> true

console.log('constructor' in object2)
//=> true
```

Probably not what you expected right? The expression `'constructor' in object1`
returns `true` because the `constructor` property was inherited from the
[object's prototype chain](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/prototype).
The `in` operator considers both the specific properties of the object as well
as its inherited properties.

This a nonissue when the object has a
[`null` prototype](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object#null-prototype_objects)
because there are no inherited properties:

```js
const object = Object.create(null)
console.log(`constructor` in object)
//=> false
```

But most of the time the object doesn't have a `null` prototype or we don't know
if it does. A more robust solution is to only check the uninherited properties
using the
[`hasOwnProperty`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/hasOwnProperty)
method, which is inherited from `Object`:

<!-- eslint-skip -->

```js
const object1 = {}
const object2 = { constructor: undefined }

console.log(object1.hasOwnProperty('constructor'))
//=> false

console.log(object2.hasOwnProperty('constructor'))
//=> true
```

There are a couple of pitfalls to using the `hasOwnProperty` method:

<!-- eslint-skip -->

```js
const object1 = { hasOwnProperty: () => true }
const object2 = Object.create(null)

console.log(object1.hasOwnProperty('property'))
//=> true

console.log(object2.hasOwnProperty('property'))
//=> TypeError: object2.hasOwnProperty is not a function
```

`object1`'s `hasOwnProperty` method was shadowed by a method that always returns
`true`. `object2` was created with a `null` prototype so it does not inherit
`hasOwnProperty` from `Object`. There are two ways around these pitfalls:

- Access `Object`'s `hasOwnProperty` method directly:

  <!-- eslint-skip -->

  ```js
  const object = { hasOwnProperty: () => true }
  console.log(Object.prototype.hasOwnProperty.call(object, 'property'))
  //=> false
  ```

- Use `Object`'s _static_
  [`hasOwn`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/hasOwn)
  method:

  <!-- eslint-skip -->

  ```js
  const object = { hasOwnProperty: () => true }
  console.log(Object.hasOwn(object, 'property'))
  //=> false
  ```

  `hasOwn` was added to JavaScript to avoid `hasOwnProperty`'s pitfalls, but at
  the time of writing it is
  [relatively new](https://caniuse.com/mdn-javascript_builtins_object_hasown).

## Recap

Checking if `value` is set to an absent value:

<!-- eslint-skip -->

```js
value == null
```

Checking if `value` is undeclared or set to an absent value:

<!-- eslint-skip -->

```js
typeof value === 'undefined' || value === null
```

Checking if `'property'` in `object` is absent or set to an absent value:

<!-- eslint-skip -->

```js
object.property == null
```

Checking if `property` in `object` is absent:

<!-- eslint-skip -->

```js
!Object.prototype.hasOwnProperty.call(object, 'property')
```

Checking if `property` in `object` is absent in
[modern browsers](https://caniuse.com/mdn-javascript_builtins_object_hasown):

<!-- eslint-skip -->

```js
!Object.hasOwn(object, 'property')
```

[^1]:
    [MDN has some examples](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/void#examples)
    of when the `void` operator is useful.

[^2]:
    CoffeeScript follows the same principle when transpiling its
    [existential operator](https://coffeescript.org/#existential-operator) to
    JavaScript.
