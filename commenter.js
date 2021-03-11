/**
 * Copyright 2021 tzing
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
"use strict";

export var commenter = function (settings_) {
    /**
     * Initialize
     */
    var settings = (
        function () {
            settings = settings_ || {};

            function setDefault(field, value) {
                var get = settings[field];
                if (get === null || typeof get !== typeof value) {
                    settings[field] = value;
                }
            }

            // set default value
            setDefault("indentSize", 4);
            setDefault("tabSize", 4);
            setDefault("floatPrecision", 4);
            setDefault("alignObjectValue", true);
            setDefault("enableMultilineString", true)

            setDefault("symbolLineBreak", "<br>");
            setDefault("symbolIndent", "&nbsp;");
            setDefault("symbolComment", "  // ");
            setDefault("symbolNull", "null");
            setDefault("symbolBooleanTrue", "true");
            setDefault("symbolBooleanFalse", "false");
            setDefault("symbolQuoteString", "\"");
            setDefault("symbolQuoteMultiline", "'''");
            setDefault("symbolItemSeparate", ",");
            setDefault("symbolObjectStart", "{");
            setDefault("symbolObjectEnd", "}");
            setDefault("symbolObjectKeyQuote", "\"");
            setDefault("symbolObjectKeyValueSplit", ": ");
            setDefault("symbolArrayStart", "[");
            setDefault("symbolArrayEnd", "]");

            // build pattern
            settings.regexQuote = new RegExp(settings.symbolQuoteString, 'g');

            return settings;
        }
    )();

    /**
     * Formatting values into string by the spec
     *
     * @param {*} value raw object
     * @param {Map<*,string>} comment comments for given object
     * @return {Array<string>} formatted value
     */
    function formatValue(value, comment) {
        // check input
        let commentNested = null;
        if (isObject(comment)) {
            commentNested = obj2map(comment);
        } else if (isMap(comment)) {
            commentNested = comment;
        }

        // format input use factory
        value = (function () {
            if (Number.isInteger(value)) {
                return [value.toString()];
            } else if (typeof value === "number") {
                return [value.toFixed(settings.floatPrecision)];
            } else if (typeof value === "boolean") {
                return [value ? settings.symbolBooleanTrue : settings.symbolBooleanFalse];
            } else if (value === null || typeof value === "undefined") {
                return [settings.symbolNull];
            } else if (isArray(value)) {
                return formatArray(value, commentNested);
            } else if (isObject(value) || isMap(value)) {
                return formatObject(value, commentNested);
            } else {
                return formatString(value);
            }
        })();

        // append
        return value;
    }

    function formatString(value) {
        // escape special chars
        value = String(value)
            .replace(/&/g, '&amp;')
            .replace(/\\/g, '&bsol;&bsol;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(settings.regexQuote, '&bsol;' + settings.symbolQuoteString);

        if (!settings.enableMultilineString) {
            value = value
                .replace(/\t/g, "\\t")
                .replace(/\n/g, "\\n")
                .replace(/\r/g, "\\r");
            return [settings.symbolQuoteString + value + settings.symbolQuoteString];
        }

        let lines = value.split(/\r?\n/g);
        if (lines.length === 1) {
            return [settings.symbolQuoteString + lines[0] + settings.symbolQuoteString];
        } else {
            let output = [settings.symbolQuoteMultiline]
            for (let i = 0; i < lines.length; i++) {
                let line = lines[i];
                if (i === lines.length - 1) {
                    line += settings.symbolQuoteMultiline;
                }
                output.push(line);
            }
            return output;
        }
    }

    /**
     * @param {Array} data
     * @param {Map<*,string>} comment
     */
    function formatArray(data, comments) {
        if (data.length == 0) {
            return [settings.symbolArrayStart + settings.symbolArrayEnd];
        }

        const indent = settings.symbolIndent.repeat(settings.indentSize);
        const output = [settings.symbolArrayStart];
        for (let i = 0; i < data.length; i++) {
            let item = data[i];
            let comment = comments !== null ? (comments.get(item) || comments.get(String(item))) : undefined;

            let formatted
            if (comment !== undefined && typeof comment !== "string") {
                formatted = formatValue(item, comment)
            } else {
                formatted = formatValue(item);
            }

            for (let j = 0; j < formatted.length; j++) {
                let line = indent + formatted[j];
                if (j === formatted.length - 1) {
                    if (i !== data.length - 1) {
                        line += settings.symbolItemSeparate;
                    }
                    if (comment !== undefined && typeof comment === "string") {
                        line += settings.symbolComment + comment;
                    }
                }
                output.push(line)
            }
        }

        output.push(settings.symbolArrayEnd);
        return output
    }

    /**
     * @param {Map} data
     * @param {Map<string,string>} comments
     */
    function formatObject(data, comments) {
        // check input
        if (isObject(data)) {
            data = obj2map(data);
        }
        if (data.size == 0) {
            return [settings.symbolObjectStart + settings.symbolObjectEnd];
        }

        // calculate indent for value alignment
        let maxKeyLength = 0
        if (settings.alignObjectValue) {
            for (let key of data.keys()) {
                const formattedKey = settings.symbolObjectKeyQuote + String(key) + settings.symbolObjectKeyQuote;
                maxKeyLength = Math.max(maxKeyLength, formattedKey.length);
            }
        }

        // build string
        const output = [settings.symbolObjectStart];
        let remain = data.size;
        for (let [key, value] of data.entries()) {
            // get comment
            const comment = comments !== null ? comments.get(key) : undefined;

            // formatting
            const formattedKey = settings.symbolObjectKeyQuote + String(key) + settings.symbolObjectKeyQuote;
            let formattedValue
            if (comment !== undefined && typeof comment !== "string") {
                formattedValue = formatValue(value, comment)
            } else {
                formattedValue = formatValue(value);
            }

            // based line
            let currentLine = settings.symbolIndent.repeat(settings.indentSize);
            currentLine += formattedKey;
            currentLine += settings.symbolObjectKeyValueSplit;

            // calculate indent size
            let perItemIndentSize = settings.indentSize + settings.symbolObjectKeyValueSplit.length;
            if (settings.alignObjectValue) {
                perItemIndentSize += maxKeyLength;
            } else {
                perItemIndentSize += formattedKey.length;
            }

            // value
            // push all lines expect last one
            for (let i = 0; i < formattedValue.length; i++) {
                if (i == 0) {
                    if (settings.alignObjectValue) {
                        currentLine += settings.symbolIndent.repeat(maxKeyLength - formattedKey.length);
                    }
                    currentLine += formattedValue[i];
                } else {
                    currentLine = settings.symbolIndent.repeat(perItemIndentSize) + formattedValue[i];
                }
                if (i != formattedValue.length - 1) {
                    output.push(currentLine);
                }
            }

            // item separator
            remain--;
            if (remain) {
                currentLine += settings.symbolItemSeparate;
            }

            // comment
            if (comment !== undefined && typeof comment === "string") {
                currentLine += settings.symbolComment + comment;
            }

            output.push(currentLine);
        }

        output.push(settings.symbolObjectEnd);
        return output;
    }

    function isArray(data) {
        return data !== null && typeof data === "object" && data.constructor == Array;
    }

    function isMap(data) {
        return data !== null && typeof data === "object" && data.constructor == Map;
    }

    function isObject(data) {
        return data !== null && typeof data === "object" && data.constructor == Object;
    }

    function obj2map(data) {
        return new Map(Object.entries(data));
    }

    return {
        stringify: function (value, comment) {
            let lines = formatValue(value, comment);
            return lines.join(settings.symbolLineBreak);
        }
    }
}

export var stringify = commenter().stringify;
