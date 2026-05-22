import { Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller';
import { ErpClientModule } from '../erp-client/erp-client.module';

@Module({
  imports: [ErpClientModule],
  controllers: [CatalogController],
})
export class CatalogModule {}
