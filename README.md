# TinkerPET — Laboratório Virtual de Robótica

Aplicação interativa do **PET Educação — UFS**. O projeto reproduz, de forma didática, a montagem de um carrinho Wi-Fi com ESP32 usando uma **bancada vazia, um catálogo lateral e peças arrastáveis**.

## Acesse

[Laboratório TinkerPET](https://peteducacao.github.io/laboratorio-robotica-pet/)

## Como usar

1. Comece com uma **bancada vazia**.
2. Abra o catálogo de componentes (menu lateral). No celular, toque em ☰. **Arraste** as peças para a bancada; como alternativa de acessibilidade, toque em uma peça para adicioná-la automaticamente.
3. **Arraste peças já colocadas** para reorganizar a montagem. Para navegar, arraste uma área vazia da bancada. Use os botões +, − e ⛶ para zoom/ajuste.
4. **Crie fios** tocando em um terminal e depois em outro. Escolha a cor do fio na barra inferior. Para remover uma ligação, toque nela ou use a aba **Fios**.
5. Use a aba de propriedades para aprender sobre o componente selecionado.
6. Coloque as 9 peças, conecte os **17 pares de terminais** do projeto e ajuste **5,0 V na saída do LM2596**.
7. Ligue as duas gangorras e escolha **Iniciar simulação** para ir à pista.
8. Na pista, use WASD, setas ou os controles na tela para pilotar.

O projeto salva automaticamente a montagem no navegador. O botão **Desfazer** reverte várias alterações. O botão **Limpar** solicita confirmação.

## Componentes presentes

- 1 ESP32 DevKit (VIN, GND, D27, D26, D32, D18)
- 1 ponte H MX1508 (VCC, GND, IN1–IN4 e duas saídas para motores)
- 1 LM2596 (IN+, IN−, OUT+, OUT−)
- 2 baterias representadas como 9 V
- 2 gangorras
- 2 motores DC TT

Fotos dos componentes obtidas do repositório público de referência didática do projeto:
[Fundamentos de Prototipagem e Fabricação Digital — Gabriel J. Santos](https://github.com/gabrieljsantos/Fundamentos-de-Prototipagem-e-Fabrica--o-Digital), arquivos em `assets/images/componentes/`. O projeto usa a logo do PET Educação mantida no catálogo do próprio PET.

## Observação técnica

**Não é uma cópia do código do Tinkercad nem um simulador elétrico de precisão.** É uma ferramenta própria com o fluxo de escolha de peças, arraste, colocação, fios e circuito do carrinho. A validação compara as ligações com o esquema educativo; não calcula corrente, falhas reais, tensão sob carga, choques ou execução do firmware. Os terminais "A • 1" / "A • 2" e "B • 1" / "B • 2" são nomes didáticos para os dois bornes de cada saída da MX1508, que não têm numeração individual.

Montagens físicas, soldas e medições exigem supervisão de um adulto capacitado. A representação de uma bateria no simulador não é uma aprovação elétrica de seu uso fora dele.

## Desenvolvimento e testes

Site estático: `index.html`, `styles.css`, `app.js` e logo em `assets/`. Não utiliza backend, conta ou bibliotecas instaladas.

Rodar os testes: `node tests/smoke.cjs`. O GitHub Actions executa o teste após cada atualização.

### Limitações conhecidas / possíveis evoluções

- As peças usam fotos e terminais didáticos, e não modelos 3D editáveis.
- As conexões são criadas por dois toques, não por um motor elétrico de circuitos universais.
- A pista é virtual e independente de um carrinho físico.
- Sensores virtuais adicionais só devem ser habilitados quando o protótipo real também os utilizar.

O catálogo de chaveiros continua independente: nenhum arquivo daquele repositório foi alterado.
