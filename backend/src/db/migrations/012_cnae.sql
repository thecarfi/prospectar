-- Migration 012: tabela CNAE (classificação de atividades econômicas)

CREATE TABLE IF NOT EXISTS cnae (
    subclasse           VARCHAR(7)  PRIMARY KEY,
    descricao_subclasse TEXT        NOT NULL,
    classe              VARCHAR(5)  NOT NULL,
    descricao_classe    TEXT        NOT NULL,
    grupo               VARCHAR(3)  NOT NULL,
    descricao_grupo     TEXT        NOT NULL,
    divisao             VARCHAR(2)  NOT NULL,
    descricao_divisao   TEXT        NOT NULL,
    secao               VARCHAR(1)  NOT NULL,
    descricao_secao     TEXT        NOT NULL,
    indicador_cnae_2_0  SMALLINT    NOT NULL DEFAULT 0,
    indicador_cnae_2_1  SMALLINT    NOT NULL DEFAULT 0,
    indicador_cnae_2_2  SMALLINT    NOT NULL DEFAULT 0,
    indicador_cnae_2_3  SMALLINT    NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_cnae_secao    ON cnae (secao);
CREATE INDEX IF NOT EXISTS idx_cnae_divisao  ON cnae (divisao);
CREATE INDEX IF NOT EXISTS idx_cnae_grupo    ON cnae (grupo);
CREATE INDEX IF NOT EXISTS idx_cnae_classe   ON cnae (classe);
