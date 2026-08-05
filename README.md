# MUITTO

> Zero dependencies. Maximum clarity.

[![npm version](https://badge.fury.io/js/@aleosovski/muitto.svg)](https://www.npmjs.com/package/@aleosovski/muitto)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-native-blue.svg)](https://www.typescriptlang.org)

<p align="center"><b>English</b> · <a href="#muitto-pt-br">Português (BR)</a></p>

---

## Quick Start

```bash
npm install --save-dev @aleosovski/muitto
```

Create your first test:

```typescript
// sum.test.ts
import { describe, it, expect } from "muitto";

function sum(a: number, b: number): number {
  return a + b;
}

describe("sum()", () => {
  it("adds two positive numbers", () => {
    expect(sum(2, 3)).toBe(5);
  });
});
```

Run it:

```bash
npx muitto
```

## Why MUITTO?

MUITTO is for developers who want a test runner that:

- **Gets out of the way** — no config files to fight, no plugins to wire up, no setup wizard
- **Starts instantly** — zero runtime dependencies means nothing to install beyond the tool itself
- **Is readable** — the source is written to be understood, not just executed
- **Just works** — sensible defaults for file discovery, timeouts, and reporting

## Features

| Feature | Description |
|---------|-------------|
| ⚡ **Zero Config** | Discovers test files automatically. Works right after install. |
| 🔄 **Watch Mode** | Re-runs tests on save. Watches the whole project, not just test files. |
| ✓ **Full Matchers** | `toBe`, `toEqual`, `toThrow`, mock matchers, asymmetric matchers. |
| ◐ **Mocks & Spies** | `fn()`, `spyOn()`, control returns, resolutions and implementations. |
| ◷ **Fake Timers** | Control time in tests. Advance timers, run callbacks, no real waiting. |
| ☙ **Snapshots** | Regression tests persisted to disk, compared across runs and commits. |
| ▤ **Parameterized** | `it.each` for data-driven tests with auto-generated names. |
| ▣ **CI Ready** | `json` and `junit` reporters for GitHub Actions, GitLab CI, Jenkins. |
| ◈ **Visual Diffs** | See exactly what was expected vs received on failure. |

## Installation

### Requirements

- **Node.js** ≥ 18
- **TypeScript** (any version supported by `tsx`)

### Install

```bash
npm install --save-dev @aleosovski/muitto
```

Or run directly without installing:

```bash
npx muitto
```

### TypeScript Configuration

No special configuration needed. MUITTO works with your existing `tsconfig.json`.

## Usage

### Run all tests

```bash
npx muitto
```

### Watch mode

```bash
npx muitto --watch
```

### Filter by name

```bash
npx muitto --grep "sum"
```

### Run a specific file

```bash
npx muitto src/math.test.ts
```

### Use a different reporter

```bash
npx muitto --reporter json --output report.json
```

### Update snapshots

```bash
npx muitto --update-snapshots
```

## Writing Tests

### Basic Test

```typescript
import { describe, it, expect } from "muitto";

describe("math", () => {
  it("adds numbers", () => {
    expect(1 + 1).toBe(2);
  });

  it.skip("not ready yet", () => {
    // This test will be skipped
  });
});
```

### Async Tests

```typescript
it("fetches data", async () => {
  const data = await fetchData();
  expect(data).toEqual({ id: 1 });
});
```

### Parameterized Tests

```typescript
it.each([
  [1, 2, 3],
  [4, 5, 9],
])("sum $1 + $2 = $3", (a, b, expected) => {
  expect(sum(a, b)).toBe(expected);
});
```

### Mocks

```typescript
import { fn, spyOn } from "muitto";

const mockFn = fn();
mockFn.mockReturnValue(42);

expect(mockFn()).toBe(42);
expect(mockFn).toHaveBeenCalled();
```

### Fake Timers

```typescript
import { useFakeTimers } from "muitto";

const timers = useFakeTimers();
let called = false;

setTimeout(() => { called = true; }, 1000);
timers.advanceTimersByTime(1000);

expect(called).toBe(true);
timers.restore();
```

### Snapshots

```typescript
it("user profile", () => {
  expect(getUserProfile()).toMatchSnapshot({ name: "user-profile" });
});
```

## API Reference

### Test Functions

| Function | Description |
|----------|-------------|
| `describe(name, fn)` | Creates a test suite |
| `it(name, fn)` | Defines a test case |
| `it.skip(name, fn)` | Skips a test |
| `it.only(name, fn)` | Runs only this test |
| `it.todo(name)` | Registers a placeholder test to write later |
| `it.each(table)(name, fn)` | Parameterized test |

### Matchers

| Matcher | Description |
|---------|-------------|
| `toBe(value)` | Strict equality (`Object.is`) |
| `toEqual(value)` | Deep equality |
| `toBeTruthy()` / `toBeFalsy()` | Truthy / falsy check |
| `toBeNull()` / `toBeUndefined()` | Nullness checks |
| `toBeGreaterThan(n)` | Numeric comparison |
| `toContain(item)` | Array/string contains |
| `toHaveLength(n)` | Has length `n` |
| `toThrow(msg?)` | Throws exception |
| `toHaveBeenCalled()` | Mock was called |
| `toMatchSnapshot(opts?)` | Snapshot comparison |

Every matcher accepts negation via `.not` — `expect(x).not.toBe(y)`. See the [full documentation](./docs-site/index.html) for the complete matcher set, including asymmetric matchers (`expect.any`, `expect.objectContaining`, etc.).

## Configuration

Optional. Create `.muittorc.json` at your project root:

```json
{
  "pattern": ["src/**/*.spec.ts"],
  "testPathIgnorePatterns": ["/fixtures/"],
  "timeout": 10000,
  "reporter": "verbose",
  "bail": false,
  "updateSnapshots": false
}
```

Or use the `"muitto"` key in `package.json`:

```json
{
  "muitto": {
    "timeout": 10000,
    "reporter": "dot"
  }
}
```

Config precedence: **CLI flags** → **`.muittorc.json`** → **`package.json`** → defaults. Each layer only applies when the one before it doesn't define the value.

## CLI Reference

| Flag | Alias | Description |
|------|-------|-------------|
| `--watch` | `-w` | Watch mode |
| `--grep <pattern>` | | Filter tests by name |
| `--reporter <name>` | | `default`, `verbose`, `dot`, `json`, `junit` |
| `--output <file>` | `-o` | Write report to file |
| `--update-snapshots` | | Rewrite diverging snapshots |
| `--timeout <ms>` | `-t` | Test timeout (default: 5000) |
| `--bail` | | Stop on first failure |
| `--show-patterns` | | List discovery patterns |
| `--coverage` | | Not implemented yet — prints a warning |
| `--help` | `-h` | Show help |
| `--version` | `-v` | Show version |

## Reporters

| Reporter | Description |
|----------|-------------|
| `default` | Full, colored output for local terminal |
| `verbose` | Shows each test individually |
| `dot` | Compact — one character per test |
| `json` | Full JSON report |
| `junit` | JUnit XML for CI systems |

```bash
muitto --reporter junit --output ./junit.xml
muitto --reporter json --output ./report.json
```

## How It Works

MUITTO is built with a few simple principles:

1. **No bundler, no plugin system** — the only dev dependency is `tsx` for TypeScript compilation
2. **File discovery** — walks your project, matches paths against glob patterns using a hand-written matcher (no external glob library)
3. **Cache-busting imports** — each file is imported with a unique query string so watch mode always gets fresh code
4. **Sequential execution** — files run one after another for deterministic output
5. **Real timeouts** — every test timeout is guarded by a real `setTimeout` reference, so `useFakeTimers()` can't accidentally disable the runner
6. **Decoupled reporters** — a small observer interface (`onStart`, `onFileStart`, `onTestEnd`, `onEnd`) completely separate from execution

## Philosophy

MUITTO is built on a simple belief: **testing tools should be boring**.

- No magic. No plugins. No configuration wizard.
- Everything is explicit. Nothing happens unless you ask for it.
- The source code is meant to be read — not just executed.
- Dependencies are a liability. MUITTO has zero at runtime.

If you want a test runner that does one thing well and gets out of your way, MUITTO is for you.

*Built without dependencies. Not even this site.*

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development

```bash
git clone https://github.com/alexandreosovski/muitto.git
cd muitto
npm install
npm run dev
```

## License

MIT © 2026 [Alexandre Osovski](https://github.com/alexandreosovski)

---

<div align="center">
  <sub>Built without dependencies. Not even this site.</sub>
</div>

## Acknowledgments

MUITTO was inspired by [Poku](https://github.com/wellwelwel/poku), another excellent minimalist test runner. Check it out.

<br>

---

# MUITTO (PT-BR)

> Zero dependências. Máxima clareza.

[![npm version](https://badge.fury.io/js/@aleosovski/muitto.svg)](https://www.npmjs.com/package/@aleosovski/muitto)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-native-blue.svg)](https://www.typescriptlang.org)

<p align="center"><a href="#muitto">English</a> · <b>Português (BR)</b></p>

---

## Início rápido

```bash
npm install --save-dev @aleosovski/muitto
```

Crie seu primeiro teste:

```typescript
// sum.test.ts
import { describe, it, expect } from "muitto";

function sum(a: number, b: number): number {
  return a + b;
}

describe("sum()", () => {
  it("adds two positive numbers", () => {
    expect(sum(2, 3)).toBe(5);
  });
});
```

Rode:

```bash
npx muitto
```

## Por que MUITTO?

MUITTO é para quem quer um test runner que:

- **Não atrapalha** — sem arquivo de config pra brigar, sem plugin pra configurar, sem assistente de setup
- **Sobe instantaneamente** — zero dependências em runtime significa nada pra instalar além da própria ferramenta
- **É legível** — o código-fonte é escrito para ser entendido, não apenas executado
- **Simplesmente funciona** — padrões sensatos para descoberta de arquivos, timeouts e relatórios

## Recursos

| Recurso | Descrição |
|---------|-------------|
| ⚡ **Zero configuração** | Descobre arquivos de teste automaticamente. Funciona logo após instalar. |
| 🔄 **Watch mode** | Reexecuta os testes ao salvar. Observa o projeto inteiro, não só os arquivos de teste. |
| ✓ **Matchers completos** | `toBe`, `toEqual`, `toThrow`, matchers de mock, matchers assimétricos. |
| ◐ **Mocks & Spies** | `fn()`, `spyOn()`, controle de retornos, resoluções e implementações. |
| ◷ **Fake Timers** | Controle o tempo nos testes. Avance timers, execute callbacks, sem esperar de verdade. |
| ☙ **Snapshots** | Testes de regressão persistidos em disco, comparados entre execuções e commits. |
| ▤ **Parametrizado** | `it.each` para testes orientados a dados, com nomes gerados automaticamente. |
| ▣ **Pronto para CI** | Reporters `json` e `junit` para GitHub Actions, GitLab CI, Jenkins. |
| ◈ **Diffs visuais** | Veja exatamente o que era esperado vs. o que foi recebido quando um teste falha. |

## Instalação

### Requisitos

- **Node.js** ≥ 18
- **TypeScript** (qualquer versão suportada pelo `tsx`)

### Instalar

```bash
npm install --save-dev @aleosovski/muitto
```

Ou rode diretamente sem instalar:

```bash
npx muitto
```

### Configuração do TypeScript

Nenhuma configuração especial é necessária. O MUITTO funciona com o `tsconfig.json` que você já tem.

## Uso

### Rodar todos os testes

```bash
npx muitto
```

### Modo watch

```bash
npx muitto --watch
```

### Filtrar por nome

```bash
npx muitto --grep "sum"
```

### Rodar um arquivo específico

```bash
npx muitto src/math.test.ts
```

### Usar um reporter diferente

```bash
npx muitto --reporter json --output report.json
```

### Atualizar snapshots

```bash
npx muitto --update-snapshots
```

## Escrevendo testes

### Teste básico

```typescript
import { describe, it, expect } from "muitto";

describe("math", () => {
  it("adds numbers", () => {
    expect(1 + 1).toBe(2);
  });

  it.skip("not ready yet", () => {
    // Este teste será pulado
  });
});
```

### Testes assíncronos

```typescript
it("fetches data", async () => {
  const data = await fetchData();
  expect(data).toEqual({ id: 1 });
});
```

### Testes parametrizados

```typescript
it.each([
  [1, 2, 3],
  [4, 5, 9],
])("sum $1 + $2 = $3", (a, b, expected) => {
  expect(sum(a, b)).toBe(expected);
});
```

### Mocks

```typescript
import { fn, spyOn } from "muitto";

const mockFn = fn();
mockFn.mockReturnValue(42);

expect(mockFn()).toBe(42);
expect(mockFn).toHaveBeenCalled();
```

### Fake Timers

```typescript
import { useFakeTimers } from "muitto";

const timers = useFakeTimers();
let called = false;

setTimeout(() => { called = true; }, 1000);
timers.advanceTimersByTime(1000);

expect(called).toBe(true);
timers.restore();
```

### Snapshots

```typescript
it("user profile", () => {
  expect(getUserProfile()).toMatchSnapshot({ name: "user-profile" });
});
```

## Referência da API

### Funções de teste

| Função | Descrição |
|----------|-------------|
| `describe(name, fn)` | Cria uma suíte de testes |
| `it(name, fn)` | Define um caso de teste |
| `it.skip(name, fn)` | Pula um teste |
| `it.only(name, fn)` | Roda apenas esse teste |
| `it.todo(name)` | Registra um placeholder para escrever o teste depois |
| `it.each(table)(name, fn)` | Teste parametrizado |

### Matchers

| Matcher | Descrição |
|---------|-------------|
| `toBe(value)` | Igualdade estrita (`Object.is`) |
| `toEqual(value)` | Igualdade profunda |
| `toBeTruthy()` / `toBeFalsy()` | Checagem de truthy / falsy |
| `toBeNull()` / `toBeUndefined()` | Checagens de nulidade |
| `toBeGreaterThan(n)` | Comparação numérica |
| `toContain(item)` | Array/string contém |
| `toHaveLength(n)` | Tem comprimento `n` |
| `toThrow(msg?)` | Lança exceção |
| `toHaveBeenCalled()` | Mock foi chamado |
| `toMatchSnapshot(opts?)` | Comparação com snapshot |

Todo matcher aceita negação via `.not` — `expect(x).not.toBe(y)`. Veja a [documentação completa](./docs-site/index.html) para o conjunto completo de matchers, incluindo matchers assimétricos (`expect.any`, `expect.objectContaining`, etc.).

## Configuração

Opcional. Crie um `.muittorc.json` na raiz do projeto:

```json
{
  "pattern": ["src/**/*.spec.ts"],
  "testPathIgnorePatterns": ["/fixtures/"],
  "timeout": 10000,
  "reporter": "verbose",
  "bail": false,
  "updateSnapshots": false
}
```

Ou use a chave `"muitto"` no `package.json`:

```json
{
  "muitto": {
    "timeout": 10000,
    "reporter": "dot"
  }
}
```

Precedência de configuração: **flags de CLI** → **`.muittorc.json`** → **`package.json`** → padrões internos. Cada camada só é aplicada quando a anterior não define o valor.

## Referência da CLI

| Flag | Alias | Descrição |
|------|-------|-------------|
| `--watch` | `-w` | Modo watch |
| `--grep <pattern>` | | Filtra testes por nome |
| `--reporter <name>` | | `default`, `verbose`, `dot`, `json`, `junit` |
| `--output <file>` | `-o` | Grava o relatório em arquivo |
| `--update-snapshots` | | Regrava snapshots divergentes |
| `--timeout <ms>` | `-t` | Timeout por teste (padrão: 5000) |
| `--bail` | | Interrompe na primeira falha |
| `--show-patterns` | | Lista os padrões de descoberta |
| `--coverage` | | Ainda não implementado — exibe um aviso |
| `--help` | `-h` | Mostra ajuda |
| `--version` | `-v` | Mostra a versão |

## Reporters

| Reporter | Descrição |
|----------|-------------|
| `default` | Interface completa e colorida para o terminal local |
| `verbose` | Mostra cada teste individualmente |
| `dot` | Modo compacto — um caractere por teste |
| `json` | Relatório JSON completo |
| `junit` | XML JUnit para sistemas de CI |

```bash
muitto --reporter junit --output ./junit.xml
muitto --reporter json --output ./report.json
```

## Como funciona

O MUITTO é construído sobre alguns princípios simples:

1. **Sem bundler, sem sistema de plugins** — a única dependência de desenvolvimento é o `tsx`, para compilar TypeScript
2. **Descoberta de arquivos** — percorre o projeto e compara os caminhos com padrões glob usando um matcher escrito à mão (sem lib externa de glob)
3. **Imports com cache-busting** — cada arquivo é importado com uma query string única, para que o watch mode sempre pegue código atualizado
4. **Execução sequencial** — os arquivos rodam um após o outro, garantindo uma saída determinística
5. **Timeouts reais** — o timeout de cada teste é protegido por uma referência real de `setTimeout`, então `useFakeTimers()` não consegue desativar o runner sem querer
6. **Reporters desacoplados** — uma pequena interface de observer (`onStart`, `onFileStart`, `onTestEnd`, `onEnd`) totalmente separada da execução

## Filosofia

O MUITTO é construído sobre uma crença simples: **ferramentas de teste deveriam ser chatas (no bom sentido)**.

- Sem mágica. Sem plugins. Sem assistente de configuração.
- Tudo é explícito. Nada acontece a menos que você peça.
- O código-fonte foi feito para ser lido — não apenas executado.
- Dependências são um passivo. O MUITTO tem zero em runtime.

Se você quer um test runner que faz uma coisa bem feita e não atrapalha, o MUITTO é pra você.

*Construído sem dependências. Nem este site.*

## Contribuindo

Contribuições são bem-vindas! Por favor:

1. Faça um fork do repositório
2. Crie uma branch de feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Add nova feature'`)
4. Dê push na branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

### Desenvolvimento

```bash
git clone https://github.com/alexandreosovski/muitto.git
cd muitto
npm install
npm run dev
```

## Licença

MIT © 2026 [Alexandre Osovski](https://github.com/alexandreosovski)

---

<div align="center">
  <sub>Construído sem dependências. Nem este site.</sub>
</div>

## Agradecimentos

O MUITTO foi inspirado pelo [Poku](https://github.com/wellwelwel/poku), outro excelente test runner minimalista. Vale a pena conhecer.
