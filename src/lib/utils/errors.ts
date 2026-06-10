// ──────────────────────────────────────────────
// Auth & Authorization Error Classes
// ──────────────────────────────────────────────

export type AuthErrorCode =
  | 'UNAUTHORIZED'
  | 'PROFILE_NOT_FOUND'
  | 'USER_DISABLED'
  | 'FORBIDDEN'
  | 'INVALID_CREDENTIALS';

export class AuthenticationError extends Error {
  public readonly code: Extract<
    AuthErrorCode,
    'UNAUTHORIZED' | 'PROFILE_NOT_FOUND' | 'USER_DISABLED'
  >;

  constructor(
    code: Extract<
      AuthErrorCode,
      'UNAUTHORIZED' | 'PROFILE_NOT_FOUND' | 'USER_DISABLED'
    >,
    message?: string,
  ) {
    super(message ?? code);
    this.name = 'AuthenticationError';
    this.code = code;
  }
}

export class AuthorizationError extends Error {
  public readonly code: 'FORBIDDEN';

  constructor(message?: string) {
    super(message ?? 'FORBIDDEN');
    this.name = 'AuthorizationError';
    this.code = 'FORBIDDEN';
  }
}
