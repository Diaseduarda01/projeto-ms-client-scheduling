# ms-client-scheduling — TODO

## Fase 1 — Setup ✅

- [x] Scaffold NestJS em `ms-client-scheduling/`
- [x] Configurar Prisma + migration `Cliente` + `BookingSession`
- [x] Configurar `ThrottlerModule`
- [x] `TenantInterceptor` — resolve `:slug` → empresaId via ms-erp-api
- [x] `ErpClientService` com `HttpService`
- [x] Health check em `/health`
- [x] Dockerfile + `.env.example`

## Fase 2 — Autenticação Google ✅

- [x] Instalar `passport`, `passport-google-oauth20`, `@nestjs/passport`, `@nestjs/jwt`, `cookie-parser`
- [x] `GoogleStrategy` — `findOrCreate` pelo `googleId`
- [x] `JwtStrategy` — lê cookie `access_token`
- [x] `GET /auth/google` + `GET /auth/google/callback`
  - [x] Redireciona para `/onboarding` se `telefone` nulo
  - [x] Redireciona para `/` se perfil completo
- [x] `GET /auth/me` + `POST /auth/logout`
- [x] `PATCH /clientes/me/telefone` — onboarding de telefone
- [x] `GET /clientes/me/agendamentos` — histórico de agendamentos

## Fase 3 — Catálogo e Agendamento

- [ ] `GET /catalog/:slug/servicos` — proxy ms-erp-api
- [ ] `GET /catalog/:slug/profissionais`
- [ ] `GET /catalog/:slug/disponibilidade`
- [ ] `POST /book/:slug/sessao` — requer JWT; usa dados do `Cliente` logado
- [ ] `POST /book/:slug/sessao/:sessionId/confirmar` — Bronze
- [ ] `GET /book/:slug/sessao/:sessionId` — polling de status
- [ ] `GET /clientes/me/agendamentos`

## Fase 4 — Pagamento (Platinum+)

- [ ] `PaymentService` — chama ms-financeiro para gerar Pix
- [ ] `POST /book/:slug/sessao/:sessionId/pix`
- [ ] `POST /webhook/pagamento` — recebe AbacatePay, valida HMAC, confirma sessão
- [ ] Cron job de expiração de sessões (a cada 5 min)

## Fase 5 — Cancelamento e Notificações

- [ ] `DELETE /book/cancelar/:cancelToken` — cancelamento público por link
- [ ] `NotificationsService` publicando eventos no RabbitMQ

## Fase 6 — Qualidade

- [ ] Testes unitários: `AuthService`, `BookingService`, `PaymentService`
- [ ] Testes de integração com Testcontainers (MySQL + RabbitMQ)
- [ ] Teste do fluxo OAuth com mock do Google
- [ ] Teste do webhook com mock do AbacatePay
- [ ] Swagger operacional em `/api`

---

## Notas

- **Prisma:** v6.19.3 (downgrade do v7 por incompatibilidade com NestJS)
- **Banco:** MySQL 8.0 via `dias-mysql` container (porta 3306)
- **Porta:** 3003
