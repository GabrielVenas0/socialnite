import { Participante, Projeto } from '@/domain/nite-participants.js';
import participantesCsv from '@/data/nite-participants.csv?raw';

export interface RegistroParticipante {
	id: string;
	nome: string;
	projetos: string[];
}

function normalizar(valor: string): string {
	return valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLocaleLowerCase('pt-BR').replace(/[?!.:]+$/, '');
}

function parseCsv(texto: string): string[][] {
	const primeiraLinha = texto.split(/\r?\n/, 1)[0] ?? '';
	const delimitador = [',', ';', '\t'].sort((a, b) => primeiraLinha.split(b).length - primeiraLinha.split(a).length)[0];
	const linhas: string[][] = [];
	let linha: string[] = [];
	let campo = '';
	let aspas = false;
	for (let i = 0; i < texto.length; i++) {
		const atual = texto[i];
		if (atual === '"') {
			if (aspas && texto[i + 1] === '"') { campo += '"'; i++; } else aspas = !aspas;
		} else if (atual === delimitador && !aspas) {
			linha.push(campo.trim()); campo = '';
		} else if ((atual === '\n' || atual === '\r') && !aspas) {
			if (atual === '\r' && texto[i + 1] === '\n') i++;
			linha.push(campo.trim());
			if (linha.some((item) => item !== '')) linhas.push(linha);
			linha = []; campo = '';
		} else campo += atual;
	}
	linha.push(campo.trim());
	if (linha.some((item) => item !== '')) linhas.push(linha);
	return linhas;
}

export function normalizarRegistros(csv: string): RegistroParticipante[] {
	const linhas = parseCsv(csv.replace(/^\uFEFF/, ''));
	if (linhas.length < 2) return [];
	const cabecalhos = linhas[0].map(normalizar);
	const colunaNome = cabecalhos.findIndex((item) => ['nome completo', 'nome', 'participante', 'name', 'full name'].includes(item));
	const colunaId = cabecalhos.findIndex((item) => ['id', 'identificador', 'matricula', 'e-mail', 'email'].includes(item));
	const colunaProjeto = cabecalhos.findIndex((item) => ['projeto', 'projetos', 'qual projeto participam', 'projetos vinculados', 'project', 'projects'].includes(item));
	if (colunaNome < 0 || colunaProjeto < 0) throw new Error('A planilha precisa conter colunas de nome e projeto.');

	const registros = new Map<string, RegistroParticipante>();
	for (const linha of linhas.slice(1)) {
		const nome = (linha[colunaNome] ?? '').trim();
		const projetos = linha.slice(colunaProjeto).join(',').split(/[;,|\n]/).map((projeto) => projeto.trim()).filter(Boolean);
		if (!nome || projetos.length === 0) continue;
		const idFonte = colunaId >= 0 ? (linha[colunaId] ?? '').trim() : '';
		const id = idFonte || `nome:${normalizar(nome)}`;
		const existente = registros.get(id);
		if (existente) {
			existente.projetos = [...new Map([...existente.projetos, ...projetos].map((projeto) => [normalizar(projeto), projeto])).values()];
		} else registros.set(id, { id, nome, projetos: [...new Map(projetos.map((projeto) => [normalizar(projeto), projeto])).values()] });
	}
	return [...registros.values()];
}

export function construirProjetos(registros: readonly RegistroParticipante[]): Projeto[] {
	const projetos = new Map<string, Projeto>();
	for (const registro of registros) {
		const participante = new Participante(registro.id, registro.nome);
		for (const nomeProjeto of registro.projetos) {
			const idProjeto = normalizar(nomeProjeto);
			let projeto = projetos.get(idProjeto);
			if (!projeto) { projeto = new Projeto(idProjeto, nomeProjeto); projetos.set(idProjeto, projeto); }
			projeto.adicionarParticipante(participante);
		}
	}
	return [...projetos.values()].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

export class FonteParticipantesNite {
	private readonly url: string | undefined;

	public constructor(url = import.meta.env.VITE_NITE_PARTICIPANTS_CSV_URL || undefined) {
		this.url = url;
	}

	public async carregar(signal?: AbortSignal): Promise<Projeto[]> {
		let csv = participantesCsv;
		if (this.url) {
			const response = await window.fetch(this.url, { signal, cache: 'no-cache' });
			if (!response.ok) throw new Error(`Fonte de dados indisponível (HTTP ${response.status}).`);
			csv = await response.text();
			if (/^\s*<!doctype html|^\s*<html/i.test(csv)) throw new Error('A planilha não está publicada para leitura por CSV.');
		}
		return construirProjetos(normalizarRegistros(csv));
	}
}
