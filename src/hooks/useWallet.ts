"use client";

import { useState, useEffect, useCallback } from "react";
import { createWalletClient, custom } from "viem";
import { sepolia } from "viem/chains";

export interface WalletState {
    address: string | null;
    isConnected: boolean;
    chainId: number | null;
    isConnecting: boolean;
    connect: () => Promise<void>;
    disconnect: () => void;
}

export function useWallet(): WalletState {
    const [address, setAddress] = useState<string | null>(null);
    const [chainId, setChainId] = useState<number | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);

    const isConnected = !!address;

    // On mount: check if already authorized (no prompt)
    useEffect(() => {
        if (typeof window === "undefined" || !window.ethereum) return;

        const eth = window.ethereum as any;

        // Silently check existing accounts
        eth.request({ method: "eth_accounts" }).then((accounts: string[]) => {
            if (accounts.length > 0) {
                setAddress(accounts[0]);
                eth.request({ method: "eth_chainId" }).then((id: string) => {
                    setChainId(parseInt(id, 16));
                });
            }
        });

        // Listen for account changes
        const onAccountsChanged = (accounts: string[]) => {
            setAddress(accounts.length > 0 ? accounts[0] : null);
        };
        const onChainChanged = (id: string) => {
            setChainId(parseInt(id, 16));
        };

        eth.on("accountsChanged", onAccountsChanged);
        eth.on("chainChanged", onChainChanged);

        return () => {
            eth.removeListener("accountsChanged", onAccountsChanged);
            eth.removeListener("chainChanged", onChainChanged);
        };
    }, []);

    const connect = useCallback(async () => {
        if (typeof window === "undefined" || !window.ethereum) {
            alert("No Web3 wallet detected. Please install MetaMask.");
            return;
        }
        setIsConnecting(true);
        try {
            const walletClient = createWalletClient({
                chain: sepolia,
                transport: custom(window.ethereum as any),
            });
            const [acc] = await walletClient.requestAddresses();
            setAddress(acc ?? null);
            const id = await (window.ethereum as any).request({ method: "eth_chainId" });
            setChainId(parseInt(id, 16));
        } catch (e) {
            console.error("Wallet connect failed:", e);
        }
        setIsConnecting(false);
    }, []);

    const disconnect = useCallback(() => {
        setAddress(null);
        setChainId(null);
    }, []);

    return { address, isConnected, chainId, isConnecting, connect, disconnect };
}
