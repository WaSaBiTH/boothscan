// globalState.ts
// This file provides a persistent in-memory storage for development HMR.

export interface QrTokenData {
    expires: number;
    activityId: string;
    activityTitle: string;
    startTime: Date;
    endTime: Date;
    roomCode: string;
    roomDesc: string;
}

export interface BoothStatusData {
    latestToken: string;
    used: boolean;
}

export interface GatekeeperTicketData {
    userId: number | string;
    username: string;
    expires: number;
}

declare global {
    var activeQrTokens: Map<string, QrTokenData>;
    var boothStatus: Map<string, BoothStatusData>;
    var gatekeeperTickets: Map<string, GatekeeperTicketData>;
}

if (!globalThis.activeQrTokens) {
    globalThis.activeQrTokens = new Map<string, QrTokenData>();
}
if (!globalThis.boothStatus) {
    globalThis.boothStatus = new Map<string, BoothStatusData>();
}
if (!globalThis.gatekeeperTickets) {
    globalThis.gatekeeperTickets = new Map<string, GatekeeperTicketData>();
}

export const activeQrTokens = globalThis.activeQrTokens;
export const boothStatus = globalThis.boothStatus;
export const gatekeeperTickets = globalThis.gatekeeperTickets;

export const QR_VALIDITY_MS = 5 * 60 * 1000; // 5 minutes
export const TICKET_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
