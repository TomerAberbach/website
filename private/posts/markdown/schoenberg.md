---
title: 'Schoenberg: The MIDI Esoteric Programming Language'
tags: ['code', 'music', 'programming languages', 'rust']
dates:
  published: 2025-06-23
---

Schoenberg is an
[esoteric programming language](https://en.wikipedia.org/wiki/Esoteric_programming_language)
where programs are written as [MIDI](https://en.wikipedia.org/wiki/MIDI) files.
A MIDI file is basically digital sheet music that tells a computer which notes
to play when and how loudly.

The programming language interpreter, and
[transpilers](https://en.wikipedia.org/wiki/Source-to-source_compiler) between
Schoenberg and [brainfuck](https://esolangs.org/wiki/Brainfuck) programs, can be
found [on GitHub](https://github.com/TomerAberbach/schoenberg).

## Semantics

The [operational semantics](https://en.wikipedia.org/wiki/Operational_semantics)
of a Schoenberg program directly match those of a brainfuck program. Since
brainfuck is
[Turing-complete](https://en.wikipedia.org/wiki/Turing_completeness), so is
Schoenberg.

Like brainfuck, Schoenberg operates on an array of memory cells, each
initialized to zero. There is a pointer, initially pointing to the first memory
cell, and there are commands for moving the pointer, modifying the current cell,
outputting the current cell, and looping.

## Syntax

Since Schoenberg programs are MIDI files, its
[syntax](<https://en.wikipedia.org/wiki/Syntax_(programming_languages)>) is not
text-based.

Instead, commands are controlled by
[pitch class](https://en.wikipedia.org/wiki/Pitch_class) distance,
[velocity](https://en.wikipedia.org/wiki/MIDI#Messages), and overlap.
[Rhythm](https://en.wikipedia.org/wiki/Rhythm) has no effect on a program's
behavior unless it causes notes to overlap.

| Command    | Description                                                         | Syntax                                                     | `amount`                                             | Brainfuck |
| ---------- | ------------------------------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------- | --------- |
| Decrement  | Decrement the pointer cell by `amount`                              | Play a note 1 pitch class away from the current note       | $\left\lceil \frac{\text{vel} + 1}{32} \right\rceil$ | `-`       |
| Increment  | Increment the pointer cell by `amount`                              | Play a note 2 pitch classes away from the current note     | $\left\lceil \frac{\text{vel} + 1}{32} \right\rceil$ | `+`       |
| Move left  | Move the pointer left `amount` times                                | Play a note 3 pitch classes away from the current note     | $\left\lceil \frac{\text{vel} + 1}{64} \right\rceil$ | `<`       |
| Move right | Move the pointer right `amount` times                               | Play a note 4 pitch classes away from the current note     | $\left\lceil \frac{\text{vel} + 1}{64} \right\rceil$ | `>`       |
| Output     | Output the pointer cell                                             | Play a note 5 pitch classes away from the current note     | N/A                                                  | `.`       |
| Input      | Input a byte into the pointer cell                                  | Play a note 6 pitch classes away from the current note     | N/A                                                  | `,`       |
| Loop start | Jump past the matching loop end if the pointer cell is 0            | Play a note that overlaps the current note (a "loop note") | N/A                                                  | `[`       |
| Loop end   | Jump back to the matching loop start if the pointer cell is _not_ 0 | Stop playing an active loop note                           | N/A                                                  | `]`       |

Additionally:

- Playing the same note twice in a row, corresponding to a pitch class distance
  of 0, is a no-op. However, playing and overlapping two different notes with
  the same pitch class (e.g. in different octaves) can be used to start loops
  without adding other commands.
- When playing multiple notes at exactly the same time (e.g. a
  [chord](<https://en.wikipedia.org/wiki/Chord_(music)>)), the chronology of the
  notes is considered to be the ascending pitch order.

Every MIDI file is a syntactically valid Schoenberg program, although most don't
do anything useful.

## Sample programs

I wrote (composed?) `echo.mid` from scratch in
[Ableton](https://www.ableton.com) and transpiled the rest from brainfuck.

| MIDI                                                                                                                             | Description                                                                                  | Audio (synthesized using [TiMidity](https://en.wikipedia.org/wiki/TiMidity%2B%2B))                        | Source                                                            |
| -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| [`hello_world.mid`](https://github.com/TomerAberbach/schoenberg/raw/refs/heads/main/samples/hello_world.mid)                     | Prints `Hello, World!`                                                                       | :audio[https://github.com/TomerAberbach/schoenberg/raw/refs/heads/main/samples/hello_world.ogg]           | [Esolang Wiki](https://esolangs.org/wiki/Brainfuck#Hello,_World!) |
| [`cell_width.mid`](https://github.com/TomerAberbach/schoenberg/raw/refs/heads/main/samples/cell_width.mid)                       | Prints the interpreter's cell width                                                          | :audio[https://github.com/TomerAberbach/schoenberg/raw/refs/heads/main/samples/cell_width.ogg]            | [Esolang Wiki](https://esolangs.org/wiki/Brainfuck#Cell_size)     |
| [`echo.mid`](https://github.com/TomerAberbach/schoenberg/raw/refs/heads/main/samples/echo.mid)                                   | Prints the input, like [`echo`](<https://en.wikipedia.org/wiki/Echo_(command)>)              | :audio[https://github.com/TomerAberbach/schoenberg/raw/refs/heads/main/samples/echo.ogg]                  | Me                                                                |
| [`wc.mid`](https://github.com/TomerAberbach/schoenberg/raw/refs/heads/main/samples/wc.mid)                                       | Counts input lines, words, and bytes, like [`wc`](<https://en.wikipedia.org/wiki/Wc_(Unix)>) | :audio[https://github.com/TomerAberbach/schoenberg/raw/refs/heads/main/samples/wc.ogg]                    | [Daniel B. Cristofani](https://brainfuck.org)                     |
| [`fib.mid`](https://github.com/TomerAberbach/schoenberg/raw/refs/heads/main/samples/fib.mid)                                     | Prints the entire [Fibonacci sequence](https://en.wikipedia.org/wiki/Fibonacci_sequence)     | :audio[https://github.com/TomerAberbach/schoenberg/raw/refs/heads/main/samples/fib.ogg]                   | [Daniel B. Cristofani](https://brainfuck.org)                     |
| [`bubble_sort.mid`](https://github.com/TomerAberbach/schoenberg/raw/refs/heads/main/samples/bubble_sort.mid)                     | Sorts the input bytes using [bubble sort](https://en.wikipedia.org/wiki/Bubble_sort)         | :audio[https://github.com/TomerAberbach/schoenberg/raw/refs/heads/main/samples/bubble_sort.ogg]           | [Daniel B. Cristofani](https://brainfuck.org)                     |
| [`insertion_sort.mid`](https://github.com/TomerAberbach/schoenberg/raw/refs/heads/main/samples/insertion_sort.mid)               | Sorts the input bytes using [insertion sort](https://en.wikipedia.org/wiki/Insertion_sort)   | :audio[https://github.com/TomerAberbach/schoenberg/raw/refs/heads/main/samples/insertion_sort.ogg]        | [Daniel B. Cristofani](https://brainfuck.org)                     |
| [`quick_sort.mid`](https://github.com/TomerAberbach/schoenberg/raw/refs/heads/main/samples/quick_sort.mid)                       | Sorts the input bytes using [quick sort](https://en.wikipedia.org/wiki/Quicksort)            | :audio[https://github.com/TomerAberbach/schoenberg/raw/refs/heads/main/samples/quick_sort.ogg]            | [Daniel B. Cristofani](https://brainfuck.org)                     |
| [`brainfuck_interpreter.mid`](https://github.com/TomerAberbach/schoenberg/raw/refs/heads/main/samples/brainfuck_interpreter.mid) | Runs a brainfuck program on its input, which should be separated by an exclamation point     | :audio[https://github.com/TomerAberbach/schoenberg/raw/refs/heads/main/samples/brainfuck_interpreter.ogg] | [Daniel B. Cristofani](https://brainfuck.org)                     |

All the programs can be found
[on GitHub](https://github.com/TomerAberbach/schoenberg/tree/main/samples).

## FAQ

### What's with the name?

The programming language is named after
[Arnold Schoenberg](https://en.wikipedia.org/wiki/Arnold_Schoenberg)
(1874–1951), who is widely considered to be the father of
[atonal music](https://en.wikipedia.org/wiki/Atonality).

Writing [_tonal_ music](https://en.wikipedia.org/wiki/Tonality#Tonal_musics),
the basis of Western music composition, requires limiting yourself to the pitch
classes of a chosen [key](<https://en.wikipedia.org/wiki/Key_(music)>), but this
is incredibly hard to do when writing Schoenberg programs.

For example, if you want to decrement the pointer cell, then
[the next note _must_ be 1 pitch class away](#syntax). This leaves you with only
two options for the next note's pitch class, but it's possible neither of those
pitch classes is in the chosen key.

As a result, Schoenberg programs tend to be atonal.

### How did you come up with the idea?

I was inspired by [Piet](https://www.dangermouse.net/esoteric/piet.html), an
esoteric programming language where programs look like abstract paintings.

The concept of a program language where programs are written in an artistic
medium was intriguing to me, so I decided to create my own programming language
based on music composition, the artistic medium
[I have the most experience with](/?tags=tracks).

### Is it useful for anything?

Like most esoteric programming languages, Schoenberg is mostly a meme and mostly
useless.

It could be used for
[steganography](https://en.wikipedia.org/wiki/Steganography) though. For
example, you could
[create a brainfuck program that outputs some text](https://copy.sh/brainfuck/text.html)
and further conceal the message by transpiling it to a Schoenberg program.

### Is there a one-to-one mapping between brainfuck and Schoenberg programs?

No, there is a one-to-many mapping for many reasons. Here are a few:

- Schoenberg programs can be
  [transposed](<https://en.wikipedia.org/wiki/Transposition_(music)>) without
  affecting behavior.
- Schoenberg's [syntax](#syntax) allows specifying most commands in more than
  one way.
- Note length can often be changed without affecting behavior.

### Why did you write it in Rust?

Rust is pretty well-suited for writing interpreters, compilers, transpilers,
etc. because of its
["algebraic data type"](https://en.wikipedia.org/wiki/Algebraic_data_type) style
[enums](https://doc.rust-lang.org/std/keyword.enum.html). It also has a
user-friendly and performant MIDI parsing and writing library called
[`midly`](https://docs.rs/midly/latest/midly).

Plus, I've rarely used Rust and this seemed like a good opportunity to learn
more about it.

### Is there an IDE?

Any MIDI editor is a Schoenberg IDE!

I personally use [Ableton](https://www.ableton.com) because that's what I use
for non-Schoenberg music production, but
[GarageBand](https://www.apple.com/mac/garageband) and
[FL Studio](https://www.image-line.com) are also good options.
