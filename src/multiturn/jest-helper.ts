export function randomChar(): string {
  // Minimum ascii value, inclusive
  const alphaMin = 32;
  // Maximum ascii value, exclusive
  const alphaMax = 127;
  const charCode =
    Math.floor(Math.random() * (alphaMax - alphaMin)) + alphaMin;
  return String.fromCharCode(charCode);
}

const generated = new Set();

export function randomString(): string {
  // Generate a random length
  const minLength = 0;
  const maxLength = 20;
  const length =
    Math.floor(Math.random() * (maxLength - minLength)) + minLength;
  let s = '';
  for (let i = 0; i < length; i++) {
    s += randomChar();
  }
  return s;
}

export function randomUniqueString(): string {
  let s;
  do {
    s = randomString();
  } while (generated.has(s));
  generated.add(s);
  return s;
}

const nonRandom = false;

export function randomData(length: number): string[] {
  const arr = [];
  for (let i = 0; i < length; i++) {
    if (nonRandom) {
      arr.push(i.toString());
    }
    else {
      arr.push(randomUniqueString());
    }
  }
  return arr;
}

export function randomTimeout(): number {
  // Random timeout between 0 seconds and 2 seconds
  const minTime = 0;
  const maxTime = 2000;
  return (Math.random() * (maxTime - minTime)) + minTime;
}
