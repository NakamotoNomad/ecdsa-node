import server from "./server";

import * as secp from "ethereum-cryptography/secp256k1.js"
import * as utils from "ethereum-cryptography/utils.js"

function Wallet({ address, setAddress, balance, setBalance, privateKey, setPrivateKey }) {
  async function onChange(evt) {
    const privateKey = evt.target.value;
    setPrivateKey(privateKey);
    const publicKey = secp.secp256k1.getPublicKey(privateKey);
    const address = "0x" + utils.toHex(publicKey).slice(-6);
    setAddress(address);
    if (address) {
      const {
        data: { balance },
      } = await server.get(`balance/${address}`);
      setBalance(balance);
    } else {
      setBalance(0);
    }
  }

  return (
    <div className="container wallet">
      <h1>Your Wallet</h1>

      <label>
        Private Key
        <input placeholder="Type your private key (big no-no in production!)" value={privateKey} onChange={onChange}></input>
      </label>

      <label>
        Address: {address}
      </label>

      <div className="balance">Balance: {balance}</div>
    </div>
  );
}

export default Wallet;
