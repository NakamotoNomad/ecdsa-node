import Wallet from "./Wallet";
import Transfer from "./Transfer";
import "./App.scss";
import {useState} from "react";

function App() {
    const [balance, setBalance] = useState(0);
    const [address, setAddress] = useState("0x1c6d0e");
    const [privateKey, setPrivateKey] = useState("ac257cc4027a216ac297d753f2808ef6976c7bbf09689931a3f7cab82978828a"); // hardcoded for convenience

    return (
        <div className="app">
            <Wallet
                balance={balance}
                setBalance={setBalance}
                address={address}
                setAddress={setAddress}
                privateKey={privateKey}
                setPrivateKey={setPrivateKey}
            />
            <Transfer setBalance={setBalance} address={address}/>
        </div>
    );
}

export default App;
