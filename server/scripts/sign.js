// Simple script to sign messages with a private key.
// Can be used as a simplified wallet for testing purposes.

// const secp = require('ethereum-cryptography/secp256k1') // this library doesn't contain all methods needed from the "real" secp256k1 library
const secp = require('secp256k1');
const { keccak256 } = require("ethereum-cryptography/keccak");
const { utf8ToBytes } = require("ethereum-cryptography/utils");
const prompt = require("prompt-sync")({ sigint: true });

// const privateKey = prompt("Private Key: ");
const privateKey = "ac257cc4027a216ac297d753f2808ef6976c7bbf09689931a3f7cab82978828a"; // hardcoded private key for convenience

const message = prompt("Message to sign: ");
// const message = "{\"message\":\"Signing this allows full access to your funds.\",\"wallet\":\"0x211707\",\"timestamp\":1697887279230,\"nonce\":\"6cb7fdc4b883f382f9c6edc1fc868937\"}";

console.log("---");
console.log(`About to sign:\n'${message}'\nwith the privateKey '${privateKey}'.`);
console.log("---");

let hash = keccak256(utf8ToBytes(message));
const hashBuffer = Buffer.from(hash, 'hex');

const signature = secp.ecdsaSign(hashBuffer, Buffer.from(privateKey, 'hex'));

console.log("Hash: " + hash);
const hashHex = Buffer.from(hash).toString('hex');
console.log(`Hash in hex: ${hashHex}`);
console.log("---");

const signatureBuffer = Buffer.from(signature.signature);

const signatureToSend = {
    signature: signatureBuffer.toString('hex'),
    recid: signature.recid
};

console.log("Signature: " + JSON.stringify(signatureToSend));
