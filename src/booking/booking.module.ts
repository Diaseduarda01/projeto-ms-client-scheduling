import { Module } from '@nestjs/common';
import { BookingController } from './booking.controller';
import { CancelController } from './cancel.controller';
import { BookingService } from './booking.service';
import { ErpClientModule } from '../erp-client/erp-client.module';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [ErpClientModule],
  controllers: [BookingController, CancelController],
  providers: [BookingService, PrismaService],
  exports: [BookingService],
})
export class BookingModule {}
