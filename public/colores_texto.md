# Guía de Colores de Texto (Sistema de Diseño)

Este documento detalla todas las variables de color, clases y estilos específicos utilizados para los textos en la aplicación, agrupados por su respectivo archivo CSS.

---

## 📌 1. [index.css](file:///c:/Users/USUARIO/Documents/sisteConta/frontend_conta/src/index.css) (Estilos Base y Temas Globales)

El archivo `index.css` define las variables globales del tema base de la aplicación, incluyendo el soporte de contraste para los modos claro (por defecto) y oscuro.

### Variables CSS de Texto
| Variable | Valor (Modo Claro) | Valor (Modo Oscuro) | Descripción / Propósito |
| :--- | :--- | :--- | :--- |
| `--text` | `#cbd5e1` (Gris azulado claro) | `#0f1215` (Gris carbón oscuro) | Color predeterminado para el texto del cuerpo (`body`). |
| `--text-h` | `#f8fafc` (Blanco grisáceo) | `#101317` (Gris carbón muy oscuro) | Utilizado para títulos principales (`h1`, `h2`), etiquetas `code` y el contador. |

### Aplicación en Reglas CSS
- **Cuerpo (`body`)**:
  - `color: theme('colors.text.primary') !important;` (Integración con Tailwind CSS)
  - `color: var(--text);` (Fallback principal de lectura)
- **Títulos (`h1, h2`)**:
  - `color: var(--text-h);`
- **Etiquetas de código y Contador (`code, .counter`)**:
  - `color: var(--text-h);`

---

## 📌 2. [App.css](file:///c:/Users/USUARIO/Documents/sisteConta/frontend_conta/src/App.css) (Diseño de la Aplicación - AuraContable)

El archivo `App.css` implementa el sistema de diseño visual principal y personalizado para la interfaz de **AuraContable**.

### Variables CSS del Sistema de Diseño
| Variable | Valor Hex / RGB | Descripción / Propósito |
| :--- | :--- | :--- |
| `--text-primary` | `#0b0c0d` (Casi negro) | Color primario para texto destacado, títulos internos y textos de alta relevancia. |
| `--text-secondary` | `#0d2222` (Verde azulado muy oscuro) | Color secundario para párrafos, explicaciones, textos de toggle, descripciones y subtítulos. |
| `--text-muted` | `#0c0c0c` (Gris oscuro apagado) | Texto atenuado para roles, fechas, cabeceras secundarias y estados inactivos. |
| `--text-main` | `#171819` (Gris oscuro) | Utilizado como fallback en el contenedor principal (`.app-container`). |

#### Acentos y Colores de Estado (Textos de Alerta/Etiquetas)
| Variable | Valor Hex / RGB | Descripción / Propósito |
| :--- | :--- | :--- |
| `--cyan` | `#213993` (Azul marino) | Acento principal de marca. Usado para enlaces, textos activos, botones destacados y pestañas activas. |
| `--indigo` | `#3B53A4` (Azul índigo) | Acento secundario. Usado para cabeceras de diarios y elementos de navegación. |
| `--emerald` | `#10B981` (Esmeralda) | Éxito/Confirmación. Usado para porcentajes, estados "online" y subidas de archivos. |
| `--amber` | `#ED3833` (Rojo/Ámbar) | Alertas/Errores. Usado para mensajes de error y etiquetas críticas. |

### Aplicación en Componentes y Clases Específicas
- **Encabezados y Subtítulos**:
  - `h1`: Texto degradado moderno (`linear-gradient(135deg, #111827 40%, #213993 100%)`) con `-webkit-text-fill-color: transparent`.
  - `.subtitle`, `.sim-desc`, `.progress-details`, `.phase-card p`: `color: var(--text-secondary);`
- **Perfil de Usuario**:
  - `.user-info strong`: `color: var(--text-primary);` (Nombre del usuario en el encabezado)
  - `.user-info span`: `color: var(--text-muted);` (Rol/Cargo del usuario en el encabezado)
  - `.logout-btn`: `color: #f87171 !important;` (Texto del botón de cerrar sesión - coral claro)
- **Autenticación**:
  - `.auth-header p`, `.auth-toggle`: `color: var(--text-secondary);`
  - `.auth-toggle button`: `color: var(--cyan);`
  - `.error-alert`: `color: #f87171;` (Mensaje de error)
- **Botones y Chat**:
  - `.btn`, `.btn-cyan`, `.btn-indigo`, `.btn-emerald`, `.btn-send`: `color: #000;` (Texto negro para alto contraste sobre fondos de colores intensos)
  - `.btn-sm`, `.btn-sm:hover`: Alternan entre `color: var(--text-secondary);` y `color: var(--text-primary);`
  - `.chat-bubble` (tanto de bot como de usuario): `color: #000;` (Texto negro para legibilidad del chat)
  - `.btn-suggest`: `color: var(--cyan);` (Texto azul marino para sugerencias)
- **Etiquetas y Estados (`.tag-xxx` / `.status-xxx`)**:
  - `.tag-cyan`: `color: var(--cyan);`
  - `.tag-indigo`: `color: var(--indigo);`
  - `.tag-emerald`: `color: var(--emerald);`
  - `.tag-amber`: `color: var(--amber);`
  - `.status-yes`, `.status-partial`, `.status-no`, `.status-aura`: `color: #ffffff;` (Texto blanco sobre fondo de estado de color)
  - `.status-indicator.status-online`: `color: var(--emerald);`
- **Tablas y Diarios (`.journal-xxx` / `table`)**:
  - `th`: `color: var(--text-primary);`
  - `.journal-entry h5`: `color: var(--indigo);`
  - `.journal-table th`: `color: var(--text-muted);`
- **Barra de Progreso y Tareas**:
  - `.progress-info strong`: `color: var(--cyan);`
  - `.week-status`: `color: var(--text-muted);`
  - `.task-item input[type="checkbox"]:checked+.task-label`: `color: var(--text-muted);` (Texto tachado/atenuado para tareas completadas)
- **Barra Lateral (Sidebar)**:
  - `.sidebar-nav .tab-btn.active`: `color: #11132bc3 !important;` (Texto de la pestaña lateral activa)
  - `.sidebar-toggle`: `color: var(--text-muted, #94a3b8);`
  - `.sidebar-footer .logout-btn`: `color: #ef4444;`

---

## 📌 3. [BillingSystem.css](file:///c:/Users/USUARIO/Documents/sisteConta/frontend_conta/src/BillingSystem.css) (Sistema de Facturación)

El archivo `BillingSystem.css` define los estilos independientes para el panel o módulo de facturación.

### Variables CSS de Facturación
| Variable | Valor Hex | Descripción / Propósito |
| :--- | :--- | :--- |
| `--text-main` | `#f8fafc` (Blanco grisáceo) | Color principal de los textos de facturación. |
| `--text-muted` | `#f8fafc` (Blanco grisáceo) | Color secundario/atenuado. |
| `--primary` | `#06b6d4` (Cian brillante) | Color de marca para el sistema de facturación. Usado para acentuar totales y estados activos. |
| `--danger` | `#ef4444` (Rojo) | Textos de error, peligro o advertencia crítica. |
| `--success` | `#10b981` (Verde) | Textos informativos de éxito. |
| `--warning` | `#f59e0b` (Naranja/Ámbar) | Textos de advertencia. |

### Aplicación en Componentes y Clases Específicas
- **Estructura General**:
  - `.billing-app`: `color: var(--text-main);` (Establece el color base del módulo)
- **Botones (`.btn`)**:
  - Botón general (`.billing-app .btn`): `color: #f8fafc;`
  - Botón primario (`.btn.primary`): `color: #000;` (Contraste sobre fondo cian)
  - Botón peligro (`.btn.danger`): `color: var(--danger);`
  - Botón advertencia (`.btn.warning`): `color: var(--warning);`
  - Botón naranja (`.btn.orange`): `color: #f97316;`
  - Botón teal (`.btn.teal`): `color: #14b8a6;`
- **Pestañas (`.tab`)**:
  - `.tab` (inactivo): `color: var(--text-muted);`
  - `.tab.active`: `color: var(--primary);`
- **Formularios y Celdas de Tabla**:
  - `.form-group label`, `.checkbox-label`: `color: #cbd5e1;` (Gris azulado claro para etiquetas)
  - `.form-group input`, `.form-group select`, `.td-input`: `color: var(--text-main);`
- **Panel de Totales (`.totals-panel` / `.total-display`)**:
  - `.total-display span` (Etiqueta): `color: var(--primary);`
  - `.total-display .amount` (Cifra de dinero): `color: #fff;`
  - `.totals-grid`: `color: var(--text-muted);`
- **Banner de Estado/Modo**:
  - `.mode-banner`: `color: var(--danger);` (Texto de modo de facturación intermitente)
