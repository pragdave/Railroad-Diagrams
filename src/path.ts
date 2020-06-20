import Options from "./options"
import Cursor from "./cursor"
import { svgElement } from "./svg_interface"


// this class stolen shamelessly from
// https://github.com/tabatkins/railroad-diagrams

export default class Path {
  attrs_d: string[]

  constructor(cursor: Cursor)
  constructor(x: number, y: number)
  constructor(x: any, y?: any) {
    if (x instanceof Cursor) this.attrs_d = [`M${x.x} ${x.y}`]
    else this.attrs_d = [`M${x} ${y}`]
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

  toSvg(attrs = {}) {
    return svgElement(
      "path",
      Object.assign({}, attrs, {d: this.attrs_d.join("")})
    )
  }
}