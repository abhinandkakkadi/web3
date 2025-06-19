package main

import (
	"encoding/json"
	"net/http"

	"github.com/ethereum/go-ethereum/crypto"
	"github.com/tyler-smith/go-bip32"
	"github.com/tyler-smith/go-bip39"
)

var (
	index uint32 = 0
)

type Wallet struct {
	PublicAddress string
}

var walletMap = map[uint32]*Wallet{}

func main() {
	http.HandleFunc("/", generateAddress)
	http.ListenAndServe(":8080", nil)
}

func generateAddress(w http.ResponseWriter, r *http.Request) {
	entropy, err := bip39.NewEntropy(128)
	if err != nil {
		http.Error(w, "Failed to generate entropy", http.StatusInternalServerError)
		return
	}

	mnemonic, err := bip39.NewMnemonic(entropy)
	if err != nil {
		http.Error(w, "Failed to generate mnemonic", http.StatusInternalServerError)
		return
	}

	seed := bip39.NewSeed(mnemonic, "")

	masterKey, err := bip32.NewMasterKey(seed)
	if err != nil {
		http.Error(w, "Failed to generate master key", http.StatusInternalServerError)
		return
	}

	purpose, _ := masterKey.NewChildKey(hardenedIndex(44))
	coinType, _ := purpose.NewChildKey(hardenedIndex(60))
	account, _ := coinType.NewChildKey(hardenedIndex(0))
	change, _ := account.NewChildKey(0)
	addressIndex, _ := change.NewChildKey(index)

	privateKey, err := crypto.ToECDSA(addressIndex.Key)
	if err != nil {
		http.Error(w, "Failed to generate master key", http.StatusInternalServerError)
		return
	}

	address := crypto.PubkeyToAddress(privateKey.PublicKey)
	walletMap[index] = &Wallet{
		PublicAddress: address.Hex(),
	}
	index++

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(walletMap)
}

func hardenedIndex(index uint32) uint32 {
	return index + bip32.FirstHardenedChild
}
