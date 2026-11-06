import { describe, expect, it } from 'vitest';
import { GerenciadoraDeConjuntos, OperacoesDeConjuntos, Participante, Projeto } from '@/domain/nite-participants.js';
import { construirProjetos, FonteParticipantesNite, normalizarRegistros } from '@/services/nite-participants.js';

function projeto(id: string, nome: string, participantes: Participante[]): Projeto {
	const result = new Projeto(id, nome);
	participantes.forEach((participante) => result.adicionarParticipante(participante));
	return result;
}

describe('OperacoesDeConjuntos', () => {
	const a = [new Participante('santiago', 'Santiago'), new Participante('vitor', 'Vitor'), new Participante('william', 'William')];
	const b = [new Participante('daniel', 'Daniel'), new Participante('gabriel', 'Gabriel'), new Participante('vitor', 'Vitor'), new Participante('william', 'William')];
	const operations = new OperacoesDeConjuntos();

	it('calcula união, interseção e diferença direcional sem duplicatas', () => {
		expect(operations.unir(a, b).map((p) => p.nome)).toEqual(['Santiago', 'Vitor', 'William', 'Daniel', 'Gabriel']);
		expect(operations.intersectar(a, b).map((p) => p.nome)).toEqual(['Vitor', 'William']);
		expect(operations.diferenca(a, b).map((p) => p.nome)).toEqual(['Santiago']);
		expect(operations.diferenca(b, a).map((p) => p.nome)).toEqual(['Daniel', 'Gabriel']);
	});

	it('mantém regiões corretas para conjuntos vazios e idênticos', () => {
		expect(operations.classificar(a, []).intersection).toEqual([]);
		expect(operations.diferenca(a, a)).toEqual([]);
		expect(operations.unir([], b)).toHaveLength(4);
	});

	it('identifica participantes por id mesmo quando nomes são iguais', () => {
		const sameName = new Participante('vitor-2', 'Vitor');
		expect(operations.intersectar([a[1]], [sameName])).toEqual([]);
	});

	it('Gerenciadora fornece resultado e classificação sem alterar regiões', () => {
		const manager = new GerenciadoraDeConjuntos();
		const result = manager.calcular(projeto('a', 'A', a), projeto('b', 'B', b), 'intersection');
		expect(result.participantes.map((p) => p.nome)).toEqual(['Vitor', 'William']);
		expect(result.regioes['a-only'].map((p) => p.nome)).toEqual(['Santiago']);
		expect(result.regioes['b-only'].map((p) => p.nome)).toEqual(['Daniel', 'Gabriel']);
	});
});

describe('Fonte de dados CSV', () => {
	it('carrega a lista de participantes fornecida para o Social Nite', async () => {
		const projetos = await new FonteParticipantesNite('').carregar();
		const porNome = new Map(projetos.map((p) => [p.nome, p]));
		expect(projetos).toHaveLength(7);
		expect(projetos.reduce((total, p) => total + p.obterParticipantes().length, 0)).toBe(19);
		expect(porNome.get('Jogos embarcados')?.obterParticipantes().map((p) => p.nome)).toEqual([
			'William Silva Lago', 'Santiago Santana Santos', 'Moisés Victor Gomes Bispo', 'Aíza Maria Farias Barretto', 'Vitor dos Anjos Silva de Araujo',
		]);
		const social = porNome.get('Social NITE')!;
		expect(social.obterParticipantes().map((p) => p.nome)).toEqual([
			'William Silva Lago', 'Kaique Souza Costa', 'Daniel Simonetti Rodrigues', 'Vitor dos Anjos Silva de Araujo',
		]);
		const resultado = new GerenciadoraDeConjuntos().calcular(porNome.get('Jogos embarcados')!, social, 'intersection');
		expect(resultado.participantes.map((p) => p.nome)).toEqual(['William Silva Lago', 'Vitor dos Anjos Silva de Araujo']);
		expect(new GerenciadoraDeConjuntos().calcular(porNome.get('Jogos embarcados')!, social, 'union').participantes).toHaveLength(7);
		expect(new GerenciadoraDeConjuntos().calcular(porNome.get('Jogos embarcados')!, social, 'difference').participantes).toHaveLength(3);
		expect(new GerenciadoraDeConjuntos().calcular(porNome.get('Jogos embarcados')!, social, 'reverse-difference').participantes.map((p) => p.nome)).toEqual([
			'Kaique Souza Costa', 'Daniel Simonetti Rodrigues',
		]);
		expect(resultado.regioes['a-only']).toHaveLength(3);
		expect(resultado.regioes['b-only']).toHaveLength(2);
	});

	it('normaliza duplicatas e associa a pessoa a vários projetos', () => {
		const data = normalizarRegistros('Nome completo,Qual projeto participam\nAna Silva,"Robótica, Redes sociais"\nAna Silva,Robótica');
		expect(data).toHaveLength(1);
		expect(data[0].projetos).toEqual(['Robótica', 'Redes sociais']);
		expect(construirProjetos(data).map((p) => p.nome)).toEqual(['Redes sociais', 'Robótica']);
	});

	it('preserva homônimos quando a origem fornece ids confiáveis', () => {
		const data = normalizarRegistros('ID,Nome,Projeto\n1,Ana,Projeto A\n2,Ana,Projeto B');
		expect(data).toHaveLength(2);
		expect(construirProjetos(data).flatMap((p) => p.obterParticipantes())).toHaveLength(2);
	});

	it('reconhece os cabeçalhos usados na planilha enviada', () => {
		const data = normalizarRegistros('Nome completo,Qual projeto participam?\nAna Silva,Projeto A');
		expect(data[0].nome).toBe('Ana Silva');
		expect(data[0].projetos).toEqual(['Projeto A']);
	});
});
