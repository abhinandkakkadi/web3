import './App.css'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import {
  WalletConnectButton,
    WalletDisconnectButton,
    WalletModalProvider,
    WalletMultiButton,
} from '@solana/wallet-adapter-react-ui';
import { Airdrop } from './Airdrop';

// Default styles that can be overridden by your app
import '@solana/wallet-adapter-react-ui/styles.css';

function App() {
  return (
    <ConnectionProvider endpoint={"https://api.devnet.solana.com"} aut>
      <div className='flex flex-col items-center justify-center min-h-screen bg-gray-100'>
            <WalletProvider wallets={[]}> {/* In the right now empty list we can add wallets that cannot be automatically detected */ }
                <WalletModalProvider autoConnect>
                  <p className='mb-2 font-bold'>SOL Faucet</p>
                  <div className='flex flex items-center justify-center gap-2'>
                  <WalletMultiButton/>
                  <WalletDisconnectButton/>
                  </div>
                  <Airdrop/>
                </WalletModalProvider>
            </WalletProvider>
      </div>
    </ConnectionProvider>
  )
}

export default App
