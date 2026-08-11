# Sistema de Gestão de Clientes

Sistema web de gestão de clientes com controle de acesso por permissões granulares (RBAC).

## Stack

- **Backend:** Node.js + Express, PostgreSQL, JWT, bcryptjs
- **Frontend:** Angular + Angular Material
- **Banco de dados:** PostgreSQL 18 (local)

## Estrutura

```
gestao_clientes_sistema/
├── backend/            # API REST (Express)
│   └── src/
│       ├── config/     # env e pool do banco
│       ├── db/         # migrations e seed
│       ├── middleware/ # auth JWT, RBAC, validação, erros
│       ├── modules/    # auth, usuarios, clientes, contatos, enderecos, interacoes
│       └── routes/
├── frontend/           # SPA (Angular)
│   └── src/app/
│       ├── core/       # models, services, guards, interceptors, directiva
│       ├── layout/     # shell com menu lateral
│       ├── pages/      # login, dashboard, clientes, usuarios
│       └── shared/     # diálogo de confirmação
└── package.json        # scripts orquestradores
```

## Requisitos

- Node.js 20+
- PostgreSQL (a configuração assume o serviço local na porta 5432)
- npm (no Windows, se `npm.ps1` estiver bloqueado, use `npm.cmd`)

## Configuração inicial

1. Criar o banco de dados:

```powershell
psql -U postgres -h localhost -c "CREATE DATABASE gestao_clientes;"
```

2. Configurar variáveis de ambiente do backend:

```powershell
Copy-Item backend/.env.example backend/.env
# edite backend/.env: DATABASE_URL, JWT_SECRET, ADMIN_EMAIL, ADMIN_SENHA
```

3. Instalar dependências:

```powershell
npm.cmd run install:all
```

4. Criar tabelas e popular permissões/usuario admin:

```powershell
npm.cmd run migrate
npm.cmd run seed
```

## Execução

Terminal 1 (API — porta 3000):

```powershell
npm.cmd run dev:backend
```

Terminal 2 (frontend — porta 4200, com proxy para a API):

```powershell
npm.cmd run dev:frontend
```

Acesse http://localhost:4200 e faça login com o admin padrão criado no seed.

## Modelo de dados (tabelas em português)

| Tabela | Descrição |
| --- | --- |
| `usuarios` | Usuários do sistema (nome, email, senha hash, papel, ativo) |
| `permissoes` | Permissões granulares (modulo + acao) |
| `papel_permissoes` | Vínculo entre papéis e permissões |
| `clientes` | Dados do cliente (nome, cpf_cnpj, segmento, município, status, observações) |
| `contatos` | Contatos do cliente (nome, email, telefone, cargo) |
| `enderecos` | Endereços do cliente (logradouro, bairro, município, CEP, principal) |
| `interacoes` | Histórico de interações (ligação, visita, anotação, mensagem) |
| `localizacao` | Estados e municípios de referência (IBGE), vinculados via `municipio_id` |

## Papéis e permissões

- **Admin:** todas as permissões, inclusive gestão de usuários.
- **Operador:** visualiza, cria e edita clientes/contatos/endereços/interações.
- **Visualizador:** somente leitura.

Permissões granulares (ex.: `clientes:criar`, `contatos:editar`, `usuarios:gerenciar`) são
validadas no backend pelo middleware `requirePermission` e refletidas no frontend por guards
e pela diretiva `appPermissao`.

## Endpoints principais

| Método | Rota | Permissão |
| --- | --- | --- |
| POST | `/api/auth/login` | pública |
| GET | `/api/auth/me` | autenticado |
| GET | `/api/clientes` | `clientes:ver` |
| GET | `/api/clientes/estatisticas` | `clientes:ver` |
| GET | `/api/clientes/:id` | `clientes:ver` |
| POST | `/api/clientes` | `clientes:criar` |
| PUT | `/api/clientes/:id` | `clientes:editar` |
| DELETE | `/api/clientes/:id` | `clientes:excluir` |
| GET/POST | `/api/clientes/:id/contatos` | `contatos:ver` / `contatos:criar` |
| GET/POST | `/api/clientes/:id/enderecos` | `enderecos:ver` / `enderecos:criar` |
| GET/POST | `/api/clientes/:id/interacoes` | `interacoes:ver` / `interacoes:criar` |
| GET | `/api/localizacao/estados` | `localizacao:ver` |
| GET | `/api/localizacao/municipios` | `localizacao:ver` |
| GET/POST/PUT/DELETE | `/api/usuarios` | `usuarios:ver` / `usuarios:gerenciar` |

Busca e filtros em `GET /api/clientes`: `busca` (nome/CPF/CNPJ), `cidade` (nome do município),
`estado` (UF), `segmento`, `status`, `pagina`, `limite`,
`ordenar_por` (nome, criado_em, cidade), `direcao`.

## Migrations

Os arquivos em `backend/src/db/migrations/` são aplicados em ordem por `npm run migrate` e
registrados na tabela `schema_migrations` (execução idempotente).

## Observações de segurança

- O segredo JWT e as credenciais do banco ficam no `backend/.env` (não versionado).
- Senhas armazenadas com bcrypt (hash + salt).
- Altere o usuário e a senha do admin padrão (`backend/.env` → `npm run seed`) em produção.
# prospectar
Sistema com objetivo de realizar gestão de prospecção de clientes antigo e novos.
