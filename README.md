Railroad-diagram Generator
==========================

This is a reworking of Tab Atkins
<a
href="https://github.com/tabatkins/railroad-diagrams/blob/gh-pages/images/rr-title.svg">Railroad
Diagram Generator</a>.

I rewrote it in TypeScript, and reworked the structure to separate the
building of the diagram from the SVG creation.

I stopped after I got sequences, choices, oneOrMore, zeroOrMore,
terminal, nonterminal, and comments working, because that is what I
needed for the work I was doing.


Use
===

Install:

    npm install https://github.com/pragdave/railroad-diagrams

Import

    import * as RR from "railroad-diagrams"


Or... Just clone the repo and

    import * as RR from "«path»/src/railroad-diagrams.ts"


Example
=======

...
