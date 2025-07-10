// components in react 

import { useConnection, useWallet } from "@solana/wallet-adapter-react"

export function Airdrop() {
    const wallet = useWallet()
    const { connection } = useConnection();
    const [amount, setAmount] = useState("");

    async function sendAirdropToUser() {
        try {
            console.log("Sending airdrop to:",  amount * 1e9);
            await connection.requestAirdrop(wallet.publicKey, amount * 1e9); 
            alert("Airdrop sent successfully!")
        } catch (error) {
            console.error("Error sending airdrop:", error);
            alert("Failed to send airdrop. Please check the console for details.");
        }
    }

    return <div>
        <input type="text" placeholder="amount" value={amount} onChange={(e)=> setAmount(e.target.value)}></input>
        <button onClick={sendAirdropToUser}>Send Airdrop</button>
    </div>
}