const FORMATADOR_MOEDA = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function lerDecimal(valor: unknown): number {
  if (valor === null || valor === undefined || valor === '') {
    return 0;
  }
  if (typeof valor === 'number') {
    return Number.isFinite(valor) ? valor : Number.NaN;
  }
  const texto = String(valor).trim();
  if (!texto) {
    return 0;
  }
  const normalizado =
    texto.includes(',') && texto.includes('.')
      ? texto.replace(/\./g, '').replace(',', '.')
      : texto.replace(',', '.');
  return Number(normalizado);
}

export function formatarMoeda(valor: number | null | undefined): string {
  const numero = Number(valor);
  if (valor === null || valor === undefined || !Number.isFinite(numero)) {
    return '-';
  }
  return FORMATADOR_MOEDA.format(numero);
}

export function formatarDecimal(
  valor: number | null | undefined,
  casas = 3
): string {
  const numero = Number(valor);
  if (valor === null || valor === undefined || !Number.isFinite(numero)) {
    return '-';
  }
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  }).format(numero);
}

export function formatarData(valor?: string | null): string {
  if (!valor) {
    return '-';
  }
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) {
    return '-';
  }
  return data.toLocaleString('pt-BR');
}

export function formatarPercentual(valor: number | null | undefined): string {
  return `${formatarDecimal(valor, 2)}%`;
}
