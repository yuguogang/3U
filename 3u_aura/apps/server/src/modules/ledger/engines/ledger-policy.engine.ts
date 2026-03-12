import { Injectable } from '@nestjs/common';

@Injectable()
export class LedgerPolicyEngine {
  buildSourceKey(sourceType: string, sourceRefId: string): string {
    return `${sourceType}:${sourceRefId}`;
  }
}
