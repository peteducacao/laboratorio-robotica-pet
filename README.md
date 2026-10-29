# LAB✳PET — Laboratório Virtual de Robótica

**PET Educação • UFS** · Projeto 01: Carrinho Wi-Fi ESP32

Oficina interativa gratuita, feita para funcionar em celular, tablet e computador, sem instalação de aplicativos.

## O que a primeira versão faz

- **9 elementos de bancada:** baterias (2), gangorras (2), LM2596, ESP32, MX1508 e dois motores.
- **17 ligações educativas** com verificação do esquema, alerta para fios indevidos e dicas.
- **Gangorras independentes:** uma para o ESP32 e outra para a ponte H/motores.
- **Ajuste virtual do LM2596:** a missão verifica saída de **5,0 V** para o ESP32.
- **Pista virtual** com movimento, obstáculos, chegada, setas/WASD e controles por toque.
- **Progresso salvo localmente** no navegador, inclusive após atualizar a página.
- Reorganização dos módulos da bancada pelo ícone **⠿**; no celular, toque nos pinos (origem e destino), sem exigir arraste de fio.
- Dicas progressivas, lista de fios removíveis e opção para recomeçar.

A interface usa a **logo oficial do PET Educação**, copiada do repositório do catálogo, mas com estilo visual independente.

## Publicar pelo GitHub Pages

1. No repositório, acesse **Settings → Pages**.
2. Em **Build and deployment**, escolha **Deploy from a branch**.
3. Selecione **main** e **/(root)** e salve.
4. Após a publicação, o endereço será: https://peteducacao.github.io/laboratorio-robotica-pet/

Não há banco de dados, backend, login nem compilação. O arquivo inicial é `index.html` e suas dependências são `styles.css`, `app.js` e `assets/logo-pet.svg`.

## Como testar

1. Em **Conheça as peças**, toque nos nomes das placas e descubra sua função.
2. Em **Faça as conexões**, toque no terminal de origem e depois no terminal de destino.
3. Conecte os 17 pares previstos. Fios indevidos aparecem como conexões a revisar; remova-os pela lista.
4. Ajuste o LM2596 para **5,0 V**, ligue as duas gangorras e clique em **Conferir circuito**.
5. Dirija até a chegada com **WASD**, **setas** ou os **botões de toque**.
6. Atualize a página e confira se os fios e a etapa permanecem salvos.

Teste automatizado (sem dependências): `node tests/smoke.cjs`. O GitHub Actions executa esse teste a cada atualização da ramificação principal.

## Limites desta versão

Trata-se de um **modelo educativo de conectividade e comandos**, não de uma emulação do firmware do ESP32 nem de uma simulação elétrica de precisão. Não simula curtos-circuitos, corrente de partida, queda de tensão, consumo da bateria, medições físicas ou conexão Wi-Fi real; os movimentos do carrinho acontecem numa pista digital independente.

Os bornes das saídas da MX1508 aparecem como **A · 1, A · 2, B · 1, B · 2** por conveniência didática. Na placa do projeto original, os dois bornes individuais de cada saída **não são numerados**. A correspondência dos sinais de comando usada na oficina é: D27/IN1, D26/IN2, D32/IN3 e D18/IN4.

A oficina segue a montagem atualizada fornecida pela equipe: duas baterias ilustradas como 9 V, duas gangorras e LM2596 ajustado para 5 V na alimentação do ESP32. O projeto de origem descreve outra disposição da bateria dos motores; a atualização gráfica da equipe prevalece nesta primeira versão.

**Atenção:** montagens físicas com baterias, solda, ferramentas e reguladores devem ser feitas sob supervisão. A leitura do simulador **não valida a segurança elétrica de uma montagem real**.

## Fonte técnica

[Carrinho Wi-Fi ESP32 PET v1 — Fundamentos de Prototipagem e Fabricação Digital](https://gabrieljsantos.github.io/Fundamentos-de-Prototipagem-e-Fabrica--o-Digital/conteudos/08-carrinho-wifi-esp32-pet-v1.html).

## Próximas etapas de desenvolvimento

Melhorar os desenhos dos componentes para reproduzir melhor suas placas físicas, permitir edição mais livre da posição dos itens e dos fios, adicionar exercícios por tipo de circuito, melhorar as animações, ampliar a pista e incorporar sensores **somente quando fizerem parte do carrinho real**.

---
*Projeto educativo independente do catálogo de chaveiros. Nenhum arquivo do catálogo foi alterado.*
