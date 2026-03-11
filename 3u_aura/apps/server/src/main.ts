import { Logger, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService: ConfigService = app.get(ConfigService);

  // Cors
  app.enableCors(await configService.get('cors'));

  app.setGlobalPrefix(await configService.get('api.prefix', 'api'));

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  const port = await configService.get<number>('port', 3010);
  (app as any).logger.log(`Nest Application now listen port: ${port}`);
  await app.listen(port);
}
bootstrap().catch((error) => {
  new Logger('Server').error(error.message, error);
  process.exit(1);
});
