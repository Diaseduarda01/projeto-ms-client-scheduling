import { Module } from '@nestjs/common';
import { ClienteController } from './cliente.controller';
import { ClienteService } from './cliente.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [ClienteController],
  providers: [ClienteService, PrismaService],
  exports: [ClienteService],
})
export class ClienteModule {}
