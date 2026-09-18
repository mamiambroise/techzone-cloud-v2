export const IS_PUBLIC_KEY = 'isPublic';
export const IAM_CONTEXT_CLIENT_KEY = 'iamContextClient';

export const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
export const ABSOLUTE_TIMEOUT_MS = 12 * 60 * 60 * 1000;

export const JWT_ACCESS_TTL = process.env.ACCESS_TOKEN_TTL || '15m';
export const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;