# ADR 0002 — Formulario de contacto con Web3Forms

- **Estado:** aceptada
- **Fecha:** 2026-09-28

## Contexto

La web necesita recibir formularios reales sin mantener un servidor propio.

## Decisión

Enviar `FormData` a Web3Forms desde el navegador, con validación en cliente y honeypot antispam.

## Consecuencias

- No hace falta backend propio.
- La clave de acceso del formulario queda visible en el HTML, como corresponde a una integración cliente de este tipo.
- Ninguna credencial privada de otras APIs debe incluirse en el frontend.
- La disponibilidad del formulario depende de un tercero.
