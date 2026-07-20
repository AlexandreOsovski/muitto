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
export declare const color: {
    /** Formats text in red (ANSI code 31) */
    red: (text: string | number) => string;
    /** Formats text in green (ANSI code 32) */
    green: (text: string | number) => string;
    /** Formats text in yellow (ANSI code 33) */
    yellow: (text: string | number) => string;
    /** Formats text in blue (ANSI code 34) */
    blue: (text: string | number) => string;
    /** Formats text in magenta (ANSI code 35) */
    magenta: (text: string | number) => string;
    /** Formats text in cyan (ANSI code 36) */
    cyan: (text: string | number) => string;
    /** Formats text in white (ANSI code 37) */
    white: (text: string | number) => string;
    /** Formats text in gray/light (ANSI code 90) */
    gray: (text: string | number) => string;
    /** Applies bold to text (ANSI code 1) */
    bold: (text: string | number) => string;
    /** Applies dim/faint text (ANSI code 2) */
    dim: (text: string | number) => string;
    /** Applies italic to text (ANSI code 3) */
    italic: (text: string | number) => string;
    /** Applies underline to text (ANSI code 4) */
    underline: (text: string | number) => string;
    /** Inverts background and foreground colors (ANSI code 7) */
    inverse: (text: string | number) => string;
    /** Applies red background (ANSI code 41) */
    bgRed: (text: string | number) => string;
    /** Applies green background (ANSI code 42) */
    bgGreen: (text: string | number) => string;
    /** Applies yellow background (ANSI code 43) */
    bgYellow: (text: string | number) => string;
    /** Applies blue background (ANSI code 44) */
    bgBlue: (text: string | number) => string;
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
export declare const symbols: {
    /** Success symbol in green (✓) */
    pass: string;
    /** Failure symbol in red (✗) */
    fail: string;
    /** Skipped symbol in yellow (○) */
    skip: string;
    /** Bullet symbol in gray (•) */
    bullet: string;
    /** Arrow symbol in gray (→) */
    arrow: string;
    /** Warning symbol in yellow (⚠) */
    warning: string;
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
export declare const divider: {
    /** Thin divider line (─) in gray */
    light: string;
    /** Thick divider line (━) in gray */
    heavy: string;
};
//# sourceMappingURL=colors.d.ts.map