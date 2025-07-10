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
            <WalletProvider wallets={[]}> {/* In the right now empty list we can add wallets that cannot be automatically detected */ }
                <WalletModalProvider autoConnect>
                  <WalletMultiButton/>
                  <WalletDisconnectButton/>
                  <Airdrop/>
                </WalletModalProvider>
            </WalletProvider>
    </ConnectionProvider>
  )
}

export default App
