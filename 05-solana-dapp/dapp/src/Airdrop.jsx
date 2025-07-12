// components in react

// TODO: refactor this code with design enhancements
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";
import bs58 from "bs58";
import { SystemProgram, Transaction, PublicKey } from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

const USDC_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");

export function Airdrop() {
  const wallet = useWallet();
  const { connection } = useConnection();

  const [amount, setAmount] = useState("");
  const [txnAmount, setTxnAmount] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");

  const [message, setMessage] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [txnId, setTxnId] = useState(null);

  useEffect(() => {
    if (wallet.publicKey) {
      connection.getBalance(wallet.publicKey).then((balance) => {
        setWalletBalance(balance / 1000000000);
      });
    } else {
      setWalletBalance(0);
    }
  }, [connection, wallet.publicKey, message]);

  async function sendTransactionToRecipient() {
    if (!wallet.publicKey || !wallet.signTransaction) {
      throw new Error("Wallet not connected or signTransaction not available");
    }

    const recepient = new PublicKey(recipientAddress);
    const lamports = txnAmount * 1e9;

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: recepient,
        lamports: lamports,
      })
    );

    transaction.feePayer = wallet.publicKey;
    transaction.recentBlockhash = (
      await connection.getLatestBlockhash()
    ).blockhash;

    const signed = await wallet.signTransaction(transaction);
    const txid = await connection.sendRawTransaction(signed.serialize());
    await connection.confirmTransaction(txid);
    setTxnId(txid);
  }

  const checkOrCreateATA = async (
    walletPublicKey,
    ownerPublicKey,
    mint,
    transaction
  ) => {
    const ata = await getAssociatedTokenAddress(
      mint,
      ownerPublicKey,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const accountInfo = await connection.getAccountInfo(ata);
    if (!accountInfo) {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          walletPublicKey, // payer
          ata, // ata address
          ownerPublicKey, // token account owner
          mint,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )
      );
    }

    return ata;
  };

  async function sendTokenTransactionToRecipient() {
    const recipient = new PublicKey(recipientAddress);
    const usdcAmount = BigInt(Number(txnAmount)*1000000); // USDC has 6 decimals on Solana, so 2 USDC = 2e6

    if (!recipient || !usdcAmount) {
        message("Please provide a valid recipient address and amount.");
        return
    }

    const transaction = new Transaction();
    const sender = wallet.publicKey;

    // Create or get ATA for sender
    const senderATA = await checkOrCreateATA(
      sender,
      sender,
      USDC_MINT,
      transaction
    );

    // Create or get ATA for recipient
    const recipientATA = await checkOrCreateATA(
      sender,
      recipient,
      USDC_MINT,
      transaction
    );

    // Add transfer instruction
    transaction.add(
      createTransferInstruction(
        senderATA,
        recipientATA,
        sender,
        usdcAmount,
        [],
        TOKEN_PROGRAM_ID
      )
    );

    // Set blockhash and fee payer
    transaction.feePayer = sender;
    transaction.recentBlockhash = (
      await connection.getLatestBlockhash()
    ).blockhash;

    // Sign and send
    const signed = await wallet.signTransaction(transaction);
    const txid = await connection.sendRawTransaction(signed.serialize());
    await connection.confirmTransaction(txid);

    console.log("✅ TX Success:", txid);
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
        return;
      }

      await connection.requestAirdrop(wallet.publicKey, Number(amount) * 1e9);
      setMessage("Airdrop sent successfully!");
    } catch (error) {
      console.error("Error sending airdrop:", error);
      const jsonString = error.message.slice(error.message.indexOf("{"));
      const obj = JSON.parse(jsonString);
      setMessage(obj?.error?.message);
    }
  }

  return (
    <div>
      <input
        className="border rounded m-4 p-2"
        type="text"
        placeholder="amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      ></input>
      <button onClick={sendAirdropToUser} className="border rounded m-4 p-2">
        Send Airdrop
      </button>
      <div>SOL Balance: {walletBalance}</div>
      {/* {wallet.publicKey && <button onClick={signMessage} className="border rounded m-4 p-2">Sign Message</button>} */}
      {wallet.publicKey && (
        <div className="flex items-center justify-center">
          <input
            className="border rounded m-4 p-2"
            type="text"
            placeholder="amount"
            value={txnAmount}
            onChange={(e) => setTxnAmount(e.target.value)}
          ></input>
          <input
            className="border rounded m-4 p-2"
            type="text"
            placeholder="recepient"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
          ></input>
          <button
            onClick={sendTokenTransactionToRecipient}
            className="border rounded m-4 p-2"
          >
            Send Transaction
          </button>
          {txnId && <div>Transaction id: {txnId}</div>}
        </div>
      )}

      {message && (
        <div className="font-bold underline">{message}</div>
      )}
    </div>
  );
}
