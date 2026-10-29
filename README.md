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
8. Ajuste o **LM2596 para 5,0 V**, ligue as duas **gangorras** pelo botão sobre a tecla e confira as 17 ligações.
9. Clique em **Iniciar simulação** e pilote o carrinho na pista com os controles de toque ou as teclas WASD / setas.

**Ao mover uma peça já conectada, os fios acompanham a origem e o destino, mantendo os pontos intermediários no lugar.** As cores e rotas concluídas são salvas automaticamente no navegador do dispositivo. Toque em **Salvar** para confirmar.

## Componentes em desenhos vetoriais próprios

| Quantidade | Componente | Características |
|---|---|---|
| 1 | ESP32 DevKit V1 | 30 pinos com nomes impressos no desenho; VIN, dois GND, GPIOs |
| 1 | Ponte H MX1508 | placa vermelha, bornes de motor, VCC, GND e IN1–IN4 |
| 1 | Regulador LM2596 | placa azul, entrada/saída IN± e OUT±, ajuste virtual |
| 2 | Bateria 9 V | polo positivo e negativo integrados à imagem |
| 2 | Gangorra iluminada | três contatos: entrada positiva, saída comutada e negativo opcional da luz indicadora; tecla basculante animada |
| 2 | Motor DC com redução | engrenagem amarela, duas vistas e contatos, prévia animada |

A logo do PET Educação foi copiada do catálogo original. **Nenhum arquivo do catálogo foi alterado.** O simulador agora armazena seus quatro desenhos complementares em:
`assets/mx1508-desenhado.svg`, `assets/lm2596-desenhado.svg`, `assets/bateria-9v-desenhada.svg`, `assets/gangorra-desenhada.svg`.

## Verificação

O arquivo `tests/smoke.cjs` é executado no GitHub Actions a cada commit na ramificação `main`. O teste verifica as 9 peças, todos os terminais, circuitos incompletos, duas gangorras, saída de 5 V, pino GND alternativo, fios com curvas por toque, salvamento e desbloqueio da pista.

**Limites educativos:** os desenhos representam componentes para montagem virtual e validação lógica; não há cálculo de corrente, simulação de curto-circuito, reprodução do firmware ESP32, Wi-Fi real ou avaliação da segurança elétrica. A pista é virtual. Na montagem real, fontes, reguladores, motores e solda exigem supervisão e medições adequadas.

Referência do projeto físico: [Carrinho Wi-Fi ESP32 — Fundamentos de Prototipagem e Fabricação Digital](https://gabrieljsantos.github.io/Fundamentos-de-Prototipagem-e-Fabrica--o-Digital/conteudos/08-carrinho-wifi-esp32-pet-v1.html).

## Revisão visual e elétrica da v9

- A alimentação positiva é vermelha e o negativo/GND é preto. **As duas baterias ilustradas são de 9 V**, não fontes de 5 V; apenas a saída do LM2596 é ajustada para 5 V para alimentar VIN do ESP32.
- A ponte H MX1508 recebe o positivo da bateria dos motores no terminal + e o negativo no terminal −. Os comandos chegam em IN1–IN4.
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

No cabeçalho da bancada, o botão **🔒 Gabarito** abre uma janela protegida por uma **senha didática** definida pelo responsável. Depois de entrar, aparecem as **17 conexões** nas mesmas quatro etapas usadas para montar e validar o circuito, com origem e destino identificados. O gabarito permite **baixar um SVG vetorial** para imprimir e usar **Imprimir / salvar PDF** no próprio navegador.

**Limitação de segurança:** esta aplicação está no GitHub Pages, que serve arquivos estáticos. A senha protege apenas a interface; quem examina o código-fonte público pode encontrá-la, assim como as respostas. Não use o mecanismo para informações confidenciais.

## Ajustes de interface v13

- Fio mais grosso e selecionável mesmo em telas de toque.
- Encaixe magnético no terminal e curvas criadas apenas a partir da ponta atual, sem retorno sobre os próprios trechos.
- Botão inicial **+** centralizado e painel de progresso enxuto, como **1/9**.
- Exclusão do fio selecionado por **Excluir** ou tecla **Delete**.
