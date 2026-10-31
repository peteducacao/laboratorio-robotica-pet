# Registro de Nicks — TinkerPET

A interface foi integrada à página **Meus circuitos** sem mudar o funcionamento do editor. O novo botão **Admin** fica logo abaixo de **Gabaritos**. O painel mostra **somente o total e os Nicks**, com busca. A lixeira na edição do Nick remove apenas o Nick **do navegador** (mantém todos os circuitos). O histórico no GitHub continua; o Nick novo é adicionado como outro nome distinto.

## Por que o registro ainda exige configuração?

O site é publicado no **GitHub Pages**, que só entrega arquivos estáticos. Para registrar um Nick automaticamente em `data/nicks.json` por meio da API GitHub, é necessário autenticar uma gravação. **Nunca** coloque um token do GitHub no JavaScript público.

O serviço intermediário está pronto em `backend/nicks-worker.js` (Cloudflare Worker). Ele recebe os novos Nicks e atualiza o JSON na API do GitHub com token **guardado no servidor**, preservando a experiência local mesmo em falhas de rede. O próprio GitHub funciona como armazenamento — **não há banco SQL**.

## Ativação (uma única vez)

1. **Recomendado:** crie um repositório GitHub **privado** separado para o registro (por exemplo, `tinkerpet-nicks`). A alternativa é usar este repositório atual, que já contém `data/nicks.json`, mas **todos os Nicks registrados ficarão públicos nos commits e na URL do arquivo**. Em repositório privado, crie um arquivo `data/nicks.json` com o conteúdo `[]`.
2. No GitHub, crie um **fine-grained personal access token** limitado exclusivamente ao repositório escolhido, com permissão **Contents: Read and write**. A pessoa administradora deve manter esse token em segredo.
3. Crie um **Cloudflare Worker** e cole o conteúdo do arquivo `backend/nicks-worker.js`. Não é necessário D1, KV, R2 ou qualquer outro banco.
4. Configure as **variáveis** do Worker:
   - `GH_OWNER`: dono do repositório de Nicks.
   - `GH_REPO`: nome do repositório de Nicks.
   - `GH_BRANCH`: `main` (ou o nome da branch).
   - `ALLOWED_ORIGIN`: `https://peteducacao.github.io`.
5. Configure **Secrets** do Worker (não variáveis públicas):
   - `GH_TOKEN`: token criado no passo 2.
   - `ADMIN_PASSWORD`: a senha definida para o painel Admin. Não publique esse valor no repositório.
6. Copie a URL HTTPS pública do Worker e cole em `nick-registry.js` na constante `API_URL`; remova a barra final, se houver. Publique a alteração.

## O que acontece depois

- Quando alguém escolher ou alterar seu Nick, o navegador tenta enviar o novo Nick em segundo plano. Se a rede falhar, a escolha local permanece e o envio fica pendente nesse navegador.
- A API guarda apenas uma ocorrência de cada Nick, ignorando maiúsculas/minúsculas e espaços repetidos. Isso **não impede** duas pessoas de escolherem o mesmo Nick no site: esse comportamento é intencional para não interferir no aprendizado.
- A senha de Admin é validada **no Worker**. Ela nunca precisa ser colocada no arquivo JS público. A lista só aparece na interface após a validação.
- Excluir seu Nick no computador **não apaga os Nicks históricos** do GitHub, apenas libera o campo para escolher outro.
- Um Nick não equivale necessariamente a uma pessoa diferente. A lista não identifica os donos e não guarda endereços de IP.
- O arquivo do GitHub é atualizado em cada novo Nick único, gerando um commit. Um repositório privado separado evita disparar novas publicações do TinkerPET a cada registro.

## Cuidados

**Não divulgue a URL da lista** se usar repositório público. Mesmo que o painel Admin peça senha, os arquivos de um repositório GitHub público podem ser acessados diretamente. Se os Nicks devem ficar reservados, **é necessário usar um repositório privado**.

O endpoint aceita Nicks de visitantes sem login, como solicitado. Isso também significa que pessoas mal-intencionadas podem tentar enviar nomes falsos. Configure proteção de taxa (rate limiting) no Cloudflare se o serviço tiver grande circulação. Para a senha Admin, use limite de tentativas no Cloudflare.

Após ativar, informe aos participantes de maneira simples que o Nick escolhido pode ser registrado para contagem e visualização pela equipe.

## Arquivos específicos

- `projects.html`: somente botão Admin, modal do painel e lixeira de Nick.
- `projects.css`: estilos novos exclusivamente para Admin/lixeira e acomodação do quarto botão no celular.
- `projects.js`: integração da lista e do botão de exclusão local; rotina do editor preservada.
- `nick-registry.js`: cliente opcional e fila de registro dos Nicks.
- `backend/nicks-worker.js`: gravação e leitura pela API do GitHub, sem token no navegador.
- `data/nicks.json`: lista inicial vazia no repositório atual (opcional usar outro repositório privado).
