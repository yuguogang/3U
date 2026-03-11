import { User } from '@/db';

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { DEVICES } from '3u-aura-common';

export const CurrentUser = createParamDecorator(
  (_, context: ExecutionContext) => {
    return context.switchToHttp().getRequest().user as User & {
      device: DEVICES;
    };
  },
);
