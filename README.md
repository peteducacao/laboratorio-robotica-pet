# TinkerPET — Laboratório Virtual de Robótica

Aplicação interativa do **PET Educação — UFS**. O projeto reproduz, de forma didática, a montagem de um carrinho Wi-Fi com ESP32 usando uma **bancada vazia, um catálogo lateral e peças arrastáveis**.

## Acesse

[Laboratório TinkerPET](https://peteducacao.github.io/laboratorio-robotica-pet/)

## Como usar

1. Comece com uma **bancada vazia**. No catálogo, procure por **Motor DC** (não Motor TT).
2. Abra o catálogo usando a **seta fixa no centro da borda esquerda**. Funciona no celular, tablet e computador sem depender do menu superior. **Arraste** a imagem da peça para a bancada ou toque nela para adicioná-la automaticamente.
3. **Arraste os componentes soltos pela imagem**, sem cartões ao redor. Os terminais aparecem sobrepostos às fotografias da placa. Arraste uma área vazia da bancada para navegar e use +, − e ⛶ para ajustar o zoom.
4. **Crie fios** tocando em um terminal e depois em outro, ou arrastando de um contato ao outro. Os caminhos usam segmentos ortogonais; escolha a cor na barra inferior. Para remover, toque no fio, abra **Fios**, ou use **Desfazer**.
5. Use a aba de propriedades para aprender sobre o componente selecionado.
6. Coloque as 9 peças, conecte os **17 pares de terminais** do projeto e ajuste **5,0 V na saída do LM2596**.
7. Ligue as duas gangorras e escolha **Iniciar simulação** para ir à pista.
8. Na pista, use WASD, setas ou os controles na tela para pilotar.

O projeto salva automaticamente a montagem no navegador. O botão **Desfazer** reverte várias alterações. O botão **Limpar** solicita confirmação.

## Componentes presentes

- 1 ESP32 DevKit V1 de 30 pinos: todos os contatos têm seus nomes no próprio desenho. O carrinho usa VIN, GND, D27, D26, D32 e D18; ambos os GND físicos são aceitos.
- 1 ponte H MX1508 (VCC, GND, IN1–IN4 e duas saídas para motores)
- 1 LM2596 (IN+, IN−, OUT+, OUT−)
- 2 baterias representadas como 9 V
- 2 gangorras
- 2 motores DC comuns com escovas, corpo cilíndrico prateado e duas abas elétricas traseiras

As imagens dos demais componentes foram obtidas do repositório público de referência didática do projeto:
[Fundamentos de Prototipagem e Fabricação Digital — Gabriel J. Santos](https://github.com/gabrieljsantos/Fundamentos-de-Prototipagem-e-Fabrica--o-Digital), arquivos em `assets/images/componentes/`. O motor DC usa uma ilustração vetorial própria em `assets/motor-dc.svg` com dois pontos de contato integrados e indicador de rotação na pista. O projeto usa a logo do PET Educação mantida no catálogo do próprio PET.

## Observação técnica

**Não é uma cópia do código do Tinkercad nem um simulador elétrico de precisão.** É uma ferramenta própria com o fluxo de escolha de peças, arraste, colocação, fios e circuito do carrinho. A validação compara as ligações com o esquema educativo; não calcula corrente, falhas reais, tensão sob carga, choques ou execução do firmware. Os terminais "A • 1" / "A • 2" e "B • 1" / "B • 2" são nomes didáticos para os dois bornes de cada saída da MX1508, que não têm numeração individual.

Montagens físicas, soldas e medições exigem supervisão de um adulto capacitado. A representação de uma bateria no simulador não é uma aprovação elétrica de seu uso fora dele.

## Desenvolvimento e testes

Site estático: `index.html`, `styles.css`, `app.js` e logo em `assets/`. Não utiliza backend, conta ou bibliotecas instaladas.

Rodar os testes: `node tests/smoke.cjs`. O GitHub Actions executa o teste após cada atualização.

### Limitações conhecidas / possíveis evoluções

- O motor DC comum foi redesenhado como componente vetorial isolado, com dois contatos na região das abas traseiras; seu indicador de eixo gira no painel da simulação quando são dados comandos de movimento. Os demais componentes ainda usam fotografias com terminais didáticos aproximados, não modelos 3D elétricos completos.
- As conexões são criadas por dois toques, não por um motor elétrico de circuitos universais.
- A pista é virtual e independente de um carrinho físico.
- Sensores virtuais adicionais só devem ser habilitados quando o protótipo real também os utilizar.

O catálogo de chaveiros continua independente: nenhum arquivo daquele repositório foi alterado.
