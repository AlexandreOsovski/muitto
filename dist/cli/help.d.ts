/**
 * Interface that defines a command line option
 *
 * @interface CliOption
 */
export interface CliOption {
    /** Full flag name (e.g.: --watch) */
    flag: string;
    /** Flag shortcut (e.g.: -w) */
    alias?: string;
    /** Option description for help display */
    description: string;
    /** Name of the value expected by the option (e.g.: "pattern", "ms") */
    value?: string;
    /** Default value of the option when not specified */
    defaultValue?: string;
}
/**
 * CLI help and documentation system
 *
 * Responsible for generating and displaying formatted help messages
 * with color support, configurable options, and usage examples
 *
 * @class HelpSystem
 *
 * @example
 * const help = new HelpSystem();
 * help.addOptions(predefinedOptions);
 * console.log(help.render());
 */
export declare class HelpSystem {
    /** List of options registered in the help system */
    private options;
    /** Tool name displayed in the header */
    private name;
    /** Tool description */
    private description;
    /** Current tool version */
    private version;
    /** Usage string displayed in the instructions section */
    private usage;
    /**
     * Adds a single option to the help system
     *
     * @param {CliOption} option - Option to be added
     * @returns {this} Returns the instance itself for method chaining
     *
     * @example
     * help.addOption({ flag: '--watch', alias: '-w', description: 'Watch mode' });
     */
    addOption(option: CliOption): this;
    /**
     * Adds multiple options to the help system at once
     *
     * @param {CliOption[]} options - Array of options to be added
     * @returns {this} Returns the instance itself for method chaining
     *
     * @example
     * help.addOptions([option1, option2, option3]);
     */
    addOptions(options: CliOption[]): this;
    /**
     * Sets the tool name
     *
     * @param {string} name - Name to be displayed in the header
     * @returns {this} Returns the instance itself for method chaining
     */
    setName(name: string): this;
    /**
     * Sets the tool description
     *
     * @param {string} description - Descriptive text of the tool
     * @returns {this} Returns the instance itself for method chaining
     */
    setDescription(description: string): this;
    /**
     * Sets the tool version
     *
     * @param {string} version - Version number (e.g.: "1.0.0")
     * @returns {this} Returns the instance itself for method chaining
     */
    setVersion(version: string): this;
    /**
     * Sets the tool usage string
     *
     * @param {string} usage - Usage string (e.g.: "mutto [options] [files...]")
     * @returns {this} Returns the instance itself for method chaining
     */
    setUsage(usage: string): this;
    /**
     * Renders the complete help message with formatting and colors
     *
     * The method generates a visual representation of the help that includes:
     * - Header with name and version
     * - Tool description
     * - Usage instructions
     * - List of available options with automatic alignment
     * - Usage examples
     * - Footer with documentation link
     *
     * @returns {string} Formatted string with the complete help message
     *
     * @example
     * const helpText = helpSystem.render();
     * console.log(helpText);
     * // Output:
     * // MUTTO v1.0.0
     * // A minimalist test runner for TypeScript
     * //
     * // Usage:
     * //   mutto [options] [files...]
     * // ...
     */
    render(): string;
    /**
     * Returns a copy of the currently registered options
     *
     * Useful for inspection or validation of configured options
     * without the risk of modifying the internal state of the system
     *
     * @returns {CliOption[]} Array with all registered options
     *
     * @example
     * const options = helpSystem.getRegisteredOptions();
     * console.log(`Total options: ${options.length}`);
     */
    getRegisteredOptions(): CliOption[];
}
/**
 * Set of predefined CLI options
 *
 * Includes all flags supported by the test runner with their
 * respective descriptions, aliases, and default values
 *
 * @constant {CliOption[]}
 *
 * @example
 * // Using with HelpSystem
 * const help = new HelpSystem();
 * help.addOptions(predefinedOptions);
 */
export declare const predefinedOptions: CliOption[];
//# sourceMappingURL=help.d.ts.map