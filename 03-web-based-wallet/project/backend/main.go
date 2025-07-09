package main

import (
	"crypto/sha256"
	"encoding/json"
	"net/http"
	"slices"

	"github.com/ethereum/go-ethereum/crypto"
	"github.com/mr-tron/base58"
	"github.com/tyler-smith/go-bip32"
	"github.com/tyler-smith/go-bip39"
)

type Code string

const (
	Ethereum Code = "ethereum"
	Solana   Code = "solana"
	Bitcoin  Code = "bitcoin"
)

var supportedCoin = []Code{
	Ethereum, Solana,
}

var Mnemonic *string

type Wallet struct {
	PublicAddress string `json:"address"`
}

var walletMap = map[Code][]*Wallet{}

var coinIndexMap = map[Code]*CoinDetail{
	Ethereum: {
		Index: 60,
	},
	Solana: {
		Index: 501,
	},
	Bitcoin: {
		Index: 0,
	},
}

type GenerateAdderss func(key *bip32.Key) (string, error)

var GenerateAddressMap = map[Code]GenerateAdderss{
	Ethereum: generateEthereumAddress,
	Solana:   generateSolanaAddress,
}

type CoinDetail struct {
	Index        uint32
	CurrentIndex uint32
}

func main() {
	http.Handle("/", headerMiddleware(http.HandlerFunc(fetchWallet)))
	http.Handle("/generate", headerMiddleware(http.HandlerFunc(generateAddress)))
	http.ListenAndServe(":8080", nil)
}

func getMnemonic() string {
	if Mnemonic != nil {
		return *Mnemonic
	}

	entropy, err := bip39.NewEntropy(128)
	if err != nil {
		panic(err)
	}

	mnemonic, err := bip39.NewMnemonic(entropy)
	if err != nil {
		panic(err)
	}

	Mnemonic = &mnemonic

	return mnemonic
}

func initWallet(coin Code) {
	if walletMap[coin] == nil {
		walletMap[coin] = []*Wallet{}
	}
}

func headerMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")
		next.ServeHTTP(w, r)
	})
}

func fetchWallet(w http.ResponseWriter, _ *http.Request) {
	json.NewEncoder(w).Encode(walletMap)
}

func generateAddress(w http.ResponseWriter, r *http.Request) {
	coin := Code(r.URL.Query().Get("coin"))
	if !slices.Contains(supportedCoin, coin) {
		http.Error(w, "invalid_coin", http.StatusInternalServerError)
		return
	}

	initWallet(coin)

	seed := bip39.NewSeed(getMnemonic(), "")

	masterKey, err := bip32.NewMasterKey(seed)
	if err != nil {
		http.Error(w, "failed_to_generate_master_key", http.StatusInternalServerError)
		return
	}

	addressIndex, _ := getChildKey(masterKey, coin)

	address, _ := GenerateAddressMap[coin](addressIndex)

	walletMap[coin] = append(walletMap[coin], &Wallet{
		PublicAddress: address,
	})

	json.NewEncoder(w).Encode(walletMap)
}

func hardenedIndex(index uint32) uint32 {
	return index + bip32.FirstHardenedChild
}

func getChildKey(masterKey *bip32.Key, coin Code) (*bip32.Key, error) {
	purpose, _ := masterKey.NewChildKey(hardenedIndex(44))
	coinType, _ := purpose.NewChildKey(hardenedIndex(coinIndexMap[coin].Index))
	account, _ := coinType.NewChildKey(hardenedIndex(0))
	change, _ := account.NewChildKey(0)

	coinIndexMap[coin].CurrentIndex++

	return change.NewChildKey(coinIndexMap[coin].CurrentIndex)
}

func generateSolanaAddress(key *bip32.Key) (string, error) {
	hash := sha256.Sum256(key.Key)

	pubKey := hash[:32]

	return base58.Encode(pubKey), nil
}

func generateEthereumAddress(key *bip32.Key) (string, error) {
	privateKey, err := crypto.ToECDSA(key.Key)
	if err != nil {
		return "", err
	}

	address := crypto.PubkeyToAddress(privateKey.PublicKey)
	return address.Hex(), nil
}
