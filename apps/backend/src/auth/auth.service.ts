import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class AuthService {
  private readonly client: OAuth2Client;
  private readonly allowedEmails: Set<string>;

  constructor(private readonly jwtService: JwtService) {
    this.client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    this.allowedEmails = this.loadAllowedEmails();
  }

  private loadAllowedEmails(): Set<string> {
    const emails = (process.env.ALLOWED_EMAILS ?? '')
      .split(/[,\n]/)
      .map(e => e.trim().toLowerCase())
      .filter(e => e.length > 0);

    if (emails.length === 0) {
      throw new Error(
        'ALLOWED_EMAILS is not set or empty — define it in the environment (.env.<NODE_ENV>)',
      );
    }

    return new Set(emails);
  }

  async verifyGoogleToken(idToken: string): Promise<string> {
    let email: string;

    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      email = ticket.getPayload()?.email ?? '';
    } catch {
      throw new UnauthorizedException('Invalid Google token');
    }

    if (!email || !this.allowedEmails.has(email.toLowerCase())) {
      throw new UnauthorizedException('Email not allowed');
    }

    return this.jwtService.sign({ email });
  }
}
