-- CreateTable
CREATE TABLE `Cliente` (
    `id` VARCHAR(191) NOT NULL,
    `googleId` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `fotoPerfil` VARCHAR(191) NULL,
    `telefone` VARCHAR(191) NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Cliente_googleId_key`(`googleId`),
    UNIQUE INDEX `Cliente_email_key`(`email`),
    INDEX `Cliente_googleId_idx`(`googleId`),
    INDEX `Cliente_email_idx`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BookingSession` (
    `id` VARCHAR(191) NOT NULL,
    `clienteId` VARCHAR(191) NOT NULL,
    `empresaId` VARCHAR(191) NOT NULL,
    `empresaSlug` VARCHAR(191) NOT NULL,
    `servicoId` VARCHAR(191) NOT NULL,
    `servicoNome` VARCHAR(191) NOT NULL,
    `servicoPreco` DECIMAL(10, 2) NOT NULL,
    `funcionarioId` VARCHAR(191) NULL,
    `funcionarioNome` VARCHAR(191) NULL,
    `dataHoraInicio` DATETIME(3) NOT NULL,
    `dataHoraFim` DATETIME(3) NOT NULL,
    `status` ENUM('RASCUNHO', 'AGUARDANDO_PAGAMENTO', 'CONFIRMADO', 'EXPIRADO', 'CANCELADO', 'CONCLUIDO') NOT NULL DEFAULT 'RASCUNHO',
    `valorGarantia` DECIMAL(10, 2) NULL,
    `pixCobrancaId` VARCHAR(191) NULL,
    `pixQrCode` TEXT NULL,
    `pixQrCodeBase64` TEXT NULL,
    `pixExpiracao` DATETIME(3) NULL,
    `agendamentoErpId` VARCHAR(191) NULL,
    `cancelToken` VARCHAR(191) NOT NULL,
    `criadaEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadaEm` DATETIME(3) NOT NULL,
    `expiraEm` DATETIME(3) NULL,

    UNIQUE INDEX `BookingSession_cancelToken_key`(`cancelToken`),
    INDEX `BookingSession_clienteId_idx`(`clienteId`),
    INDEX `BookingSession_empresaSlug_idx`(`empresaSlug`),
    INDEX `BookingSession_pixCobrancaId_idx`(`pixCobrancaId`),
    INDEX `BookingSession_cancelToken_idx`(`cancelToken`),
    INDEX `BookingSession_status_expiraEm_idx`(`status`, `expiraEm`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `BookingSession` ADD CONSTRAINT `BookingSession_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `Cliente`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
