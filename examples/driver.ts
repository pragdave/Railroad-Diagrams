import * as rr from "../src/railroad-diagrams"

let d: any
let svg: SVGElement

// d = rr.diagram(
// rr.oneOrMore("dave", "lots"),
// rr.zeroOrMore("dave", "lots and lots and lots"),
// rr.optional("dave", "skip")
// )
// svg = rr.toSvg(d)
// console.dir(svg)
// document.body.appendChild(svg)
d = rr.diagram(
  rr.choice(
    0,
    rr.sequence(
      "enum",
      rr.NT("identifier"),
      rr.optional(rr.sequence("{", rr.NT("enumerator-list"), "}"))
    ),
    rr.sequence("enum", "{", rr.NT("enumerator-list"), "}")
  )
)

svg = rr.toSvg(d)
document.body.appendChild(svg)
