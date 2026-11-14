// Ponto de entrada do container (substitui `node server.js`).
// O proxy da faculdade retira /condominio e repassa o resto com uma barra a mais no começo
// (//_next/..., //login). O Next responde 308 para o caminho "limpo", e esse redirecionamento sai sem o
// prefixo /condominio, então o navegador cai num 404 do servidor. Aqui as barras repetidas do início do
// caminho são reduzidas a uma antes de o Next ver o pedido. Não muda nada para quem já chega sem barra dupla.
const http = require("http");

const emitir = http.Server.prototype.emit;
http.Server.prototype.emit = function (evento, req, ...resto) {
  if (evento === "request" && req && typeof req.url === "string" && req.url.startsWith("//")) {
    req.url = req.url.replace(/^\/{2,}/, "/");
  }
  return emitir.call(this, evento, req, ...resto);
};

require("./server.js");
