
import Options from "./options"
import Artist from "./artist"
import Cursor from "./cursor"

export interface Element {}
export interface Terminal extends Element {}

//////////////////////////////////////////////////////// Element
export abstract class Element {
  up = 0
	down = 0
	width = 0
  height = 0

	static wrap(thing: any, maker?: any) : Element {
		if (typeof thing == "string") {
			if (maker)
				return new maker("" + thing)
			else
				return new Strut(new Terminal("" + thing))
		}
		else
			return thing
	}

	abstract accept(visitor: Artist, cursor: Cursor) : Cursor
}

export type Elements = Element[]
export type StringOrElement = string | Element

//////////////////////////////////////////////////////// Container

abstract class Container extends Element {
	children: Elements

  constructor(children: StringOrElement[]) {
		super()
		function shrinkAdjacentStruts(previous: Element, next: Element): Element {
			if (previous instanceof Strut && next instanceof Strut) {
				previous.right /= 2
				next.left /= 2
			}
			return next
		}
		this.children = children.map(e => Element.wrap(e))
		// this.children.reduce(shrinkAdjacentStruts)
  }
}

export class Diagram extends Container {

	constructor(...children: StringOrElement[]) {
		super(children)
		if(!(this.children[0] instanceof Start)) {
			this.children.unshift(new Start())
		}
		if(!(this.children[this.children.length-1] instanceof End)) {
			this.children.push(new End())
		}

    for(const child of this.children) {
			this.width += child.width
			this.up = Math.max(this.up, child.up - this.height);
			this.height += child.height;
			this.down = Math.max(this.down - child.height, child.down);
		}
	}

	accept(visitor: Artist, cursor) {
		return visitor.diagram(this, cursor)
	}
}



export class Sequence extends Container {
	constructor(...children: StringOrElement[]) {
		super(children);

		for(var i = 0; i < this.children.length; i++) {
			var item = this.children[i];
			this.width += item.width
			this.up = Math.max(this.up, item.up - this.height);
			this.height += item.height;
			this.down = Math.max(this.down - item.height, item.down);
		}
	}

	accept(visitor: Artist, cursor: Cursor): Cursor {
		return visitor.sequence(this, cursor)
	}
}


// export class Stack extends Container {
// 	constructor(...children: Element[]) {
//     super(children)

// 		if( children.length === 0 ) {
// 			throw new RangeError("Stack() must have at least one child.");
// 		}
// 		this.width = Math.max.apply(null, this.children.map(function(e) { return e.width + (e.needsSpace?20:0); }));
// 		//if(this.children[0].needsSpace) this.width -= 10;
// 		//if(this.children[this.children.length-1].needsSpace) this.width -= 10;
// 		if(this.children.length > 1){
// 			this.width += Options.AR*2;
// 		}
// 		this.needsSpace = true;
// 		this.up = this.children[0].up;
// 		this.down = this.children[this.children.length-1].down;

// 		this.height = 0;
// 		var last = this.children.length - 1;
// 		for(var i = 0; i < this.children.length; i++) {
// 			var item = this.children[i];
// 			this.height += item.height;
// 			if(i > 0) {
// 				this.height += Math.max(Options.AR*2, item.up + Options.VS);
// 			}
// 			if(i < last) {
// 				this.height += Math.max(Options.AR*2, item.down + Options.VS);
// 			}
// 		}
// 	}

// }



export class Choice extends Container {

	constructor(public inlineChoice: number, ...children: StringOrElement[]) {
		super(children)

		var first = 0;
		var last = this.children.length - 1;
		this.width = Math.max.apply(null, this.children.map(function(el){return el.width})) + Options.AR*4;
		this.height = this.children[inlineChoice].height;
		this.up = this.children[first].up;
		var arcs;
		for(var i = first; i < inlineChoice; i++) {
			if(i == inlineChoice-1) arcs = Options.AR*2;
			else arcs = Options.AR;
			this.up += Math.max(arcs, this.children[i].height + this.children[i].down + Options.VS + this.children[i+1].up);
		}
		this.down = this.children[last].down;
		for(i = inlineChoice+1; i <= last; i++) {
			if(i == inlineChoice+1) arcs = Options.AR*2;
			else arcs = Options.AR;
			this.down += Math.max(arcs, this.children[i-1].height + this.children[i-1].down + Options.VS + this.children[i].up);
		}
		this.down -= this.children[inlineChoice].height; // already counted in Choice.height
	}

	accept(visitor: Artist, cursor: Cursor) {
		return visitor.choice(this, cursor)
	}
}



export class Optional extends Choice {
	constructor(item: StringOrElement, skip?: "skip") {
		if( skip === undefined )
			super(1, new Skip(), item);
		else if ( skip === "skip" )
			super(0, new Skip(), item);
		else
			throw "Unknown value for Optional()'s 'skip' argument.";
	}
}


export class OneOrMore extends Element {
  item: Element
  rep:  Element
	constructor(item: StringOrElement, rep?) {
		super();
		rep = rep || new Skip();
		this.item = Element.wrap(item);
		this.rep = Element.wrap(rep, Comment)
		this.width = Math.max(this.item.width, this.rep.width) + Options.AR*2;
		this.height = this.item.height;
		this.up = this.item.up;
		this.down = Math.max(Options.AR*2, this.item.down + Options.VS + this.rep.up + this.rep.height + this.rep.down);
//		this.needsSpace()
  }

	accept(visitor: Artist, cursor: Cursor): Cursor {
		return visitor.oneOrMore(this, cursor)
	}
}


export class ZeroOrMore extends Element {
  item: Element
  rep:  Element
	constructor(item: StringOrElement, rep?: StringOrElement) {
		super();
		this.item = Element.wrap(item);
		if (rep) {
			this.rep = Element.wrap(rep, Comment)
			this.width = Math.max(this.item.width, this.rep.width) + Options.AR*2;
			this.down = Math.max(Options.AR*2, this.item.down + Options.VS + this.rep.up + this.rep.height + this.rep.down);
		} else {
			this.rep =  undefined
			this.width = this.item.width + Options.AR*2;
			this.down = Math.max(Options.AR*2, this.item.down + Options.VS);
		}
		this.height = this.item.height;
		this.up = this.item.up;
//		this.needsSpace()
	}

	accept(visitor: Artist, cursor: Cursor) : Cursor {
		return visitor.zeroOrMore(this, cursor)
	}
}


// export class Group extends Element {
//   item:  Element
//   label: Comment
//   boxUp: number

// 	constructor(item: StringOrElement, label?: string | Comment) {
// 		super();
// 		this.item = Element.wrap(item);
// 		this.label =
// 			label instanceof Comment
// 			  ? label
// 			: label
// 			  ? new Comment(label)
// 			  : undefined

// 		this.width = Math.max(
// 			this.item.width + (this.item.needsSpace?20:0),
// 			this.label ? this.label.width : 0,
// 			Options.AR*2);
// 		this.height = this.item.height;
// 		this.boxUp = this.up = Math.max(this.item.up + Options.VS, Options.AR);
// 		if(this.label) {
// 			this.up += this.label.up + this.label.height + this.label.down;
// 		}
// 		this.down = Math.max(this.item.down + Options.VS, Options.AR);
// 		this.needsSpace = true;
// 	}

// }


export class Start extends Element {
  label: string

	constructor(label?: string) {
		super();
		this.width = 20;
		this.height = 0;
		this.up = 10;
		this.down = 10;
		if(label) {
			this.label = ""+label;
			this.width = Math.max(20, this.label.length * Options.CHAR_WIDTH + 10);
		}
	}

	accept(visitor: Artist, cursor)  {
		return visitor.start(this, cursor)
	}
}


export class End extends Element {
	constructor() {
		super();
		this.width = 20;
		this.height = 0;
		this.up = 10;
		this.down = 10;
	}

	accept(visitor: Artist, cursor) {
		return visitor.end(this, cursor)
	}
}

export interface TerminalOpts {
  href?: string
  title?: string
  cls?: string
}

abstract class TerminalBase extends Element {
  href: string
  title: string
  cls: string
  text: string

  constructor(text, {href, title, cls}: TerminalOpts = {}, public radius: number) {
		super();
		this.text = ""+text;
		this.href = href;
		this.title = title;
		this.cls = cls;
		this.width = this.text.length * Options.CHAR_WIDTH + 20;
		this.height = 0;
		this.up = Options.CHAR_WIDTH
		this.down = Options.CHAR_WIDTH
//		this.needsSpace()
	}

	accept(visitor: Artist, cursor: Cursor): Cursor {
		return visitor.terminal(this, cursor)
	}
}

export class Terminal extends TerminalBase {
  constructor(text, options: TerminalOpts = {}) {
    super(text, options, 10)
	}
}


export class NonTerminal extends TerminalBase {
	constructor(text, options: TerminalOpts) {
    super(text, options, 0)
	}
}


export class Comment extends TerminalBase {

  constructor(text, options: TerminalOpts={}) {
		super(text, options, -1)
		this.width = this.text.length * Options.COMMENT_CHAR_WIDTH + 10;
		this.up = 8;
		this.down = 8;
	}
}

export class Strut extends Element {
	constructor(public element: Element, private _left=10, private _right=_left) {
		super()
		this.height = element.height
		this.up = element.up
		this.down = element.down
		this.setWidth()
	}

	private setWidth() {
		this.width = this.element.width + this._left + this._right
	}

	get left(): number { return this._left }
	set left(v: number) {
		this._left = v
		this.setWidth()
	}

	get right(): number { return this._left }
	set right(v: number) {
		this._left = v
		this.setWidth()
	}

	accept(visitor: Artist, cursor: Cursor) : Cursor {
		return visitor.strut(this, cursor)
	}
}

export class Skip extends Element {
	constructor() {
		super();
	}

	accept(visitor: Artist, cursor: Cursor): Cursor {
		return visitor.skip(this, cursor)
	}
}