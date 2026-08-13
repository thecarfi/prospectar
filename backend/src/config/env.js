require('dotenv').config();

const obrigatorias = ['DATABASE_URL', 'JWT_SECRET'];

for (const chave of obrigatorias) {
  if (!process.env[chave]) {
    console.error(`Variável de ambiente obrigatória ausente: ${chave}`);
    process.exit(1);
  }
}

module.exports = {
  port: Number(process.env.PORT) || 3000,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  cnpjWsTimeoutMs: Number(process.env.CNPJ_WS_TIMEOUT_MS) || 10000,
  cnpjWsTentativas: Number(process.env.CNPJ_WS_TENTATIVAS) || 3,
  admin: {
    nome: process.env.ADMIN_NOME || 'Administrador',
    email: process.env.ADMIN_EMAIL || 'admin@gestao.com.br',
    senha: process.env.ADMIN_SENHA || 'admin123',
  },
};
