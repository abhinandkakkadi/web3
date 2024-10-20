const crypto = require("crypto");

// The work that is being computed below is what happens in case of proof of work.

function makeid(length) {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

// create an input for which hex output starts with 00000
while (true) {
  random_input = makeid(10);
  hashed_value = crypto.createHash("sha256").update(random_input).digest("hex");
  if (hashed_value.startsWith("00000")) {
    console.log("input where hash starts with 00000 => ", random_input);
    break;
  }
}

// abhinand
// In an actual situation the miners have to constantly mine,
// so given a prefix we have to find a random number / nonce
// where "prefix + nonce = "target hash" "
while (true) {
  random_input = "abhinand" + makeid(10);
  hashed_value = crypto.createHash("sha256").update(random_input).digest("hex");
  if (hashed_value.startsWith("00000")) {
    console.log("input starts with abhinand ", random_input);
    break;
  }
}
