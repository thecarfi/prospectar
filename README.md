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
| `clientes` | Dados do cliente (nome, cpf_cnpj, segmentos, município, status, observações) |
| `status_clientes` | Status parametrizáveis aplicáveis ao cliente (nome, descrição, cor) |
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

O acesso ao módulo **Configurações** (menu e rota) é controlado por `configuracao:ver`; cada
aba dentro dele tem permissão própria: `segmentos:ver` (aba Segmentos) e `status_clientes:ver`
(aba Status de Clientes).

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
| GET | `/api/localizacao/estados` | autenticado (qualquer papel) |
| GET | `/api/localizacao/municipios` | autenticado (qualquer papel) |
| GET/POST/PUT/DELETE | `/api/segmentos` | `segmentos:ver` / `segmentos:criar` / `segmentos:editar` / `segmentos:excluir` |
| GET/POST/PUT/DELETE | `/api/status-clientes` | `status_clientes:ver` / `status_clientes:criar` / `status_clientes:editar` / `status_clientes:excluir` |
| GET/POST/PUT/DELETE | `/api/usuarios` | `usuarios:ver` / `usuarios:gerenciar` |

Busca e filtros em `GET /api/clientes`: `busca` (nome/CPF/CNPJ), `cidade` (nome do município),
`estado` (UF), `segmento_id`, `status_id`, `pagina`, `limite`,
`ordenar_por` (nome, criado_em, cidade), `direcao`.

## Consulta CNPJ e campo json_coletado

Ao utilizar a funcionalidade **"Consultar online"** no formulário de criação/edição de cliente,
o sistema consulta a API externa `publica.cnpj.ws` e armazena o JSON completo retornado no
campo `json_coletado` (JSONB) da tabela `clientes`. Esse campo preserva todos os dados
originais da Receita Federal (razão social, endereço, CNAEs, sócios, situação cadastral, etc.).

O campo é preenchido automaticamente ao clicar em "Consultar online" e depois "Salvar", e
fica disponível via API para consulta e atualização.

## Estrutura do body — POST/PUT `/api/clientes`

| Campo | Tipo | Obrigatório (POST) | Descrição |
| --- | --- | --- | --- |
| `nome` | string | Sim | Nome do cliente |
| `cpf_cnpj` | string | Não | CPF ou CNPJ (até 18 caracteres) |
| `status_id` | number | Não | ID do status (padrão: primeiro cadastrado) |
| `segmento_ids` | number[] | Não | IDs dos segmentos vinculados |
| `observacoes` | string | Não | Observações livres |
| `json_coletado` | object \| null | Não | JSON retornado da API publica.cnpj.ws |
| `logradouro` | string | Não | Logradouro do endereço principal |
| `numero` | string | Não | Número do endereço |
| `complemento` | string | Não | Complemento |
| `bairro` | string | Não | Bairro |
| `cep` | string | Não | CEP (até 10 caracteres) |
| `municipio_id` | number | Não | ID do município (IBGE) |
| `cnaes` | array | Não | `[{ "subclasse": "string", "principal": true }]` |
| `contatos` | array | Não | `[{ "nome": "string", "email": "string", "telefone": "string", "cargo": "string" }]` |

> **Nota:** No `PUT`, todos os campos são opcionais. Apenas os campos enviados são atualizados;
> campos omitidos mantêm o valor anterior.

Exemplo de body com `json_coletado`:

```json
{
  "nome": "Empresa Exemplo LTDA",
  "cpf_cnpj": "12.345.678/0001-90",
  "status_id": 1,
  "json_coletado": {
    "cnpj_raiz": "12345678",
    "razao_social": "Empresa Exemplo LTDA",
    "estabelecimento": {
      "logradouro": "RUA EXEMPLO",
      "numero": "100",
      "estado": { "sigla": "SP" },
      "cidade": { "nome": "São Paulo" }
    }
  },
  "logradouro": "RUA EXEMPLO",
  "numero": "100",
  "municipio_id": 527
}
```

## Estrutura da resposta — GET `/api/clientes/:id`

```json
{
  "id": 1,
  "nome": "Empresa Exemplo LTDA",
  "cpf_cnpj": "12.345.678/0001-90",
  "status_id": 1,
  "status_nome": "Ativo",
  "status_descricao": "Cliente ativo",
  "status_cor": "#4CAF50",
  "json_coletado": {
    "cnpj_raiz": "12345678",
    "razao_social": "Empresa Exemplo LTDA",
    "estabelecimento": { "..." : "..." }
  },
  "observacoes": "Cliente importado via API",
  "criado_por": 1,
  "criado_em": "2026-08-24T10:00:00.000Z",
  "atualizado_em": "2026-08-24T10:00:00.000Z",
  "contatos": [
    { "id": 1, "nome": "Contato", "email": "contato@exemplo.com", "telefone": "11-33334444", "cargo": null }
  ],
  "enderecos": [
    { "id": 1, "logradouro": "RUA EXEMPLO", "numero": "100", "complemento": null, "bairro": "Centro", "municipio_id": 527, "municipio_nome": "São Paulo", "municipio_uf": "SP", "cep": "01001-000", "principal": true }
  ],
  "endereco_principal": { "..." : "..." },
  "interacoes": [],
  "segmentos": [
    { "id": 1, "nome": "Indústria", "descricao": null }
  ],
  "cnaes": [
    { "secao": "C", "divisao": "20", "grupo": "20.9", "classe": "20.93-2", "subclasse": "2093-2/00", "descricao_subclasse": "Fabricação de aditivos de uso industrial", "principal": true }
  ]
}
```

## Migrations

Os arquivos em `backend/src/db/migrations/` são aplicados em ordem por `npm run migrate` e
registrados na tabela `schema_migrations` (execução idempotente).

## Observações de segurança

- O segredo JWT e as credenciais do banco ficam no `backend/.env` (não versionado).
- Senhas armazenadas com bcrypt (hash + salt).
- Altere o usuário e a senha do admin padrão (`backend/.env` → `npm run seed`) em produção.
# prospectar
Sistema com objetivo de realizar gestão de prospecção de clientes antigo e novos.
