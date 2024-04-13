---
title: 'Publications'
tags: ['publications', 'resume']
dates:
  published: 2022-08-16
  updated: 2024-04-12
---

I've had a few publications over the years. The publications are ordered
from most to least recent.

- [Language Agnostic Code Highlighting in Word Processors](https://www.tdcommons.org/dpubs_series/5207) · June 16, 2022

  > This disclosure describes techniques for highlighting code snippets included in text documents edited via a word processor. A text block containing code is received and analyzed using a tokenizer to identify specific words included in the text block. The words are classified by the tokenizer into a finite set of types (categories) by matching the words with a list of words defined for different computer languages. Words or characters are colorized based on whether the word is a language specific reserved keyword or a user-defined identifier. Multiple coding languages can be supported, with low maintenance, since only the active dictionary of reserved words needs to be updated when adding a language. The techniques can support live updates, highlighting code even as the user enters text. Incremental highlighting can be implemented with relatively minimal additional effort by analyzing only a small block of code near the altered text character(s).

  The techniques described in this defensive publication were used for [adding code blocks to Google Docs](/what-ive-worked-on-at-google).

- [Decodon Calculator: Degenerate Codon Set Design for Protein Variant Libraries](https://par.nsf.gov/servlets/purl/10285027) · August 1, 2020

  > We have designed and implemented an algorithm that, given any set of amino acids, produces the minimum number of decodons necessary to code for exactly this set, i.e. without coding for extraneous amino acids or STOP codons. There are 15 nucleotide codes ("letters"), ranging from the completely unambiguous A, C, G and T representing a single nucleotide, to the completely ambiguous N representing all 4 nucleotides. There are 153 = 3, 375 decodons that can be assembled from this 15-letter alphabet of ambiguous codes, compared to the 43 = 64 codons that can be constructed from the standard 4-letter alphabet of unambiguous nucleotides.
