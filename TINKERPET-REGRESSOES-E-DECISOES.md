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
