import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Keypair, SystemProgram, Transaction } from "@solana/web3.js";
import {
  createInitializeInstruction,
  createMintToInstruction,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddressSync,
  createInitializeMetadataPointerInstruction,
  createInitializeMintInstruction,
  getMintLen,
  ExtensionType,
  TYPE_SIZE,
  LENGTH_SIZE,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { pack } from "@solana/spl-token-metadata";
import { useState } from "react";

export function TokenLaunchPad() {
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [initialSupply, setInitialSupply] = useState("");
  const [message, setMessage] = useState("");

  const { connection } = useConnection();
  const wallet = useWallet();

  function isNumeric(str) {
    return !isNaN(str) && !isNaN(parseFloat(str));
  }

  function isInputValid() {
    if (name === "" || symbol === "" || imageUrl === "") {
        return false
    }

    if (!isNumeric(initialSupply)) {
        return false
    }

    return true
  }

  async function createToken() {
    if (!isInputValid()) {
        setMessage("Please fill all fields with valid data.");
        return
    }

    try {
      if (!wallet.publicKey || !wallet.signTransaction) {
        throw new Error(
          "Wallet not connected or signTransaction not available"
        );
      }

      const mintKeyPair = Keypair.generate();
      const metadata = {
        mint: mintKeyPair.publicKey,
        name: name,
        symbol: symbol,
        uri: imageUrl, // TODO: change
        additionalMetadata: [],
      };

      const mintLen = getMintLen([ExtensionType.MetadataPointer]);
      const metadataLen = TYPE_SIZE + LENGTH_SIZE + pack(metadata).length;

      const lamports = await connection.getMinimumBalanceForRentExemption(
        mintLen + metadataLen
      );

      const transaction = new Transaction().add(
        SystemProgram.createAccount({
          fromPubkey: wallet.publicKey,
          newAccountPubkey: mintKeyPair.publicKey,
          lamports,
          space: mintLen,
          programId: TOKEN_2022_PROGRAM_ID,
        }),
        createInitializeMetadataPointerInstruction(
          mintKeyPair.publicKey,
          wallet.publicKey,
          mintKeyPair.publicKey,
          TOKEN_2022_PROGRAM_ID
        ),
        createInitializeMintInstruction(
          mintKeyPair.publicKey,
          9,
          wallet.publicKey,
          wallet.publicKey,
          TOKEN_2022_PROGRAM_ID
        ),
        createInitializeInstruction({
          programId: TOKEN_2022_PROGRAM_ID,
          mint: mintKeyPair.publicKey,
          metadata: mintKeyPair.publicKey,
          name: metadata.name,
          symbol: metadata.symbol,
          uri: metadata.uri,
          mintAuthority: wallet.publicKey,
          updateAuthority: wallet.publicKey,
        })
      );

      transaction.feePayer = wallet.publicKey;
      transaction.recentBlockhash = (
        await connection.getLatestBlockhash()
      ).blockhash;
      transaction.partialSign(mintKeyPair);

      await wallet.sendTransaction(transaction, connection);

      const associatedToken = getAssociatedTokenAddressSync(
        mintKeyPair.publicKey,
        wallet.publicKey,
        false,
        TOKEN_2022_PROGRAM_ID
      );

      const transaction2 = new Transaction().add(
        createAssociatedTokenAccountInstruction(
          wallet.publicKey,
          associatedToken,
          wallet.publicKey,
          mintKeyPair.publicKey,
          TOKEN_2022_PROGRAM_ID
        )
      );

      await wallet.sendTransaction(transaction2, connection);

      const transaction3 = new Transaction().add(
        createMintToInstruction(
          mintKeyPair.publicKey,
          associatedToken,
          wallet.publicKey,
          1000000000,
          [],
          TOKEN_2022_PROGRAM_ID
        )
      );

      await wallet.sendTransaction(transaction3, connection);
      console.log("Token created and minted successfully");
      setMessage("Token created and minted successfully");
    } catch (error) {
      console.error("Error creating token:", error);
      setMessage("Failed to create token. Check console for details.");
    }
  }

  return (
    <div>
      <div className="flex gap-4 mb-4">
        <input
          className="inputText border-2 border-gray-200 rounded-lg px-4 py-2 shadow-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={!wallet.connected}
        ></input>{" "}
        <input
          className="inputText border-2 border-gray-200 rounded-lg px-4 py-2 shadow-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          type="text"
          placeholder="Symbol"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          disabled={!wallet.connected}
        ></input>{" "}
        <input
          className="inputText border-2 border-gray-200 rounded-lg px-4 py-2 shadow-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          type="text"
          placeholder="Image URL"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          disabled={!wallet.connected}
        ></input>{" "}
        <input
          className="inputText border-2 border-gray-200 rounded-lg px-4 py-2 shadow-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          type="text"
          placeholder="Initial Supply"
          value={initialSupply}
          onChange={(e) => setInitialSupply(e.target.value)}
          disabled={!wallet.connected}
        ></input>
      </div>
      <div className="flex justify-center ">
        <button onClick={createToken} className="btn bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 w-40">
          Create a token
        </button>
      </div>
      {message && <div className="flex flex-col items-center justify-center">
        <br/>
        <div className="text-color-red-500">{message}</div>
      </div>}
    </div>
  );
}
