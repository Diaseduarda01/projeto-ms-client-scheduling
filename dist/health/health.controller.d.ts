import { PrismaService } from '../prisma.service';
export declare class HealthController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    check(): Promise<{
        status: string;
        timestamp: string;
        service: string;
        checks: {
            database: string;
        };
    }>;
    private checkDatabase;
}
