export default {
	DEBUG: false, // if true, writes some debug information into attributes
	VS: 15, // minimum vertical separation between things. For a 3px stroke, must be at least 4
	AR: 10, // radius of arcs
	DIAGRAM_CLASS: 'railroad-diagram', // class to put on the root <svg>
	INTERNAL_ALIGNMENT: 'center', // how to align items when they have extra space. left/right/center
	CHAR_WIDTH: 8.5, // width of each monospace character. play until you find the right value for your font
	COMMENT_CHAR_WIDTH: 7, // comments are in smaller text by default
}