# TinkerPET — Laboratório Virtual de Robótica

Laboratório educativo e responsivo do **PET Educação — UFS**, publicado em https://peteducacao.github.io/laboratorio-robotica-pet/.

## Monte o carrinho
1. Abra a gaveta **PEÇAS** pela seta fixa na lateral ou pelo botão **+** central quando a bancada está vazia.
2. Arraste os componentes do catálogo para a bancada (ou toque na peça para adicioná-la sem arrastar).
3. Organize as imagens soltas na mesa. A bancada de 1900 × 1450 pode ser deslocada **com um dedo no fundo vazio**, em qualquer direção, e **com dois dedos mesmo em cima de uma peça**. Abra a **lupa (⌕)** no canto superior direito da bancada para reduzir ou ampliar pela barra, **enquadrar peça** ou **ver montagem**. O gesto de pinça também funciona para diminuir e ampliar com dois dedos; mova os dois dedos juntos para navegar horizontalmente e verticalmente.
4. Toque no **primeiro terminal** para iniciar um fio sólido. O fio permanece aberto.
5. Toque numa área livre da bancada para **prolongar o jumper a partir da última ponta**. As curvas são ortogonais e não permitem voltar pelo segmento anterior.
6. Aproxime o jumper do **segundo terminal** e solte para encaixar automaticamente no pino. O caminho completo é salvo sem duplicar a ponta.
7. Se errar antes de finalizar, use **Desfazer** para remover a última curva (ou Escape no teclado para cancelar). Para apagar uma ligação pronta, toque no próprio fio e use **Excluir**, ou remova pelo × da aba **Fios**.
8. Ajuste o **LM2596 para 5,0 V** e ligue as duas **gangorras** pelo botão sobre a tecla.
9. Clique em **Iniciar simulação** a qualquer momento para observar os componentes energizados na própria bancada. Após completar as 17 ligações, clique em **Abrir pista** para dirigir com WASD, setas ou controles de toque.

**Ao mover uma peça já conectada, os fios acompanham a origem e o destino, mantendo os pontos intermediários no lugar.** As cores e rotas concluídas são salvas automaticamente no navegador do dispositivo. Toque em **Salvar** para confirmar.

## Componentes em desenhos vetoriais próprios

| Quantidade | Componente | Características |
|---|---|---|
| 1 | ESP32 DevKit V1 | 30 pinos com nomes impressos no desenho; VIN, dois GND, GPIOs |
| 1 | Ponte H MX1508 | placa vermelha, bornes de motor, VCC, GND e IN1–IN4 |
| 1 | Regulador LM2596 | placa azul, entrada/saída IN± e OUT±, ajuste virtual |
| 1 | Bateria 9 V | fonte do regulador LM2596 e do ESP32 |
| 1 | Suporte de 6 pilhas AA | fonte da ponte H MX1508, seis células AA de 1,5 V (9 V nominais) |
| 2 | Gangorra iluminada | três contatos: entrada positiva, saída comutada e negativo opcional da luz indicadora; tecla basculante animada |
| 2 | Motor DC com redução | engrenagem amarela, duas vistas e contatos, prévia animada |

A logo do PET Educação foi copiada do catálogo original. **Nenhum arquivo do catálogo foi alterado.** O simulador agora armazena seus quatro desenhos complementares em:
`assets/mx1508-desenhado.svg`, `assets/lm2596-desenhado.svg`, `assets/bateria-9v-desenhada.svg`, `assets/suporte-6-pilhas.svg`, `assets/gangorra-desenhada.svg`.

## Verificação

O arquivo `tests/smoke.cjs` é executado no GitHub Actions a cada commit na ramificação `main`. O teste verifica as 9 peças, todos os terminais, circuitos incompletos, duas gangorras, saída de 5 V, pino GND alternativo, fios com curvas por toque, salvamento e desbloqueio da pista.

**Limites educativos:** os desenhos representam componentes para montagem virtual e validação lógica; não há cálculo de corrente, simulação de curto-circuito, reprodução do firmware ESP32, Wi-Fi real ou avaliação da segurança elétrica. A pista é virtual. Na montagem real, fontes, reguladores, motores e solda exigem supervisão e medições adequadas.

Referência do projeto físico: [Carrinho Wi-Fi ESP32 — Fundamentos de Prototipagem e Fabricação Digital](https://gabrieljsantos.github.io/Fundamentos-de-Prototipagem-e-Fabrica--o-Digital/conteudos/08-carrinho-wifi-esp32-pet-v1.html).

## Revisão visual e elétrica da v9

- A alimentação positiva é vermelha e o negativo/GND é preto. **Há uma bateria de 9 V para o ESP32 e um suporte de seis pilhas AA para a ponte H**. Com pilhas alcalinas de 1,5 V, o suporte fornece 9 V nominais; com seis NiMH recarregáveis de 1,2 V, a tensão nominal é 7,2 V. Apenas a saída do LM2596 é ajustada para 5 V para alimentar VIN.
- A ponte H MX1508 recebe o positivo do suporte de seis pilhas no terminal + e o negativo no terminal −. Os comandos chegam em IN1–IN4.
- A gangorra ilustrada agora é um **modelo iluminado de três terminais**: IN (positivo de entrada), OUT (saída comutada) e LED− (retorno opcional do indicador). As 17 ligações de funcionamento continuam obrigatórias; um fio adicional para LED− em cada gangorra é aceito e acende o indicador quando ligada. **Não assuma que todos os modelos reais de três terminais usam a mesma pinagem: consulte o esquema impresso na peça real.**
- O interruptor bascula visualmente ao ligar e desligar. As conexões são desenhadas sobre os pontos reais dos terminais e as linhas são contínuas, sem traços interrompidos.
- Removidas legendas excessivas de bobinas e capacitores dos desenhos.

## Revisão v10 — celular e desenhos

- Ocultados os títulos flutuantes acima de cada peça; nomes disponíveis no catálogo e na aba de propriedades.
- LM2596: removidos capacitores redondos exagerados, bloco central e seus textos supérfluos; mantidos os bornes IN+/IN− e OUT+/OUT−.
- MX1508: removidos os dois cilindros centrais, os três blocos/tracinhos e o detalhe de fixação junto à borda superior esquerda.
- Gangorra: os três terminais físicos ficam desenhados sem legendas sobre eles. A função de cada contato continua disponível no inspetor, pois a pinagem de interruptores iluminados pode variar.
- O zoom é contínuo entre 17% e 240% e inclui pinça, lupa deslizante e enquadramento. Com peças grandes, o primeiro posicionamento via catálogo no celular diminui a escala quando necessário.

## Gabarito para professores e estudantes

No cabeçalho da bancada, o botão **🔒 Gabarito** abre uma janela protegida por uma **senha didática** definida pelo responsável. Depois da senha, a tela mostra **o circuito visual pronto**, com os **nove componentes originais desenhados na bancada e os 17 fios conectados entre os pinos reais**, sem alterar a montagem do estudante. O usuário pode ampliar o desenho, **baixar PNG**, **baixar SVG vetorial** (com componentes incorporados) e **imprimir / salvar PDF**. O texto das ligações fica numa seção **Ver resumo das 17 conexões**, inicialmente recolhida.

**Limitação de segurança:** esta aplicação está no GitHub Pages, que serve arquivos estáticos. A senha protege apenas a interface; quem examina o código-fonte público pode encontrá-la, assim como as respostas. Não use o mecanismo para informações confidenciais.

## Ajustes de interface v13

- Fio mais grosso e selecionável mesmo em telas de toque.
- Encaixe magnético no terminal e curvas criadas apenas a partir da ponta atual, sem retorno sobre os próprios trechos.
- Botão inicial **+** centralizado e painel de progresso enxuto, como **1/9**.
- Exclusão do fio selecionado por **Excluir** ou tecla **Delete**.

### Gabarito visual v15

O circuito pronto é renderizado em SVG na própria página, a partir das coordenadas das nove peças e das 17 arestas de validação de `app.js`. A ligação de terra para a ponte H usa o pino **GND2**, equivalente ao GND. Nenhuma peça é adicionada à área de trabalho do aluno ao abrir o gabarito. A versão para impressão mostra o diagrama visual, sem substituir a bancada por uma tabela de texto.

### Conferência de fios por etapa (v17)

Na janela do **Gabarito visual**, os 17 fios têm cores individuais: os GPIOs IN1–IN4 possuem quatro cores diferentes, o **Motor 1** usa tons verdes e o **Motor 2**, tons laranja. As duas gangorras exibem rótulos alinhados aos contatos **IN, OUT e LED−**. Acima da bancada estão filtros por **Tudo**, **Energia ESP32**, **Energia motores**, **Comandos**, **Motor 1** e **Motor 2**, que ocultam fios de outros grupos. Sob os filtros, basta tocar no número de uma ligação para ver **somente aquele fio**, com a descrição de origem e destino. Tocar novamente restaura o grupo. Os arquivos PNG/SVG e a impressão reproduzem a visualização selecionada. A montagem interativa original do estudante não é modificada.

### Bancada contínua sem bordas (v19)

A área de montagem não tem mais o limite de 1900 × 1450 unidades: peças e curvas de fios podem ser arrastadas para coordenadas positivas ou negativas, sem recorte ao ultrapassar a região original. A grade pontilhada acompanha o zoom e o movimento da câmera, permanecendo contínua nas quatro direções. A inserção pelo catálogo procura um espaço livre perto do centro **visível**, mesmo longe da origem; o botão Enquadrar traz todas as peças de volta à tela. Na bancada, arraste uma região vazia para navegar sem mexer nas peças ou mantenha **Espaço** pressionado e arraste no computador. A roda do mouse desloca a visão, Ctrl + roda dá zoom ancorado no ponteiro, e dois dedos movem/ampliam em dispositivos touch. O ajuste de zoom permite afastar até 4%. Enquanto um fio está parcialmente desenhado, use Espaço + arrastar no computador ou dois dedos no celular para deslocar a câmera. Posições e curvas continuam salvas no navegador e podem ser desfeitas.

### Interface TinkerPET v25 — referência de organização do Tinkercad

A barra de ferramentas agora fica acima do catálogo e da bancada, com grupos compactos para **Desfazer/Refazer**, **Copiar/Colar/Excluir**, **cor do jumper**, zoom, dicas, **Baixar montagem** e iniciar a simulação. Não foram adicionados comentários, tipo de fio tracejado, painel de código ou envio para plataformas externas. A montagem é exportada para PNG com os desenhos dos componentes embutidos e, caso o navegador não consiga gerar PNG, é oferecido SVG. A exportação enquadra também as curvas dos fios.

A bancada mantém zoom por pinça, duplo toque reversível e área infinita, agora com fundo cinza-neutro. O catálogo usa cartões pequenos em mosaico e sua alça tem **apenas a seta**. Para excluir componentes, selecione e use **Lixeira** ou **Delete**, ou arraste a peça de volta para o catálogo (ou para a alça de abertura, no celular). As peças não exibem uma caixa tracejada em volta; o ESP32 conserva os nomes dos pinos, mas não apresenta texto dentro da blindagem metálica.

Os jumpers não desenham círculos extras nos pinos. Clique no pino inicial e movimente livremente o cursor: a ponta acompanha a posição com curvas ortogonais, sem exigir que o botão do mouse permaneça pressionado. Cada clique na bancada fixa o trecho percorrido **sem desconectar o restante do fio**, e o próximo movimento continua da última ponta; clique no borne final para fechar. Uma pequena faísca animada marca a ponta em construção (respeitando a preferência do sistema de reduzir animações). O histórico **Ctrl+Z / Ctrl+Y** conserva cada clique como um único passo.

### v28 — simulação progressiva na bancada e alimentação corrigida

**Iniciar simulação** não exige as nove peças ou as 17 ligações: aciona um modo de observação na bancada. Cada efeito é habilitado por um caminho elétrico didático de alimentação e controle efetivamente montado. Uma fonte de 9 V alimenta a LM2596 por S1; uma segunda fonte, o **suporte de seis pilhas AA**, alimenta a MX1508 por S2. O ESP32 acende um **LED vermelho** quando VIN recebe os 5 V ajustados no regulador, e pisca um **LED azul** como **representação didática de atividade Wi-Fi**, não indicação de comunicação Wi-Fi real. Os motores DC giram separadamente quando a alimentação das duas partes, o GND comum, seus GPIOs IN e terminais de saída estão conectados. O usuário pode testar apenas parte do circuito e enxergar o efeito dos interruptores e dos fios faltantes. A pista é um recurso separado: o botão **Abrir pista** fica disponível com os 17 pares do gabarito corretos, as nove peças, as duas gangorras ligadas e a LM2596 em 5 V.

**Indicadores honestos:** o desenho utilizado para a LM2596 e a MX1508 não mostra LED físico de indicação; em vez de acrescentar LEDs fictícios, o simulador mostra uma pequena etiqueta de alimentação quando esses componentes recebem energia. A bateria de 9 V e o suporte das seis AA não apresentam luz nem animação artificial. Este é um **modelo educativo de lógica de conexões** e não um modelo elétrico real: não simula falhas, calor, desgaste das pilhas, tensão sob carga, programação nem conexão Wi-Fi física.

### v30 — movimento reto do jumper até o clique

A ponta livre agora segue o mouse ou o dedo **por um único segmento reto**, desde o último ponto fixado até o cursor, em qualquer direção. Não há cotovelo automático durante a movimentação. O clique em uma área vazia **fixa exatamente um vértice** no ponto escolhido; a partir dali, a nova ponta continua reta até o próximo clique ou pino de destino. Conectar ao pino termina diretamente nele, sem criar curvas adicionais. **Ctrl+Z** remove uma curva fixada por clique e **Ctrl+Y** a restaura. As novas ligações usam o formato manual de pontos e continuam salvas; os jumpers antigos preservam seus caminhos anteriores por compatibilidade.

### v32 — ajuste de jumper conectado, semelhante ao Tinkercad

Depois de conectar um jumper, clique/toque e **arraste um trecho visível do fio**. O trecho move-se transversalmente e surgem cotovelos de adaptação, enquanto os terminais de origem e destino continuam ligados às mesmas peças. Segmentos retos podem ser alinhados pela grade de 20 unidades ou pela altura/posição dos bornes; aparece uma **linha-guia azul pontilhada com “ALINHADO”** apenas durante o arraste próximo do alinhamento. O desenho atualizado é salvo localmente e participa do **Ctrl+Z/Ctrl+Y**. Funciona inclusive em fios originalmente retos sem curvas e nos fios antigos.

Ao **arrastar a bateria, o ESP32 ou outro componente**, só a peça selecionada se desloca e os fios ligados a ela acompanham os pinos. As demais peças permanecem no lugar. Nos caminhos manuais com trechos alinhados aos bornes, o cotovelo próximo acompanha o componente para evitar diagonais indesejadas. Esse ajuste não muda nem desconecta o circuito elétrico e não altera a animação ou as 17 ligações esperadas.

### v34 — ponta estacionária e alinhamento magnético com liberação

Ao criar um jumper, a ponta acompanha o mouse somente enquanto está em edição. **Clique na área vazia para estacionar a ponta**: o trecho desenhado fica fixo e movimentar o cursor não o altera. Para continuar, clique ou toque no **pequeno quadrado na extremidade**, então puxe o próximo trecho. O gesto pode ser repetido até chegar ao borne de destino. Cada fixação faz parte do histórico de **Ctrl+Z/Ctrl+Y**, inclusive o estado ativo/estacionado.

A ponta ativa tem **encaixe magnético nas linhas horizontal ou vertical de pinos próximos** (captura de ~11 px). Durante o alinhamento surge a guia azul com “ALINHADO” e a coordenada fica temporariamente presa. Se o usuário puxar mais (desvio superior a ~24 px), a atração cede e a ponta volta a acompanhar livremente o cursor. O mesmo comportamento foi estendido ao reposicionamento de segmentos já conectados. Isso é uma assistência visual de montagem e não cria conexão elétrica sem escolher o pino de destino.
