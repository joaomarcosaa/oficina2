const { mover, teclaParaComando } = require("../src/movement");

test("move para a direita", () => {
  expect(mover({ x: 0, y: 0 }, "direita")).toEqual({ x: 1, y: 0 });
});

test("não sai dos limites da grade", () => {
  expect(mover({ x: 0, y: 0 }, "esquerda")).toEqual({ x: 0, y: 0 });
  expect(mover({ x: 9, y: 9 }, "tras")).toEqual({ x: 9, y: 9 });
});

test("comando inválido não move", () => {
  expect(mover({ x: 3, y: 3 }, "pular")).toEqual({ x: 3, y: 3 });
});

test("seta do teclado vira comando", () => {
  expect(teclaParaComando("ArrowUp")).toBe("frente");
  expect(teclaParaComando("a")).toBeNull();
});
