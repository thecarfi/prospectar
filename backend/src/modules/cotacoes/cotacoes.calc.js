const FATOR_CUBAGEM = 300;

const PARAMETROS_OBRIGATORIOS = [
  'seguro',
  'gris',
  'pedagio',
  'sec_cat',
  'valor_quilo',
  'frete_percentual',
];

function paraNumero(valor) {
  if (valor === null || valor === undefined || valor === '') {
    return 0;
  }
  if (typeof valor === 'number') {
    return Number.isFinite(valor) ? valor : Number.NaN;
  }
  const normalizado =
    String(valor).includes(',') && String(valor).includes('.')
      ? String(valor).replace(/\./g, '').replace(',', '.')
      : String(valor).replace(',', '.');
  return Number(normalizado);
}

function montarParametros(generalidades) {
  const mapa = {};
  generalidades.forEach((item) => {
    mapa[item.tipo_generalidade] = paraNumero(item.valor_generalidade);
  });
  return mapa;
}

function calcularCotacao(entrada, rota, parametros) {
  const largura = paraNumero(entrada.largura);
  const altura = paraNumero(entrada.altura);
  const comprimento = paraNumero(entrada.comprimento);
  const valorNf = paraNumero(entrada.valor_nf);
  const peso = paraNumero(entrada.peso);

  const pesoCubado = largura * altura * comprimento;
  const pesoCubadoMultiplicado = pesoCubado * FATOR_CUBAGEM;
  const pesoDefinido = Math.max(pesoCubadoMultiplicado, peso);

  const fretePeso = pesoDefinido * parametros.valor_quilo;
  const fretePercentual = valorNf * parametros.frete_percentual;
  const freteMinimo = paraNumero(rota.frete_minimo);

  const opcoesFrete = [
    { nome: 'Frete mínimo', valor: freteMinimo },
    { nome: 'Frete Percentual', valor: fretePercentual },
    { nome: 'Frete peso', valor: fretePeso },
  ];
  const freteEscolhido = opcoesFrete.reduce((maior, atual) =>
    atual.valor > maior.valor ? atual : maior
  );
  const valorFreteEscolhido = freteEscolhido.valor;

  const icms = valorFreteEscolhido * paraNumero(rota.icms);
  const seguro = parametros.seguro * valorNf;
  const gris = parametros.gris * valorNf;
  const pedagio = parametros.pedagio * pesoDefinido;
  const secCat = parametros.sec_cat;
  const valorGeneralidade = seguro + gris + pedagio + secCat;
  const valorTotal = valorFreteEscolhido + icms + valorGeneralidade;

  return {
    peso_cubado: pesoCubado,
    peso_cubado_multiplicado: pesoCubadoMultiplicado,
    peso_definido: pesoDefinido,
    frete_peso: fretePeso,
    frete_percentual_valor: fretePercentual,
    frete_minimo_valor: freteMinimo,
    frete_escolhido: freteEscolhido.nome,
    valor_frete: valorFreteEscolhido,
    icms_valor: icms,
    seguro_valor: seguro,
    gris_valor: gris,
    pedagio_valor: pedagio,
    sec_cat_valor: secCat,
    valor_generalidade: valorGeneralidade,
    valor_total: valorTotal,
  };
}

module.exports = {
  FATOR_CUBAGEM,
  PARAMETROS_OBRIGATORIOS,
  paraNumero,
  montarParametros,
  calcularCotacao,
};
