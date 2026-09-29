# ADR 0001 — Mantener el portfolio como web estática

- **Estado:** aceptada
- **Fecha:** 2026-09-28

## Contexto

El portfolio necesita ser rápido de desplegar, fácil de inspeccionar en GitHub y suficientemente interactivo sin requerir backend propio para la mayoría de funciones.

## Decisión

Mantener una arquitectura estática basada en HTML, JavaScript vanilla y dependencias cargadas desde CDN.

## Consecuencias

- Despliegue sencillo en GitHub Pages u hosting estático.
- Menor complejidad operativa.
- Dependencia de CDN para Tailwind, fuentes y Chart.js.
- Si el proyecto crece, convendrá migrar estilos y dependencias a un proceso de build.
