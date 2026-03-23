// Calculator DOM references
const displayInput = document.getElementById("display");
const resultDisplay = document.getElementById("result");
const buttons = document.getElementById("buttons");
const historyList = document.getElementById("historyList");
const clearHistoryBtn = document.getElementById("clearHistory");
const modeToggle = document.getElementById("modeToggle");
const themeToggle = document.getElementById("themeToggle");
const angleModeBadge = document.getElementById("angleMode");
const statusHint = document.getElementById("statusHint");
const body = document.body;

// Current expression shown in the display
let expression = "";
let angleMode = "DEG";
const maxHistory = 12;

const operators = ["+", "-", "*", "/", "^", "%"];
const functions = ["sin", "cos", "tan", "log", "ln", "√"];

function isOperator(char) {
  return operators.includes(char);
}

function setStatus(text) {
  statusHint.textContent = text;
}

function updateDisplay() {
  displayInput.value = expression || "";
  if (!expression) {
    resultDisplay.textContent = "0";
    return;
  }

  const preview = safeEvaluate(expression);
  if (preview !== null && Number.isFinite(preview)) {
    resultDisplay.textContent = formatNumber(preview);
  } else {
    resultDisplay.textContent = "—";
  }
}

function formatNumber(value) {
  if (Math.abs(value) >= 1e12 || (Math.abs(value) > 0 && Math.abs(value) < 1e-6)) {
    return value.toExponential(6).replace(/\.0+e/, "e");
  }
  return Number(value.toFixed(10)).toString();
}

function appendNumber(value) {
  expression += value;
}

function appendDecimal() {
  const lastOperatorIndex = Math.max(
    ...operators.map((op) => expression.lastIndexOf(op)),
    expression.lastIndexOf("("),
    expression.lastIndexOf(")")
  );
  const currentNumber = expression.slice(lastOperatorIndex + 1);
  if (!currentNumber.includes(".")) {
    expression += currentNumber === "" ? "0." : ".";
  }
}

function appendOperator(op) {
  if (!expression) {
    if (op === "-") {
      expression = "-";
    }
    return;
  }

  const last = expression.slice(-1);
  if (isOperator(last)) {
    expression = expression.slice(0, -1) + op;
    return;
  }
  if (last === "(" && op !== "-") {
    return;
  }
  expression += op;
}

function appendParenthesis(paren) {
  const last = expression.slice(-1);
  if (paren === "(" && last && (/[0-9π)]/.test(last))) {
    expression += "*";
  }
  expression += paren;
}

function appendFunction(name) {
  const last = expression.slice(-1);
  if (last && (/[0-9π)]/.test(last))) {
    expression += "*";
  }
  expression += `${name}(`;
}

function appendConstant(name) {
  const last = expression.slice(-1);
  if (last && (/[0-9π)]/.test(last))) {
    expression += "*";
  }
  if (name === "pi") {
    expression += "π";
  }
}

function backspace() {
  if (!expression) return;
  const funcMatch = functions.find((fn) => expression.endsWith(`${fn}(`));
  if (funcMatch) {
    expression = expression.slice(0, -(funcMatch.length + 1));
    return;
  }
  expression = expression.slice(0, -1);
}

function clearAll() {
  expression = "";
  setStatus("Cleared");
}

function evaluateExpression() {
  const value = safeEvaluate(expression);
  if (value === null || !Number.isFinite(value)) {
    setStatus("Error");
    resultDisplay.textContent = "Error";
    return;
  }

  const formatted = formatNumber(value);
  pushHistory(expression, formatted);
  expression = formatted;
  setStatus("Calculated");
}

function sanitizeExpression(expr) {
  const valid = /^[0-9+\-*/().^%π√a-zA-Z\s]*$/;
  if (!valid.test(expr)) {
    return null;
  }
  return expr;
}

function toJsExpression(expr) {
  let prepared = expr;
  prepared = prepared.replace(/\s+/g, "");
  prepared = prepared.replace(/π/g, "PI");
  prepared = prepared.replace(/√/g, "sqrt");
  prepared = prepared.replace(/\^/g, "**");
  prepared = prepared.replace(/%/g, "/100");
  return prepared;
}

// Safely evaluate the expression with a restricted function scope
function safeEvaluate(expr) {
  if (!expr) return 0;
  const sanitized = sanitizeExpression(expr);
  if (!sanitized) return null;

  const prepared = toJsExpression(sanitized);

  try {
    const fn = new Function(
      "sin",
      "cos",
      "tan",
      "log",
      "ln",
      "sqrt",
      "PI",
      `return ${prepared}`
    );
    return fn(
      (x) => Math.sin(angleMode === "DEG" ? toRadians(x) : x),
      (x) => Math.cos(angleMode === "DEG" ? toRadians(x) : x),
      (x) => Math.tan(angleMode === "DEG" ? toRadians(x) : x),
      (x) => Math.log10(x),
      (x) => Math.log(x),
      (x) => Math.sqrt(x),
      Math.PI
    );
  } catch {
    return null;
  }
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function pushHistory(expr, result) {
  const item = document.createElement("li");
  item.className = "history__item";
  item.innerHTML = `
    <span class="history__expr">${expr}</span>
    <span class="history__result">${result}</span>
  `;
  historyList.prepend(item);

  while (historyList.children.length > maxHistory) {
    historyList.removeChild(historyList.lastChild);
  }
}

function handleButtonClick(event) {
  const target = event.target.closest("button");
  if (!target || target.disabled) return;

  const { action, type, value } = target.dataset;

  if (action === "clear") {
    clearAll();
    updateDisplay();
    return;
  }

  if (action === "delete") {
    backspace();
    updateDisplay();
    return;
  }

  if (action === "equals") {
    evaluateExpression();
    updateDisplay();
    return;
  }

  switch (type) {
    case "number":
      appendNumber(value);
      break;
    case "decimal":
      appendDecimal();
      break;
    case "operator":
      appendOperator(value);
      break;
    case "paren":
      appendParenthesis(value);
      break;
    case "func":
      if (value === "sqrt") {
        appendFunction("√");
      } else {
        appendFunction(value);
      }
      break;
    case "const":
      appendConstant(value);
      break;
    default:
      break;
  }

  setStatus("Typing");
  updateDisplay();
}

buttons.addEventListener("click", handleButtonClick);

modeToggle.addEventListener("click", () => {
  body.classList.toggle("hidden-sci");
  const isHidden = body.classList.contains("hidden-sci");
  modeToggle.textContent = isHidden ? "Basic" : "Scientific";
  setStatus(isHidden ? "Basic mode" : "Scientific mode");
});

angleModeBadge.addEventListener("click", () => {
  angleMode = angleMode === "DEG" ? "RAD" : "DEG";
  angleModeBadge.textContent = angleMode;
  setStatus(`Mode: ${angleMode}`);
  updateDisplay();
});

angleModeBadge.style.cursor = "pointer";

clearHistoryBtn.addEventListener("click", () => {
  historyList.innerHTML = "";
  setStatus("History cleared");
});

themeToggle.addEventListener("click", () => {
  const isLight = body.classList.toggle("theme-light");
  body.classList.toggle("theme-dark", !isLight);
  themeToggle.textContent = isLight ? "Dark" : "Light";
});

// Basic keyboard support
document.addEventListener("keydown", (event) => {
  const key = event.key;

  if (/^[0-9]$/.test(key)) {
    appendNumber(key);
  } else if (key === ".") {
    appendDecimal();
  } else if (operators.includes(key)) {
    appendOperator(key);
  } else if (key === "Enter" || key === "=") {
    event.preventDefault();
    evaluateExpression();
  } else if (key === "Backspace") {
    backspace();
  } else if (key === "Delete") {
    clearAll();
  } else if (key === "(" || key === ")") {
    appendParenthesis(key);
  } else {
    return;
  }

  setStatus("Typing");
  updateDisplay();
});

body.classList.add("hidden-sci");
modeToggle.textContent = body.classList.contains("hidden-sci") ? "Basic" : "Scientific";
updateDisplay();
