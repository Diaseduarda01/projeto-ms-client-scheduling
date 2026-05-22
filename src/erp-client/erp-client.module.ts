import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ErpClientService } from './erp-client.service';

@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        baseURL: config.get<string>('ERP_API_URL'),
        headers: {
          'X-Internal-Api-Key': config.get<string>('ERP_INTERNAL_API_KEY'),
        },
        timeout: 10000,
      }),
    }),
  ],
  providers: [ErpClientService],
  exports: [ErpClientService],
})
export class ErpClientModule {}
