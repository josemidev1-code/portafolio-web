# Portfolio de José Miguel Miralles Gandia

Portfolio web estático orientado a mostrar proyectos, automatizaciones, habilidades y evolución técnica.

## Stack

- HTML5
- Tailwind CSS vía CDN
- JavaScript vanilla
- Chart.js
- Web3Forms para el formulario de contacto

## Ejecutar en local

Puedes abrir `index.html` directamente o servir la carpeta con un servidor local:

```bash
python -m http.server 8000
```

Después abre `http://localhost:8000`.

## Estructura

```text
.
├── index.html
├── favicon.svg
├── README.md
└── docs/
    └── adr/
        ├── 0001-arquitectura-web-estatica.md
        └── 0002-formulario-web3forms.md
```

## Funciones destacadas

- Calculadora de coste operativo con escenario configurable.
- Simulador visual de pipeline de automatización.
- Casos/proyectos con filtros.
- Matriz tecnológica sin porcentajes de dominio inventados.
- Terminal interactiva con comando `gh`.
- Formulario real con validación y Web3Forms.
- Metaetiquetas, favicon y JSON-LD.

## Contacto y seguridad

La clave pública de Web3Forms vive en el cliente porque el formulario es estático. No guardes contraseñas, tokens privados ni claves de APIs sensibles en este repositorio.

## Nota sobre métricas

Las cifras de ahorro deben publicarse solo después de medir un proceso real. La calculadora de ROI genera escenarios orientativos y no constituye una garantía.
