export interface ParticipanteInterface {
	id: string;
	nome: string;
}

export interface ProjetoInterface {
	id: string;
	nome: string;
}

export interface ProjetoComParticipantes extends ProjetoInterface {
	obterParticipantes(): Participante[];
}

export type OperacaoConjunto = 'union' | 'intersection' | 'difference' | 'reverse-difference';
export type RegiaoDiagramaVenn = 'a-only' | 'intersection' | 'b-only';

export interface ResultadoOperacao {
	operacao: OperacaoConjunto;
	participantes: Participante[];
	regioes: Record<RegiaoDiagramaVenn, Participante[]>;
}

export class Participante implements ParticipanteInterface {
	public readonly id: string;
	public readonly nome: string;

	public constructor(id: string, nome: string) {
		this.id = id.trim();
		this.nome = nome.trim();
		if (!this.id || !this.nome) throw new Error('Participante precisa de identificador e nome.');
	}
}

export class Projeto implements ProjetoInterface {
	public readonly id: string;
	public readonly nome: string;
	private readonly membros = new Map<string, Participante>();

	public constructor(id: string, nome: string) {
		this.id = id.trim();
		this.nome = nome.trim();
		if (!this.id || !this.nome) throw new Error('Projeto precisa de identificador e nome.');
	}

	public adicionarParticipante(participante: Participante): void {
		this.membros.set(participante.id, participante);
	}

	public obterParticipantes(): Participante[] {
		return [...this.membros.values()];
	}
}

export class OperacoesDeConjuntos {
	public unir(a: readonly Participante[], b: readonly Participante[]): Participante[] {
		return [...new Map([...a, ...b].map((participante) => [participante.id, participante])).values()];
	}

	public intersectar(a: readonly Participante[], b: readonly Participante[]): Participante[] {
		const idsB = new Set(b.map((participante) => participante.id));
		return this.unicos(a).filter((participante) => idsB.has(participante.id));
	}

	public diferenca(a: readonly Participante[], b: readonly Participante[]): Participante[] {
		const idsB = new Set(b.map((participante) => participante.id));
		return this.unicos(a).filter((participante) => !idsB.has(participante.id));
	}

	public classificar(a: readonly Participante[], b: readonly Participante[]): ResultadoOperacao['regioes'] {
		return {
			'a-only': this.diferenca(a, b),
			intersection: this.intersectar(a, b),
			'b-only': this.diferenca(b, a),
		};
	}

	private unicos(participantes: readonly Participante[]): Participante[] {
		return [...new Map(participantes.map((participante) => [participante.id, participante])).values()];
	}
}

export class GerenciadoraDeConjuntos {
	public constructor(private readonly operacoes = new OperacoesDeConjuntos()) {}

	public calcular(a: ProjetoComParticipantes, b: ProjetoComParticipantes, operacao: OperacaoConjunto): ResultadoOperacao {
		const participantesA = a.obterParticipantes();
		const participantesB = b.obterParticipantes();
		const regioes = this.operacoes.classificar(participantesA, participantesB);
		const participantes = operacao === 'union'
			? this.operacoes.unir(participantesA, participantesB)
			: operacao === 'intersection'
				? regioes.intersection
				: operacao === 'difference'
					? regioes['a-only']
					: regioes['b-only'];
		return { operacao, participantes, regioes };
	}
}
