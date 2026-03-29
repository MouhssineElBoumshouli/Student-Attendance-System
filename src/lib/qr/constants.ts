// QR rotation interval in seconds
export const DEFAULT_ROTATION_SEC = 20;

// How many windows (past) to accept when validating a token
// 1 = accept current + 1 previous window (handles boundary scanning)
export const TOKEN_TOLERANCE_WINDOWS = 1;

// Max clock skew allowed in seconds
export const MAX_CLOCK_SKEW_SEC = 60;

// Token length (hex characters extracted from HMAC)
export const TOKEN_LENGTH = 16;
