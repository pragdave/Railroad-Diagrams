import * as RR from "./builder"
import Options from "./options"
import Cursor from "./cursor"
import Path from "./path"
import { svgElement } from "./svg_interface"

export interface HasSize {
  width: number
  height: number
}

enum Pad {
  Space,
  Line,
}

export default class Artist {
  svg: SVGElement

  constructor(private topLevel: RR.Diagram) {}

  ////////////////////////////////////////////////////////////// diagram

  diagram(diagram: RR.Diagram, cursor: Cursor) {
    let width = diagram.width + 5 // stroke width...
    let height = diagram.height + diagram.up + diagram.down + 5
    this.svg = svgElement("svg", {
      class: "railroad-diagram",
      width,
      height,
      preserveAspectRatio: "xMinYMin meet",
      viewBox: `0 0 ${width} ${height}`,
    })
    this.drawChain(diagram.children, cursor.bumpY(diagram.up))
    return cursor
  }

  ////////////////////////////////////////////////////////////// toSvg

  toSvg() {
    this.topLevel.accept(this, new Cursor(5 / 2, 5 / 2))
    return this.svg
  }

  ////////////////////////////////////////////////////////////// choice

  choice(element: RR.Choice, cursor: Cursor) {
    let targetWidth = element.width - Options.AR * 4
    let inlineIndex = element.inlineChoice
    let kids = element.children
    let last = kids.length - 1
    let offsets = [0]
    let arc

    for (let i = 1; i < kids.length; i++) {
      offsets[i] = offsets[i - 1] + kids[i - 1].down + kids[i].up + Options.VS
    }

    // now normalize so that the inline element has an offset of zero
    let inlineOffset = offsets[inlineIndex]
    offsets = offsets.map(offset => offset - inlineOffset)

    for (let i = 0; i < kids.length; i++) {
      let tmpCursor = cursor.bumpY(offsets[i])

      if (i < inlineIndex) {
        arc = new Path(tmpCursor.bumpXY(Options.AR, Options.AR)).arc("wn")
        this.svg.appendChild(arc.toSvg())

        arc = new Path(tmpCursor.bumpX(2 * Options.AR + targetWidth)).arc("ne")
        this.svg.appendChild(arc.toSvg())
      }

      if (i > inlineIndex) {
        arc = new Path(tmpCursor.bumpXY(Options.AR, -Options.AR)).arc("ws")
        this.svg.appendChild(arc.toSvg())

        arc = new Path(tmpCursor.bumpX(2 * Options.AR + targetWidth)).arc("se")
        this.svg.appendChild(arc.toSvg())
      }

      this.pad(kids[i], tmpCursor.bumpX(2 * Options.AR), targetWidth)
    }

    // now fill in the gaps

    // join the west and east  connectors to the lines going up, down, and across

    let endCursor = cursor.bumpX(targetWidth + 4 * Options.AR)

    if (inlineIndex > 0) {
      this.svg.appendChild(new Path(cursor).arc("se").toSvg())
      this.svg.appendChild(new Path(endCursor).arc("sw").toSvg())
    }

    this.svg.appendChild(new Path(cursor).h(2 * Options.AR).toSvg())
    this.svg.appendChild(new Path(endCursor).h(-2 * Options.AR).toSvg())

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

      line = new Path(cursor.x + Options.AR, cursor.y + barTop).v(barLen)
      this.svg.appendChild(line.toSvg())

      line = new Path(
        cursor.x + targetWidth + 3 * Options.AR,
        cursor.y + barTop
      ).v(barLen)
      this.svg.appendChild(line.toSvg())
    }

    // and to the bottommost
    if (inlineIndex < last) {
      barTop = offsets[inlineIndex] + Options.AR
      barLen = offsets[offsets.length - 1] - Options.AR - barTop

      line = new Path(cursor.x + Options.AR, cursor.y + barTop).v(barLen)
      this.svg.appendChild(line.toSvg())

      line = new Path(
        cursor.x + targetWidth + 3 * Options.AR,
        cursor.y + barTop
      ).v(barLen)
      this.svg.appendChild(line.toSvg())
    }

    return cursor.bump(element)
  }

  ////////////////////////////////////////////////////////////// end

  end(element: RR.End, cursor: Cursor) {
    let path = new Path(cursor)
    path.add(`h${element.width} m -8 -6 v12 l 8 -6 z`)
    this.svg.appendChild(path.toSvg({class: "arrow"}))
    return cursor.bump(element)
  }

  ////////////////////////////////////////////////////////////// oneOrMore

  oneOrMore(element: RR.OneOrMore, cursor: Cursor) {
    let targetWidth = element.width - 2 * Options.AR

    // Draw item
    this.svg.appendChild(new Path(cursor).moveRight(Options.AR).toSvg())
    this.pad(element.item, cursor.bumpX(Options.AR), targetWidth)
    this.svg.appendChild(
      new Path(cursor.bumpX(targetWidth + Options.AR))
        .moveRight(Options.AR)
        .toSvg()
    )

    let offset = Math.max(
      Options.AR * 2,
      element.item.height + element.item.down + Options.VS
    )
    let path = new Path(cursor.bumpX(Options.AR))
      .arc("nw")
      .moveDown(offset - Options.AR * 2)
      .arc("ws")
      .h(targetWidth)
      .arc("se")
      .moveUp(
        offset - Options.AR * 2 + element.rep.height - element.item.height
      )
      .arc("en")
    this.svg.appendChild(path.toSvg())

    if (element.rep) {
      offset += element.rep.up + element.rep.height + Options.VS / 4
      this.pad(
        element.rep,
        cursor.bumpXY(Options.AR, offset),
        targetWidth,
        Pad.Space
      )
    }

    return cursor.bump(element)
  }

  ////////////////////////////////////////////////////////////// oneOrMore
  sequence(element: RR.Sequence, cursor: Cursor): Cursor {
    this.drawChain(element.children, cursor)
    return cursor.bump(element)
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
    path.add(`m 0 4 v12 l8 -6 l-8 -6 m0 6 h${element.width}`)
    this.svg.appendChild(path.toSvg({class: "arrow"}))
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

  ////////////////////////////////////////////////////////////// strut
  strut(element: RR.Strut, cursor: Cursor): Cursor {
    let path: Path
    path = new Path(cursor).h(element.left)
    this.svg.appendChild(path.toSvg())
    element.element.accept(this, cursor.bumpX(element.left))
    path = new Path(cursor.bumpX(element.left + element.element.width)).h(
      element.right
    )
    this.svg.appendChild(path.toSvg())

    return cursor.bump(element)
  }

  ////////////////////////////////////////////////////////////// oneOrMore
  // also does nonterminals and comments
  terminal(element: RR.Terminal, cursor: Cursor) {
    if (element.radius >= 0) {
      let svg = svgElement("rect", {
        x: cursor.x,
        y: cursor.y - element.up,
        width: element.width,
        height: element.up + element.down,
        rx: element.radius,
        ry: element.radius,
      })
      this.svg.appendChild(svg)
    }
    let text = svgElement(
      "text",
      {
        x: cursor.x + element.width / 2,
        y: cursor.y + Options.CHAR_WIDTH / 2,
        class: element.constructor.name.toLowerCase(),
      },
      element.text
    )
    this.svg.appendChild(text)

    return cursor.bump(element)
  }

  ////////////////////////////////////////////////////////////// zeroOrMore

  zeroOrMore(element: RR.OneOrMore, cursor: Cursor) {
    let targetWidth = element.width - 2 * Options.AR
    let path: Path
    let repHeight = element.rep ? element.rep.height : 0

    path = new Path(cursor).h(element.width)
    this.svg.appendChild(path.toSvg())

    let offset = Math.max(
      Options.AR * 2,
      element.item.height + element.item.up + Options.VS
    )
    path = new Path(cursor.bumpX(Options.AR))
      .arc("nw")
      .moveDown(offset - Options.AR * 2)
      .arc("ws")
    this.svg.appendChild(path.toSvg())
    this.pad(element.item, cursor.bumpXY(Options.AR, offset), targetWidth)
    path = new Path(
      cursor.bumpXY(element.width - Options.AR, offset + repHeight)
    )
      .arc("se")
      .moveUp(offset - Options.AR * 2 + repHeight - element.item.height)
      .arc("en")
    this.svg.appendChild(path.toSvg())

    if (element.rep) {
      offset += element.item.down + element.rep.up + repHeight + Options.VS / 4
      this.pad(
        element.rep,
        cursor.bumpXY(Options.AR, offset),
        targetWidth,
        Pad.Space
      )
    }

    return cursor.bump(element)
  }

	/////////////////////////////////////////////////////////////////////////
  // helpers

  drawChain(elements: RR.Elements, cursor: Cursor) {
    for (let element of elements) {
      // cursor = this.maybeAddSpace(element, cursor)
      cursor = element.accept(this, cursor)
    }
  }

  // make an element fit inside a given width by extending it with lines
  // as necessary. We also handle drawing the in and out lines
  // is the element specifies them

  pad(
    element: RR.Element,
    cursor: Cursor,
    targetWidth: number,
    padding: Pad = Pad.Line
  ) {
    const [leftPad, rightPad] = this.determineGaps(targetWidth, element.width)
    if (leftPad > 0) {
      if (padding == Pad.Line) {
        this.svg.appendChild(new Path(cursor).h(leftPad).toSvg())
      }
    }
    cursor = cursor.bumpX(leftPad)

    cursor = element.accept(this, cursor)

    if (rightPad > 0) {
      if (padding == Pad.Line) {
        this.svg.appendChild(new Path(cursor).h(rightPad).toSvg())
      }
    }
    cursor = cursor.bumpX(rightPad)
    return cursor
  }

	// given an element that's smaller than its peers, work out
	// the gaps to its left and right depending on its alignment

  determineGaps(outer: number, inner: number): [number, number] {
    var diff = outer - inner
    switch (Options.INTERNAL_ALIGNMENT) {
      case "left":
        return [0, diff]
      case "right":
        return [diff, 0]
      default:
        return [diff / 2, diff / 2]
    }
  }
}
