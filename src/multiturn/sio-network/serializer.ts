export type Serializer = (key: string, message: string) => string;
export type Deserializer = (value: string) => [boolean, string, string];

export function defaultSerializer(key: string, message: string): string {
  // Replace single dollar signs with double dollar signs
  // Four dollar signs are in the replacement due to regex escaping
  const newKey = key.replace(new RegExp('\\$', 'g'), '$$$$');
  // Add single $ as separator, don't modify message
  return newKey + '$' + message;
}

export function defaultDeserializer(value: string): [boolean, string, string] {
  let i;
  for (i = 0; i < value.length; i++) {
    const c = value[i];
    if (c === '$') {
      // Separator detected
      if (i === value.length - 1) {
        break;
      }
      else if (value[i + 1] !== '$') {
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
  // Replace double dollar signs with single dollar signs
  // Two dollar signs are in the replacement due to regex escaping
  const newKey = key.replace(new RegExp('\\$\\$', 'g'), '$$');
  return [true, newKey, message];
}
