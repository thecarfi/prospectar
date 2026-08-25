require('dotenv').config();
const fs = require('fs');
const app = require('./app');
const env = require('./config/env');

if (process.env.GCP_PROJECT_ID && process.env.GCP_KEYFILE_PATH) {
  const chavePresente = fs.existsSync(process.env.GCP_KEYFILE_PATH);
  console.log(
    `BigQuery: configurado=true, chave_presente=${chavePresente} (${process.env.GCP_KEYFILE_PATH})`
  );
} else {
  console.log('BigQuery: configurado=false');
}

app.listen(env.port, () => {
  console.log(`API rodando em http://localhost:${env.port}`);
});
