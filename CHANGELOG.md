# Changelog

All notable changes to this project are documented in this file.
*Todas as mudanças relevantes deste projeto são documentadas neste arquivo.*

---

## [1.5.0] — 2026-08-09

### English

#### Added

- **Real code coverage** — `--coverage` now actually instruments and reports coverage instead of printing a "not implemented" notice. Implemented with Node's built-in `node:inspector` Profiler (precise, block-level V8 coverage) — no `istanbul`/`nyc`/`c8` dependency, keeping the zero-runtime-dependency guarantee. Reports line, statement (approximated from line data), function, and branch (approximated from V8's nested block ranges) coverage. Prints a per-file summary table to the terminal and writes a machine-readable `coverage/coverage-summary.json` for CI. Files under `node_modules/`, `dist/`, `.git/`, `coverage/`, `build/`, `.next/`, `.nuxt/`, and the test files themselves are excluded, so only the code under test is measured.
- `CoverageReport`/`CoverageMetric`/`FileCoverage` types (`src/types.ts`) now describe the real shape produced by the new coverage engine, replacing the previously-unused placeholder `CoverageReport` interface.
- **`globalSetup` / `globalTeardown`** — new config-only (`.muittorc.json` / the `"muitto"` key in `package.json`) options for hooks that run once for the **entire run**, across all test files, instead of being scoped to a single `describe` block like `beforeAll`/`afterAll`. Each is a file path (resolved relative to the project root) whose default export is a `() => void | Promise<void>` function, dynamically imported and called once — useful for spinning up a shared test database or server before any test runs, and tearing it down after the last one finishes. If `globalSetup` throws, the whole run aborts immediately and zero test files run. If `globalTeardown` throws, the run fails (non-zero exit) even if every test passed, though the test results are still reported first. `--show-patterns` now also prints the configured paths, if any.

### Português

#### Adicionado

- **Cobertura de código de verdade** — `--coverage` agora de fato instrumenta e reporta cobertura, em vez de exibir um aviso de "não implementado". Implementado com o Profiler nativo do `node:inspector` (cobertura precisa do V8, no nível de bloco) — sem dependência de `istanbul`/`nyc`/`c8`, preservando a garantia de zero dependências em runtime. Reporta cobertura de linhas, statements (aproximado a partir dos dados de linha), funções e branches (aproximado a partir dos ranges de bloco aninhados do V8). Imprime uma tabela resumo por arquivo no terminal e grava um `coverage/coverage-summary.json` legível por máquina para o CI. Arquivos em `node_modules/`, `dist/`, `.git/`, `coverage/`, `build/`, `.next/`, `.nuxt/`, e os próprios arquivos de teste são excluídos, de forma que só o código sob teste é medido.
- Os tipos `CoverageReport`/`CoverageMetric`/`FileCoverage` (`src/types.ts`) agora descrevem o formato real produzido pelo novo motor de cobertura, substituindo a interface `CoverageReport` anterior, que era apenas um placeholder não utilizado.
- **`globalSetup` / `globalTeardown`** — novas opções, disponíveis apenas via arquivo de configuração (`.muittorc.json` / chave `"muitto"` no `package.json`), para hooks que rodam uma única vez para **toda a execução**, através de todos os arquivos de teste, em vez de ficarem restritos a um único bloco `describe` como `beforeAll`/`afterAll`. Cada uma é um caminho de arquivo (resolvido em relação à raiz do projeto) cuja exportação padrão é uma função `() => void | Promise<void>`, importada dinamicamente e chamada uma única vez — útil para subir um banco de dados ou servidor de teste compartilhado antes de qualquer teste rodar, e derrubá-lo depois que o último terminar. Se `globalSetup` lançar um erro, a execução inteira é abortada imediatamente e nenhum arquivo de teste roda. Se `globalTeardown` lançar um erro, a execução falha (código de saída diferente de zero) mesmo que todos os testes tenham passado, embora os resultados dos testes ainda sejam reportados primeiro. `--show-patterns` agora também exibe os caminhos configurados, se houver.

## [1.4.13] — 2026-08-04

### English

#### Fixed

- **Config precedence** — settings in `.muittorc.json` / the `"muitto"` key in `package.json` (`timeout`, `reporter`, `coverage`, `bail`, `grep`) were being silently discarded whenever a caller (the CLI or a programmatic `runTests()` call) didn't explicitly repeat the same value. Precedence is now correctly: **CLI flags → `.muittorc.json` → `package.json` → built-in defaults**, with each layer only applying when the one before it doesn't define the value.
- **`pattern` / `testMatch` now actually drive discovery** — these settings used to be cosmetic. Test file discovery ran a hardcoded `.spec.`/`.test.` substring check regardless of what was configured. A real glob matcher (supporting `**`, `*`, `?`, and `{a,b}` alternation) now backs discovery, and `--show-patterns` reflects what's genuinely in effect.
- **Registry leak on collection errors** — if a test file threw partway through import (after some `describe`/`it` calls had already run), leftover tests could leak into and run as part of the *next* file, mislabeled with the wrong file path.
- **`useFakeTimers()` no longer breaks the runner's own timeout** — a test that mocks timers and forgets to call `restore()` could previously disable the per-test timeout entirely, causing a hang instead of a clean timeout failure. Real timer references are now captured once, before any test file runs.
- **Watch mode** now re-discovers newly created test files instead of only re-running the file list gathered at startup, and watches the whole project directory rather than just the initially discovered test files.

#### Added

- **Disk-persisted snapshots** — `toMatchSnapshot()` and `expectSnapshot()` now write to `__snapshots__/<file>.snap` next to the test file, and compare against previous runs and commits (not just earlier calls within the same process).
- **`--update-snapshots`** is now wired up end-to-end. It existed as a CLI flag before but had no effect.
- **`--coverage`** now prints an explicit notice that coverage instrumentation isn't implemented yet, instead of silently doing nothing.

#### Changed

- Asymmetric matchers (`expect.any`, `expect.anything`, `expect.objectContaining`, etc.) now use an internal `muitto.asymmetricMatcher` symbol instead of a leftover `jest.asymmetricMatcher` one. Purely internal — no behavior change.

### Português

#### Corrigido

- **Precedência de configuração** — as opções em `.muittorc.json` / na chave `"muitto"` do `package.json` (`timeout`, `reporter`, `coverage`, `bail`, `grep`) eram descartadas silenciosamente sempre que quem chamava (a CLI ou um `runTests()` programático) não repetisse explicitamente o mesmo valor. A precedência agora é, corretamente: **flags de CLI → `.muittorc.json` → `package.json` → padrões internos**, e cada camada só é aplicada quando a anterior não define o valor.
- **`pattern` / `testMatch` agora realmente guiam a descoberta** — essas opções eram cosméticas. A descoberta de arquivos de teste rodava uma checagem fixa de substring `.spec.`/`.test.`, independente do que estivesse configurado. Um matcher de glob de verdade (suportando `**`, `*`, `?` e alternância `{a,b}`) agora sustenta a descoberta, e `--show-patterns` reflete o que está realmente em vigor.
- **Vazamento de registro em erros de coleta** — se um arquivo de teste lançasse um erro no meio da importação (depois de alguns `describe`/`it` já terem rodado), os testes restantes podiam vazar e rodar como parte do *próximo* arquivo, com o caminho de arquivo errado.
- **`useFakeTimers()` não quebra mais o timeout do próprio runner** — um teste que mocka timers e esquece de chamar `restore()` podia antes desativar o timeout por teste inteiramente, causando um travamento em vez de uma falha limpa de timeout. Referências reais dos timers agora são capturadas uma única vez, antes de qualquer arquivo de teste rodar.
- **Watch mode** agora redescobre arquivos de teste recém-criados em vez de só reexecutar a lista coletada na inicialização, e observa o projeto inteiro em vez de só os arquivos de teste descobertos inicialmente.

#### Adicionado

- **Snapshots persistidos em disco** — `toMatchSnapshot()` e `expectSnapshot()` agora gravam em `__snapshots__/<arquivo>.snap`, ao lado do arquivo de teste, e comparam contra execuções e commits anteriores (não só chamadas anteriores dentro do mesmo processo).
- **`--update-snapshots`** agora está conectado de ponta a ponta. Antes existia como flag de CLI mas não tinha efeito nenhum.
- **`--coverage`** agora imprime um aviso explícito de que a instrumentação de cobertura ainda não está implementada, em vez de simplesmente não fazer nada.

#### Alterado

- Matchers assimétricos (`expect.any`, `expect.anything`, `expect.objectContaining`, etc.) agora usam um símbolo interno `muitto.asymmetricMatcher` em vez de um `jest.asymmetricMatcher` esquecido. Puramente interno — sem mudança de comportamento.
