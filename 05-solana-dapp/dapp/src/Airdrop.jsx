// components in react 

// TODO: refactor this code with design enhancements
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { useEffect, useState } from "react";
import bs58 from "bs58";
import { SystemProgram, Transaction, PublicKey } from "@solana/web3.js";

export function Airdrop() {
    const wallet = useWallet()
    const { connection } = useConnection();

    const [amount, setAmount] = useState("");
    const [txnAmount, setTxnAmount] = useState("");
    const [recipientAddress, setRecipientAddress] = useState("");

    const [airdropMessage, setAirdropMessage] = useState(null);
    const [walletBalance, setWalletBalance] = useState(0);
    const [txnId, setTxnId] = useState(null);

    useEffect(()=>{
        if (wallet.publicKey) {
                connection.getBalance(wallet.publicKey).then((balance) => {
                    setWalletBalance(balance/1000000000)
        })
        } else {
            setWalletBalance(0);  
        }
    }, [connection, wallet.publicKey, airdropMessage])

    async function sendTransactionToRecipient() {
        if (!wallet.publicKey || !wallet.signTransaction) {
            throw new Error("Wallet not connected or signTransaction not available");
        }

        const recepient = new PublicKey(recipientAddress)
        const lamports = txnAmount * 1e9; 

        const transaction = new Transaction().add(SystemProgram.transfer({
            fromPubkey: wallet.publicKey,
            toPubkey: recepient,
            lamports: lamports,
        }))

        transaction.feePayer = wallet.publicKey;
        transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

        const signed = await wallet.signTransaction(transaction);
        const txid = await connection.sendRawTransaction(signed.serialize());
        await connection.confirmTransaction(txid);
        setTxnId(txid);
    }

    async function signMessage() {
       try {
            const message = new TextEncoder().encode("Hello, Solana!");
            const signature = await wallet.signMessage(message);
            if (signature) {
                setTxnId(bs58.encode(signature));
            } else {
                setTxnId("No signature returned");
            }
            
       } catch (error) {
            console.log("Error signing message:", error);
       }
    }

    async function sendAirdropToUser() {
        try {
            if (!wallet.publicKey) {
                console.log("Wallet not connected");
                return
            }

            await connection.requestAirdrop(wallet.publicKey, Number(amount) * 1e9); 
            setAirdropMessage("Airdrop sent successfully!");
        } catch (error) {
            console.error("Error sending airdrop:", error);
            const jsonString = error.message.slice(error.message.indexOf('{'));
            const obj = JSON.parse(jsonString);
            setAirdropMessage(obj?.error?.message);
        }
    }

    return (
    <div>
        <input className="border rounded m-4 p-2" type="text" placeholder="amount" value={amount} onChange={(e)=> setAmount(e.target.value)}></input>
        <button onClick={sendAirdropToUser} className="border rounded m-4 p-2">Send Airdrop</button>
        <div>SOL Balance: {walletBalance}</div>
        {/* {wallet.publicKey && <button onClick={signMessage} className="border rounded m-4 p-2">Sign Message</button>} */}
        {wallet.publicKey && <div className="flex items-center justify-center">
            <input className="border rounded m-4 p-2" type="text" placeholder="amount" value={txnAmount} onChange={(e)=> setTxnAmount(e.target.value)}></input>
            <input className="border rounded m-4 p-2" type="text" placeholder="recepient" value={recipientAddress} onChange={(e)=> setRecipientAddress(e.target.value)}></input>
            <button onClick={sendTransactionToRecipient} className="border rounded m-4 p-2">Send Transaction</button>
            {txnId && <div>Transaction id: {txnId}</div>}
            </div>}
        
        {airdropMessage && <div className="font-bold underline">{airdropMessage}</div>}
    </div>)  
}