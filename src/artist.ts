import * as RR from "./builder"
import Options from "./options"

interface HasSize {
	width: number
	height: number
}

enum Pad {
	Space,
	Line
}

export class Cursor {
	constructor(public x: number, public y: number) {}

	bumpX(delta: number) {
		return new Cursor(this.x + delta, this.y)
	}

	bumpY(delta: number) {
		return new Cursor(this.x, this.y + delta)
	}

	bumpXY(dx, dy) {
		return new Cursor(this.x + dx, this.y + dy)
	}

	bump(el: HasSize) {
		return new Cursor(this.x + el.width, this.y + el.height)
	}

}

const Padding = 20

export default class Artist {
  svg: SVGElement

  constructor(private topLevel: RR.Diagram) {}

  toSvg() {
		this.topLevel.accept(this, new Cursor(Padding, Padding)))
		return this.svg
	}

		////////////////////////////////////////////////////////////// diagram

	diagram(diagram: RR.Diagram, cursor: Cursor) {
    let width = diagram.width + 2*Padding
    let height = diagram.height + diagram.up + diagram.down + 2*Padding
    this.svg = svgElement("svg", {width, height})
    this.drawChain(diagram.children, cursor.bumpY(diagram.up))
    return cursor
	}

		////////////////////////////////////////////////////////////// choice


	choice(element: RR.Choice, cursor: Cursor) {
			let targetWidth = element.width - Options.AR*4;
			let inlineIndex = element.inlineChoice
			let kids = element.children
			let last = kids.length - 1
			let offsets = [ 0 ]
			let arc

			for (let i = 1; i < kids.length; i++) {
				offsets[i] = offsets[i-1] + kids[i-1].down + kids[i].up + Options.VS
			}

			// now normalize so that the inline element has an offset of zero
			let inlineOffset = offsets[inlineIndex]
			offsets = offsets.map(offset => offset - inlineOffset)

			// Start with the simple case, draw the element that flows along
			// the x axis

			for (let i = 0; i < kids.length; i++) {
				let tmpCursor = cursor.bumpY(offsets[i])

				if (i < inlineIndex) {
					arc = new Path(tmpCursor.bumpXY(Options.AR, Options.AR)).arc('wn')
					this.svg.appendChild(arc.toSvg())

					arc = new Path(tmpCursor.bumpX(2*Options.AR + targetWidth)).arc('ne')
					this.svg.appendChild(arc.toSvg())
				}

				if (i > inlineIndex) {
					arc = new Path(tmpCursor.bumpXY(Options.AR, -Options.AR)).arc('ws')
					this.svg.appendChild(arc.toSvg())

					arc = new Path(tmpCursor.bumpX(2*Options.AR + targetWidth)).arc('se')
					this.svg.appendChild(arc.toSvg())
				}

				this.pad(kids[i], tmpCursor.bumpX(2*Options.AR), targetWidth)
			}

			// now fill in the gaps

			// join the west and east  connectors to the lines going up, down, and across

			let endCursor = cursor.bumpX(targetWidth + 4* Options.AR)

			if (inlineIndex > 0) {
				 this.svg.appendChild(new Path(cursor).arc("se").toSvg())
				 this.svg.appendChild(new Path(endCursor).arc("sw").toSvg())
			}

			this.svg.appendChild(new Path(cursor).h(2*Options.AR).toSvg())
			this.svg.appendChild(new Path(endCursor).h(-2*Options.AR).toSvg())

			if (inlineIndex < last) {
				this.svg.appendChild(new Path(cursor).arc("ne").toSvg())
				this.svg.appendChild(new Path(endCursor).arc("nw").toSvg())
			}
			// same for the right connector


			// draw thh vertical lines from the index element up to the topmost
			let barTop: number, barLen: number, line: Path

			if (inlineIndex > 0) {
				barTop = offsets[0] + Options.AR
				barLen = offsets[inlineIndex] - Options.AR - barTop

				line = new Path(cursor.x +Options.AR, cursor.y + barTop).v(barLen)
				this.svg.appendChild(line.toSvg())

				line = new Path(cursor.x + targetWidth + 3*Options.AR, cursor.y + barTop).v(barLen)
				this.svg.appendChild(line.toSvg())
			}

			// and to the bottommost
			if (inlineIndex < last) {
				barTop = offsets[inlineIndex] + Options.AR
				barLen = offsets[offsets.length-1] - Options.AR - barTop

				line = new Path(cursor.x +Options.AR, cursor.y + barTop).v(barLen)
				this.svg.appendChild(line.toSvg())

				line = new Path(cursor.x + targetWidth + 3*Options.AR, cursor.y + barTop).v(barLen)
				this.svg.appendChild(line.toSvg())
			}

			return cursor.bump(element)
	}


	////////////////////////////////////////////////////////////// end


	end(element: RR.End, cursor: Cursor) {
		let path = new Path(cursor)
		path.add(`h${element.width} m -8 -6 v12 l 8 -6 z`)
		this.svg.appendChild(path.toSvg())
		return cursor.bump(element)
	}

	////////////////////////////////////////////////////////////// oneOrMore

	oneOrMore(element: RR.OneOrMore, cursor: Cursor) {
		let targetWidth = element.width - 2*Options.AR

		// Draw item
			this.svg.appendChild(new Path(cursor).moveRight(Options.AR).toSvg())
			this.pad(element.item, cursor.bumpX(Options.AR), targetWidth)
			this.svg.appendChild(new Path(cursor.bumpX(targetWidth + Options.AR)).moveRight(Options.AR).toSvg())

			let offset = Math.max(Options.AR*2,  element.item.height + element.item.down + Options.VS)
			let path = new Path(cursor.bumpX(Options.AR))
				.arc('nw')
				.moveDown(offset - Options.AR*2)
				.arc('ws')
				.h(targetWidth)
				.arc('se')
				.moveUp(offset - Options.AR*2 + element.rep.height - element.item.height)
				.arc('en')
			this.svg.appendChild(path.toSvg())

			if (element.rep) {
				offset += element.rep.up + element.rep.height + Options.VS/4
				this.pad(element.rep, cursor.bumpXY(Options.AR, offset), targetWidth, Pad.Space)
			}

			return cursor.bump(element);
	}

	////////////////////////////////////////////////////////////// oneOrMore
	sequence(element: RR.Sequence, cursor: Cursor) {
		return this.drawChain(element.children)
	}


	////////////////////////////////////////////////////////////// oneOrMore
	// skips draw nothing: it's up to the container to
	// add the padding, as we have a width of 0
	skip(element: RR.Skip, cursor: Cursor) {
		return cursor
	}

	////////////////////////////////////////////////////////////// oneOrMore
  start(element: RR.Start, cursor: Cursor): Cursor {
    let path = new Path(cursor.bumpY(-10))
    path.add(`m 0 4 v12 l8 -6 l -8 -6 m0 6 h${element.width}`)
    this.svg.appendChild(path.toSvg())
    if (element.label) {
      let label = svgElement(
        "text",
        {x: cursor.x, y: cursor.y - 15, style: "text-anchor:start"},
        element.label
      )
      this.svg.appendChild(label)
		}
		return cursor.bump(element)
  }


	////////////////////////////////////////////////////////////// oneOrMore
	// also does nonterminals and comments
	terminal(element: RR.Terminal, cursor: Cursor) {
		// Hook up the two sides if this is narrower than its stated width.
//			let gaps = determineGaps(width, this.width);
//			new Path(x,y).h(gaps[0]).addTo(this);
//			new Path(x+gaps[0]+this.width,y).h(gaps[1]).addTo(this);
//			x += gaps[0];

		if (element.radius >= 0) {
			let svg = svgElement(
				'rect',
				{
					x: cursor.x,
					y: cursor.y -11,
					width: element.width,
					height: element.up+element.down,
					rx: element.radius,
					ry: element.radius
				}
			)
			this.svg.appendChild(svg)
			}
			let text = svgElement(
				'text',
				{
					x: cursor.x + element.width/2,
					y: cursor.y + 4,
					class: element.constructor.name.toLowerCase()
				},
				element.text
			);
			this.svg.appendChild(text)

			return cursor.bump(element)
	}

	////////////////////////////////////////////////////////////// zeroOrMore

	zeroOrMore(element: RR.OneOrMore, cursor: Cursor) {
		let targetWidth = element.width - 2*Options.AR

		// easy part is the line connecting in to out

		let path: Path

		path = new Path(cursor).h(element.width)
		this.svg.appendChild(path.toSvg())

		let offset = Math.max(Options.AR*2,  element.item.height + element.item.up + Options.VS)
		   path = new Path(cursor.bumpX(Options.AR)).arc('nw').moveDown(offset - Options.AR*2).arc('ws')
			this.svg.appendChild(path.toSvg())
			this.pad(element.item, cursor.bumpXY(Options.AR, offset), targetWidth)
			path = new Path(cursor.bumpXY(element.width-Options.AR, offset + element.rep.height))
				 .arc('se')
				 .moveUp(offset - Options.AR*2 + element.rep.height - element.item.height).arc('en')
			this.svg.appendChild(path.toSvg())

		if (element.rep) {
			offset += element.item.down + element.rep.up + element.rep.height + Options.VS/4
			this.pad(element.rep, cursor.bumpXY(Options.AR, offset), targetWidth, Pad.Space)
		}
		// 	let offset = Math.max(Options.AR*2,  element.item.height + element.item.down + Options.VS + element.rep.up)
		//    path = new Path(cursor.bumpX(Options.AR)).arc('nw').moveDown(offset - Options.AR*2).arc('ws')
		// 	this.svg.appendChild(path.toSvg())
		// 	this.pad(element.rep, cursor.bumpXY(Options.AR, offset), targetWidth)
		// 	path = new Path(cursor.bumpXY(element.width-Options.AR, offset + element.rep.height))
		// 		 .arc('se')
		// 		 .moveUp(offset - Options.AR*2 + element.rep.height - element.item.height).arc('en')
		// 	this.svg.appendChild(path.toSvg())

			return cursor.bump(element);
	}



  // helpers

  drawChain(elements: RR.Elements, cursor: Cursor) {
    for (let element of elements) {
			cursor = this.maybeAddSpace(element, cursor)
			cursor = element.accept(this, cursor)
			cursor = this.maybeAddSpace(element, cursor)
		}
  }

	// make an element fit inside a given width by extending it with lines
	// as necessary
	pad(element: RR.Element, cursor: Cursor, targetWidth: number, padding: Pad = Pad.Line) {
		const [leftPad, rightPad ] = this.determineGaps(targetWidth, element.width)
		if (leftPad > 0) {
			if (padding == Pad.Line) {
				this.svg.appendChild(new Path(cursor).h(leftPad).toSvg())
				cursor = cursor.bumpX(leftPad)
			}
		}
		cursor = element.accept(this, cursor)
		if (rightPad > 0) {
			if (padding == Pad.Line) {
				this.svg.appendChild(new Path(cursor).h(rightPad).toSvg())
				cursor = cursor.bumpX(rightPad)
			}
		}
		return cursor
	}


  // private wrapWithSpacer(element, cb) {
  //   this.maybeAddSpace(element)

  //   cb(element)

  //   this.x += element.width
  //   this.y += element.height
  //   this.maybeAddSpace(element)
  // }

  private maybeAddSpace(element: RR.Element, cursor: Cursor) {
    if (element.needsSpace) {
      this.svg.appendChild(new Path(cursor.x, cursor.y).h(10).toSvg())
      return cursor.bumpX(10)
		}
		else {
			return cursor
		}
	}

determineGaps(outer: number, inner: number): [ number, number ] {
	var diff = outer - inner;
	switch(Options.INTERNAL_ALIGNMENT) {
		case 'left': return [0, diff];
		case 'right': return [diff, 0];
		default: return [diff/2, diff/2];
	}
}
}

function svgElement(tag: string, attrs: any, text?: string): SVGElement {
  var el = document.createElementNS("http://www.w3.org/2000/svg", tag)
  for (var attr in attrs) {
    if (attr === "xlink:href")
      el.setAttributeNS("http://www.w3.org/1999/xlink", "href", attrs[attr])
    else el.setAttribute(attr, attrs[attr])
	}
	if (text)
		el.textContent = text
  return el
}

class Path {
  attrs_d: string[]

	constructor(cursor: Cursor)
	constructor(x: number, y: number)
  constructor(x: any, y?: any) {
		if (x instanceof Cursor)
			this.attrs_d = [`M${x.x} ${x.y}`]
		else
		this.attrs_d = [`M${x} ${y}`]
  }

	add(cmds) {
		this.attrs_d.push(cmds)
	}

  m(x, y) {
    this.add(`m${x} ${y}`)
    return this
  }

  h(val) {
    this.add(`h${val}`)
    return this
  }

  moveRight(val) {
    return this.h(Math.max(0, val))
  }

  moveLeft(val) {
    return this.h(-Math.max(0, val))
  }

  v(val) {
    this.add(`v${val}`)
    return this
  }

  moveDown(val) {
    return this.v(Math.max(0, val))
  }

  moveUp(val) {
    return this.v(-Math.max(0, val))
  }

  arc(sweep) {
    // 1/4 of a circle
    var x = Options.AR
    var y = Options.AR
    if (sweep[0] == "e" || sweep[1] == "w") {
      x *= -1
    }
    if (sweep[0] == "s" || sweep[1] == "n") {
      y *= -1
    }
    var cw
    if (sweep == "ne" || sweep == "es" || sweep == "sw" || sweep == "wn") {
      cw = 1
    } else {
      cw = 0
    }
    this.add(`a${Options.AR} ${Options.AR} 0 0 ${cw} ${x} ${y}`)
    return this
  }

  arc_8(start, dir) {
    // 1/8 of a circle
    const arc = Options.AR
    const s2 = (1 / Math.sqrt(2)) * arc
    const s2inv = arc - s2
    let path =
      "a " + arc + " " + arc + " 0 0 " + (dir == "cw" ? "1" : "0") + " "
    const sd = start + dir
    const offset =
      sd == "ncw"
        ? [s2, s2inv]
        : sd == "necw"
        ? [s2inv, s2]
        : sd == "ecw"
        ? [-s2inv, s2]
        : sd == "secw"
        ? [-s2, s2inv]
        : sd == "scw"
        ? [-s2, -s2inv]
        : sd == "swcw"
        ? [-s2inv, -s2]
        : sd == "wcw"
        ? [s2inv, -s2]
        : sd == "nwcw"
        ? [s2, -s2inv]
        : sd == "nccw"
        ? [-s2, s2inv]
        : sd == "nwccw"
        ? [-s2inv, s2]
        : sd == "wccw"
        ? [s2inv, s2]
        : sd == "swccw"
        ? [s2, s2inv]
        : sd == "sccw"
        ? [s2, -s2inv]
        : sd == "seccw"
        ? [s2inv, -s2]
        : sd == "eccw"
        ? [-s2inv, -s2]
        : sd == "neccw"
        ? [-s2, -s2inv]
        : null
    path += offset.join(" ")
    this.add(path)
    return this
  }

  l(x, y) {
    this.add(`l${x} ${y}`)
    return this
  }

  toSvg() {
    return svgElement("path", {d: this.attrs_d.join("")})
  }
  // format() {
  // 	// All paths in this library start/end horizontally.
  // 	// The extra .5 ensures a minor overlap, so there's no seams in bad rasterizers.
  // 	this.attrs.d += 'h.5';
  // 	return this;
  // }
}
