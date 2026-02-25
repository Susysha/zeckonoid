import {
    HealthStatus,
    InfoResponse,
    MspClient,
    UserInfo,
    ValueProp
} from '@storagehub-sdk/msp-client';
import { HttpClientConfig } from '@storagehub-sdk/core';
import { getWalletAddress } from './clientService';
import { NETWORK } from '../config/networks';
import { WalletClient } from 'viem';

const httpCfg: HttpClientConfig = { baseUrl: NETWORK.mspUrl };
let sessionToken: string | undefined = undefined;

export const initializeMspClient = async (privateKey: string) => {
    const sessionProvider = async () =>
        sessionToken
            ? ({ token: sessionToken, user: { address: getWalletAddress(privateKey) } } as const)
            : undefined;

    return await MspClient.connect(httpCfg, sessionProvider);
}

export const getMspInfo = async (mspClient: MspClient): Promise<InfoResponse> => {
    const mspInfo = await mspClient.info.getInfo();
    console.log(`MSP ID: ${mspInfo.mspId}`);
    return mspInfo;
};

export const getMspHealth = async (mspClient: MspClient): Promise<HealthStatus> => {
    const mspHealth = await mspClient.info.getHealth();
    console.log(`MSP Health: ${mspHealth}`);
    return mspHealth;
};

export const authenticateUser = async (mspClient: MspClient, walletClient: WalletClient): Promise<UserInfo> => {
    console.log('Authenticating user with MSP via SIWE...');
    const domain = 'localhost';
    const uri = 'http://localhost:3000'; // Must exactly match the frontend origin or SIWE signature validation fails on backend

    const siweSession = await mspClient.auth.SIWE(walletClient, domain, uri);
    console.log('SIWE Session:', siweSession);
    sessionToken = (siweSession as { token: string }).token;

    return await mspClient.auth.getProfile();
};

export const getValueProps = async (mspClient: MspClient): Promise<`0x${string}`> => {
    const valueProps: ValueProp[] = await mspClient.info.getValuePropositions();
    if (!Array.isArray(valueProps) || valueProps.length === 0) {
        throw new Error('No value propositions available from MSP');
    }
    const valuePropId = valueProps[0].id as `0x${string}`;
    console.log(`Chose Value Prop ID: ${valuePropId}`);
    return valuePropId;
};
