require('dotenv').config();
const { BigQuery } = require('@google-cloud/bigquery');

const projectId = process.env.GCP_PROJECT_ID;
const keyFilename = process.env.GCP_KEYFILE_PATH;

const bigquery =
  projectId && keyFilename ? new BigQuery({ projectId, keyFilename }) : null;

module.exports = { bigquery };
