---
title: 'Publications'
tags: ['biology', 'google', 'publications', 'resume']
dates:
  published: 2022-08-16
  updated: 2024-06-05
---

I've had a few publications over the years. The publications are ordered from
most to least recent.

- [Language Agnostic Incremental Real-time Code Highlighting](https://www.tdcommons.org/dpubs_series/7077)
  · June 5, 2024

  > This disclosure describes techniques of fast, real-time highlighting of code
  > snippets with low algorithmic complexity. The techniques are suitable to
  > enable highlighting of code sections within relatively lightweight
  > environments such as general-purpose word processors. Delimited ranges of
  > characters within code are identified. Changes within delimited ranges are
  > tracked using a sparse array. The use of a sparse array enables operations
  > on the delimited range to be tracked at a low computational complexity. The
  > highlighted color of a word is the color of its delimited range. The color
  > highlighting maintains real-time synchronization with edits being made
  > simultaneously on a document by collaborating developers. The overhead to
  > define a language is kept low, such that highlighting can be provided
  > without building knowledge of the entire syntax and grammar of the language
  > into the code highlighting implementation.

- [Synthesis cost-optimal targeted mutant protein libraries](https://pubmed.ncbi.nlm.nih.gov/38669847)
  · April 18, 2024

  > Protein variant libraries produced by site-directed mutagenesis are a useful
  > tool utilized by protein engineers to explore variants with potentially
  > improved properties, such as activity and stability. These libraries are
  > commonly built by selecting residue positions and alternative beneficial
  > mutations for each position. All possible combinations are then constructed
  > and screened, by incorporating degenerate codons at mutation sites. These
  > degenerate codons often encode additional unwanted amino acids or even STOP
  > codons. Our study aims to take advantage of annealing based recombination of
  > oligonucleotides during synthesis and utilize multiple degenerate codons per
  > mutation site to produce targeted protein libraries devoid of unwanted
  > variants. Toward this goal we created an algorithm to calculate the minimum
  > number of degenerate codons necessary to specify any given amino acid set,
  > and a dynamic programming method that uses this algorithm to optimally
  > partition a DNA target sequence with degeneracies into overlapping
  > oligonucleotides, such that the total cost of synthesis of the target mutant
  > protein library is minimized. Computational experiments show that, for a
  > modest increase in DNA synthesis costs, beneficial variant yields in
  > produced mutant libraries are increased by orders of magnitude, an effect
  > particularly pronounced in large combinatorial libraries.

- [Language Agnostic Code Highlighting in Word Processors](https://www.tdcommons.org/dpubs_series/5207)
  · June 16, 2022

  > This disclosure describes techniques for highlighting code snippets included
  > in text documents edited via a word processor. A text block containing code
  > is received and analyzed using a tokenizer to identify specific words
  > included in the text block. The words are classified by the tokenizer into a
  > finite set of types (categories) by matching the words with a list of words
  > defined for different computer languages. Words or characters are colorized
  > based on whether the word is a language specific reserved keyword or a
  > user-defined identifier. Multiple coding languages can be supported, with
  > low maintenance, since only the active dictionary of reserved words needs to
  > be updated when adding a language. The techniques can support live updates,
  > highlighting code even as the user enters text. Incremental highlighting can
  > be implemented with relatively minimal additional effort by analyzing only a
  > small block of code near the altered text character(s).

  The techniques described in this defensive publication were used for
  [adding code blocks to Google Docs](/what-ive-worked-on-at-google).

- [Decodon Calculator: Degenerate Codon Set Design for Protein Variant Libraries](https://par.nsf.gov/servlets/purl/10285027)
  · August 1, 2020

  > We have designed and implemented an algorithm that, given any set of amino
  > acids, produces the minimum number of decodons necessary to code for exactly
  > this set, i.e. without coding for extraneous amino acids or STOP codons.
  > There are 15 nucleotide codes ("letters"), ranging from the completely
  > unambiguous A, C, G and T representing a single nucleotide, to the
  > completely ambiguous N representing all 4 nucleotides. There are 153 = 3,
  > 375 decodons that can be assembled from this 15-letter alphabet of ambiguous
  > codes, compared to the 43 = 64 codons that can be constructed from the
  > standard 4-letter alphabet of unambiguous nucleotides.
