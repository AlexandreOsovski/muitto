/**
 * Checks if ANSI color output is enabled
 *
 * Colors are disabled when:
 * - The NO_COLOR environment variable is set (https://no-color.org/ standard)
 * - The output is not an interactive terminal (redirected to file/pipe)
 *
 * Colors are enabled when:
 * - The output is a TTY (interactive terminal)
 * - The FORCE_COLOR variable is set (forces colors even without TTY)
 *
 * @constant {boolean}
 *
 * @example
 * // Disable colors
 * NO_COLOR=1 node test.js
 *
 * // Force colors in pipe
 * FORCE_COLOR=1 node test.js | cat
 */
const isColorEnabled = process.env.NO_COLOR === undefined &&
    (process.stdout.isTTY || process.env.FORCE_COLOR !== undefined);
/**
 * Creates a wrapper function that applies ANSI escape codes to text
 *
 * Uses closure to create specialized formatting functions,
 * each with its specific ANSI opening and closing codes.
 *
 * If colors are disabled (isColorEnabled = false),
 * returns the text without modifications.
 *
 * @param {number} open - ANSI opening code (e.g.: 31 for red)
 * @param {number} close - ANSI closing code (e.g.: 39 to reset color)
 * @returns {(text: string | number) => string} Function that applies formatting
 *
 * @example
 * const red = wrap(31, 39);
 * console.log(red('Error!')); // "\x1b[31mError!\x1b[39m"
 *
 * @example
 * const bold = wrap(1, 22);
 * console.log(bold('Title')); // "\x1b[1mTitle\x1b[22m"
 */
function wrap(open, close) {
    return (text) => {
        const s = String(text);
        // Returns plain text if colors are disabled
        if (!isColorEnabled)
            return s;
        return `\x1b[${open}m${s}\x1b[${close}m`;
    };
}
/**
 * Text formatting utilities with ANSI colors
 *
 * Provides functions to color and style text in the terminal.
 * Each function takes text and returns the text wrapped in
 * appropriate ANSI escape codes.
 *
 * Supported colors:
 * - red, green, yellow, blue, magenta, cyan, white, gray
 *
 * Supported styles:
 * - bold, dim, italic, underline, inverse
 *
 * Background colors:
 * - bgRed, bgGreen, bgYellow, bgBlue
 *
 * @constant {Object}
 *
 * @example
 * console.log(color.red('Error!'));
 * console.log(color.bold(color.green('Success!')));
 * console.log(color.bgRed(color.white('Critical!')));
 *
 * @example
 * // Disabled with NO_COLOR
 * // NO_COLOR=1 node script.js
 * console.log(color.red('Text')); // "Text" (without colors)
 */
export const color = {
    /** Formats text in red (ANSI code 31) */
    red: wrap(31, 39),
    /** Formats text in green (ANSI code 32) */
    green: wrap(32, 39),
    /** Formats text in yellow (ANSI code 33) */
    yellow: wrap(33, 39),
    /** Formats text in blue (ANSI code 34) */
    blue: wrap(34, 39),
    /** Formats text in magenta (ANSI code 35) */
    magenta: wrap(35, 39),
    /** Formats text in cyan (ANSI code 36) */
    cyan: wrap(36, 39),
    /** Formats text in white (ANSI code 37) */
    white: wrap(37, 39),
    /** Formats text in gray/light (ANSI code 90) */
    gray: wrap(90, 39),
    /** Applies bold to text (ANSI code 1) */
    bold: wrap(1, 22),
    /** Applies dim/faint text (ANSI code 2) */
    dim: wrap(2, 22),
    /** Applies italic to text (ANSI code 3) */
    italic: wrap(3, 23),
    /** Applies underline to text (ANSI code 4) */
    underline: wrap(4, 24),
    /** Inverts background and foreground colors (ANSI code 7) */
    inverse: wrap(7, 27),
    /** Applies red background (ANSI code 41) */
    bgRed: wrap(41, 49),
    /** Applies green background (ANSI code 42) */
    bgGreen: wrap(42, 49),
    /** Applies yellow background (ANSI code 43) */
    bgYellow: wrap(43, 49),
    /** Applies blue background (ANSI code 44) */
    bgBlue: wrap(44, 49),
};
/**
 * Pre-formatted symbols for use in test messages
 *
 * Each symbol already includes the appropriate color for its meaning:
 * - ✓ Green: success/passed
 * - ✗ Red: failure/error
 * - ○ Yellow: skipped
 * - • Gray: list item
 * - → Gray: arrow/transition
 * - ⚠ Yellow: warning/alert
 *
 * @constant {Object}
 *
 * @example
 * console.log(`${symbols.pass} Test passed`);
 * console.log(`${symbols.fail} Test failed`);
 * console.log(`${symbols.warning} Deprecated API`);
 */
export const symbols = {
    /** Success symbol in green (✓) */
    pass: color.green("✓"),
    /** Failure symbol in red (✗) */
    fail: color.red("✗"),
    /** Skipped symbol in yellow (○) */
    skip: color.yellow("○"),
    /** Bullet symbol in gray (•) */
    bullet: color.dim("•"),
    /** Arrow symbol in gray (→) */
    arrow: color.dim("→"),
    /** Warning symbol in yellow (⚠) */
    warning: color.yellow("⚠"),
};
/**
 * Divider lines for visual separation in the console
 *
 * Offers two divider styles:
 * - light: thin line (─) for subtle separations
 * - heavy: thick line (━) for more prominent separations
 *
 * Both with 50 characters width in dim gray.
 *
 * @constant {Object}
 *
 * @example
 * console.log(divider.light);
 * console.log('Section Title');
 * console.log(divider.heavy);
 *
 * // Output:
 * // ──────────────────────────────────────────────────
 * // Section Title
 * // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
export const divider = {
    /** Thin divider line (─) in gray */
    light: color.dim("─".repeat(50)),
    /** Thick divider line (━) in gray */
    heavy: color.dim("━".repeat(50)),
};
//# sourceMappingURL=colors.js.map