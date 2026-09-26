# Social Nite — Registro de alterações

Fork do Misskey v2025.10.2 rebrandado como **Social Nite**.
Sessão de 03–04/09/2026. Todas as mudanças abaixo estão no working tree, **ainda não commitadas**.

Nesta pasta:

| Arquivo | O que é |
|---|---|
| `SOCIALNITE-CHANGES.md` | este registro |
| `REGRAS-DO-SERVIDOR.md` | 9 regras prontas para colar no painel de admin |
| `TERMOS-DE-USO.md` | rascunho dos termos, com `[placeholders]` a preencher |

---

## 1. Marca: Misskey → Social Nite

**Arquivos:** `locales/pt-PT.yml`, `locales/en-US.yml`, `packages/frontend/src/**`, `packages/backend/src/server/web/**`

- 32 strings em pt-PT e 33 em en-US trocadas de "Misskey" para "Social Nite".
- `Misskey Games` → **Nite Games** (`navbar.ts`, `pages/games.vue`).
- `#MisskeyReversi` → `#NiteReversi`; conquista "Eu Amo Misskey" → "Eu Amo Social Nite" (`#SocialNite`), com o gatilho em `MkPostForm.vue` aceitando os dois termos.
- Página "Sobre": título grande passou a "Social Nite".
- Backend: página de erro de boot, ferramenta de reparo (`/bios`), cliente simples (`/cli`), `manifest.json`, `FeedService` e metatags `application-name`.

### O que foi deliberadamente mantido como "Misskey"

O Misskey é **AGPL-3.0**; remover o crédito ao projeto original violaria a licença.

- `_aboutMisskey.about` — crédito ao syuilo.
- `_aboutMisskey.thisIsModifiedVersion` — aviso de versão modificada (é ele que protege o projeto).
- Links para repositório, Crowdin e Patreon originais.
- `chooseServerOnMisskeyHub`, `i18nInfo`, `repositoryUrlDescription` — apontam para serviços reais de terceiros.

### Popup de doação — desativado

`packages/frontend/src/boot/main-boot.ts`

O popup pedia doação apontando para o **Patreon do Misskey**. Rebrandeá-lo faria parecer que o dinheiro ia para o Social Nite. Removida a exibição; a página "Sobre" segue creditando o projeto original.

---

## 2. Idioma: japonês vazando na interface

**Causa raiz:** `locales/index.js` montava pt-PT como `merge(ja-JP, pt-PT)` — qualquer chave ausente caía em **japonês**.

- 12 chaves ausentes traduzidas + 1 com valor vazio (`continueOnRemote`), que o `removeEmpty` do loader apagava e fazia cair no fallback.
- Japonês hardcoded traduzido: `JavaScriptを有効にしてください` (noscript de `base.pug` e `base-embed.pug`) e as mensagens da página `/flush`.
- Pontuação japonesa (`　`, `・`) trocada por marcadores normais em `moveAccountDescription`.
- **Cadeia de fallback corrigida** para `merge(ja-JP, en-US, pt-PT)`: chave faltando agora mostra inglês, não japonês.

**Resultado verificado:** zero caracteres japoneses no bundle pt-PT servido.

### Traduções erradas corrigidas

- `_followRequest.recieved/sent`: "Aplicação recebida/enviada" → **"Recebidos"/"Enviados"** (tradução literal de *application*).
- `antennaKeywordsDescription`: "será uma especificação AND/OR" → explicação real em português.
- `_userLists.tip` e `_clip.tip`: eram circulares, reescritas.

---

## 3. Renomeações de conceito (pt-PT)

| Antes | Depois | Observação |
|---|---|---|
| Listas | **Redes de Pessoas** | 21 strings; não se mexeu em "lista" fora de contexto ("Recarregar lista de contas", "Lista de Rascunhos") |
| Antenas | **Redes de Palavras** | 16 strings. Evitou-se "Busca de Palavras" para não colidir com "Pesquisar" |
| Clipe | **Notas Salvas** | 15 + 10 strings (passou por "Salvos" antes) |
| Páginas | **Portfólio** | |
| Play | **Dê o Play** | |
| Conversar com usuário / Mensagem | **Conversas** | nome único; era diferente no sidebar e no título |
| Salas (chat) | **Grupos** | |

### A troca de "Grupos"

As Listas chegaram a se chamar "Grupos", mas a palavra foi devolvida ao chat, que é onde as pessoas esperam encontrá-la — "Grupos" sugere conversa, não filtro de timeline.

As Listas viraram **Redes de Pessoas**, em par com **Redes de Palavras**: são a mesma ideia (montar uma aba filtrada), uma escolhendo *pessoas*, a outra escolhendo *palavras*. Os dois documentos em `changes/` foram alinhados a essa terminologia.

---

## 4. Tela de entrada (visitante)

- **Estatísticas, linha do tempo e gráfico removidos** — via `clientOptions` no banco (`showTimelineForVisitor: false`, `showActivitiesForVisitor: false`). **Não é código**: dá para religar em Painel de Controle → Marca.
- **Menu dos três pontinhos removido** (`MkVisitorDashboard.vue`). Ele expunha Anúncios, Ferramentas e Gráficos a visitante anônimo. Gate por admin não serviria: quem vê essa tela está sempre deslogado.

---

## 5. Navegação — desktop

### Barra superior de timelines → sidebar

Lógica extraída para `packages/frontend/src/utility/timeline-nav.ts` (reutilizável pelas duas navbars). A barra de abas do topo saiu; o título "Linha do tempo" foi escondido com `hideTitle`.

Sidebar hoje: **Início · Local · Grupos · Redes de Palavras · Canais**

### Timelines removidas da navbar

- **Global** — com `federation: none` mostra o mesmo que Local.
- **Social** — é *exatamente* `Início ∪ Local` (verificado nas queries do backend). Não tem nota própria.

As três continuam funcionando no backend; só os botões saíram.

### Itens removidos do menu

| Item | Motivo |
|---|---|
| Pesquisar | Explorar cobre a descoberta |
| Alternar UI | Modo Deck é outra interface, sem o mesmo ajuste visual |
| Canais (do menu) | Duplicado — já existe atalho fixo no topo |
| Consultar (`lookup`) | Caso principal depende de federação, que está desligada |
| Favoritos | Sobrepõe Notas Salvas |
| Ferramentas | Expunha Console de API ao usuário final |
| Grupos / Redes de Palavras (do menu) | Duplicados dos atalhos fixos |

### Outros

- **Explorar**: ícone `#` → globo (`ti ti-world`).
- **Avisos**: visível apenas para admin/moderador.
- **Drive**: saiu e voltou. Só o atalho havia sido removido — a página é obrigatória (seletor de anexos, avatar, banner).

---

## 6. Navegação — mobile

`packages/frontend/src/ui/_common_/mobile-footer-menu.vue`

Botão central do sino (**Notificações**) trocado pelo **"Mais"** (`ti ti-grid-dots`), que abre o LaunchPad — o mesmo do desktop.

---

## 7. Notificações e pedidos de seguidor

- **Pedidos de seguidor** saiu do sidebar e virou **aba em Notificações**, com sub-abas Recebidos/Enviados. Fazia sentido porque o pedido já chegava como notificação (`receiveFollowRequest`).
- Lista extraída para `MkFollowRequestList.vue`, usada pela aba nova, pela página `/my/follow-requests` e pelo widget — sem duplicar código.
- **Widget de Notificações** ganhou abas `Todos · Recebidos · Enviados`, com **badge** na aba Recebidos quando há pendência.
- `MkTab.vue` ganhou suporte a `indicate?: boolean` — qualquer aba do sistema pode ter badge agora.

---

## 8. Chat

A página deixou de ter abas e virou **uma lista só**, na ordem em que se usa:

1. **Dica explicativa** (`_chat.chatAboutTip`)
2. **Iniciar conversa** — menu com "Conversa individual" ou "Criar Grupo"
3. **Busca** de mensagens
4. **Histórico** — conversas recentes, 1-a-1 e grupos juntos
5. **Convites** — só aparece quando existe algum pendente
6. **Grupos** — os que você criou e os que participa, mesclados e deduplicados (`chat/rooms/owned` + `chat/rooms/joining`)
7. **Começar uma conversa** — quem você segue, com avatar e link direto (`users/following`, limite 30)

As três abas originais (Convidar, Salas ingressadas, Salas criadas) sumiram como *abas*; o conteúdo delas está nas seções 5 e 6. Os componentes `home.joiningRooms.vue` e `home.ownedRooms.vue` ficaram sem uso — candidatos a remoção.

---

## 9. Widgets

- Botão **"Editar widgets" removido** (`ui/_common_/widgets.vue`).
- Widget **Destaques**: mostra uma explicação quando está vazio, em vez de um painel em branco.

---

## 10. Textos de ajuda adicionados

Todos no formato dispensável ("Entendi"), registrados em `packages/frontend/src/tips.ts`.

| Chave | Onde |
|---|---|
| `antennasAboutTip` | `/my/antennas` |
| `channelsAboutTip` | `/channels` |
| `exploreAboutTip` | `/explore` |
| `trendsAboutTip` | widget Destaques (estado vazio) |
| `_chat.chatAboutTip` | home do chat |
| `_timelineDescription.*` | reescritas sem a expressão "linha do tempo" |

⚠️ Chaves novas precisam existir em **`ja-JP.yml`** também: o `generateDTS.js` gera os tipos do i18n a partir do japonês, e o DTS só é regerado no `pnpm build-assets` (último passo do build).

---

## Pendências e planejamento futuro

### 1. Página "Sobre" → documentação e regulamento da rede — **PRIORIDADE**

**Objetivo:** transformar o "Sobre" numa página de documentação: o que o Social Nite é, como ele funciona hoje, os termos de compromisso e a política de privacidade.

**Status:** adiado. Os textos já existem (`changes/TERMOS-DE-USO.md` e `changes/REGRAS-DO-SERVIDOR.md`), mas ainda têm `[placeholders]` que só a instituição pode preencher — responsável, e-mail de contato, idade mínima, quem pode participar e foro. Sem isso, publicar o documento seria assumir compromisso em nome de alguém que não foi consultado.

**Descoberta importante (busca exaustiva no repositório):** **não existe texto de termos ou regras no código do Misskey, em idioma nenhum** — nem em japonês. Não havia nada a traduzir. O que existe em japonês são apenas rótulos de uma palavra (`利用規約` = "Termos de Uso", o nome do campo). Confirmado por:

- `serverRules` nasce como array **vazio** (`migration/1681400427971-serverRules.js`, `DEFAULT '{}'`);
- `termsOfServiceUrl` e `privacyPolicyUrl` são colunas **nulas sem default** (`models/Meta.ts:366,392`);
- não existe nenhum arquivo `TERMS`/`TOS`/`PRIVACY`/`RULES` de qualquer extensão no repo;
- busca por prosa jurídica (`本規約`, `第1条`, `you agree to`, `shall not be liable`) retornou zero.

É **por design**: o Misskey guarda apenas **links externos** para o texto legal e um array de regras curtas que o admin digita no painel. Cada servidor escreve o próprio texto.

**Caminhos possíveis para implementar:**

- **(A) Rota interna** — criar `/tos` e `/privacy` no `router.definition.ts` renderizando o Markdown, e apontar `termsOfServiceUrl`/`privacyPolicyUrl` para elas. Mantém tudo dentro do servidor, versionado no git.
- **(B) Hospedagem externa** — publicar as páginas fora e colar as URLs em Painel de Controle → Configurações. Zero código, mas o texto sai do controle de versão.

**Enquanto as URLs estiverem nulas**, o bloco de termos simplesmente não aparece no cadastro (`MkSignupDialog.rules.vue`, `v-if="availableTos || availablePrivacyPolicy"`).

**Aplicação imediata possível, sem depender do item acima:** as **regras** já estão prontas e não têm placeholder. Basta colar em Painel de Controle → Regras do servidor, uma por item (máx. 280 caracteres cada) — elas passam a aparecer na tela de cadastro.

### 2. Outros itens decididos e não implementados

- **Galeria** — avaliar se some ou se funde com o fluxo de publicar.
- **Favoritos** — o atalho saiu, mas a ação "Favoritar" continua no menu da nota: dá para favoritar e não achar a lista. Ou remove a ação, ou devolve o atalho.
- **Barra mobile** — o botão de Notificações saiu para dar lugar ao "Mais"; Notificações ficou só no menu ☰. Além disso "Mais" (`ti-grid-dots`) e Widgets (`ti-apps`) ficaram com ícones parecidos, lado a lado.
- **Nomes a revisar** — "Consultar" e "Play" seguem no menu com utilidade baixa nesta instância (o primeiro depende de federação).

### Painel de admin / moderador

Já existe pronto em `/admin`, restrito por cargo no frontend **e** no backend: moderação, denúncias, avisos, emojis, arquivos, convites, cargos, banco e filas.

⚠️ **Painel com senhas dos usuários: não é possível.** As senhas são guardadas como hash **bcrypt** (`SigninApiService.ts`) — irreversível por definição. Ninguém lê a senha de ninguém, nem o admin. Guardar senha legível removeria a proteção principal das contas e entraria em conflito com a LGPD.
**Alternativa que já existe:** `admin/reset-password` gera uma senha nova de 8 caracteres e a mostra ao admin, com registro no log de moderação.

⚠️ **Avisos só para admin:** avisos com `display: normal` agora ficam invisíveis para o usuário comum. Ao criar um aviso, use **"dialog"** ou **"banner"**.

### Ambiente

- Rodar: Docker (`compose-db.dev.yml`) → `pnpm migrate` → `NODE_ENV=production pnpm start` → http://localhost:3000
- `NODE_ENV=production` é obrigatório: sem ele o backend faz proxy de `/vite/*` para um dev server inexistente.
- Todo build gera hashes novos e apaga os antigos → abas abertas quebram com `APP_IMPORT`. **Ctrl+Shift+R** resolve; o botão "Recarregar" da tela de erro usa `location.reload(true)`, cujo argumento os navegadores modernos ignoram — ele não limpa cache.
- O banco local tem 2 usuários e 0 notas; as telas com conteúdo real vêm de outra instância.
