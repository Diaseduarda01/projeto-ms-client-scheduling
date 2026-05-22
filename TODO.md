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

## Fase 3 — Catálogo e Agendamento ✅

- [x] `GET /catalog/:slug/servicos` — proxy ms-erp-api
- [x] `GET /catalog/:slug/profissionais`
- [x] `GET /catalog/:slug/disponibilidade`
- [x] `POST /book/:slug/sessao` — requer JWT; usa dados do `Cliente` logado
- [x] `POST /book/:slug/sessao/:sessionId/confirmar` — Bronze
- [x] `GET /book/:slug/sessao/:sessionId` — polling de status
- [x] `GET /clientes/me/agendamentos` (já implementado na Fase 2)

## Fase 4 — Pagamento (Platinum+) ✅

- [x] `PaymentService` — chama ms-financeiro para gerar Pix
- [x] `POST /book/:slug/sessao/:sessionId/pix`
- [x] `POST /webhook/pagamento` — recebe AbacatePay, valida HMAC, confirma sessão
- [x] Cron job de expiração de sessões (a cada 5 min)

## Fase 5 — Cancelamento e Notificações ✅

- [x] `DELETE /book/cancelar/:cancelToken` — cancelamento público por link
- [x] `NotificationsService` publicando eventos no RabbitMQ
  - [x] `booking.confirmado` — após confirmação (Bronze ou pagamento)
  - [x] `booking.expirado` — após expiração de sessão
  - [x] `booking.cancelado` — após cancelamento pelo cliente

## Fase 6 — Qualidade

- [ ] Testes unitários: `AuthService`, `BookingService`, `PaymentService`
- [ ] Testes de integração com Testcontainers (MySQL + RabbitMQ)
- [ ] Teste do fluxo OAuth com mock do Google
- [ ] Teste do webhook com mock do AbacatePay
- [ ] Swagger operacional em `/api`

---

## Frontend — Telas ✅

### Autenticação
- [x] `LoginPage` — Botão "Entrar com Google", branding da empresa
- [x] `OnboardingPage` — Coleta de telefone (pós-login se `precisaOnboarding`)

### Fluxo de Agendamento
- [x] `HomePage` — Landing com CTA "Agendar agora", info da empresa
- [x] `ServicosPage` — Lista de serviços com preço e duração
- [x] `ProfissionaisPage` — Seleção de profissional (ou "qualquer disponível")
- [x] `CalendarioPage` — Seleção de data + horários disponíveis
- [x] `ResumoPage` — Resumo do agendamento (serviço, profissional, data, valor)
- [x] `PagamentoPage` — QR Code Pix + timer 15min + polling status (Platinum+)
- [x] `ConfirmacaoPage` — Sucesso + detalhes + link cancelamento

### Área do Cliente
- [x] `MeusAgendamentosPage` — Histórico de agendamentos

### Componentes Compartilhados
- [x] `Header` — Logo empresa, avatar usuário, menu dropdown
- [x] `Stepper` — Indicador de etapas (1-4)
- [x] `ServicoCard` — Card de serviço com preço e duração
- [x] `ProfissionalCard` — Card de profissional com foto
- [x] `HorarioSlot` — Slot de horário disponível com nome do profissional
- [x] `LoadingSpinner` — Loading states (sm, md, lg)

### Layout & Rotas (React Router) ✅
```
/login                      → LoginPage
/onboarding                 → OnboardingPage
/:slug                      → HomePage (tenant)
/:slug/servicos             → ServicosPage
/:slug/profissionais        → ProfissionaisPage
/:slug/calendario           → CalendarioPage
/:slug/resumo               → ResumoPage
/:slug/pagamento            → PagamentoPage
/:slug/confirmacao          → ConfirmacaoPage
/meus-agendamentos          → MeusAgendamentosPage
```

---

## Notas

- **Prisma:** v6.19.3 (downgrade do v7 por incompatibilidade com NestJS)
- **Banco:** MySQL 8.0 via `dias-mysql` container (porta 3306)
- **Porta:** 3003
- **Frontend:** React 19 + Vite + React Router + Tailwind CSS v4
- **Design:** Interface limpa com bordas arredondadas (rounded-2xl, rounded-3xl)
