// components in react 

import { useConnection, useWallet } from "@solana/wallet-adapter-react"

export function Airdrop() {
    const wallet = useWallet()
    const { connection } = useConnection();

    async function sendAirdropToUser() {
       await connection.requestAirdrop(wallet.publicKey, 2000000000)
    }

    return <div>
        <input type="text" placeholder="amount"></input>
        <button onClick={sendAirdropToUser}>Send Airdrop</button>
    </div>
}