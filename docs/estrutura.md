# Estrutura do PopLavanderia

A raiz guarda a entrada do site e o que as ferramentas só leem nesse lugar. Todo o resto fica na pasta do seu assunto, um arquivo por responsabilidade.

## Raiz

| Arquivo | Por que fica aqui |
| --- | --- |
| `index.html` | Única página na raiz. O Vite e o navegador tratam `/` como este arquivo. |
| `package.json`, `package-lock.json` | O npm só reconhece o manifesto na raiz. |
| `vite.config.js` | Configuração do servidor de desenvolvimento e do build. |
| `playwright.config.js` | Configuração dos testes de interface. |
| `netlify.toml` | Build, cabeçalhos e reescritas de URL da publicação. |
| `.gitignore` | Regras do Git para o repositório inteiro. |

Não coloque na raiz outra página HTML, script solto, imagem ou favicon. Se uma ferramenta nova exigir arquivo na raiz, registre o motivo nesta tabela.

## Pastas

```
pages/          páginas HTML, uma por rota
  institucional   sobre, serviços, unidades
  acesso          login, cadastro, recuperar e redefinir senha
  app             aplicativo e conta
public/         arquivos servidos como estão, no mesmo caminho
  images/         fotos e ilustrações estáticas
src/css/        folha de estilo
src/js/pages/   comportamento de cada página
src/js/lib/     regras de sessão, crédito, validação e armazenamento
src/js/ui/      cabeçalho, carrossel, bolhas e avisos
src/js/data/    tabelas estáticas de lojas e preços
scripts/        automações do repositório
tests/          testes Playwright
docs/           esta documentação
```

O módulo em `src/js/pages/` acompanha a página em `pages/`. Exemplo: `pages/acesso/login.html` carrega `src/js/pages/login.js`.

## Endereço público e arquivo

O visitante continua em `/sobre.html`. O arquivo mora em `pages/institucional/sobre.html`. A tabela única está em `scripts/page-routes.mjs`.

- No desenvolvimento, `vite.config.js` reescreve o pedido para o arquivo.
- Na publicação, `netlify.toml` faz a mesma reescrita com status 200.

Ao criar uma página, faça os três passos juntos:

1. Grave o HTML na pasta do domínio (`institucional`, `acesso` ou `app`).
2. Acrescente a rota em `scripts/page-routes.mjs`.
3. Copie a mesma reescrita para `netlify.toml`.

Links internos, canonical e sitemap usam o endereço curto (`/login.html`), nunca o caminho da pasta.

## Arquivos estáticos

Imagens, favicon, `robots.txt` e `sitemap.xml` ficam em `public/`. O navegador pede `/images/hero-principal.png` e `/favicon.svg`. O HTML referencia esses caminhos com barra no início.

A foto do hero é editada em `src/assets/hero-principal.png`. Os scripts `predev` e `prebuild` copiam esse arquivo para `public/images/hero-principal.png` (`scripts/sync-hero-image.mjs`), para o Vite e o Netlify servirem sempre o mesmo caminho estável, sem depender de JavaScript para trocar o `src`.

`header-scroll.js` também fica em `public/`, porque as páginas o carregam com `<script defer>`. A versão em `src/js/header-scroll.js` é o módulo importado por `src/js/boot.js`. As duas se protegem com `window.__popHeaderScrollInit` para não registrar o scroll duas vezes.

## O que não versionar

`node_modules/`, `dist/`, `test-results/` e relatórios do Playwright são gerados. O `.gitignore` já os exclui.
