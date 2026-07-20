import { color } from "../colors.js";
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
export class HelpSystem {
    /** List of options registered in the help system */
    options = [];
    /** Tool name displayed in the header */
    name = "muitto";
    /** Tool description */
    description = "A minimalist test runner for TypeScript";
    /** Current tool version */
    version = "1.0.0";
    /** Usage string displayed in the instructions section */
    usage = "muitto [options] [files...]";
    /**
     * Adds a single option to the help system
     *
     * @param {CliOption} option - Option to be added
     * @returns {this} Returns the instance itself for method chaining
     *
     * @example
     * help.addOption({ flag: '--watch', alias: '-w', description: 'Watch mode' });
     */
    addOption(option) {
        this.options.push(option);
        return this;
    }
    /**
     * Adds multiple options to the help system at once
     *
     * @param {CliOption[]} options - Array of options to be added
     * @returns {this} Returns the instance itself for method chaining
     *
     * @example
     * help.addOptions([option1, option2, option3]);
     */
    addOptions(options) {
        this.options.push(...options);
        return this;
    }
    /**
     * Sets the tool name
     *
     * @param {string} name - Name to be displayed in the header
     * @returns {this} Returns the instance itself for method chaining
     */
    setName(name) {
        this.name = name;
        return this;
    }
    /**
     * Sets the tool description
     *
     * @param {string} description - Descriptive text of the tool
     * @returns {this} Returns the instance itself for method chaining
     */
    setDescription(description) {
        this.description = description;
        return this;
    }
    /**
     * Sets the tool version
     *
     * @param {string} version - Version number (e.g.: "1.0.0")
     * @returns {this} Returns the instance itself for method chaining
     */
    setVersion(version) {
        this.version = version;
        return this;
    }
    /**
     * Sets the tool usage string
     *
     * @param {string} usage - Usage string (e.g.: "muitto [options] [files...]")
     * @returns {this} Returns the instance itself for method chaining
     */
    setUsage(usage) {
        this.usage = usage;
        return this;
    }
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
     * // MUITTO v1.0.0
     * // A minimalist test runner for TypeScript
     * //
     * // Usage:
     * //   muitto [options] [files...]
     * // ...
     */
    render() {
        const lines = [];
        // Header
        lines.push(color.bold(color.cyan(`${this.name.toUpperCase()} v${this.version}`)));
        lines.push(color.dim(this.description));
        lines.push("");
        // Usage
        lines.push(color.bold("Usage:"));
        lines.push(`  ${this.usage}`);
        lines.push("");
        // Options
        lines.push(color.bold("Options:"));
        /** Calculates the maximum length of flags for alignment */
        const maxFlagLen = Math.max(...this.options.map((opt) => {
            const flags = [opt.flag];
            if (opt.alias)
                flags.push(opt.alias);
            if (opt.value)
                flags.push(`<${opt.value}>`);
            return flags.join(", ").length;
        }));
        // Renders each option with alignment
        for (const option of this.options) {
            const flags = [option.flag];
            if (option.alias)
                flags.push(option.alias);
            if (option.value)
                flags.push(`<${option.value}>`);
            const flagStr = flags.join(", ");
            const padding = " ".repeat(maxFlagLen - flagStr.length + 4);
            let line = `  ${color.cyan(flagStr)}${padding}${option.description}`;
            // Adds default value if it exists
            if (option.defaultValue) {
                line += color.dim(` (default: ${option.defaultValue})`);
            }
            lines.push(line);
        }
        lines.push("");
        // Examples
        lines.push(color.bold("Examples:"));
        lines.push(color.dim("  muitto"));
        lines.push(color.dim("  muitto --watch"));
        lines.push(color.dim('  muitto --grep "auth"'));
        lines.push(color.dim("  muitto --reporter verbose"));
        lines.push(color.dim("  muitto --reporter junit --output ./junit.xml"));
        lines.push(color.dim("  muitto ./tests --coverage"));
        lines.push("");
        // Footer
        lines.push(color.dim(`For more information, visit: https://github.com/alexandreosovski/muitto`));
        lines.push("");
        return lines.join("\n");
    }
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
    getRegisteredOptions() {
        return [...this.options];
    }
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
export const predefinedOptions = [
    {
        flag: "--watch",
        alias: "-w",
        description: "Run tests in watch mode",
    },
    {
        flag: "--coverage",
        description: "Generate coverage report",
    },
    {
        flag: "--grep",
        value: "pattern",
        description: "Run only matching tests",
    },
    {
        flag: "--reporter",
        value: "name",
        description: "Select reporter (default, verbose, dot, json, junit)",
        defaultValue: "default",
    },
    {
        flag: "--output",
        alias: "-o",
        value: "file",
        description: "Write report to file (used by json and junit reporters)",
    },
    {
        flag: "--update-snapshots",
        description: "Update snapshots",
    },
    {
        flag: "--timeout",
        alias: "-t",
        value: "ms",
        description: "Timeout per test in ms",
        defaultValue: "5000",
    },
    {
        flag: "--bail",
        description: "Stop on first failure",
    },
    {
        flag: "--pattern",
        alias: "-p",
        value: "regex",
        description: "Custom regex for test file discovery",
    },
    {
        flag: "--help",
        alias: "-h",
        description: "Show help",
    },
    {
        flag: "--version",
        alias: "-v",
        description: "Show version",
    },
];
//# sourceMappingURL=help.js.map