import { ConfigOptions } from '@/configuration';
import {
  NftEligibilityStatus,
  NftReferralSignatureRequest,
  NftEligibilityView,
  ReferralMintSignaturePayload,
  ReferralSignaturePreview,
} from '3u-aura-common';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getAddress } from 'viem';
import {
  NftEligibilityApplicationService,
  NftEligibilityRepository,
} from '../../nft-eligibility';
import { Eip712PayloadEngine } from '../engines/eip712-payload.engine';
import { SigningNonceRepository } from '../repositories/signing-nonce.repository';

type SigningConfig = {
  chainId: number;
  contractAddress: string;
  referralSignerPrivateKey: string;
  referralSignatureTtlSeconds: number;
};

@Injectable()
export class SigningService {
  constructor(
    private readonly configService: ConfigService<ConfigOptions>,
    private readonly eip712PayloadEngine: Eip712PayloadEngine,
    private readonly nftEligibilityApplicationService: NftEligibilityApplicationService,
    private readonly nftEligibilityRepository: NftEligibilityRepository,
    private readonly signingNonceRepository: SigningNonceRepository,
  ) {}

  async prepareReferralMintPayload(
    request: NftReferralSignatureRequest,
  ): Promise<ReferralSignaturePreview> {
    const { payload } = await this.preparePayload(request);

    return payload;
  }

  async issueReferralMintSignature(
    request: NftReferralSignatureRequest,
  ): Promise<ReferralMintSignaturePayload> {
    const { config, eligibility, onChainReferralSigner, payload } =
      await this.preparePayload(request);
    const configuredSignerAddress = this.eip712PayloadEngine.getSignerAddress(
      config.referralSignerPrivateKey,
    );

    if (configuredSignerAddress !== onChainReferralSigner) {
      throw new ConflictException(
        'Configured signer does not match the on-chain referral signer',
      );
    }

    const issuedAt = new Date().toISOString();
    const signature = await this.eip712PayloadEngine.signReferralMintPayload(
      payload,
      config.referralSignerPrivateKey,
    );
    const signedPayload =
      this.eip712PayloadEngine.buildReferralMintSignaturePayload({
        payload,
        issuedAt,
        signature,
      });

    await this.nftEligibilityRepository.markSignedPayload({
      expiresAt: new Date(signedPayload.expiresAt),
      payloadHash: signedPayload.digest,
      signedNonce: signedPayload.nonce,
      userId: eligibility.userId,
    });

    return signedPayload;
  }

  private async preparePayload(request: NftReferralSignatureRequest): Promise<{
    config: SigningConfig;
    eligibility: NftEligibilityView;
    onChainReferralSigner: string;
    payload: ReferralSignaturePreview;
  }> {
    const config = this.getSigningConfig();
    const normalizedRequest = this.normalizeRequest(request, config);
    const eligibility =
      await this.nftEligibilityApplicationService.getCurrentEligibility({
        walletAddress: normalizedRequest.recipient,
      });
    this.assertEligibleForSigning(eligibility);

    const expiresAt = this.resolveExpiresAt(
      normalizedRequest.expiresAt,
      config.referralSignatureTtlSeconds,
    );
    const signingState = await this.signingNonceRepository.readSigningState({
      contractAddress: normalizedRequest.contractAddress!,
      recipient: normalizedRequest.recipient,
    });
    const expiry = Math.floor(expiresAt.getTime() / 1000);
    const payload = this.eip712PayloadEngine.buildReferralMintPreview(
      normalizedRequest,
      signingState.nonce,
      expiry,
    );

    return {
      config,
      eligibility,
      onChainReferralSigner: signingState.referralSigner,
      payload,
    };
  }

  private getSigningConfig(): SigningConfig {
    const promotion =
      this.configService.get<ConfigOptions['promotion']>('promotion');
    const contractAddress = promotion?.nftSaleAddress;
    const referralSignerPrivateKey = promotion?.referralSignerPrivateKey;
    const referralSignatureTtlSeconds =
      promotion?.referralSignatureTtlSeconds ?? 900;

    if (!contractAddress || !referralSignerPrivateKey) {
      throw new InternalServerErrorException(
        'Referral mint signer is not fully configured',
      );
    }

    return {
      chainId: promotion?.claimChainId ?? 97,
      contractAddress: getAddress(contractAddress),
      referralSignerPrivateKey,
      referralSignatureTtlSeconds,
    };
  }

  private normalizeRequest(
    request: NftReferralSignatureRequest,
    config: SigningConfig,
  ): NftReferralSignatureRequest {
    if (request.chainId !== config.chainId) {
      throw new BadRequestException('Unsupported promotion chainId');
    }

    if (
      request.contractAddress &&
      getAddress(request.contractAddress) !== config.contractAddress
    ) {
      throw new BadRequestException(
        'Requested contractAddress does not match signer configuration',
      );
    }

    return {
      ...request,
      contractAddress: config.contractAddress,
      recipient: getAddress(request.recipient),
    };
  }

  private resolveExpiresAt(
    requestedExpiresAt: string | undefined,
    ttlSeconds: number,
  ): Date {
    const now = Date.now();
    const maxExpiresAt = now + ttlSeconds * 1000;

    if (!requestedExpiresAt) {
      return new Date(maxExpiresAt);
    }

    const expiresAt = new Date(requestedExpiresAt);
    if (Number.isNaN(expiresAt.getTime())) {
      throw new BadRequestException('Invalid expiresAt');
    }
    if (expiresAt.getTime() <= now) {
      throw new BadRequestException('expiresAt must be in the future');
    }
    if (expiresAt.getTime() > maxExpiresAt) {
      throw new BadRequestException(
        'expiresAt exceeds the configured signer TTL',
      );
    }

    return expiresAt;
  }

  private assertEligibleForSigning(eligibility: NftEligibilityView): void {
    if (
      eligibility.status !== NftEligibilityStatus.ELIGIBLE &&
      eligibility.status !== NftEligibilityStatus.SIGNED
    ) {
      throw new ConflictException(
        'NFT referral mint is not currently eligible',
      );
    }
  }
}
