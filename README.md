# 🥓 MUITTO

> Transformando porco em bacon

**MUITTO** é um test runner minimalista para TypeScript, construído sem dependências externas em runtime (além do `tsx` para transpilação em dev). Rápido, leve e com uma interface moderna inspirada nos melhores test runners do mercado.

[![npm version](https://img.shields.io/npm/v/muitto.svg)](https://www.npmjs.com/package/muitto)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)

---

## ✨ Features

- 🚀 **Zero configuração** - Funciona out of the box
- 🎨 **Interface bonita** - Cores, símbolos e formatação profissional
- 📊 **Expected vs Received** - Diff visual quando testes falham
- 🔍 **Watch Mode** - Reexecuta testes automaticamente ao salvar arquivos
- 🧪 **Matchers completos** - `toBe`, `toEqual`, `toContain`, `toThrow` e muito mais
- 🎭 **Mock Functions** - Crie mocks, spies e controle comportamentos
- ⏱️ **Fake Timers** - Controle o tempo nos seus testes
- 🔄 **Retry** - Tentativas automáticas para testes flaky
- 📸 **Snapshots** - Teste de regressão visual
- 🏷️ **Test.each** - Testes parametrizados
- 🎯 **Filtros** - Rode apenas os testes que você quer (`--grep`)
- 📄 **Reporters para CI** - `json` e `junit` prontos para integrar com sua pipeline

---

## 📦 Instalação

```bash
npm install --save-dev @aleosovski/muitto
```

Ou use diretamente com npx:

```bash
npx @aleosovski/muitto
```

## 🚀 Uso Rápido

### Execute todos os testes

```bash
npx muitto
```

### Watch Mode

```bash
npx muitto --watch
```

### Filtrar testes

```bash
npx muitto --grep "soma"
```

### Arquivo específico

```bash
npx muitto __tests__/soma.test.ts
```

### Relatório para CI

```bash
npx muitto --reporter junit --output ./junit.xml
npx muitto --reporter json --output ./report.json
```

## 📝 Escrevendo Testes

### Básico

```typescript
import { describe, it, expect } from "muitto";

function soma(a: number, b: number): number {
  return a + b;
}

describe("soma()", () => {
  it("soma dois números positivos", () => {
    expect(soma(2, 3)).toBe(5);
  });

  it("soma com negativos", () => {
    expect(soma(-2, -3)).toBe(-5);
  });
});
```

### Testes Parametrizados

```typescript
it.each([
  [1, 2, 3],
  [4, 5, 9],
  [10, 20, 30]
])('soma $1 + $2 = $3', (a: number, b: number, expected: number) => {
  expect(soma(a, b)).toBe(expected);
});
```

### Objetos e Arrays

```typescript
it("compara objetos profundamente", () => {
  expect({ a: 1, b: [1, 2, 3] }).toEqual({ a: 1, b: [1, 2, 3] });
});

it("verifica se array contém item", () => {
  expect([1, 2, 3]).toContain(2);
});
```

### Exceções

```typescript
it("captura exceções", () => {
  expect(() => {
    throw new Error("boom");
  }).toThrow("boom");
});
```

### Mocks

```typescript
import { fn, spyOn } from "muitto";

it("cria função mock", () => {
  const mockFn = fn();
  mockFn.mockReturnValue(42);

  expect(mockFn()).toBe(42);
  expect(mockFn.mock.calls).toHaveLength(1);
});

it("espiona método de objeto", () => {
  const obj = {
    greet: (name: string) => `Hello ${name}`,
  };

  const spy = spyOn(obj, "greet");

  obj.greet("World");

  expect(spy.mock.calls).toEqual([["World"]]);

  spy.mockRestore();
});
```

### Fake Timers

```typescript
import { useFakeTimers } from "muitto";

it("controla o tempo", () => {
  const timers = useFakeTimers();
  let called = false;

  setTimeout(() => {
    called = true;
  }, 1000);

  timers.advanceTimersByTime(1000);

  expect(called).toBe(true);

  timers.restore();
});
```

### Retry

```typescript
import { retry } from "muitto";

it("tenta novamente em caso de falha", async () => {
  let attempts = 0;

  await retry(async () => {
    attempts++;
    if (attempts < 3) throw new Error("Ainda não");
  }, { times: 5, delay: 100 });

  expect(attempts).toBe(3);
});
```

## 🎯 Matchers Disponíveis

| Matcher | Descrição |
|---|---|
| `toBe(value)` | Igualdade estrita (`===`) |
| `toEqual(value)` | Igualdade profunda |
| `toBeTruthy()` | Valor é truthy |
| `toBeFalsy()` | Valor é falsy |
| `toBeNull()` | Valor é `null` |
| `toBeUndefined()` | Valor é `undefined` |
| `toBeDefined()` | Valor não é `undefined` |
| `toBeNaN()` | Valor é `NaN` |
| `toBeGreaterThan(n)` | Maior que `n` |
| `toBeGreaterThanOrEqual(n)` | Maior ou igual a `n` |
| `toBeLessThan(n)` | Menor que `n` |
| `toBeLessThanOrEqual(n)` | Menor ou igual a `n` |
| `toBeCloseTo(n, precision?)` | Próximo de `n` |
| `toContain(item)` | Contém `item` |
| `toHaveLength(n)` | Tem comprimento `n` |
| `toHaveProperty(path, value?)` | Tem propriedade |
| `toBeInstanceOf(Class)` | É instância de `Class` |
| `toThrow(message?)` | Lança exceção |
| `toMatch(pattern)` | Match com regex/string |
| `toBeOneOf(array)` | É um dos valores |
| `toSatisfy(predicate)` | Satisfaz predicado |
| `.not` | Nega qualquer matcher |

## 📋 CLI Options

```text
Usage:
  muitto [options] [files...]

Options:

  --watch, -w            Run tests in watch mode
  --coverage              Generate coverage report
  --grep <pattern>        Run only matching tests
  --reporter <name>       Select reporter (default, verbose, dot, json, junit)
  --output, -o <file>     Write report to file (used by json and junit reporters)
  --update-snapshots       Update snapshots
  --timeout, -t <ms>      Timeout per test in ms (default: 5000)
  --bail                  Stop on first failure
  --pattern, -p <regex>   Custom regex for test file discovery
  --help, -h               Show help
  --version, -v            Show version
```

## 🎨 Reporters

| Reporter | Descrição |
|---|---|
| `default` | Interface completa e colorida |
| `verbose` | Mostra cada teste individualmente |
| `dot` | Modo compacto com pontos |
| `json` | Relatório JSON completo, para stdout ou arquivo (`--output`) |
| `junit` | XML compatível com JUnit, ideal para CI (GitHub Actions, GitLab, Jenkins) |

```bash
npx muitto --reporter verbose
npx muitto --reporter dot
npx muitto --reporter json --output ./report.json
npx muitto --reporter junit --output ./junit.xml
```

## 🔥 Exemplo de Output

### Testes passando

```text
MUiTTO v1.0.0
Found 3 test file(s)

RUN  __tests__/soma.test.ts
  ✓ soma dois números positivos (1ms)
  ✓ soma com negativos (0ms)

RUN  __tests__/matchers.test.ts
  ✓ toEqual compara profundamente (1ms)
  ✓ toContain funciona em arrays e strings (0ms)

──────────────────────────────────────────────────

PASS 4

Test Files  2 passed
Tests       4 passed
Duration    25ms

✨ All tests passed
```

### Testes falhando

```text
FAIL soma()

  Expected:
    5

  Received:
    3

  at __tests__/soma.test.ts:10:5

──────────────────────────────────────────────────

FAIL 1
PASS 3

✖ Some tests failed
```

## 🏗️ Estrutura do Projeto

```text
muitto/
├── bin/
│   └── index.js            # Ponto de entrada do binário (npm)
├── src/
│   ├── cli/
│   │   ├── cli.ts          # Parser da CLI
│   │   ├── help.ts         # Sistema de ajuda
│   │   └── watch.ts        # Watch mode
│   ├── core/
│   │   ├── runner.ts       # Executor de testes
│   │   ├── collector.ts    # Coletor de resultados
│   │   └── timer.ts        # Timer de performance
│   ├── formatting/
│   │   ├── errors.ts       # Formatação de erros
│   │   ├── diff.ts         # Diff de objetos
│   │   └── summary.ts      # Resumo final
│   ├── reporters/
│   │   ├── base.ts         # Interface base
│   │   ├── default.ts      # Reporters padrão, dot e verbose
│   │   ├── json.ts         # Reporter JSON
│   │   └── junit.ts        # Reporter JUnit XML
│   ├── assert.ts           # Assertions e matchers
│   ├── colors.ts           # Cores e símbolos
│   ├── index.ts            # API pública
│   └── types.ts             # Tipos TypeScript
├── package.json
└── README.md
```

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para:

1. 🍴 Fazer um fork
2. 🌿 Criar uma branch (`git checkout -b feature/nova-feature`)
3. 💾 Commitar suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. 📤 Push para a branch (`git push origin feature/nova-feature`)
5. 🔃 Abrir um Pull Request

## 📄 Licença

MIT © 2026 Alexandre Osovski

---

### 🥓 Por que MUITTO?

**MUITTO** é uma brincadeira/homenagem ao [Poku Test Runner](https://github.com/wellwelwel/poku), um test runner minimalista e sem dependências criado pelo [@wellwelwel](https://github.com/wellwelwel).

A ideia era criar um test runner também **zero dependências** (além do `tsx` para transpilação TypeScript), seguindo a mesma filosofia do Poku: ser leve, rápido e direto ao ponto.

Enquanto o Poku transforma o caos em ordem, o MUITTO transforma o POKU em bacon! 🐷➡️🥓

> Se você curte test runners minimalistas, dá uma olhada no [Poku](https://github.com/wellwelwel/poku) também!
