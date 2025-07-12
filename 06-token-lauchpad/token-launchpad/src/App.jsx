import "./App.css";

import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletDisconnectButton,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";
import { TokenLaunchPad } from "./components/TokenLaunchpad";

function App() {
  return (
    <div className="h-full">
      <ConnectionProvider endpoint={"https://api.devnet.solana.com"}>
        <WalletProvider wallets={[]} autoConnect>
          <WalletModalProvider>
            <div className="border-b-2 border-gray-300 h-screen flex flex-col items-center justify-center">
              <div className="border-2 border-gray-300 p-4 flex flex-col items-center justify-center gap-4">
              <h1 className="text-center font-sans text-lg">Solana Token Launchpad</h1>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <WalletMultiButton />
                  <WalletDisconnectButton />
                </div>
                <TokenLaunchPad />
              </div>
            </div>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </div>
  );
}

export default App;
