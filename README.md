# AguilArt Design

Landing page corporativa de **AguilArt Design**, un estudio enfocado en crear soluciones digitales sobre WordPress, WooCommerce, automatizaciones con n8n e integraciones mediante APIs.

El sitio presenta los servicios, capacidades técnicas, tecnologías, proceso de trabajo y ejemplos de proyectos de la marca mediante una experiencia visual responsive, accesible y compatible con tema claro y oscuro.

## Contenido de la landing

- Hero con propuesta de valor y arquitectura digital animada.
- Soluciones para WordPress, WooCommerce, automatización, APIs y UX/UI.
- Capacidades y tipos de plataformas que puede desarrollar el estudio.
- Ecosistema de tecnologías y herramientas utilizadas.
- Proceso de trabajo dividido en etapas.
- Mockups de proyectos y casos de uso.
- Ventajas de centralizar herramientas y procesos.
- Formulario de contacto demostrativo.

## Características

- Diseño adaptable para escritorio, tablet y dispositivos móviles.
- Navegación por secciones con compensación para el header fijo.
- Menú móvil accesible y navegación mediante teclado.
- Tema claro y oscuro con persistencia de la preferencia.
- Animaciones de entrada y estados visuales interactivos.
- Respeto por `prefers-reduced-motion`.
- Metadata básica para SEO, Open Graph y Twitter Cards.
- Datos estructurados de tipo `ProfessionalService`.
- Componentes semánticos y estilos organizados mediante tokens CSS.

## Tecnologías

- [Astro](https://astro.build/) 7
- HTML semántico
- CSS nativo
- JavaScript nativo
- Fuente variable Inter

## Requisitos

- Node.js `22.12.0` o superior.
- npm.

## Instalación y desarrollo

```bash
git clone https://github.com/AguilArtDesign/aguilartdesign.git
cd aguilartdesign
npm install
npm run dev
```

El servidor local estará disponible normalmente en `http://localhost:4321`.

## Comandos

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Inicia el servidor local de desarrollo. |
| `npm run build` | Genera la versión de producción en `dist/`. |
| `npm run preview` | Previsualiza localmente la versión compilada. |
| `npm run astro -- --help` | Muestra la ayuda de Astro CLI. |

## Estructura principal

```text
aguilartdesign/
├── public/
│   ├── media/
│   │   └── Logo.svg
│   ├── favicon.ico
│   └── favicon.svg
├── src/
│   ├── components/    # Secciones y elementos de interfaz
│   ├── layouts/       # Layout, metadata y estructura HTML base
│   ├── pages/         # Rutas del sitio
│   ├── scripts/       # Tema, navegación y animaciones
│   └── styles/        # Estilos globales, tokens y flow digital
├── astro.config.mjs
└── package.json
```

## Recursos multimedia

Los logos, imágenes y recursos estáticos deben agregarse en `public/media/`. Los archivos colocados allí se sirven desde la ruta `/media/`.

## Formulario de contacto

El formulario incluido actualmente funciona como demostración visual y no envía información a un servidor. Antes de publicar el sitio para recibir solicitudes reales debe conectarse a un backend, servicio de formularios o automatización.

## Licencia

Proyecto y diseño propiedad de AguilArt Design. Todos los derechos reservados.
