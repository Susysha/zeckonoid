import { privateKeyToAccount } from 'viem/accounts';
import {
    createPublicClient,
    createWalletClient,
    http,
    WalletClient,
    PublicClient,
} from 'viem';
import { StorageHubClient } from '@storagehub-sdk/core';
import { ApiPromise, WsProvider, Keyring } from '@polkadot/api';
import { types } from '@storagehub/types-bundle';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import { NETWORK, chain } from '../config/networks';

export const publicClient: PublicClient = createPublicClient({
    chain,
    transport: http(NETWORK.rpcUrl),
});

const normalizePrivateKey = (key: string): `0x${string}` => {
    let normalized = key.trim();
    if (!normalized.startsWith('0x')) {
        normalized = `0x${normalized}`;
    }
    return normalized as `0x${string}`;
}

export const getWalletAddress = (privateKey: string) => {
    return privateKeyToAccount(normalizePrivateKey(privateKey)).address;
}

export const getStorageHubClient = (privateKey: string) => {
    const account = privateKeyToAccount(normalizePrivateKey(privateKey));
    const walletClient: WalletClient = createWalletClient({
        chain,
        account,
        transport: http(NETWORK.rpcUrl),
    });
    return {
        walletClient,
        storageHubClient: new StorageHubClient({
            rpcUrl: NETWORK.rpcUrl,
            chain: chain,
            walletClient: walletClient,
            filesystemContractAddress: NETWORK.filesystemContractAddress,
        })
    };
}

export const getClientServices = async (privateKey: string) => {
    await cryptoWaitReady();
    const walletKeyring = new Keyring({ type: 'ethereum' });
    const signerInstance = walletKeyring.addFromUri(normalizePrivateKey(privateKey));

    const provider = new WsProvider(NETWORK.wsUrl);
    const polkadotApiInstance = await ApiPromise.create({
        provider,
        typesBundle: types,
        noInitWarn: true,
    });

    return { signer: signerInstance, polkadotApi: polkadotApiInstance };
}
