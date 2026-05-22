# ms-client-scheduling — Portal de Agendamento do Cliente

## Visão Geral

Portal onde o cliente cria uma conta via **Google OAuth**, agenda seu horário e confirma o agendamento pagando **50% do valor do serviço** como garantia antecipada via Pix (AbacatePay). O login elimina cadastros manuais e garante identidade real; a garantia elimina faltas e no-shows.

**Stack:** NestJS + TypeScript + Prisma + MySQL  
**Auth:** Google OAuth 2.0 + JWT (cookie HttpOnly)  
**Plano mínimo:** Bronze (agendamento sem pagamento) / Platinum+ (com garantia de pagamento)  
**URL pública:** `https://agenda.{empresaSlug}.com.br`

---

## Fluxo Principal

```
[LOGIN] Entrar com Google
     ↓ (primeira vez: coletar telefone)
[PASSO 1] Escolher Serviço
     ↓
[PASSO 2] Escolher Profissional (ou "qualquer disponível")
     ↓
[PASSO 3] Escolher Data → Horários livres
     ↓
[PASSO 4] Resumo + confirmação (dados já preenchidos do perfil)
     ↓
[PASSO 5] Geração do Pix (50% do valor) — Platinum+
     ↓
[AGUARDANDO] Cliente tem até 15 min para pagar
     ↓ (webhook AbacatePay)
[FIM] Agendamento CONFIRMADO → notificação enviada
```

> **Bronze:** o Passo 5 não existe — o agendamento é confirmado direto no Passo 4.

### Estados do Agendamento

| Status | Descrição |
|---|---|
| `RASCUNHO` | Dados selecionados, aguardando confirmação do cliente |
| `AGUARDANDO_PAGAMENTO` | Pix gerado, aguardando confirmação (TTL: 15 min) |
| `CONFIRMADO` | Agendamento confirmado (com ou sem pagamento conforme plano) |
| `EXPIRADO` | Pix não pago dentro do TTL — vaga liberada |
| `CANCELADO` | Cancelado pelo cliente via área logada ou token |
| `CONCLUIDO` | Atendimento realizado (sincronizado do ms-erp-api) |

---

## Arquitetura do Serviço

```
ms-client-scheduling/
├── src/
│   ├── app.module.ts
│   ├── main.ts
│   │
│   ├── auth/                           # Google OAuth + sessão JWT
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts          # /auth/google, /auth/callback, /auth/me, /auth/logout
│   │   ├── auth.service.ts
│   │   ├── strategies/
│   │   │   ├── google.strategy.ts      # PassportStrategy(Google)
│   │   │   └── jwt.strategy.ts         # PassportStrategy(JWT) — lê cookie
│   │   └── guards/
│   │       ├── google-auth.guard.ts
│   │       └── jwt-auth.guard.ts
│   │
│   ├── cliente/                        # Perfil do cliente logado
│   │   ├── cliente.module.ts
│   │   ├── cliente.controller.ts       # /clientes/me, PATCH /clientes/me/telefone
│   │   ├── cliente.service.ts
│   │   └── dto/
│   │       ├── cliente-profile.dto.ts
│   │       └── update-telefone.dto.ts
│   │
│   ├── booking/                        # Módulo de agendamento
│   │   ├── booking.module.ts
│   │   ├── booking.controller.ts       # Protegido por JwtAuthGuard
│   │   ├── booking.service.ts
│   │   └── dto/
│   │       ├── create-booking.dto.ts
│   │       ├── booking-response.dto.ts
│   │       └── payment-status.dto.ts
│   │
│   ├── payment/                        # Garantia de pagamento (Platinum+)
│   │   ├── payment.module.ts
│   │   ├── payment.service.ts
│   │   ├── payment-webhook.controller.ts  # Público — chamado pelo AbacatePay
│   │   └── dto/
│   │       └── webhook-payload.dto.ts
│   │
│   ├── catalog/                        # Catálogo público (sem login)
│   │   ├── catalog.module.ts
│   │   └── catalog.controller.ts       # /catalog/:slug/* — sem auth
│   │
│   ├── erp-client/                     # HTTP client para ms-erp-api
│   │   ├── erp-client.module.ts
│   │   └── erp-client.service.ts
│   │
│   ├── notifications/                  # Publica eventos no RabbitMQ
│   │   ├── notifications.module.ts
│   │   └── notifications.service.ts
│   │
│   └── common/
│       ├── guards/
│       │   └── rate-limit.guard.ts
│       └── interceptors/
│           └── tenant.interceptor.ts   # Resolve :slug → empresaId
│
├── prisma/
│   └── schema.prisma
├── Dockerfile
├── .env.example
└── package.json
```

---

## Schema de Banco de Dados

```prisma
// prisma/schema.prisma

model Cliente {
  id             String           @id @default(uuid())
  googleId       String           @unique
  email          String           @unique
  nome           String
  fotoPerfil     String?
  telefone       String?          // Coletado em onboarding pós-login
  criadoEm       DateTime         @default(now())
  atualizadoEm   DateTime         @updatedAt
  sessions       BookingSession[]

  @@index([googleId])
  @@index([email])
}

model BookingSession {
  id               String        @id @default(uuid())
  clienteId        String
  cliente          Cliente       @relation(fields: [clienteId], references: [id])
  empresaId        String
  empresaSlug      String
  servicoId        String
  servicoNome      String
  servicoPreco     Decimal       @db.Decimal(10, 2)
  funcionarioId    String?
  funcionarioNome  String?
  dataHoraInicio   DateTime
  dataHoraFim      DateTime
  status           BookingStatus @default(RASCUNHO)
  valorGarantia    Decimal?      @db.Decimal(10, 2)   // 50% — nulo se Bronze
  pixCobrancaId    String?
  pixQrCode        String?       @db.Text
  pixQrCodeBase64  String?       @db.Text
  pixExpiracao     DateTime?
  agendamentoErpId String?       // ID no ms-erp-api após confirmação
  cancelToken      String        @unique @default(uuid())
  criadaEm         DateTime      @default(now())
  atualizadaEm     DateTime      @updatedAt
  expiraEm         DateTime?

  @@index([clienteId])
  @@index([empresaSlug])
  @@index([pixCobrancaId])
  @@index([cancelToken])
  @@index([status, expiraEm])
}

enum BookingStatus {
  RASCUNHO
  AGUARDANDO_PAGAMENTO
  CONFIRMADO
  EXPIRADO
  CANCELADO
  CONCLUIDO
}
```

---

## Autenticação Google OAuth

### Fluxo OAuth

```
1. Cliente clica "Entrar com Google"
2. Redirect → GET /auth/google (Passport inicia OAuth)
3. Google autentica → callback GET /auth/google/callback
4. auth.service.findOrCreateCliente(googleProfile)
   ├── Novo cliente: cria registro, redireciona para /onboarding (coleta telefone)
   └── Cliente existente: redireciona para /book/:slug (última empresa visitada ou home)
5. JWT assinado → cookie HttpOnly "access_token" (7 dias)
```

### Endpoints de Auth

```
GET  /auth/google                    # Inicia OAuth (público)
GET  /auth/google/callback           # Callback do Google (público)
GET  /auth/me                        # Retorna perfil do cliente logado (JWT guard)
POST /auth/logout                    # Limpa cookie (JWT guard)

PATCH /clientes/me/telefone          # Onboarding: salva telefone (JWT guard)
GET   /clientes/me/agendamentos      # Histórico de agendamentos do cliente (JWT guard)
```

### Resposta de `/auth/me`

```json
{
  "id": "cli_abc",
  "nome": "Maria Silva",
  "email": "maria@gmail.com",
  "fotoPerfil": "https://lh3.googleusercontent.com/...",
  "telefone": "11999999999",
  "precisaOnboarding": false
}
```

> `precisaOnboarding: true` quando `telefone` é nulo — o frontend redireciona para a tela de coleta de telefone antes de permitir o agendamento.

### JWT Payload

```json
{
  "sub": "cli_abc",
  "email": "maria@gmail.com",
  "iat": 1716163200,
  "exp": 1716768000
}
```

Cookie: `access_token`, HttpOnly, Secure, SameSite=Lax, Path=/

---

## API Endpoints

### Catálogo (sem autenticação — browsing público)

```
GET /catalog/:slug/servicos
GET /catalog/:slug/profissionais?servicoId=
GET /catalog/:slug/disponibilidade?servicoId=&funcionarioId=&data=YYYY-MM-DD
```

#### `GET /catalog/:slug/servicos`
```json
[
  {
    "id": "srv_123",
    "nome": "Corte Feminino",
    "descricao": "Corte + lavagem",
    "duracaoMinutos": 60,
    "preco": "120.00",
    "valorGarantia": "60.00"
  }
]
```

#### `GET /catalog/:slug/disponibilidade`
```json
{
  "data": "2026-05-20",
  "horarios": [
    { "inicio": "09:00", "fim": "10:00", "funcionarioId": "fun_1", "funcionarioNome": "Ana" },
    { "inicio": "10:00", "fim": "11:00", "funcionarioId": "fun_2", "funcionarioNome": "Carlos" }
  ]
}
```

---

### Agendamento (requer JWT)

```
POST /book/:slug/sessao                    # Cria sessão de agendamento
POST /book/:slug/sessao/:sessionId/pix    # Gera Pix (Platinum+)
GET  /book/:slug/sessao/:sessionId        # Consulta status (polling)
POST /book/:slug/sessao/:sessionId/confirmar  # Confirma sem pagamento (Bronze)
DELETE /book/cancelar/:cancelToken        # Cancelamento (público — via link de notificação)
```

#### `POST /book/:slug/sessao`
Request — o nome/email/telefone vêm do `Cliente` autenticado, não do body:
```json
{
  "servicoId": "srv_123",
  "funcionarioId": "fun_1",
  "dataHoraInicio": "2026-05-20T09:00:00"
}
```
Response:
```json
{
  "sessionId": "sess_abc123",
  "status": "RASCUNHO",
  "resumo": {
    "servico": "Corte Feminino",
    "profissional": "Ana",
    "dataHora": "2026-05-20T09:00:00",
    "valorTotal": "120.00",
    "valorGarantia": "60.00",
    "cliente": {
      "nome": "Maria Silva",
      "telefone": "11999999999"
    }
  }
}
```

#### `POST /book/:slug/sessao/:sessionId/pix` (Platinum+)
```json
{
  "sessionId": "sess_abc123",
  "status": "AGUARDANDO_PAGAMENTO",
  "pix": {
    "qrCode": "00020126...",
    "qrCodeBase64": "data:image/png;base64,...",
    "valor": "60.00",
    "expiracao": "2026-05-20T09:20:00",
    "ttlSegundos": 900
  }
}
```

#### `POST /book/:slug/sessao/:sessionId/confirmar` (Bronze)
Confirma diretamente sem pagamento — cria agendamento no ms-erp-api na hora.
```json
{ "sessionId": "sess_abc123", "status": "CONFIRMADO", "cancelToken": "tok_qrs789" }
```

#### `GET /clientes/me/agendamentos`
Histórico do cliente logado (sincronizado do ms-erp-api).
```json
[
  {
    "id": "sess_abc123",
    "servicoNome": "Corte Feminino",
    "empresaSlug": "salao-da-ana",
    "dataHora": "2026-05-20T09:00:00",
    "status": "CONFIRMADO",
    "cancelToken": "tok_qrs789"
  }
]
```

---

## Integração com ms-erp-api

| Chamada | Endpoint no ms-erp-api | Quando |
|---|---|---|
| Listar serviços | `GET /public/:slug/servicos` | Catálogo |
| Listar profissionais | `GET /public/:slug/profissionais?servicoId=` | Catálogo |
| Consultar disponibilidade | `GET /public/:slug/disponibilidade` | Catálogo |
| Verificar disponibilidade antes de confirmar | `GET /internal/disponibilidade` | Antes de gerar Pix ou confirmar |
| Criar agendamento | `POST /internal/agendamentos` | Após pagamento confirmado ou Bronze direto |
| Cancelar agendamento | `DELETE /internal/agendamentos/:id` | Cancelamento pelo token |

> A vaga é bloqueada no ms-erp-api **somente após confirmação** (pagamento recebido no Platinum+ ou confirmação direta no Bronze). Conflito de horário retorna `409` — o serviço expira a sessão e instrui o cliente a escolher outro horário.

---

## Integração com ms-financeiro (AbacatePay)

```
ms-client-scheduling
       │
       ├─ POST /cobrancas → ms-financeiro
       │       payload: { empresaId, valor, descricao, pagador, ttlSegundos, metadados }
       │       retorna: { pixQrCode, pixQrCodeBase64, cobrancaId, expiracao }
       │
       └─ POST /webhook/pagamento ← AbacatePay  (rota pública)
               ↓ valida HMAC-SHA256 no header X-AbacatePay-Signature
               ↓ busca BookingSession por cobrancaId (idempotente)
               ↓ avança status → CONFIRMADO
               ↓ POST /internal/agendamentos no ms-erp-api
               ↓ publica booking.confirmado no RabbitMQ
```

---

## Eventos RabbitMQ

| Evento | Fila | Payload chave | Consumer |
|---|---|---|---|
| `booking.confirmado` | `notificacao.booking_confirmado` | `clienteNome, clienteTelefone, clienteEmail, servicoNome, dataHora, cancelToken, empresaId` | ms-notificacao |
| `booking.expirado` | `notificacao.booking_expirado` | `clienteNome, clienteTelefone, empresaId` | ms-notificacao |
| `booking.cancelado` | `notificacao.booking_cancelado` | `clienteNome, servicoNome, dataHora, empresaId` | ms-notificacao |

---

## Segurança

### Rate Limiting (ThrottlerModule)
- Catálogo (sem auth): máx. 60 req/min por IP
- Criação de sessão: máx. 10 sessões/hora por `clienteId`
- Geração de Pix: máx. 3 tentativas por sessão

### Cancelamento Self-Service
- Rota `DELETE /book/cancelar/:cancelToken` é **pública** — funciona sem login (via link no e-mail/WhatsApp)
- Validade: até 2h antes do agendamento (configurável)
- Política de reembolso da garantia: definida pela empresa — o serviço apenas cancela e notifica

### Webhook AbacatePay
- Verificação HMAC-SHA256 obrigatória
- Idempotência: `cobrancaId` já processado retorna `200` sem reprocessar

### Cookie JWT
- HttpOnly — não acessível por JavaScript
- Secure — apenas HTTPS
- SameSite=Lax — protege contra CSRF

---

## Widget Embeddável (iframe)

```html
<iframe
  src="https://agenda.{slug}.com.br/widget"
  width="100%"
  height="700"
  frameborder="0">
</iframe>
```

A rota `/widget` serve o portal em layout compacto (sem header/footer). O Google OAuth funciona normalmente dentro do iframe via redirect.

---

## Variáveis de Ambiente

```env
# .env.example

# Servidor
PORT=3003
NODE_ENV=production

# Banco de dados
DATABASE_URL=mysql://user:pass@ms-database:3306/client_scheduling

# Google OAuth
GOOGLE_CLIENT_ID=changeme.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=changeme
GOOGLE_CALLBACK_URL=https://agenda.{slug}.com.br/auth/google/callback

# JWT (cookie)
JWT_SECRET=changeme
JWT_EXPIRES_IN=7d
COOKIE_DOMAIN=.{slug}.com.br

# Integração interna
ERP_API_URL=http://ms-erp-api:3000
ERP_INTERNAL_API_KEY=changeme

# RabbitMQ
RABBITMQ_URL=amqp://user:pass@ms-rabbitmq:5672

# Pagamento (ms-financeiro)
FINANCEIRO_API_URL=http://ms-financeiro:3004
FINANCEIRO_INTERNAL_API_KEY=changeme
ABACATEPAY_WEBHOOK_SECRET=changeme

# Configurações de negócio
GARANTIA_PERCENTUAL=50
PIX_TTL_SEGUNDOS=900
CANCELAMENTO_ANTECEDENCIA_HORAS=2
```

---

## Checklist de Implementação

### Fase 1 — Setup ✅
- [x] Scaffold NestJS em `ms-client-scheduling/`
- [x] Configurar Prisma + migration `Cliente` + `BookingSession`
- [x] Configurar `ThrottlerModule`
- [x] `TenantInterceptor` — resolve `:slug` → empresaId via ms-erp-api
- [x] `ErpClientService` com `HttpService`
- [x] Health check em `/health`
- [x] Dockerfile + `.env.example`

### Fase 2 — Autenticação Google ✅
- [x] Instalar `passport`, `passport-google-oauth20`, `@nestjs/passport`, `@nestjs/jwt`, `cookie-parser`
- [x] `GoogleStrategy` — `findOrCreate` pelo `googleId`
- [x] `JwtStrategy` — lê cookie `access_token`
- [x] `GET /auth/google` + `GET /auth/google/callback`
  - [x] Redireciona para `/onboarding` se `telefone` nulo
  - [x] Redireciona para `/` se perfil completo
- [x] `GET /auth/me` + `POST /auth/logout`
- [x] `PATCH /clientes/me/telefone` — onboarding de telefone

### Fase 3 — Catálogo e Agendamento
- [ ] `GET /catalog/:slug/servicos` — proxy ms-erp-api
- [ ] `GET /catalog/:slug/profissionais`
- [ ] `GET /catalog/:slug/disponibilidade`
- [ ] `POST /book/:slug/sessao` — requer JWT; usa dados do `Cliente` logado
- [ ] `POST /book/:slug/sessao/:sessionId/confirmar` — Bronze
- [ ] `GET /book/:slug/sessao/:sessionId` — polling de status
- [ ] `GET /clientes/me/agendamentos`

### Fase 4 — Pagamento (Platinum+)
- [ ] `PaymentService` — chama ms-financeiro para gerar Pix
- [ ] `POST /book/:slug/sessao/:sessionId/pix`
- [ ] `POST /webhook/pagamento` — recebe AbacatePay, valida HMAC, confirma sessão
- [ ] Cron job de expiração de sessões (a cada 5 min)

### Fase 5 — Cancelamento e Notificações
- [ ] `DELETE /book/cancelar/:cancelToken` — cancelamento público por link
- [ ] `NotificationsService` publicando eventos no RabbitMQ

### Fase 6 — Qualidade
- [ ] Testes unitários: `AuthService`, `BookingService`, `PaymentService`
- [ ] Testes de integração com Testcontainers (MySQL + RabbitMQ)
- [ ] Teste do fluxo OAuth com mock do Google
- [ ] Teste do webhook com mock do AbacatePay
- [ ] Swagger operacional em `/api`

---

## Dependências entre Serviços

```
ms-client-scheduling
    ├── requer: ms-erp-api (catálogo + disponibilidade + criação de agendamento)
    ├── requer: ms-financeiro (geração de Pix — apenas Platinum+)
    ├── requer: ms-rabbitmq (publicação de eventos — apenas Bronze+)
    └── notifica: ms-notificacao (via RabbitMQ)
```
