"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function defaultSerializer(inToken) {
    let outToken;
    if (inToken === '$') {
        outToken = '$$';
    }
    else {
        outToken = inToken;
    }
    return (key, message) => {
        // Replace single dollar signs with double dollar signs
        // Four dollar signs are in the replacement due to regex escaping
        const newKey = key.replace(new RegExp(`\\${inToken}`, 'g'), `${outToken}${outToken}`);
        // Add single $ as separator, don't modify message
        return `${newKey}${inToken}${message}`;
    };
}
exports.defaultSerializer = defaultSerializer;
// Replace double inTokens with single outTokens
// Two dollar signs are in the replacement due to regex escaping
function defaultDeserializer(inToken) {
    let outToken;
    if (inToken === '$') {
        outToken = '$$';
    }
    else {
        outToken = inToken;
    }
    return (value) => {
        let i;
        for (i = 0; i < value.length; i++) {
            const c = value[i];
            if (c === inToken) {
                // Separator detected
                if (i === value.length - 1) {
                    break;
                }
                else if (value[i + 1] !== inToken) {
                    break;
                }
                else {
                    i++;
                }
            }
        }
        let key;
        let message;
        if (i === value.length) {
            key = value;
            message = '';
        }
        else {
            key = value.substring(0, i);
            message = value.substring(i + 1);
        }
        const newKey = key.replace(new RegExp(`\\${inToken}\\${inToken}`, 'g'), outToken);
        return [true, newKey, message];
    };
}
exports.defaultDeserializer = defaultDeserializer;
