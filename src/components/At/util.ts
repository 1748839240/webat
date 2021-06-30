export function insertAfter (node: Node): void {
  const parent = this.parentNode as Node
  if (parent.lastChild === this) {
    parent.appendChild(node);
  }
  else {
    parent.insertBefore(node, this.nextSibling);
  }
}

export function isNextSiblings(node: Node): boolean {
  const siblings = Array.from(this.parentNode.childNodes) as Array<Node>
  return siblings.indexOf(this) < siblings.indexOf(node)
}

export function isPreviousSiblings(node: Node): boolean {
  const siblings = Array.from(this.parentNode.childNodes) as Array<Node>
  return siblings.indexOf(this) > siblings.indexOf(node)
}
