import { BadRequestException } from '@nestjs/common';
import { VerifiedSocialProfile } from '../../../../domain/models/customer-auth.model';

export class SocialLoginCustomerValidation {
  execute(profile: VerifiedSocialProfile): void {
    if (!profile?.provider) {
      throw new BadRequestException('Social provider is required');
    }
    if (!profile?.providerId || typeof profile.providerId !== 'string') {
      throw new BadRequestException('Social provider ID is required');
    }
  }
}
