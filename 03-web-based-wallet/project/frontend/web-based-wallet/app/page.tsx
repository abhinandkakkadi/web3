'use client'

import axios, { AxiosResponse } from 'axios';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useEffect, useState } from 'react';

interface WalletAddress {
  address: string;
}

interface WalletResponse {
  ethereum: WalletAddress[];
  solana: WalletAddress[];
}

export default function Home() {
  const [wallet, setWallets] = useState<any>()

  useEffect(()=>{
    async function fetchWallet() {
      async function getWallet(): Promise<WalletResponse> {
        const response: AxiosResponse<WalletResponse> = await axios.get(`http://localhost:8080`);
        return response.data;
      }
      
      const data = await getWallet()
      setWallets(data)
    } 

    fetchWallet()
  }, [])

  const  generateWallet = async (coin: string) => {
    async function fetchWallet(coin :string): Promise<WalletResponse> {
      const response: AxiosResponse<WalletResponse> = await axios.get(`http://localhost:8080/generate?coin=${coin}`);
      return response.data;
    }
    
    const data =  await fetchWallet(coin)
    setWallets(data)
  }

  return (
  <div>
    <Button variant='outline' size='lg' className='capitalize-m8 mb-12' onClick={()=>{
      generateWallet("ethereum")
    }}>Add wallet</Button>
    <div className="flex flex-wrap">
      {wallet?.ethereum?.map((w: WalletAddress) => {
         return cardComponent(w)
      })}
    </div>
  </div>
  );
}

const cardComponent = (wallet :WalletAddress) => {
  return (
    <Card className="w-100">
    <CardHeader>
      <CardTitle>Ethereum wallet</CardTitle>
    </CardHeader>
     <CardContent>
      <p>{wallet.address}</p>
     </CardContent>
  </Card>
  )
}
