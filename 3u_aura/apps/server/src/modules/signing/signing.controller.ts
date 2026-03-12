import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { User } from '@/db';
import {
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { NftReferralSignatureRequest } from '3u-aura-common';
import { getAddress } from 'viem';
import { NftReferralSignatureRequestDto } from '../nft-eligibility';
import { SigningService } from './services/signing.service';

@Controller('signing')
@UseGuards(JwtAuthGuard)
export class SigningController {
  constructor(private readonly signingService: SigningService) {}

  @Post('referral-mint-preview')
  @HttpCode(HttpStatus.OK)
  async previewReferralMint(
    @CurrentUser() user: User,
    @Body() body: NftReferralSignatureRequestDto,
  ) {
    return this.signingService.prepareReferralMintPayload(
      this.assertRecipientMatchesAuthenticatedWallet(user, body),
    );
  }

  @Post('referral-mint-signature')
  @HttpCode(HttpStatus.OK)
  async signReferralMint(
    @CurrentUser() user: User,
    @Body() body: NftReferralSignatureRequestDto,
  ) {
    return this.signingService.issueReferralMintSignature(
      this.assertRecipientMatchesAuthenticatedWallet(user, body),
    );
  }

  private assertRecipientMatchesAuthenticatedWallet(
    user: User,
    body: NftReferralSignatureRequestDto,
  ): NftReferralSignatureRequest {
    const request = body as NftReferralSignatureRequest;

    if (getAddress(user.walletAddress) !== getAddress(request.recipient)) {
      throw new ForbiddenException(
        'Recipient must match the authenticated wallet',
      );
    }

    return request;
  }
}
