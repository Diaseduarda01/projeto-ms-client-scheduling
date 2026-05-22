import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { ErpClientModule } from '../erp-client/erp-client.module';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [ScheduleModule.forRoot(), ErpClientModule],
  controllers: [PaymentController],
  providers: [PaymentService, PrismaService],
  exports: [PaymentService],
})
export class PaymentModule {}
