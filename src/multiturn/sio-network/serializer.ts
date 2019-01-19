export type Serializer = (key: string, message: string) => string;
export type Deserializer = (value: string) => [boolean, string, string];

export function defaultSerializer(inToken: string,
    midToken?: string): Serializer {
  let outToken: string;
  if (inToken === '$') {
    outToken = '$$';
  }
  else{
    outToken = inToken;
  }
  if (!midToken) {
    midToken = '|';
  }
  return (key: string, message: string) => {
    // Replace single dollar signs with double dollar signs
    // Four dollar signs are in the replacement due to regex escaping
    const newKey = key.replace(new RegExp(`\\${inToken}`, 'g'),
      `${outToken}${outToken}`);
    // Add single $ as separator, don't modify message
    return `${newKey}${inToken}${midToken}${message}`;
  };
}

// Replace double inTokens with single outTokens
// Two dollar signs are in the replacement due to regex escaping
export function defaultDeserializer(inToken: string,
    midToken?: string): Deserializer {
  let outToken: string;
  if (inToken === '$') {
    outToken = '$$';
  }
  else{
    outToken = inToken;
  }
  if (!midToken) {
    midToken = '|';
  }
  return (value: string) => {
    const fail: [boolean, string, string] = [false, '', ''];
    let i;
    let found = false;
    for (i = 0; i < value.length; i++) {
      const c = value[i];
      if (c === inToken) {
        // Separator detected
        if (i === value.length - 1) {
          return fail;
        }
        else if (value[i + 1] === inToken) {
          i++;
        }
        else if (value[i + 1] === midToken) {
          found = true;
          break;
        }
        else {
          return fail;
        }
      }
    }
    if (!found) {
      return fail;
    }
    let key;
    let message;
    if (i === value.length) {
      key = value;
      message = '';
    }
    else {
      key = value.substring(0, i);
      message = value.substring(i + 2);
    }
    const newKey = key.replace(new RegExp(`\\${inToken}\\${inToken}`, 'g'),
      outToken);
    return [true, newKey, message];
  };
}
