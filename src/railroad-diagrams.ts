import Artist from "./artist"
import * as R from "./builder"
export { default as Options } from "./options"


// Create a new diagram (the top level unit). The children are
// either other elements or strings. Strings will be mapped to
// terminal elements.
//
// the children are rendered left to right as a sequence
//
export function diagram(...children: R.StringOrElement[]) : R.Diagram {
	return new R.Diagram(...children)
}

// Convert a diagram to an SVG node
export function toSvg(diagram: R.Diagram): SVGElement {
	return new Artist(diagram).toSvg()
}

// singleton elements:
// Terminals are drawn in boxes with rounded corners
//
// Any container method will accept a string in place of an element.
// These are automaticlly wrapped in a Terminal (except when used as a
// label for OneOrMore or ZeroOrMore, in which case the label is wrapped
// in a Comment

export function terminal(text: string, options: R.TerminalOpts = {}) : R.Strut {
	return new R.Strut(new R.Terminal(text, options))
}
export function T(text: string, options: R.TerminalOpts = {}) : R.Strut {
	return terminal(text, options)
}


// Non terminals are drawn in boxes with squared corners
export function nonterminal(text: string, options: R.TerminalOpts={}) : R.Strut {
	return new R.Strut(new R.NonTerminal(text, options))
}
export function NT(text: string, options: R.TerminalOpts={}) : R.Strut {
	return nonterminal(text, options)
}

// and comments are just text: no box is drawn
export function comment(text: string, options: R.TerminalOpts={}) : R.Strut {
	return new R.Strut(new R.Comment(text, options))
}

// Generate a start symbol (an arrow). If a start is not the first
// element passed to `diagram()`, then one will be added for you

export function start() : R.Start {
	return new R.Start()
}

// Generate an end symbol (an arrow). If an end is not the last
// element passed to `diagram()`, then one will be added for you

export function end() : R.End {
	return new R.End()
}

//Skip is an element with no content. We use it in containers when we
//need a simple straight line

export function skip() : R.Skip {
	return new R.Skip()
}

// container elements (will contain other elements as children)

// Render the children left to right

export function sequence(...children: R.StringOrElement[]) : R.Diagram {
	return new R.Sequence(...children)
}


// Create a vertical stack of the elements, connecting their inputs and
// outputs together, so that only one may be selected. The inlineChoice
// is the zero-based index of the choice that is to be rendered on the
// current left-to-right line: elements before it will be above the line
// and element after it will be below.

export function choice(inlineChoice: number, ...children: R.StringOrElement[]) {
	return new R.Choice(inlineChoice, ...children)
}

// Display an optional element. If the optional second parameter is
// "skip", the optional item will be draw below the line, otherwise the
// item will be on the line with a bypass track above it

export function optional(item: R.StringOrElement, skip?: "skip") : R.Optional {
	return new R.Optional(item, skip)
}


// Display item inline, with a loop underneath it. The optional second
// parameter is text that will be used to label the loop. If it is a
// string, it will be rendered as a comment

export function oneOrMore(item: R.StringOrElement, label?: R.StringOrElement): R.Strut {
	return new R.Strut(new R.OneOrMore(item, label))
}

// Display item below the line in  a loop underneath it. The optional second
// parameter is text that will be used to label the loop. If it is a
// string, it will be rendered as a comment

export function zeroOrMore(item: R.StringOrElement, label?: R.StringOrElement): R.Strut {
	return new R.Strut(new R.ZeroOrMore(item, label))
}
