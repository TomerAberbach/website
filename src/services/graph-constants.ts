/**
 * The geometry of the graph on the page, which the widget renders with and the
 * layout plans around. Lengths are CSS pixels at the graph's full width.
 */

/** The radius of a vertex's dot. */
export const VERTEX_RADIUS = 10
export const VERTEX_SIZE = VERTEX_RADIUS * 2

/**
 * The distance from a vertex's center to the bottom of its label. The label is
 * positioned relative to the vertex's box, so it scales with the graph.
 */
export const LABEL_OFFSET = VERTEX_RADIUS * 2

/** The width post labels wrap at. */
export const INTERNAL_LABEL_WIDTH = 208

/** The horizontal padding of a label, in em. */
export const LABEL_PADDING_X_EM = 0.25

/** The graph renders at no less than this fraction of its full width. */
export const MIN_GRAPH_WIDTH_RATIO = 0.75

/**
 * The label font at its largest, which is the upper bound of the page's
 * fluid `--text-base`, and its line height and widest glyph as a fraction of
 * the font size. The stylesheet and font define these, so a browser test
 * checks that rendered labels fit the boxes estimated from them.
 */
export const LABEL_FONT_SIZE = 20
export const LABEL_LINE_HEIGHT_EM = 1.6
export const LABEL_CHAR_WIDTH_EM = 0.64
