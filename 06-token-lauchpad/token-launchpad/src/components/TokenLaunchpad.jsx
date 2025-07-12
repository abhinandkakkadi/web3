import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Keypair, SystemProgram, Transaction } from "@solana/web3.js";
import { createInitializeInstruction, createMintToInstruction,createAssociatedTokenAccountInstruction,getAssociatedTokenAddressSync, createInitializeMetadataPointerInstruction, createInitializeMintInstruction, getMintLen, ExtensionType, TYPE_SIZE, LENGTH_SIZE, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token"
import {  pack } from '@solana/spl-token-metadata';
import { useState } from "react";

export function TokenLaunchPad() {
    const [name, setName] = useState("");
    const [symbol, setSymbol] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [initialSupply, setInitialSupply] = useState("");
    
    
    const {connection} = useConnection()
    const wallet = useWallet()

    async function createToken() {
        const mintKeyPair = Keypair.generate()
        const metadata = {
            mint: mintKeyPair.publicKey,
            name: "KAKKADI",
            Symbol: "KAKKADI",
            uri: "https://example.com/metadata.json", // TODO: change
            additionalMetadata: [],
        }

        const mintLen = getMintLen([ExtensionType.MetadataPointer])
        const metadataLen = TYPE_SIZE + LENGTH_SIZE + pack(metadata).length;

        const lamports = await connection.getMinimumBalanceForRentExemption(mintLen + metadataLen)

        const transaction = new Transaction().add(
            SystemProgram.createAccount({
                fromPubkey: wallet.publicKey,
                newAccountPubkey: mintKeyPair.publicKey,
                lamports,
                space: mintLen,
                programId:TOKEN_2022_PROGRAM_ID,
            }),
            createInitializeMetadataPointerInstruction(mintKeyPair.publicKey, wallet.publicKey, mintKeyPair.publicKey, TOKEN_2022_PROGRAM_ID),
            createInitializeMintInstruction(mintKeyPair.publicKey, 9, wallet.publicKey, wallet.publicKey, TOKEN_2022_PROGRAM_ID),
            createInitializeInstruction({
                programId: TOKEN_2022_PROGRAM_ID,
                mint: mintKeyPair.publicKey,
                metadata: mintKeyPair.publicKey,
                name: metadata.name,
                symbol: metadata.Symbol,
                uri: metadata.uri,
                mintAuthority: wallet.publicKey,
                updateAuthority: wallet.publicKey,
            })
        )

        transaction.feePayer = wallet.publicKey;
        transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        transaction.partialSign(mintKeyPair);

        await wallet.sendTransaction(transaction, connection)

        const associatedToken = getAssociatedTokenAddressSync(mintKeyPair.publicKey, wallet.publicKey, false, TOKEN_2022_PROGRAM_ID);
        console.log("associated_token_address: ", associatedToken.toBase58());

        const transaction2 = new Transaction().add(
            createAssociatedTokenAccountInstruction(wallet.publicKey, associatedToken, wallet.publicKey, mintKeyPair.publicKey, TOKEN_2022_PROGRAM_ID),
        )
        
        await wallet.sendTransaction(transaction2, connection)

        const transaction3 = new Transaction().add(createMintToInstruction(mintKeyPair.publicKey, associatedToken, wallet.publicKey, 1000000000, [], TOKEN_2022_PROGRAM_ID))

        await wallet.sendTransaction(transaction3, connection)
        console.log("Token created and minted successfully");
    }

    return  <div style={{
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column'
    }}>
        <h1>Solana Token Launchpad</h1>
        <input className='inputText' type='text' placeholder='Name' value={name} onChange={(e) => setName(e.target.value)}></input> <br />
        <input className='inputText' type='text' placeholder='Symbol' value={symbol} onChange={(e) => setSymbol(e.target.value)}></input> <br />
        <input className='inputText' type='text' placeholder='Image URL' value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}></input> <br />
        <input className='inputText' type='text' placeholder='Initial Supply' value={initialSupply} onChange={(e) => setInitialSupply(e.target.value)}></input> <br />
        <button onClick={createToken} className='btn'>Create a token</button>
    </div>
}