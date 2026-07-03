import { Test } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { OAuth2Client } from 'google-auth-library';

const ALLOWED_EMAIL = 'allowed@example.com';

async function createService(): Promise<AuthService> {
  const module = await Test.createTestingModule({
    providers: [
      AuthService,
      { provide: JwtService, useValue: { sign: jest.fn().mockReturnValue('signed-jwt') } },
    ],
  }).compile();

  return module.get(AuthService);
}

describe('AuthService', () => {
  const originalAllowedEmails = process.env.ALLOWED_EMAILS;

  beforeEach(() => {
    process.env.ALLOWED_EMAILS = ALLOWED_EMAIL;
  });

  afterEach(() => {
    jest.clearAllMocks();
    if (originalAllowedEmails === undefined) {
      delete process.env.ALLOWED_EMAILS;
    } else {
      process.env.ALLOWED_EMAILS = originalAllowedEmails;
    }
  });

  describe('verifyGoogleToken', () => {
    it('returns a JWT for a valid token from an allowed email', async () => {
      const service = await createService();
      jest.spyOn(OAuth2Client.prototype, 'verifyIdToken').mockResolvedValue({
        getPayload: () => ({ email: ALLOWED_EMAIL }),
      } as never);

      const result = await service.verifyGoogleToken('valid-token');
      expect(result).toBe('signed-jwt');
    });

    it('throws UnauthorizedException when Google rejects the token', async () => {
      const service = await createService();
      jest.spyOn(OAuth2Client.prototype, 'verifyIdToken').mockRejectedValue(new Error('bad') as never);

      await expect(service.verifyGoogleToken('bad-token'))
        .rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when email is not in the allowlist', async () => {
      const service = await createService();
      jest.spyOn(OAuth2Client.prototype, 'verifyIdToken').mockResolvedValue({
        getPayload: () => ({ email: 'stranger@example.com' }),
      } as never);

      await expect(service.verifyGoogleToken('valid-token'))
        .rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when payload has no email', async () => {
      const service = await createService();
      jest.spyOn(OAuth2Client.prototype, 'verifyIdToken').mockResolvedValue({
        getPayload: () => ({}),
      } as never);

      await expect(service.verifyGoogleToken('valid-token'))
        .rejects.toThrow(UnauthorizedException);
    });

    it('matches allowed emails case-insensitively', async () => {
      process.env.ALLOWED_EMAILS = 'Allowed@Example.com';
      const service = await createService();
      jest.spyOn(OAuth2Client.prototype, 'verifyIdToken').mockResolvedValue({
        getPayload: () => ({ email: 'ALLOWED@example.COM' }),
      } as never);

      await expect(service.verifyGoogleToken('valid-token')).resolves.toBe('signed-jwt');
    });
  });

  describe('loadAllowedEmails', () => {
    it('parses a comma-separated list and trims whitespace', async () => {
      process.env.ALLOWED_EMAILS = ' a@example.com , b@example.com ';
      const service = await createService();

      jest.spyOn(OAuth2Client.prototype, 'verifyIdToken').mockResolvedValue({
        getPayload: () => ({ email: 'b@example.com' }),
      } as never);

      await expect(service.verifyGoogleToken('t')).resolves.toBe('signed-jwt');
    });

    it('throws when ALLOWED_EMAILS is unset', async () => {
      delete process.env.ALLOWED_EMAILS;
      await expect(createService()).rejects.toThrow(/ALLOWED_EMAILS/);
    });

    it('throws when ALLOWED_EMAILS is empty', async () => {
      process.env.ALLOWED_EMAILS = '   ';
      await expect(createService()).rejects.toThrow(/ALLOWED_EMAILS/);
    });
  });
});
