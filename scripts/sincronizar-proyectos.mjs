// Arma la tabla "Más proyectos" del README a partir de https://solalcaraz.github.io/proyectos.json
// (la misma lista que alimenta las cards de la web) y la escribe entre las marcas
// <!-- PROYECTOS:INICIO --> y <!-- PROYECTOS:FIN -->.
//
// Uso: node scripts/sincronizar-proyectos.mjs [url-o-archivo-del-json]
//
// Si algo falla (la web no responde, el JSON viene vacío o roto, faltan las marcas), el script
// termina con error y NO toca el README: queda la versión anterior, como en la web.
import { readFileSync, writeFileSync } from "node:fs";

const ORIGEN = process.argv[2] ?? "https://solalcaraz.github.io/proyectos.json";
const README = new URL("../README.md", import.meta.url);

// Los destacados están escritos a mano arriba en el README: no se repiten en la tabla.
// Usan el mismo `id` que en proyectos.json. Si cambian los destacados, se cambia esta lista.
const DESTACADOS = ["calis-trainer", "polar-canvas", "caso-crudo", "back-remy-app", "booklibre"];

const INICIO = "<!-- PROYECTOS:INICIO -->";
const FIN = "<!-- PROYECTOS:FIN -->";

async function leerJson() {
  if (/^https?:\/\//.test(ORIGEN)) {
    const respuesta = await fetch(ORIGEN);
    if (!respuesta.ok) throw new Error(`${ORIGEN} respondió ${respuesta.status}`);
    return respuesta.json();
  }
  return JSON.parse(readFileSync(ORIGEN, "utf8"));
}

const celda = (texto) => String(texto ?? "").replaceAll("|", "\\|").replaceAll("\n", " ").trim();

const { proyectos } = await leerJson();
if (!Array.isArray(proyectos) || proyectos.length === 0) {
  throw new Error("El JSON no trae proyectos: no se toca el README.");
}

const filas = proyectos
  .filter((p) => !DESTACADOS.includes(p.id))
  .map((p) => {
    const nombre = p.enlace ? `[${celda(p.nombre)}](${p.enlace})` : celda(p.nombre);
    return `| ${nombre} | ${celda(p.tipo)} | ${celda(p.fecha)} |`;
  });

if (filas.length === 0) throw new Error("No quedó ningún proyecto para la tabla: no se toca el README.");

const bloque = [
  INICIO,
  "<!-- Esta tabla la genera una acción de GitHub desde https://solalcaraz.github.io. No editar a mano. -->",
  "",
  "| Proyecto | Qué es | Fecha |",
  "|---|---|---|",
  ...filas,
  "",
  FIN,
].join("\n");

const actual = readFileSync(README, "utf8");
const desde = actual.indexOf(INICIO);
const hasta = actual.indexOf(FIN);
if (desde === -1 || hasta === -1 || hasta < desde) {
  throw new Error("Faltan las marcas PROYECTOS:INICIO / PROYECTOS:FIN en el README.");
}

const nuevo = actual.slice(0, desde) + bloque + actual.slice(hasta + FIN.length);
if (nuevo === actual) {
  console.log("Sin cambios.");
} else {
  writeFileSync(README, nuevo);
  console.log(`Tabla actualizada: ${filas.length} proyectos.`);
}
