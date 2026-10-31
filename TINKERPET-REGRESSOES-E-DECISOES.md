# TinkerPET Studio — Histórico de decisões, erros e testes

**Objetivo:** consultar este arquivo ANTES de modificar o projeto. Ele registra decisões confirmadas, regressões já relatadas e verificações obrigatórias. Atualizar depois de cada correção relevante.

## Regra principal de segurança
- **Não alterar o código nem o comportamento da versão PC** quando o pedido é somente sobre o celular. Preservar `app.js`, `editor-layout.js`, `editor-layout.css`, `styles.css` e os algoritmos que já funcionam no computador, salvo autorização expressa.
- Para ajustes móveis, usar `mobile-editor.css` (regra de largura `max-width:700px`) e `mobile-editor.js`; `editor.html` somente para incluir e versionar esses arquivos, preservando a versão PC.
- Evitar duplicar motor de fios no celular; os dois dispositivos devem utilizar os mesmos dados de montagem e regras de conexão.
- Não declarar “testado no celular” quando apenas sintaxe, código ou CSS foram verificados. Validar com Chrome/Android real ou teste de navegador equivalente, especialmente após editar estilos e gestos.

## Registro das regressões e decisões

| Área | Comportamento confirmado/esperado | Erro observado ou risco | Teste obrigatório |
| --- | --- | --- | --- |
| Barra móvel | Primeira linha: ajustes/engrenagem, dicas, baixar. Segunda: progresso compacto. Abaixo: ferramentas de edição (copiar, selecionar, girar 90°, inverter, colar, excluir), desfazer/refazer, cor dos fios e zoom. Ícones tocáveis e distribuídos com equilíbrio. | Antes os botões ficavam espremidos na primeira linha ou os 3 superiores ficavam isolados à direita com muito espaço vazio. | Chrome Android em 320, 360, 390 e 430 px; conferir editor de circuito antigo E novo. |
| Circuitos salvos antigos | Abrir circuito antigo deve carregar EXATAMENTE o mesmo editor móvel e mesmas melhorias de um circuito novo. | Capturas de 30/10/2026 mostraram barra antiga em um circuito com 17/17 e barra nova no circuito recém-criado. Pode haver abas e HTML/CSS em cache. | Acessar ambos a partir de Meus circuitos, usar F5/atualizar e conferir versão dos assets no DevTools; preservar o circuito. |
| Desktop | O PC conserva layout, ferramentas, zoom, fios e tudo que já funciona. | Correções anteriores de estilo/comportamento afetaram indevidamente o PC. | Comparar SHA/arquivos do motor e da camada desktop antes/depois; testar >700 px. |
| Fios e jumpers | Fios manuais, a ponta segue o dedo/mouse somente durante o arraste, conexão ocupa o centro do pino; não criar cotovelos automáticos falsos. A área clicável cobre todos os segmentos. | No celular persistia comportamento antigo; partes do fio não selecionavam, sobras à direita após arrastar ponta, linhas duplicadas. | Criar fio, puxar bolinha, deixar solto, reconectar, editar curvas e selecionar trechos no celular e PC. |
| Ponta solta | Ao soltar fora do pino ela fica naquela posição, não grudada no cursor. Salvar, F5, desfazer e miniaturas devem preservar. | Em versões antigas continuava acompanhando o cursor. | Arrastar de pino e largar no vazio, mover outras peças, salvar/reabrir. |
| Câmera | Durante arraste de componente para borda, bancada rola para cima/baixo/lados sem separar dedo da peça. | Bancada não acompanhava o cursor/dedo na borda. | Segurar peça perto de todas as bordas, inclusive móvel. |
| Componentes | Sem bordas/molduras quadradas pontilhadas de seleção. Girar 90° alinhado, inverter horizontalmente sem desalinhar pinos; desfazer/refazer. | Quadrado azul ao redor; ícone de girar desalinhado; controles pequenos. | Selecionar, girar, inverter, mover, desfazer, reconectar. |
| Progresso | Barra de conexões aparece na edição em vez de botão Iniciar simulação, compacta no celular. Mostrar total e erros, mas sem simulação visível. | Celular mostrou botão antigo; painel Configurações repetia contagem. | Abrir circuitos com e sem gangorras; ver 15/15 ou 17/17 conforme montagem. |
| Mensagem de conquista | Ao TRANSITAR de incompleto para concluído, desfoca bancada, apresenta caixa limpa, confetes por todo o fundo e contador circular de **10 s**, com fechamento manual. F5 de circuito já completo não reabre modal. Reconectar/desfazer que torne completo novamente pode reabrir. | 3 s era curto, confetes restritos ao cartão, ao atualizar podia haver risco de replay. | Montar 15/15 e 17/17, F5, apagar/reconectar jumper, botão fechar e timer. |
| Salvamento | Nome/estado do circuito exclusivo por aba; ✓ Salvo é transitório na lista (3 s), não permanente. | F5 em aba A podia abrir B; selo de salvo ficava para sempre. | Abrir A e B em abas, alterar ambos, atualizar, conferir independência. |
| Download | Depois que o PNG for gerado e o download iniciado com sucesso, fechar a prévia imediatamente; erro mantém prévia para tentar novamente. | Caixa de prévia continuava aberta após download. | Baixar PNG no Chrome Android com e sem componentes; conferir arquivo e fechamento. |
| Painéis | Menu Buscar componentes começa recolhido após entrar e após F5. Seta visível; com painéis fechados bancada preenche largura. | Menu ficou exposto após F5; espaços em branco na bancada. | Android e PC: abrir/fechar menu e Configurações; atualizar. |
| Textos acessórios | Removidos: dica persistente sobre jumper sobre a bancada e aviso “Importe um arquivo salvo...” em Meus circuitos. | Continuaram visíveis por páginas/recursos antigos em cache. | Verificar ambos os contextos depois de atualizar assets. |

## Checklist de entrega para cada alteração de celular
- [ ] Comparar circuito antigo e novo, não apenas novo.
- [ ] Respeitar todos os IDs de controles existentes; não duplicar JS da versão PC.
- [ ] Testar disposição em 320, 360, 390, 430, 700 e >700 px.
- [ ] Testar toque: selecionar pino, iniciar, arrastar, parar, soltar, selecionar fio inteiro, arrastar bolinhas e desfazer.
- [ ] Conferir cabos/portas e salvamento após atualizar, sem corromper projetos antigos.
- [ ] Verificar PNG, progresso, timer, menus, zoom, rotação e inversão.
- [ ] Alterar versão de cache de CSS/JS no `editor.html` e rotas de projeto quando necessário.
- [ ] Conferir a publicação no GitHub Pages; distinguir “commit enviado” de “site no celular já atualizado”.
- [ ] Registrar aqui o que realmente foi verificado e regressões novas.

## 30/10/2026 — revisão da inconsistência entre circuitos antigos e novos
- Relato: captura do circuito antigo completo (17/17) ainda com barra antiga; novo circuito com layout móvel reorganizado. Não atribuir a um bug de dados sem verificar cache/HTML e mesma origem.
- Melhorar distribuição horizontal da primeira linha; diminuir altura da barra de progresso.
- Manter PC inalterado. Corrigir apenas `mobile-editor.css`, `mobile-editor.js` se necessário, e carregamento/versionamento dos arquivos no HTML/lista.
- Validação exigida: comparar os dois tipos de circuito, sem excluir ou migrar dados do usuário.


## 30/10/2026 — correção aplicada à distribuição móvel e cache
- **Mudança feita somente na camada móvel:** `mobile-editor.css?v=3` organiza a primeira linha em três ações igualmente distribuídas, agora com nomes “Ajustes”, “Dicas” e “Baixar”; o progresso permanece na segunda linha, com menos padding, altura de trilha de 5 px e texto menor; edição e zoom continuam abaixo.
- `mobile-editor.js?v=3` atualiza os links de retorno para a lista na navegação móvel, sem trocar os listeners nem o roteador de fios do PC.
- `projects.js?v=11` define `release=20261030mobile-ui-v3` **apenas para telas de até 700 px**, preservando a URL de desktop, para que abrir circuitos antigos e novos carregue o mesmo HTML atualizado.
- `index.html` e `projects.html` receberam somente o ajuste de link/versionamento para a nova lista; nenhum circuito salvo foi apagado, migrado ou sobrescrito.
- **Não foram modificados:** `app.js`, `editor-layout.js`, `editor-layout.css`, `styles.css`, o motor de conexões nem o sistema de salvamento.
- Verificação possível aqui: código, sintaxe, CSS balanceado, condições de largura, scripts/versões presentes e preservação dos SHA do motor do PC.
- **Pendente de teste real:** visualização no Chrome Android, F5 em aba antiga já aberta e arraste de jumpers com dedos. Não declarar resolvido visualmente sem esses testes.
- Se circuito antigo continuar com barra antiga após abrir pela lista atualizada, investigar cache específico da aba, publicação real do GitHub Pages e carregamento/erros de `mobile-editor.css`, antes de alterar regras de circuito.

## 30/10/2026 — fios seguindo o dedo: versão móvel separada
- Pedido: ao criar e arrastar um fio com o dedo, a ponta deve permanecer sob o dedo, mudando de direção em cada virada; as mudanças devem formar curvas ortogonais e persistir ao soltar, reconectar e salvar.
- **Restrição explícita:** não alterar `app.js` nem o código do PC.
- Solução: criado `app-mobile.js` como cópia independente do motor atual, adaptando somente `mobileFingerRoute`, `mobileFinishFingerRoute` e `mobileReconnectFinger` para toques. O HTML escolhe o motor móvel em telas até 700px e continua carregando `app.js?v=77` no PC; a lógica desktop permanece intocada.
- Durante arraste, os vértices são ortogonais e o último ponto corresponde à posição real do dedo. As mudanças de eixo geram pontos fixados. A área sensível das alças móveis passou a ~42px; gesto de iniciar fio no toque passa a responder após ~7px.
- **Teste realizado:** 7.200 posições simuladas de desenho móvel, sem trecho diagonal nem perda do ponto seguido pelo dedo, e casos de virada horizontal/vertical e atualização de `reconnectPending.corners`.
- **Limitação a acompanhar:** o teste automatizado foi de lógica, não um ensaio com dedo em Chrome Android. Após publicação, validar toques em circuito antigo e novo e confirmar que soltura, reconexão, edição do fio, salvamento e PNG continuam íntegros.
- Nova rota da lista móvel: `release=20261030finger-wire-v1`, scripts atualizados em `projects.html` e `editor.html`. Evitar reaproveitar aba antiga com recurso em cache.
- **Atenção na manutenção:** como existe cópia independente `app-mobile.js`, correções futuras de segurança/negócio no motor PC não são automaticamente incorporadas ao celular; comparar conscientemente os dois e preservar a regra de não alterar PC por um bug móvel.

## 30/10/2026 — bolinhas enormes e IN1–IN4 com GPIOs alternativos (celular)
- Evidência: screenshot mostra bolinhas ciano sobrepostas cobrindo pinos da MX1508; editor móvel anterior usava `42/zoom` para alças visíveis. O dedo não conseguia selecionar e alinhar o jumper com precisão.
- **Corrigido só no celular**: aro visível de 12 px e área de toque de 26 px, em `app-mobile.js` e `mobile-editor.css`; alças continuam sob o dedo, seleção por segmento de fio reduzida a 20 px e toast de instrução extensa removido ao selecionar um fio.
- Erro relatado: conectar IN1–IN4 da MX1508 a GPIOs diferentes dos quatro do gabarito era considerado inválido no celular, ainda que os GPIOs tivessem capacidade de saída.
- **Corrigido só no celular:** `selectedControlConnections()` infere o GPIO ligado a cada IN; `expectedConnections()`, `countGood()`, `mistakes()`, `missing()` e `powerStatus()` passam a reconhecer as escolhas, preservando 15 ligações no circuito direto e 17 no com gangorras.
- Cada entrada precisa usar um GPIO diferente, com capacidade de saída. GPIO34/35 e VP/VN são de entrada, não adequados; VIN/GND/3V3/EN e UART0 também não são substitutos. GPIOs de strapping (2/5/12/15) podem funcionar, mas exigem cuidados no boot. O firmware real deverá configurar os quatro GPIOs efetivamente usados.
- Testados (lógica): gabaritos 15/15 e 17/17; quatro alternativas distintas; troca de GPIO27 e GPIO26; bloqueio de GPIO35, uso duplicado de um GPIO e GND como controle.
- **Não alterado:** `app.js` do desktop, CSS e layout originais. Teste visual em Chrome Android continua necessário para confirmar bolinhas e posicionamento final.
- Nova rota móvel `20261030fine-wire-gpio-v3`, com atualizações de versões dos scripts móveis e da página de projetos. Conferir F5 em circuitos antigos e novos.

## 31/10/2026 — validação de 5 V: Android divergente e parabéns durante arraste
- Sintoma confirmado no usuário: circuito antigo com 17/17 e LM2596 em **3,5 V** mostrava “Montagem concluída” no Android. No PC, ao arrastar a régua passando brevemente por 5 V, abria o modal de parabéns mesmo sem o usuário ter soltado o controle.
- Causa: **dois motores JS distintos**. `app.js` já tinha a validação de tensão no selo, mas `app-mobile.js` ainda considerava somente os fios. Ambos chamavam `syncCompletionCelebration()` em cada evento `input` da régua.
- Correção **nos dois motores**, preservando as demais regras: mostrar estado “Ajustando LM2596” durante arraste; manter etiqueta de conclusão inativa; validar apenas após `change`, `pointerup` ou `pointercancel` e **450 ms** de estabilidade. Cancelar timer ao receber novo `input`. Progresso só fica verde se conexão, 5,0 V e gangorras (quando presentes) estiverem corretos.
- Testes de lógica executados **em ambos os arquivos, nos modos com e sem gangorras**: 3,5 V (erro), 5,0 V transitório durante arraste (sem mensagem), 5,5 V (erro), 5,0 V após soltar e estabilizar (uma comemoração), 6,0 V (erro), retorno para 5,0 V (nova comemoração), F5 já concluído (não repete), uma ligação ausente e gangorra desligada (não conclui). Os 4 conjuntos de testes passaram.
- Cache: `editor.html` passou a solicitar `app.js?v=82` no PC e `app-mobile.js?v=8` no celular. `projects.js`, `projects.html`, `index.html` e `mobile-editor.js` usam rota `20261031voltage-settle-v2`; a lista usa `projects.js?v=17`.
- **Pendente teste visual real em Chrome Android/desktop:** commits e testes unitários não garantem que o GitHub Pages já tenha propagado ou que aba antiga não esteja em cache. Não anunciar teste visual concluído sem executá-lo.

## 31/10/2026 — gangorras independentes e verificação dos 5 V
- **Sintoma relatado:** a segunda gangorra parecia presa à alimentação da ponte H, e usar a segunda para a bateria do LM2596 apresentava erro enquanto a pessoa ainda montava os fios. O erro era especialmente relevante ao conectar fios em ordem diferente daquela dos gabaritos. A tensão de 3,5 V em um circuito salvo também já foi exibida incorretamente como concluída em uma aba antiga.
- **Regra confirmada:** qualquer gangorra (s1 ou s2) pode ser a chave do LM2596 ou da ponte H. A escolha é determinada por seus próprios fios; os contatos IN/OUT de cada chave podem ser invertidos; a outra chave deve atender a outra fonte. LEDG não participa da alimentação obrigatória.
- **Correção:** `switchWiringCandidates()` filtra as oito atribuições possíveis (duas ordens de chaves × duas orientações para cada chave) pelas conexões realmente instaladas. `selectedSwitchConnections()` usa uma atribuição compatível; `acceptedConnectionSet()` aceita a união das ligações de todas as atribuições ainda compatíveis durante a montagem parcial, sem assumir que s1 pertence ao LM2596. Se já existe uma ligação contraditória, mantém a detecção do erro.
- A conclusão depende simultaneamente das conexões, da tensão LM2596 ajustada a **5,0 V** e, na versão com gangorras, das duas chaves ativadas. Os valores 3,0–4,5 V e 5,5–6,0 V não podem deixar o selo verde de concluído.
- **Teste automatizado feito nos motores PC e celular:** 3.868 verificações, com todos os subconjuntos parciais das quatro ligações das gangorras, 24 ordens de ligação por configuração, trocas s1↔s2, orientação inversa dos terminais, tensão de 3,0 a 6,0 V, gabarito direto, gangorras desligadas e ligações contraditórias. **0 falhas na lógica testada.**
- **Arquivos do editor:** `app.js?v=83` PC e `app-mobile.js?v=9` celular. **Navegação/cache:** `release=20261031switches-dynamic-v3`, `projects.js?v=18`, `mobile-editor.js?v=7`. Sem alterar os projetos salvos nem o modo de desenhar os fios.
- **Limite do teste:** os testes de lógica e de integridade não substituem um ensaio visual no Chrome Android e no desktop; não anunciar isso como testado sem acesso ao navegador real.
