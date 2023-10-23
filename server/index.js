const express = require("express");
const app = express();
const cors = require("cors");
const port = 3042;
const crypto = require('crypto');
// const { secp256k1 } = require("ethereum-cryptography/secp256k1"); // this library doesn't contain all methods needed from the "real" secp256k1 library
const secp256k1 = require('secp256k1');
const {keccak256} = require("ethereum-cryptography/keccak");
const {toHex, utf8ToBytes} = require("ethereum-cryptography/utils");

app.use(cors());
app.use(express.json());

const FIVE_MINUTES = 5 * 60 * 1000;

const balances = { // Note: these are sample keys generated with generate.js, do not use these keys other than for testing purposes
    "0x211707": 100, // Private key: b165b99b5b491c7f2f90c4cb28515b2caf62e15dca4c3a9e9c94df6109d4d560, Public key : 031e9ea896b0677fc2be57b7889030738c46049c041ca073686226aa8963211707, Public addr: 0x211707
    "0x1c6d0e": 50,  // Private key: ac257cc4027a216ac297d753f2808ef6976c7bbf09689931a3f7cab82978828a, Public key : 020b04a0a17f0b170a14ad1b418fce78afa6e9ebd7aa68e05043c44ce8ce1c6d0e, Public addr: 0x1c6d0e
    "0x805639": 75,  // Private key: ee9f5967b5ec2e58f522952ad4759a3a64033430a9a80bf003ba6331a266274f, Public key : 029138bc6f485a1b9c7f3f61bfea15aaafcfccea547f1a3eead00f360b99805639, Public addr: 0x805639
};

let openNonces = [];

app.get("/balance/:address", (req, res) => {
    const {address} = req.params;
    const balance = balances[address] || 0;
    res.send({balance});
});

app.post("/send", (req, res) => {
    console.log("Backend received send command: " + JSON.stringify(req.body));

    const {sender, recipient, amount, challenge, signature} = req.body;

    setInitialBalance(sender);
    setInitialBalance(recipient);

    if (!checkTransactionPreconditions(sender, amount, res)
        || !checkChallengeValid(sender, challenge, res)
        || !checkSignatureValid(sender, challenge, signature, res)) {
        console.log("Validity checks failed, aborting transaction!");
        return;
    }

    balances[sender] -= amount;
    balances[recipient] += amount;
    res.send({balance: balances[sender]});
});

app.get("/createChallenge/:address", (req, res) => {
    const {address} = req.params;

    const currentTimestamp = Date.now();
    const currentNonce = crypto.randomBytes(16).toString('hex'); // this is a CSPRNG, safe for using for a nonce
    openNonces.push({timestamp: currentTimestamp, nonce: currentNonce});
    console.log(`Added open nonce: ${currentNonce} (${currentTimestamp})`);

    const challenge = {
        message: "Signing this allows full access to your funds.",
        wallet: address,
        timestamp: currentTimestamp,
        nonce: currentNonce
    };

    res.send(challenge);
});

app.listen(port, () => {
    console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
    if (!balances[address]) {
        balances[address] = 0;
    }
}

function checkTransactionPreconditions(sender, amount, res) {
    if (amount < 0) {
        res.status(400).send({message: "Amount can't be negative, naughty naughty!!"});
        return false;
    }
    if (amount === 0) {
        res.status(400).send({message: "Amount can't be zero to prevent address poisoning!"});
        return false;
    }
    if (balances[sender] < amount) {
        res.status(400).send({message: "Not enough funds!"});
        return false;
    }

    console.log("Preconditions valid.");
    return true;
}

function checkChallengeValid(sender, challenge, res) {
    const currentTime = Date.now();
    if (challenge.timestamp > currentTime) {
        res.status(400).send({message: "Challenge in future, not valid!"});
        return false;
    }
    if ((challenge.timestamp + FIVE_MINUTES) <= currentTime) {
        res.status(400).send({message: "Challenge timed out, not valid anymore!"});
        return false;
    }

    const isValidNonce = openNonces.some((item) => item.nonce === challenge.nonce);
    if (!isValidNonce) {
        res.status(400).send({message: "Nonce not in list of valid nonces, please generate a new challenge!"});
        return false;
    }
    openNonces = openNonces.filter((item) => item.nonce !== challenge.nonce);

    console.log("Challenge valid.");
    return true;
}

function checkSignatureValid(sender, challenge, signature, res) {
    console.log('Checking validity of signature...');

    const challengeString = JSON.stringify(challenge);
    console.log('Challenge:', challengeString);
    console.log('Signature:', signature);

    const signatureBuffer = Buffer.from(signature.signature, 'hex');
    const recid = signature.recid;

    const hash = Buffer.from(keccak256(utf8ToBytes(challengeString)));
    const hashHex = hash.toString('hex');

    console.log(`Computed hash in hex: ${hashHex}`); // this hash must match the hash from sign.js

    const recoveredPublicKey = secp256k1.ecdsaRecover(signatureBuffer, recid, hash, true);
    const recoveredAddress = "0x" + toHex(recoveredPublicKey).slice(-6);

    console.log("Recovered public key: " + recoveredPublicKey);
    console.log("Recovered public key hex: " + toHex(recoveredPublicKey));
    console.log("Recovered address: " + recoveredAddress);

    const signatureValid = secp256k1.ecdsaVerify(signatureBuffer, hash, recoveredPublicKey);

    if (!signatureValid) {
        res.status(400).send({message: "Invalid signature!"});
        return false;
    }

    console.log("Sender: " + sender);
    if (sender !== recoveredAddress) {
        res.status(400).send({message: "Sender address does not match signer!"});
        return false;
    }

    console.log("Signature valid.");
    return true;
}
