import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import {
  SocialProvider,
  VerifiedSocialProfile,
} from '../../domain/models/customer-auth.model';

@Injectable()
export class SocialAuthService {
  async verify(provider: SocialProvider, token: string): Promise<VerifiedSocialProfile> {
    if (!token || typeof token !== 'string') {
      throw new BadRequestException('Social token is required');
    }

    switch (provider) {
      case 'GOOGLE':
        return this.verifyGoogleToken(token.trim());
      case 'FACEBOOK':
        return this.verifyFacebookToken(token.trim());
      default:
        throw new BadRequestException(`Unsupported social provider: ${provider}`);
    }
  }

  private async verifyGoogleToken(token: string): Promise<VerifiedSocialProfile> {
    // Development / Mock token support for local testing
    if (token.startsWith('mock-google-')) {
      const parts = token.replace('mock-google-', '').split(':');
      const providerId = parts[0] || 'mock-google-id';
      const email = parts[1] || 'mock.google@example.com';
      return {
        provider: SocialProvider.GOOGLE,
        providerId,
        email: email.toLowerCase(),
        firstName: 'GoogleUser',
        lastName: 'Demo',
      };
    }

    try {
      const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new UnauthorizedException('Invalid or expired Google token');
      }

      const data = (await response.json()) as {
        sub?: string;
        email?: string;
        given_name?: string;
        family_name?: string;
        aud?: string;
      };

      if (!data.sub) {
        throw new UnauthorizedException('Google token does not contain a valid user identifier');
      }

      // Check allowed audiences (Client IDs) if configured
      const allowedAudiences = (process.env.GOOGLE_CLIENT_IDS || '')
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);

      if (allowedAudiences.length > 0 && (!data.aud || !allowedAudiences.includes(data.aud))) {
        throw new UnauthorizedException('Google token audience does not match this application');
      }

      return {
        provider: SocialProvider.GOOGLE,
        providerId: data.sub,
        email: data.email?.trim().toLowerCase(),
        firstName: data.given_name,
        lastName: data.family_name,
      };
    } catch (error: any) {
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }
      throw new UnauthorizedException('Failed to verify Google token with Google servers');
    }
  }

  private async verifyFacebookToken(token: string): Promise<VerifiedSocialProfile> {
    // Development / Mock token support for local testing
    if (token.startsWith('mock-facebook-')) {
      const parts = token.replace('mock-facebook-', '').split(':');
      const providerId = parts[0] || 'mock-facebook-id';
      const email = parts[1] || 'mock.facebook@example.com';
      return {
        provider: SocialProvider.FACEBOOK,
        providerId,
        email: email.toLowerCase(),
        firstName: 'FacebookUser',
        lastName: 'Demo',
      };
    }

    try {
      const url = `https://graph.facebook.com/me?fields=id,first_name,last_name,email&access_token=${encodeURIComponent(token)}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new UnauthorizedException('Invalid or expired Facebook token');
      }

      const data = (await response.json()) as {
        id?: string;
        first_name?: string;
        last_name?: string;
        email?: string;
        error?: any;
      };

      if (data.error || !data.id) {
        throw new UnauthorizedException('Invalid or expired Facebook token');
      }

      return {
        provider: SocialProvider.FACEBOOK,
        providerId: data.id,
        email: data.email?.trim().toLowerCase(),
        firstName: data.first_name,
        lastName: data.last_name,
      };
    } catch (error: any) {
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }
      throw new UnauthorizedException('Failed to verify Facebook token with Facebook Graph API');
    }
  }
}
