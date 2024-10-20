// represent array of unit8 / bytes
let bytes = new Uint8Array([0, 255, 127, 128]);
// Here the max value for an element in this array is 255 as it is a bytes array and the max
// value that can be stored in a bytes array is 255 - 11111111
// Why use this, it use less space. whenever we have a requirement when only this much space
// is required, we can use it.
console.log(bytes);

// bytes to string
function bytesToAscii(byteArray) {
  return new TextDecoder().decode(byteArray);
}
const newBytes = new Uint8Array([72, 101, 108, 108, 111]);
const asciiString = bytesToAscii(newBytes);
console.log(asciiString);

// string t bytes

function AsciiToBytes(asciiString) {
  const res = [];
  for (i = 0; i < asciiString.length; i++) {
    char = asciiString[i];
    res.push(char.charCodeAt(0));
  }
  return res;
}

asciiNewString = "Hello";
res = AsciiToBytes(asciiString);
console.log("bytes representation of Hello: ", res);
