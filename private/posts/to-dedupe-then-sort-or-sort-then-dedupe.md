---
title: 'To Dedupe Then Sort or Sort Then Dedupe?'
tags: ['code', 'data structures', 'javascript', 'performance']
dates:
  published: 2024-06-30
---

I recently came across a deceptively simple problem. I wanted to dedupe and sort
a list of integers [in-place](https://en.wikipedia.org/wiki/In-place_algorithm).

My initial instinct was to first remove duplicates and then sort using the
programming language's built in sort function. In JavaScript that would look
something like this:

```js
const removeDuplicatesThenSort = array => {
  const seen = new Set()
  let insertIndex = 0
  for (let i = 0; i < array.length; i++) {
    const value = array[i]

    // Skip integers we've already seen.
    if (seen.has(value)) {
      continue
    }
    seen.add(value)

    // Place this unique integer at the next available index.
    array[insertIndex] = value
    // Increment to place the next unique integer at the next index.
    insertIndex++
  }
  // Shrink the array down to its new length.
  array.length = insertIndex

  array.sort((a, b) => a - b)
}
```

But then I realized this is not the only option. I could sort first and _then_
remove duplicates:

```js
const sortThenRemoveDuplicates = array => {
  array.sort((a, b) => a - b)

  if (array.length === 0) {
    return
  }
  let insertIndex = 1
  for (let i = 1; i < array.length; i++) {
    // Skip sequences of duplicate integers.
    const previous = array[i - 1]
    const current = array[i]
    if (current === previous) {
      continue
    }

    // Place this unique integer at the next available index.
    array[insertIndex] = current
    // Increment to place the next unique integer at the next index.
    insertIndex++
  }
  // Shrink the array down to its new length.
  array.length = insertIndex
}
```

At first I thought this option must be more efficient than the other one because
it doesn't require tracking already seen integers in a set. But then I had
another realization: removing duplicates first could shrink the size of the
array, and that could speed up the subsequent sorting.

So which option is better?

:::note

We won't explore the possibility of removing duplicates while sorting because
that would require rewriting the programming language's built in sorting
algorithm and it's unlikely that we can match the original performance[^1].

:::

## Time and space complexity

[Complexity analysis](https://en.wikipedia.org/wiki/Computational_complexity) is
a way to reason about the amount of resources, usually time and space, an
algorithm uses as the size of its input increases. We can use it to objectively
compare our two algorithms!

Let's define some variables that describe our input array:

- $n$ is the total number of integers
- $d \leq n$ is the number of _distinct_ integers

### Dedupe then sort

Removing duplicates and then sorting takes $O(n + d\log_2{d})$ time (on average)
and $O(d)$ space because:

- We loop through all $n$ integers and perform
  [constant time](https://en.wikipedia.org/wiki/Time_complexity#Constant_time)
  work (on average) for each one. That takes $O(n)$ time.
- We add $d$ integers to a set by the end of the loop. That requires $O(d)$
  space.
- We sort the remaining deduplicated integers, which there are $d$ of. In
  general sorting takes
  [quasilinear time](https://en.wikipedia.org/wiki/Time_complexity#Quasilinear_time)
  so sorting these integers takes $O(d\log_2{d})$ time.

I used the phrase "on average" a couple of times. That's because if the set is a
[hash table](https://en.wikipedia.org/wiki/Hash_table),
[which it is in JavaScript](https://stackoverflow.com/a/33614512/5195839), then
insertion and lookup take linear time, not constant time, in the worst case.

That means that the algorithm takes $O(n^2 + d\log_2{d}) = O(n^2)$ time in the
worst case[^2].

### Sort then dedupe

Sorting then removing duplicates takes $O(n\log_2{n})$ time and $O(1)$ space
because:

- We sort the input integers, which there are $n$ of. That takes $O(n\log_2{n})$
  time.
- We loop through all $n$ integers and perform constant time work for each one.
  That takes $O(n)$ time.
- We don't allocate any space dependent on the input size. That requires only
  $O(1)$ space.

Unlike the other algorithm, the average and worst case time complexities are the
same.

## Which is better?

The average case is most informative, but it's still not immediately clear
whether $O(n + d\log_2{d})$ is more efficient than $O(n\log_2{n})$ because we
have two variables, not one. Let's explore what happens when we assume different
relationships between $n$ and $d$.

### $d$ is _significantly_ smaller than $n$

If $d$ is _significantly_ smaller than $n$, meaning there are many duplicate
integers, then the time complexity of removing duplicates and then sorting
becomes $O(n)$, which is certainly more efficient than $O(n\log_2{n})$.

There's still the matter of the $O(d)$ space complexity, but that's unlikely to
be a problem unless $d$, and consequently $n$, are very large.

### $d \approx n$

If $d$ and $n$ are _not_ significantly different, meaning there are few or no
duplicate integers, then the time complexity of both algorithms becomes
$O(n\log_2{n})$.

However, removing duplicates and then sorting also requires $O(d)$ space, which
with our assumption is approximately $O(n)$, that the other algorithm doesn't.
Plus, in practice that space also takes additional time to allocate, insert
into, and query, even if it doesn't affect the time complexity.

So in this case sorting and then removing duplicates is more efficient.

## Which is better _empirically_?

Our theoretical analysis suggests that we should sort and then remove duplicates
if we expect few duplicates. Otherwise, we should remove duplicates and then
sort. But is that empirically true? And if so, then how many duplicates does it
take for switching algorithms to be worthwhile?

[I benchmarked to find out!](https://github.com/TomerAberbach/to-dedupe-then-sort-or-sort-then-dedupe)
I ran each algorithm on a shuffled array of 100,000 integers with various
duplicate integer percentages and this was the result:

![]($efficiency-of-sorting-and-deduping.svg)

This confirms that the overhead from the set used when removing duplicates and
then sorting isn't _always_ offset by the reduced number of integers to sort
later[^3].

In the case of 100,000 integers the overhead is only offset once roughly 27% of
the integers are duplicates. I also benchmarked some other array sizes and the
boundary varies. For example, for 100 integers the boundary was around 10%. Do
your own benchmarking if you're going to depend on this!

## Conclusion

The appropriate approach depends on the expected percentage of duplicates. And
problems that seem simple... aren't.

[^1]:
    The sorting algorithms built into programming languages are meticulously
    optimized by being written low-level programming languages and using a state
    of the art algorithm like [Timsort](https://en.wikipedia.org/wiki/Timsort).

[^2]:
    $n^2$ asymptotically dominates $d\log_2{d}$ because $n \geq d$, so we can
    omit $d\log_2{d}$.

[^3]:
    You might be wondering why sorting and then removing duplicates becomes so
    much more efficient when all integers in the input array are the same (100%
    duplicates). I don't know for certain, but I would guess the JavaScript
    sorting algorithm has a linear time optimization that skips sorting when the
    values are already in order, which is the case if all the values are the
    same!
