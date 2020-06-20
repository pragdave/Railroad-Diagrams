// return an SVG element with a given tag and attributes
// Right now we're running in the browser, and use the real DOM.
// To run on (say) node, we'd just need to replace this with something
// that build a simple tree of fake svg elements. These would need
// to support `appendChild()` to work with the rest of the code

export function svgElement(tag: string, attrs: any, text?: string): SVGElement {
  var el = document.createElementNS("http://www.w3.org/2000/svg", tag)
  for (var attr in attrs) {
    if (attr === "xlink:href")
      el.setAttributeNS("http://www.w3.org/1999/xlink", "href", attrs[attr])
    else el.setAttribute(attr, attrs[attr])
  }
  if (text) el.textContent = text
  return el
}