import Artist from "./artist"
import * as R from "./builder"
let d = new R.Diagram(
//  new R.Choice(2, new R.Terminal("Hello"), new R.Terminal("Bye"), new R.Terminal("very long one"),
//   new R.Choice(1, new R.Terminal("Hello"), new R.Terminal("Bye"), new R.Terminal("very long one"))),
new R.OneOrMore("dave", "lots"),
new R.ZeroOrMore("dave", "lots and lots and lots"),
new R.Optional(new R.Terminal("dave"), "skip")
)
let svg = new Artist(d).toSvg()
console.dir(svg)
document.body.appendChild(svg)
