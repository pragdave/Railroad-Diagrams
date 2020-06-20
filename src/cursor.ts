import { HasSize } from "./artist";

export default class Cursor {
	constructor(public x: number, public y: number) { }

	bumpX(delta: number) {
		return new Cursor(this.x + delta, this.y);
	}

	bumpY(delta: number) {
		return new Cursor(this.x, this.y + delta);
	}

	bumpXY(dx, dy) {
		return new Cursor(this.x + dx, this.y + dy);
	}

	bump(el: HasSize) {
		return new Cursor(this.x + el.width, this.y + el.height);
	}
}
