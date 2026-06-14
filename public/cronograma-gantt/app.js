// --- Week-Based Configuration ---
const TIMELINE_START_STR = '2026-05-15';
const DAYS_OF_WEEK = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS_SPANISH = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

// Safely parse date strings as local dates to prevent UTC timezone shift issues
function parseLocalDate(dateStr) {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// Format Date object as YYYY-MM-DD local date string
function formatLocalDate(date) {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Generate exactly 12 weeks starting from Friday, May 15, 2026
// First week starts on May 15 (Friday) and ends on May 17 (Sunday)
// Subsequent weeks start on Mondays and end on Sundays
function generate12Weeks() {
  const weeksList = [];
  const startDay = parseLocalDate(TIMELINE_START_STR);
  let currentDay = new Date(startDay);

  for (let w = 0; w < 12; w++) {
    const weekStart = new Date(currentDay);
    
    // Find next Sunday (0 is Sunday, 1 is Monday, ..., 6 is Saturday)
    let daysToSunday = 7 - currentDay.getDay();
    if (currentDay.getDay() === 0) daysToSunday = 0;
    
    const weekEnd = new Date(currentDay);
    weekEnd.setDate(currentDay.getDate() + daysToSunday);
    
    // Format label nicely (e.g., "15 al 17 de May" or "29 de Jun al 5 de Jul")
    const startM = MONTHS_SPANISH[weekStart.getMonth()];
    const endM = MONTHS_SPANISH[weekEnd.getMonth()];
    
    let datesLabel = '';
    if (startM === endM) {
      datesLabel = `${weekStart.getDate()} al ${weekEnd.getDate()} de ${startM}`;
    } else {
      datesLabel = `${weekStart.getDate()} de ${startM} al ${weekEnd.getDate()} de ${endM}`;
    }

    weeksList.push({
      name: `Semana ${w + 1}`,
      dates: datesLabel,
      details: `Semana ${w + 1}`,
      startDay: new Date(weekStart),
      endDay: new Date(weekEnd)
    });

    // Next week starts on the following Monday (weekEnd + 1 day)
    currentDay = new Date(weekEnd);
    currentDay.setDate(weekEnd.getDate() + 1);
  }

  return weeksList;
}

const WEEKS_METADATA = generate12Weeks();

// --- Default Demo Data (12-Week Distribution) ---
const DEFAULT_TASKS = [
  {
    id: 'task-1',
    name: 'Análisis de Requisitos y Planificación',
    startWeek: 0,
    endWeek: 0,
    progress: 100,
    color: 'var(--task-color-1)',
    desc: 'Reunión inicial, levantamiento de requerimientos del cliente y planificación del proyecto AuraContable.',
    dependency: ''
  },
  {
    id: 'task-2',
    name: 'Diseño UX/UI y Paleta de Colores Amigable',
    startWeek: 0,
    endWeek: 1,
    progress: 100,
    color: 'var(--task-color-2)',
    desc: 'Rediseño de interfaz con una paleta de colores agradable a la vista y de ambiente amigable para el usuario.',
    dependency: 'task-1'
  },
  {
    id: 'task-3',
    name: 'Modelado de Base de Datos y Mapeo de IVA',
    startWeek: 1,
    endWeek: 2,
    progress: 90,
    color: 'var(--task-color-3)',
    desc: 'Diseño lógico en PostgreSQL para el IVA, retenciones, compras y ventas. Configuración de Prisma.',
    dependency: 'task-2'
  },
  {
    id: 'task-4',
    name: 'Módulo de Contabilidad (Facturas de Empresa)',
    startWeek: 2,
    endWeek: 3,
    progress: 80,
    color: 'var(--task-color-4)',
    desc: 'Contabilización automática de facturas de la empresa ingresadas al sistema y generación de asientos contables.',
    dependency: 'task-3'
  },
  {
    id: 'task-5',
    name: 'Módulo de Ventas y Retenciones de Clientes',
    startWeek: 3,
    endWeek: 4,
    progress: 75,
    color: 'var(--task-color-5)',
    desc: 'Registro de ventas y vinculación automática con los comprobantes de retención emitidos por los clientes.',
    dependency: 'task-4'
  },
  {
    id: 'task-6',
    name: 'Módulo de Proveedores y Carga de Compras',
    startWeek: 4,
    endWeek: 5,
    progress: 60,
    color: 'var(--task-color-6)',
    desc: 'Gestión de catálogo de proveedores y carga de facturas físicas/electrónicas de compras.',
    dependency: 'task-5'
  },
  {
    id: 'task-7',
    name: 'Módulo de Caja (Ingresos/Egresos de Efectivo)',
    startWeek: 5,
    endWeek: 6,
    progress: 50,
    color: 'var(--task-color-1)',
    desc: 'Control diario de caja chica, conciliaciones de flujo neto de caja, e ingresos/egresos manuales.',
    dependency: 'task-6'
  },
  {
    id: 'task-8',
    name: 'Clasificación de Productos (Análisis de IVA)',
    startWeek: 6,
    endWeek: 7,
    progress: 40,
    color: 'var(--task-color-2)',
    desc: 'Revisión y análisis de productos para clasificar cuáles aplican y cuáles no aplican el IVA (0%, 12%, 15%).',
    dependency: 'task-3'
  },
  {
    id: 'task-9',
    name: 'Sincronización Automática con el SRI',
    startWeek: 7,
    endWeek: 8,
    progress: 30,
    color: 'var(--task-color-3)',
    desc: 'Módulo de integración para subir compras pendientes y sincronizar en tiempo real el estado tributario con el SRI.',
    dependency: 'task-6'
  },
  {
    id: 'task-10',
    name: 'Descarga Instantánea y Envío de Facturas',
    startWeek: 8,
    endWeek: 9,
    progress: 15,
    color: 'var(--task-color-4)',
    desc: 'Descarga automatizada de facturas del SRI de proveedor a cliente y envío instantáneo por email al destinatario.',
    dependency: 'task-9'
  },
  {
    id: 'task-11',
    name: 'Reportes de Ventas y de Clientes',
    startWeek: 9,
    endWeek: 10,
    progress: 0,
    color: 'var(--task-color-5)',
    desc: 'Desarrollo del submódulo de reportes estadísticos para analizar ventas históricas y comportamiento de clientes.',
    dependency: 'task-5'
  },
  {
    id: 'task-12',
    name: 'Generación de Reportes Tributarios para SRI',
    startWeek: 9,
    endWeek: 10,
    progress: 0,
    color: 'var(--task-color-6)',
    desc: 'Formatos exportables listos para la declaración de retenciones, IVA y anexos transaccionales simplificados.',
    dependency: 'task-9'
  },
  {
    id: 'task-13',
    name: 'Pruebas de Integración y Ajustes UX/UI',
    startWeek: 10,
    endWeek: 11,
    progress: 0,
    color: 'var(--task-color-1)',
    desc: 'Pruebas E2E del sistema integrado AuraContable, pulido de la interfaz amigable y corrección de bugs visuales.',
    dependency: 'task-10'
  },
  {
    id: 'task-14',
    name: 'Despliegue Final en Contenedores Docker',
    startWeek: 11,
    endWeek: 11,
    progress: 0,
    color: 'var(--task-color-2)',
    desc: 'Montaje del entorno de producción utilizando Docker y Docker Compose, entrega final y capacitación.',
    dependency: 'task-13'
  }
];

// --- State Management ---
let tasks = [];
let currentFilter = 'all';
let searchQuery = '';

// Helper to migrate legacy day-based task objects
function migrateLegacyTasks(storedTasks) {
  return storedTasks.map(task => {
    // Check if task uses legacy start/end date format
    if (task.startDate && task.endDate) {
      const taskStart = parseLocalDate(task.startDate);
      const taskEnd = parseLocalDate(task.endDate);
      
      let startWeek = 0;
      let endWeek = 0;

      // Find the first week that overlaps
      for (let i = 0; i < WEEKS_METADATA.length; i++) {
        const week = WEEKS_METADATA[i];
        if (taskStart <= week.endDay) {
          startWeek = i;
          break;
        }
      }

      // Find the last week that overlaps
      for (let i = WEEKS_METADATA.length - 1; i >= 0; i--) {
        const week = WEEKS_METADATA[i];
        if (taskEnd >= week.startDay) {
          endWeek = i;
          break;
        }
      }

      // Safeguard start <= end
      if (startWeek > endWeek) {
        endWeek = startWeek;
      }

      return {
        id: task.id,
        name: task.name,
        startWeek: startWeek,
        endWeek: endWeek,
        progress: task.progress,
        color: task.color,
        desc: task.desc || '',
        dependency: task.dependency || ''
      };
    }
    return task;
  });
}

// Initialize state
function init() {
  // Setup CSS Variable for layout: 12 columns representing 12 weeks
  document.documentElement.style.setProperty('--total-weeks', WEEKS_METADATA.length);

  // Populate dynamic select dropdowns in HTML form
  populateWeekSelectDropdowns();

  // Load from local storage or use defaults
  const storedTasks = localStorage.getItem('auracontable_gantt_tasks');
  let loadedTasks = null;
  if (storedTasks) {
    try {
      loadedTasks = JSON.parse(storedTasks);
    } catch (e) {
      console.error("Error loading tasks", e);
    }
  }

  // Seed default tasks if empty
  if (!loadedTasks || loadedTasks.length === 0) {
    tasks = [...DEFAULT_TASKS];
    saveState();
  } else {
    tasks = migrateLegacyTasks(loadedTasks);
    saveState();
  }

  // Load theme preference
  const savedTheme = localStorage.getItem('gantt_theme') || 'dark';
  if (savedTheme === 'light') {
    document.body.classList.remove('dark-mode');
    document.body.classList.add('light-mode');
  } else {
    document.body.classList.add('dark-mode');
    document.body.classList.remove('light-mode');
  }

  // Event Listeners
  setupEventListeners();
  
  // Render application
  renderTimelineHeader();
  render();
  
  // Render icon components
  lucide.createIcons();
}

function saveState() {
  localStorage.setItem('auracontable_gantt_tasks', JSON.stringify(tasks));
}

window.updateQuickProgress = function(id, val, el) {
  const progress = parseInt(val, 10);
  const index = tasks.findIndex(t => t.id === id);
  if (index !== -1) {
    tasks[index].progress = progress;
    saveState();
    
    // 1. Update the label next to the slider
    if (el && el.nextElementSibling) {
      el.nextElementSibling.textContent = `${progress}%`;
      if (progress === 100) {
        el.nextElementSibling.style.color = 'var(--task-color-3)';
      } else {
        el.nextElementSibling.style.color = 'var(--text-main)';
      }
    }

    // 2. Update the timeline progress fill bar
    const fillEl = document.getElementById(`bar-fill-${id}`);
    if (fillEl) {
      fillEl.style.width = `${progress}%`;
    }

    // 3. Update the tooltip description on the bar wrapper
    const wrapEl = document.getElementById(`bar-wrap-${id}`);
    if (wrapEl) {
      const task = tasks[index];
      const startLabel = WEEKS_METADATA[task.startWeek].name;
      const endLabel = WEEKS_METADATA[task.endWeek].name;
      wrapEl.title = `${task.name}\n${progress}% completado\nPeriodo: ${startLabel} a ${endLabel}\n${task.desc || ''}`;
    }

    // 4. Update the statistics dashboard
    updateStats();
  }
};

// Populate Week Dropdowns dynamically on initialization
function populateWeekSelectDropdowns() {
  const startSelect = document.getElementById('task-start-week');
  const endSelect = document.getElementById('task-end-week');

  startSelect.innerHTML = '';
  endSelect.innerHTML = '';

  WEEKS_METADATA.forEach((week, index) => {
    const optStart = document.createElement('option');
    optStart.value = index;
    optStart.textContent = `${week.name} (${week.dates})`;
    startSelect.appendChild(optStart);

    const optEnd = document.createElement('option');
    optEnd.value = index;
    optEnd.textContent = `${week.name} (${week.dates})`;
    endSelect.appendChild(optEnd);
  });
}

// --- Rendering Functions ---

function renderTimelineHeader() {
  const headerContainer = document.getElementById('gantt-timeline-header');
  headerContainer.innerHTML = '';

  WEEKS_METADATA.forEach(week => {
    const weekHeader = document.createElement('div');
    weekHeader.className = 'timeline-week-header';
    weekHeader.innerHTML = `
      <span>${week.dates}</span>
      <span class="timeline-week-title">${week.name}</span>
    `;
    headerContainer.appendChild(weekHeader);
  });
}

function render() {
  const sidebarList = document.getElementById('gantt-sidebar-list');
  const gridContent = document.getElementById('gantt-grid-content');
  
  sidebarList.innerHTML = '';
  gridContent.innerHTML = '';

  // 1. Create background grid lines container (12 columns)
  const gridLinesBg = document.createElement('div');
  gridLinesBg.className = 'grid-lines-bg';
  WEEKS_METADATA.forEach(() => {
    const lineCol = document.createElement('div');
    lineCol.className = 'grid-line-col';
    gridLinesBg.appendChild(lineCol);
  });
  gridContent.appendChild(gridLinesBg);

  // 2. Filter tasks
  const filteredTasks = tasks.filter(task => {
    // Search query check
    const matchesSearch = task.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (task.desc && task.desc.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (!matchesSearch) return false;

    // Status filter check
    if (currentFilter === 'all') return true;
    if (currentFilter === 'pending') return task.progress === 0;
    if (currentFilter === 'progress') return task.progress > 0 && task.progress < 100;
    if (currentFilter === 'completed') return task.progress === 100;
    
    return true;
  });

  // Calculate and update stats
  updateStats();

  // 3. Handle Empty State
  if (filteredTasks.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.className = 'gantt-empty-state';
    emptyState.innerHTML = `
      <i data-lucide="folder-open"></i>
      <p>No se encontraron tareas coincidiendo con los filtros.</p>
    `;
    gridContent.appendChild(emptyState);
    lucide.createIcons();
    return;
  }

  // 4. Render tasks in the sidebar and corresponding timeline rows
  filteredTasks.forEach(task => {
    const weekRangeText = task.startWeek === task.endWeek 
      ? `Semana ${task.startWeek + 1}` 
      : `Semana ${task.startWeek + 1} - ${task.endWeek + 1}`;

    // Sidebar card
    const sidebarItem = document.createElement('div');
    sidebarItem.className = 'task-item';
    sidebarItem.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
        <div class="task-meta" style="flex: 1; min-width: 0;">
          <span class="task-name-text" title="${task.name}" style="font-weight: 600; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${task.name}</span>
          <span class="task-date-sub" style="font-size: 11px; color: var(--text-muted);">${weekRangeText}</span>
        </div>
        <div class="task-item-actions" style="display: flex; gap: 4px;">
          <button class="btn-icon-sm edit" onclick="openEditModal('${task.id}')" title="Editar tarea">
            <i data-lucide="edit-3"></i>
          </button>
          <button class="btn-icon-sm delete" onclick="deleteTask('${task.id}')" title="Eliminar tarea">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 8px; margin-top: 6px;">
        <input type="range" class="quick-progress-slider" min="0" max="100" value="${task.progress}" 
               oninput="updateQuickProgress('${task.id}', this.value, this)" 
               style="flex: 1; margin: 0; cursor: pointer;">
        <span style="font-family: var(--font-mono); font-size: 11px; width: 32px; text-align: right; font-weight: bold; color: ${task.progress === 100 ? 'var(--task-color-3)' : 'var(--text-main)'};">${task.progress}%</span>
      </div>
    `;
    sidebarList.appendChild(sidebarItem);

    // Grid timeline row (12 columns)
    const startColIndex = task.startWeek + 1;
    const spanWeeks = task.endWeek - task.startWeek + 1;

    const row = document.createElement('div');
    row.className = 'gantt-row';

    const barWrapper = document.createElement('div');
    barWrapper.className = 'task-bar-wrapper';
    barWrapper.id = `bar-wrap-${task.id}`;
    barWrapper.style.gridColumn = `${startColIndex} / span ${spanWeeks}`;
    barWrapper.style.setProperty('--shadow-color', task.color + '40'); // Soft glow overlay
    
    const startLabel = WEEKS_METADATA[task.startWeek].name;
    const endLabel = WEEKS_METADATA[task.endWeek].name;
    const hoverTooltip = `${task.name}\n${task.progress}% completado\nPeriodo: ${startLabel} a ${endLabel}\n${task.desc || ''}`;
    barWrapper.title = hoverTooltip;
    barWrapper.onclick = () => openEditModal(task.id);

    // Progress bar background & fill
    const barProgressBg = document.createElement('div');
    barProgressBg.className = 'task-bar-progress-bg';

    const barProgressFill = document.createElement('div');
    barProgressFill.className = 'task-bar-progress-fill';
    barProgressFill.id = `bar-fill-${task.id}`;
    barProgressFill.style.width = `${task.progress}%`;
    barProgressFill.style.backgroundColor = task.color;
    barProgressFill.style.boxShadow = `0 0 10px ${task.color}`;

    barProgressBg.appendChild(barProgressFill);
    barWrapper.appendChild(barProgressBg);

    // Label text inside bar
    const barLabel = document.createElement('div');
    barLabel.className = 'task-bar-label';
    barLabel.textContent = task.name;
    barWrapper.appendChild(barLabel);

    row.appendChild(barWrapper);
    gridContent.appendChild(row);
  });

  // Re-instantiate icons
  lucide.createIcons();
  
  // Populate the dependency select option (using all tasks)
  populateDependencyOptions();
}

function updateStats() {
  const total = tasks.length;
  const completed = tasks.filter(t => t.progress === 100).length;
  const inProgress = tasks.filter(t => t.progress > 0 && t.progress < 100).length;
  const pending = tasks.filter(t => t.progress === 0).length;

  // Calculate overall project progress
  const totalProgressSum = tasks.reduce((sum, t) => sum + t.progress, 0);
  const overallProgress = total > 0 ? Math.round(totalProgressSum / total) : 0;

  const progressEl = document.getElementById('stat-overall-progress');
  if (progressEl) {
    progressEl.textContent = `${overallProgress}%`;
  }

  document.getElementById('stat-total-tasks').textContent = total;
  document.getElementById('stat-completed-tasks').textContent = completed;
  document.getElementById('stat-in-progress-tasks').textContent = inProgress;
  document.getElementById('stat-pending-tasks').textContent = pending;
}

function populateDependencyOptions() {
  const select = document.getElementById('task-dependency');
  const currentId = document.getElementById('task-id').value;
  
  select.innerHTML = '<option value="">Ninguna</option>';
  
  tasks.forEach(task => {
    if (task.id !== currentId) {
      const option = document.createElement('option');
      option.value = task.id;
      option.textContent = task.name;
      select.appendChild(option);
    }
  });
}

// --- Event Handlers & Subsystems ---

function setupEventListeners() {
  // Theme Toggle
  document.getElementById('btn-theme-toggle').addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark-mode');
    document.body.classList.toggle('light-mode', !isDark);
    localStorage.setItem('gantt_theme', isDark ? 'dark' : 'light');
  });

  // Search Input
  document.getElementById('search-input').addEventListener('input', (e) => {
    searchQuery = e.target.value;
    render();
  });

  // Status Filter Buttons
  const tabs = document.querySelectorAll('.btn-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.getAttribute('data-filter');
      render();
    });
  });

  // Modal controls
  document.getElementById('btn-add-task').addEventListener('click', () => openAddModal());
  document.getElementById('btn-close-modal').addEventListener('click', closeModal);
  document.getElementById('btn-cancel-modal').addEventListener('click', closeModal);
  
  // Progress range indicator sync
  const progressInput = document.getElementById('task-progress');
  const progressVal = document.getElementById('progress-val');
  progressInput.addEventListener('input', (e) => {
    progressVal.textContent = `${e.target.value}%`;
  });

  // Task Form Submit
  document.getElementById('task-form').addEventListener('submit', handleFormSubmit);

  // Week selection validation to ensure Start Week <= End Week
  const startWeekSelect = document.getElementById('task-start-week');
  const endWeekSelect = document.getElementById('task-end-week');

  startWeekSelect.addEventListener('change', () => {
    const startVal = parseInt(startWeekSelect.value, 10);
    const endVal = parseInt(endWeekSelect.value, 10);
    if (startVal > endVal) {
      endWeekSelect.value = startWeekSelect.value;
    }
  });

  endWeekSelect.addEventListener('change', () => {
    const startVal = parseInt(startWeekSelect.value, 10);
    const endVal = parseInt(endWeekSelect.value, 10);
    if (endVal < startVal) {
      startWeekSelect.value = endWeekSelect.value;
    }
  });

  // Action Bar Buttons: Reset Demo
  document.getElementById('btn-reset-demo').addEventListener('click', () => {
    if (confirm('¿Estás seguro de que deseas restablecer los datos originales de demostración? Se perderán tus cambios.')) {
      tasks = [...DEFAULT_TASKS];
      saveState();
      render();
    }
  });

  // Export JSON
  document.getElementById('btn-export-json').addEventListener('click', () => {
    const dataStr = JSON.stringify(tasks, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cronograma-semanal-${formatLocalDate(new Date())}.json`;
    link.click();
    URL.revokeObjectURL(url);
  });

  // Import JSON Trigger
  document.getElementById('btn-import-json').addEventListener('click', () => {
    document.getElementById('file-import-input').click();
  });

  // File Upload parsing
  document.getElementById('file-import-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(evt) {
      try {
        const imported = JSON.parse(evt.target.result);
        if (Array.isArray(imported)) {
          // Verify basic schema (now checking startWeek / endWeek)
          const valid = imported.every(t => t.id && t.name && (t.startWeek !== undefined) && (t.endWeek !== undefined));
          if (valid) {
            tasks = imported;
            saveState();
            render();
            alert('¡Cronograma importado con éxito!');
          } else {
            // Check if it's old day format, migrate if possible
            const looksLikeOldFormat = imported.every(t => t.id && t.name && t.startDate && t.endDate);
            if (looksLikeOldFormat) {
              tasks = migrateLegacyTasks(imported);
              saveState();
              render();
              alert('¡Cronograma importado y migrado con éxito a formato semanal!');
            } else {
              alert('El archivo JSON no cumple con el formato correcto de tareas.');
            }
          }
        } else {
          alert('El archivo importado debe ser una lista de tareas.');
        }
      } catch (err) {
        alert('Error al leer el archivo JSON.');
      }
      e.target.value = ''; // Reset input
    };
    reader.readAsText(file);
  });

  // Print Screen Call
  document.getElementById('btn-print').addEventListener('click', () => {
    window.print();
  });
}

// --- Modal Logic ---

function openAddModal() {
  document.getElementById('modal-title').textContent = 'Nueva Tarea';
  document.getElementById('task-id').value = '';
  document.getElementById('task-name').value = '';
  document.getElementById('task-start-week').value = '0';
  document.getElementById('task-end-week').value = '0';
  document.getElementById('task-progress').value = 0;
  document.getElementById('progress-val').textContent = '0%';
  document.getElementById('task-desc').value = '';
  document.getElementById('task-dependency').value = '';
  
  // Set default color choice (first color)
  const radios = document.getElementsByName('task-color-select');
  if (radios.length > 0) radios[0].checked = true;

  populateDependencyOptions();
  document.getElementById('task-modal').classList.add('open');
}

window.openEditModal = function(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  document.getElementById('modal-title').textContent = 'Editar Tarea';
  document.getElementById('task-id').value = task.id;
  document.getElementById('task-name').value = task.name;
  document.getElementById('task-start-week').value = task.startWeek.toString();
  document.getElementById('task-end-week').value = task.endWeek.toString();
  document.getElementById('task-progress').value = task.progress;
  document.getElementById('progress-val').textContent = `${task.progress}%`;
  document.getElementById('task-desc').value = task.desc || '';
  
  populateDependencyOptions();
  document.getElementById('task-dependency').value = task.dependency || '';

  // Select corresponding radio button for color
  const radios = document.getElementsByName('task-color-select');
  for (let radio of radios) {
    if (radio.value === task.color) {
      radio.checked = true;
      break;
    }
  }

  document.getElementById('task-modal').classList.add('open');
}

function closeModal() {
  document.getElementById('task-modal').classList.remove('open');
}

function handleFormSubmit(e) {
  e.preventDefault();
  
  const id = document.getElementById('task-id').value;
  const name = document.getElementById('task-name').value.trim();
  const startWeek = parseInt(document.getElementById('task-start-week').value, 10);
  const endWeek = parseInt(document.getElementById('task-end-week').value, 10);
  const progress = parseInt(document.getElementById('task-progress').value, 10);
  const desc = document.getElementById('task-desc').value.trim();
  const dependency = document.getElementById('task-dependency').value;

  // Find color selection
  let color = 'var(--task-color-1)';
  const radios = document.getElementsByName('task-color-select');
  for (let radio of radios) {
    if (radio.checked) {
      color = radio.value;
      break;
    }
  }

  if (id) {
    // Edit existing task
    const index = tasks.findIndex(t => t.id === id);
    if (index !== -1) {
      tasks[index] = { ...tasks[index], name, startWeek, endWeek, progress, color, desc, dependency };
    }
  } else {
    // Add new task
    const newId = 'task-' + Date.now();
    tasks.push({ id: newId, name, startWeek, endWeek, progress, color, desc, dependency });
  }

  saveState();
  render();
  closeModal();
}

window.deleteTask = function(id) {
  if (confirm('¿Estás seguro de que deseas eliminar esta tarea?')) {
    // Clear dependencies referencing this task
    tasks = tasks.map(t => {
      if (t.dependency === id) {
        return { ...t, dependency: '' };
      }
      return t;
    });

    tasks = tasks.filter(t => t.id !== id);
    saveState();
    render();
  }
}

// --- Initialize App ---
document.addEventListener('DOMContentLoaded', init);
