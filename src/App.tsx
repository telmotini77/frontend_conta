import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import BillingSystem from './BillingSystem';
import './App.css';

interface KardexTransaction {
  id: string;
  type: 'INGRESS' | 'EGRESS';
  quantity: number;
  unitCost: number;
  totalCost: number;
  balanceStock: number;
  date: string;
}

interface Category {
  id: string;
  name: string;
  userId: string;
}

interface Product {
  id: string;
  sku: string;
  name: string;
  stock: number;
  cost: number;
  price: number;
  hasIva: boolean;
  transactions?: KardexTransaction[];
  categoryId?: string;
  category?: Category;
}

interface Asset {
  id: string;
  name: string;
  value: number;
  residualValue: number;
  yearsOfLife: number;
  purchaseDate: string;
}

interface Invoice {
  id: string;
  claveAcceso: string;
  clientName: string;
  amount: number;
  subtotal: number;
  iva: number;
  status: 'RECEIVED' | 'AUTHORIZED' | 'REJECTED';
  sentToClient: boolean;
  createdAt: string;
}

interface Depreciation {
  id: string;
  period: string;
  amount: number;
  date: string;
  asset?: {
    name: string;
  };
}

interface Purchase {
  id: string;
  invoiceNum: string;
  claveAcceso: string;
  providerRuc: string;
  providerName: string;
  amount: number;
  subtotal: number;
  iva: number;
  date: string;
  synced: boolean;
}

interface Withholding {
  id: string;
  numeroRetencion: string;
  claveAcceso?: string;
  type: 'RECEIVED' | 'EMITTED';
  amountRenta: number;
  amountIva: number;
  amountTotal: number;
  date: string;
  clientOrProviderRuc: string;
  clientOrProviderName: string;
  invoiceId?: string;
  purchaseId?: string;
}

interface CashTransaction {
  id: string;
  type: 'INGRESS' | 'EGRESS';
  source: 'SALE' | 'PURCHASE' | 'MANUAL';
  amount: number;
  date: string;
  description: string;
  invoiceId?: string;
  purchaseId?: string;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface Customer {
  id: string;
  name: string;
  ruc: string;
  email: string;
  phone: string;
  address: string;
  createdAt: string;
}

interface ProformaItem {
  productId: string;
  productName: string;
  productSku: string;
  price: number;
  quantity: number;
  hasIva: boolean;
}

interface Proforma {
  id: string;
  clientName: string;
  clientRuc: string;
  items: ProformaItem[];
  subtotal: number;
  iva: number;
  total: number;
  status: 'BORRADOR' | 'ENVIADA' | 'CONVERTIDA';
  createdAt: string;
  notes: string;
}

interface BankAccount {
  id: string;
  bankName: string;
  accountType: 'CORRIENTE' | 'AHORRO';
  accountNumber: string;
  balance: number;
  currency: string;
  createdAt: string;
}

interface BankMovement {
  id: string;
  accountId: string;
  type: 'DEPOSITO' | 'RETIRO' | 'TRANSFERENCIA';
  amount: number;
  description: string;
  date: string;
}

interface ReconciliationInvoice {
  id: string;
  claveAcceso: string;
  clientName: string;
  amount: number;
  createdAt: string;
  cashPaid: number;
  withheld: number;
  balance: number;
  status: 'CONCILIADO' | 'PARCIAL' | 'PENDING';
}

interface ReconciliationPurchase {
  id: string;
  invoiceNum: string;
  providerName: string;
  providerRuc: string;
  amount: number;
  date: string;
  cashPaid: number;
  withheld: number;
  balance: number;
  status: 'CONCILIADO' | 'PARCIAL' | 'PENDING';
}

interface ReconciliationMetrics {
  totalRecaudado: number;
  totalPagado: number;
  flujoNeto: number;
  creditIva: number;
  creditRenta: number;
  creditoTotal: number;
}

interface ReconciliationSummary {
  metrics: ReconciliationMetrics;
  invoices: ReconciliationInvoice[];
  purchases: ReconciliationPurchase[];
  withholdings: Withholding[];
  cashTransactions: CashTransaction[];
}

interface JournalEntryLine {
  id: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
}

interface JournalEntry {
  id: string;
  description: string;
  date: string;
  type: string;
  invoiceId?: string;
  purchaseId?: string;
  lines: JournalEntryLine[];
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const BILLING_API_BASE = import.meta.env.VITE_BILLING_API_URL || 'http://localhost:3001';

const AVAILABLE_BUSINESS_TYPES = [
  "Industrias Manufactureras y ProducciÃƒÂ³n",
  "Comercio al Por Mayor y Por Menor de Viveres en General",
  "Comercio al Por Mayor y Por Menor de Productos en General",
  "Industrias de ExtracciÃƒÂ³n, Cultivo, ExplotaciÃƒÂ³n, ConservaciÃƒÂ³n, etc",
  "Hoteleria y Turismo",
  "Restaurantes, Cafeterias o Similares",
  "Servicios de Contabilidad",
  "Actividades Profesionales",
  "Servicios Sociales y de Salud",
  "Servicios en General",
  "Servicios de Transporte",
  "Servicios de ReparaciÃƒÂ³n de Automotores y Motocicletas"
];

const ECUADOR_PROVINCES: Record<string, string[]> = {
  "Pichincha": ["Quito", "Cayambe", "MejÃƒÂ­a", "RumiÃƒÂ±ahui", "Pedro Moncayo", "San Miguel de los Bancos", "Pedro Vicente Maldonado", "Puerto Quito"],
  "Guayas": ["Guayaquil", "DurÃƒÂ¡n", "SamborondÃƒÂ³n", "Milagro", "Daule", "Playas", "Naranjal", "Empalme", "Balzar", "Yaguachi"],
  "Azuay": ["Cuenca", "Gualaceo", "Paute", "GirÃƒÂ³n", "Santa Isabel", "Chordeleg", "SÃƒÂ­gsig"],
  "ManabÃƒÂ­": ["Manta", "Portoviejo", "Chone", "Montecristi", "BahÃƒÂ­a de CarÃƒÂ¡quez", "Jipijapa", "Pedernales", "El Carmen"],
  "Loja": ["Loja", "Catamayo", "Cariamanga", "MacarÃƒÂ¡", "Saraguro", "Alamor"],
  "Tungurahua": ["Ambato", "BaÃƒÂ±os", "Pelileo", "PÃƒÂ­llaro", "Quero"],
  "El Oro": ["Machala", "Pasaje", "Santa Rosa", "Huaquillas", "Arenillas", "Zaruma", "PiÃƒÂ±as"],
  "Santo Domingo de los TsÃƒÂ¡chilas": ["Santo Domingo"],
  "Los RÃƒÂ­os": ["Babahoyo", "Quevedo", "Vinces", "Ventanas", "Buena Fe"],
  "Esmeraldas": ["Esmeraldas", "Atacames", "QuinindÃƒÂ©", "San Lorenzo", "Muisne"],
  "Imbabura": ["Ibarra", "Otavalo", "Cotacachi", "Atuntaqui", "Pimampiro"],
  "Chimborazo": ["Riobamba", "Guano", "Chambo", "AlausÃƒÂ­", "Colta"],
  "Cotopaxi": ["Latacunga", "Salcedo", "PujilÃƒÂ­", "La ManÃƒÂ¡", "SaquisilÃƒÂ­"],
  "Santa Elena": ["Santa Elena", "Salinas", "La Libertad", "MontaÃƒÂ±ita"],
  "Carchi": ["TulcÃƒÂ¡n", "San Gabriel", "BolÃƒÂ­var"],
  "CaÃƒÂ±ar": ["Azogues", "La Troncal", "CaÃƒÂ±ar", "BibliÃƒÂ¡n"],
  "BolÃƒÂ­var": ["Guaranda", "San Miguel", "Chimbo"],
  "Morona Santiago": ["Macas", "Gualaquiza", "SucÃƒÂºa"],
  "Napo": ["Tena", "Archidona", "El Chaco"],
  "Pastaza": ["Puyo", "Mera", "Santa Clara"],
  "Zamora Chinchipe": ["Zamora", "Yantzaza", "El Pangui"],
  "GalÃƒÂ¡pagos": ["Puerto Ayora", "Puerto Baquerizo Moreno", "Puerto Villamil"],
  "Orellana": ["El Coca", "Joyas de los Sachas", "Loreto"],
  "SucumbÃƒÂ­os": ["Nueva Loja (Lago Agrio)", "Shushufindi", "Caspiscal"]
};

const BUSINESS_THEMES: Record<string, {
  name: string;
  accent: string;
  accentGlow: string;
  accentSecondary: string;
  gradient: string;
  icon: string;
  banner: string;
  bgDark: string;
  panelDark: string;
  textPrimary: string;
  metrics: { title: string; value: string; icon: string }[];
}> = {
  'Industrias Manufactureras y ProducciÃƒÂ³n': {
    name: 'Manufactura y ProducciÃƒÂ³n',
    accent: '#f59e0b',
    accentGlow: 'rgb(245, 158, 11)',
    accentSecondary: '#d97706',
    gradient: 'linear-gradient(135deg, rgb(245, 158, 11) 0%, rgb(5, 8, 20) 100%)',
    icon: 'Ã°Å¸ÂÂ­',
    banner: 'Consola de Control de ProducciÃƒÂ³n y Manufactura',
    bgDark: '#0f172a',
    panelDark: '#1e293b',
    textPrimary: '#f8fafc',
    metrics: [
      { title: 'Lotes Producidos', value: '42 Lotes', icon: 'Ã°Å¸â€œÂ¦' },
      { title: 'Eficiencia de Planta', value: '94.2%', icon: 'Ã¢Å¡Â¡' },
      { title: 'Materia Prima Disponible', value: '82%', icon: 'Ã°Å¸Â§Â±' }
    ]
  },
  'Comercio al Por Mayor y Por Menor de Viveres en General': {
    name: 'Comercio de VÃƒÂ­veres',
    accent: '#10b981',
    accentGlow: 'rgb(16, 185, 129)',
    accentSecondary: '#059669',
    gradient: 'linear-gradient(135deg, rgb(16, 185, 129) 0%, rgb(5, 8, 20) 100%)',
    icon: 'Ã°Å¸â€ºâ€™',
    banner: 'Portal Comercial y Control de VÃƒÂ­veres en General',
    bgDark: '#022c22',
    panelDark: '#064e3b',
    textPrimary: '#f0fdf4',
    metrics: [
      { title: 'Stock CrÃƒÂ­tico VÃƒÂ­veres', value: '3 SKU', icon: 'Ã¢Å¡Â Ã¯Â¸Â' },
      { title: 'Venta POS RÃƒÂ¡pida', value: '$1,245.50', icon: 'Ã¢Å¡Â¡' },
      { title: 'Margen Promedio', value: '18.5%', icon: 'Ã°Å¸â€œË†' }
    ]
  },
  'Comercio al Por Mayor y Por Menor de Productos en General': {
    name: 'Comercio General',
    accent: '#a855f7',
    accentGlow: 'rgb(168, 85, 247)',
    accentSecondary: '#7c3aed',
    gradient: 'linear-gradient(135deg, rgb(168, 85, 247) 0%, rgb(5, 8, 20) 100%)',
    icon: 'Ã°Å¸â€œÂ¦',
    banner: 'Ecosistema de Inventario y DistribuciÃƒÂ³n de Productos',
    bgDark: '#1e1b4b',
    panelDark: '#312e81',
    textPrimary: '#e0e7ff',
    metrics: [
      { title: 'RotaciÃƒÂ³n de Inventario', value: '14.8 dÃƒÂ­as', icon: 'Ã°Å¸â€â€ž' },
      { title: 'Productos Bajo Umbral', value: '12 ÃƒÂ­tems', icon: 'Ã°Å¸â€ºâ€˜' },
      { title: 'Pedidos Despachados', value: '89 Hoy', icon: 'Ã°Å¸Å¡Å¡' }
    ]
  },
  'Industrias de ExtracciÃƒÂ³n, Cultivo, ExplotaciÃƒÂ³n, ConservaciÃƒÂ³n, etc': {
    name: 'ExtracciÃƒÂ³n y Cultivo',
    accent: '#22c55e',
    accentGlow: 'rgb(34, 197, 94)',
    accentSecondary: '#15803d',
    gradient: 'linear-gradient(135deg, rgb(34, 197, 94) 0%, rgb(5, 8, 20) 100%)',
    icon: 'Ã°Å¸Å¡Å“',
    banner: 'Terminal de GestiÃƒÂ³n AgrÃƒÂ­cola, Cultivo y ConservaciÃƒÂ³n',
    bgDark: '#052e16',
    panelDark: '#14532d',
    textPrimary: '#f0fdf4',
    metrics: [
      { title: 'Cosecha Estimada', value: '12.5 Toneladas', icon: 'Ã°Å¸Å’Â¾' },
      { title: 'Humedad de Suelo', value: '62.4%', icon: 'Ã°Å¸â€™Â§' },
      { title: 'Costo de OperaciÃƒÂ³n', value: '$840.00 / Ha', icon: 'Ã°Å¸â€™Âµ' }
    ]
  },
  'Hoteleria y Turismo': {
    name: 'HotelerÃƒÂ­a y Turismo',
    accent: '#eab308',
    accentGlow: 'rgb(234, 179, 8)',
    accentSecondary: '#ca8a04',
    gradient: 'linear-gradient(135deg, rgb(234, 179, 8) 0%, rgb(5, 8, 20) 100%)',
    icon: 'Ã°Å¸ÂÂ¨',
    banner: 'Plataforma Hotelera y Servicios TurÃƒÂ­sticos',
    bgDark: '#1c1917',
    panelDark: '#292524',
    textPrimary: '#fafaf9',
    metrics: [
      { title: 'OcupaciÃƒÂ³n de Habitaciones', value: '78.5%', icon: 'Ã°Å¸â€â€˜' },
      { title: 'Check-ins Pendientes', value: '6 hoy', icon: 'Ã°Å¸Å¡Âª' },
      { title: 'Servicios de Hospedaje', value: '$450.00 extra', icon: 'Ã°Å¸ÂÂ½Ã¯Â¸Â' }
    ]
  },
  'Restaurantes, Cafeterias o Similares': {
    name: 'Restaurantes y CafeterÃƒÂ­as',
    accent: '#f97316',
    accentGlow: 'rgb(249, 115, 22)',
    accentSecondary: '#ea580c',
    gradient: 'linear-gradient(135deg, rgb(249, 115, 22) 0%, rgb(5, 8, 20) 100%)',
    icon: 'Ã°Å¸Ââ€',
    banner: 'Consola Operativa GastronÃƒÂ³mica y Restaurantes',
    bgDark: '#2a1a15',
    panelDark: '#3e2723',
    textPrimary: '#efebe9',
    metrics: [
      { title: 'Mesas Ocupadas', value: '14 / 20', icon: 'Ã°Å¸Âªâ€˜' },
      { title: 'Ticket Promedio', value: '$22.40', icon: 'Ã°Å¸â€™Â°' },
      { title: 'Ventas del Turno', value: '$856.20', icon: 'Ã°Å¸â€Â¥' }
    ]
  },
  'Servicios de Contabilidad': {
    name: 'Servicios Contables',
    accent: '#06b6d4',
    accentGlow: 'rgb(6, 182, 212)',
    accentSecondary: '#0891b2',
    gradient: 'linear-gradient(135deg, rgb(6, 182, 212) 0%, rgb(5, 8, 20) 100%)',
    icon: 'Ã°Å¸â€™Â¼',
    banner: 'Escritorio de GestiÃƒÂ³n Contable y Tributaria Profesional',
    bgDark: '#082f49',
    panelDark: '#0c4a6e',
    textPrimary: '#f0f9ff',
    metrics: [
      { title: 'Reportes Firmados', value: '18 / 24', icon: 'Ã°Å¸â€œÂ' },
      { title: 'Impuestos Declarados', value: '100% Completado', icon: 'Ã°Å¸Ââ€ºÃ¯Â¸Â' },
      { title: 'Clientes Activos', value: '54 Empresas', icon: 'Ã°Å¸Â¤Â' }
    ]
  },
  'Actividades Profesionales': {
    name: 'Actividades Profesionales',
    accent: '#3b82f6',
    accentGlow: 'rgb(59, 130, 246)',
    accentSecondary: '#2563eb',
    gradient: 'linear-gradient(135deg, rgb(59, 130, 246) 0%, rgb(5, 8, 20) 100%)',
    icon: 'Ã°Å¸Å½â€œ',
    banner: 'Escritorio de ConsultorÃƒÂ­a y Servicios Profesionales',
    bgDark: '#0f172a',
    panelDark: '#1e293b',
    textPrimary: '#f8fafc',
    metrics: [
      { title: 'Horas Facturables', value: '38.5 hrs', icon: 'Ã¢ÂÂ³' },
      { title: 'Honorarios del Mes', value: '$4,800.00', icon: 'Ã°Å¸â€™Âµ' },
      { title: 'Casos/Proyectos Activos', value: '9 pendientes', icon: 'Ã°Å¸â€œâ€š' }
    ]
  },
  'Servicios Sociales y de Salud': {
    name: 'Servicios de Salud',
    accent: '#0d9488',
    accentGlow: 'rgb(13, 148, 136)',
    accentSecondary: '#0f766e',
    gradient: 'linear-gradient(135deg, rgb(13, 148, 136) 0%, rgb(5, 8, 20) 100%)',
    icon: 'Ã°Å¸Â©Âº',
    banner: 'Portal de Servicios de Salud y Bienestar Social',
    bgDark: '#042f2e',
    panelDark: '#115e59',
    textPrimary: '#f0fdfa',
    metrics: [
      { title: 'Pacientes Atendidos', value: '15 Hoy', icon: 'Ã°Å¸Â§â€˜Ã¢â‚¬ÂÃ¢Å¡â€¢Ã¯Â¸Â' },
      { title: 'Consultas Reservadas', value: '28 de esta semana', icon: 'Ã°Å¸â€”â€œÃ¯Â¸Â' },
      { title: 'Historiales ClÃƒÂ­nicos', value: '412 Guardados', icon: 'Ã°Å¸â€”â€šÃ¯Â¸Â' }
    ]
  },
  'Servicios en General': {
    name: 'Servicios Generales',
    accent: '#6366f1',
    accentGlow: 'rgb(99, 102, 241)',
    accentSecondary: '#4f46e5',
    gradient: 'linear-gradient(135deg, rgb(99, 102, 241) 0%, rgb(5, 8, 20) 100%)',
    icon: 'Ã°Å¸â€Â§',
    banner: 'Consola General de GestiÃƒÂ³n de Servicios',
    bgDark: '#111827',
    panelDark: '#1f2937',
    textPrimary: '#f9fafb',
    metrics: [
      { title: 'Servicios Completados', value: '344 ÃƒÂ³rdenes', icon: 'Ã¢Å“â€¦' },
      { title: 'CalificaciÃƒÂ³n Promedio', value: '4.9 Ã¢Â­Â', icon: 'Ã¢Â­Â' },
      { title: 'Ãƒâ€œrdenes en Progreso', value: '5 activas', icon: 'Ã°Å¸â€ºÂ Ã¯Â¸Â' }
    ]
  },
  'Servicios de Transporte': {
    name: 'Servicios de Transporte',
    accent: '#ef4444',
    accentGlow: 'rgb(239, 68, 68)',
    accentSecondary: '#dc2626',
    gradient: 'linear-gradient(135deg, rgb(239, 68, 68) 0%, rgb(5, 8, 20) 100%)',
    icon: 'Ã°Å¸Å¡Å¡',
    banner: 'Terminal LogÃƒÂ­stico y Despacho de Transporte',
    bgDark: '#450a0a',
    panelDark: '#7f1d1d',
    textPrimary: '#fef2f2',
    metrics: [
      { title: 'VehÃƒÂ­culos en Ruta', value: '5 Activos', icon: 'Ã°Å¸Å¡â€º' },
      { title: 'Rutas Despachadas', value: '12 Hoy', icon: 'Ã°Å¸â€”ÂºÃ¯Â¸Â' },
      { title: 'Costo Combustible', value: '$384.20', icon: 'Ã¢â€ºÂ½' }
    ]
  },
  'Servicios de ReparaciÃƒÂ³n de Automotores y Motocicletas': {
    name: 'ReparaciÃƒÂ³n Automotriz',
    accent: '#84cc16',
    accentGlow: 'rgb(132, 204, 22)',
    accentSecondary: '#65a30d',
    gradient: 'linear-gradient(135deg, rgb(132, 204, 22) 0%, rgb(5, 8, 20) 100%)',
    icon: 'Ã°Å¸ÂÂÃ¯Â¸Â',
    banner: 'Consola Operativa de Taller Automotriz y Motos',
    bgDark: '#1c1d17',
    panelDark: '#2d2e24',
    textPrimary: '#f7fee7',
    metrics: [
      { title: 'VehÃƒÂ­culos en Taller', value: '8 en ReparaciÃƒÂ³n', icon: 'Ã°Å¸Å¡â€”' },
      { title: 'Trabajos Entregados', value: '14 esta semana', icon: 'Ã°Å¸â€Â§' },
      { title: 'Repuestos Utilizados', value: '38 Unidades', icon: 'Ã¢Å¡â„¢Ã¯Â¸Â' }
    ]
  },
  'default': {
    name: 'General',
    accent: '#213993',
    accentGlow: 'rgb(33, 57, 147)',
    accentSecondary: '#3b53a4',
    gradient: 'linear-gradient(135deg, rgb(33, 57, 147) 0%, rgb(5, 8, 20) 100%)',
    icon: 'Ã°Å¸â€™Â»',
    banner: 'Consola General de Control y Contabilidad',
    bgDark: '#E8EAE9',
    panelDark: '#FFFFFF',
    textPrimary: '#111827',
    metrics: [
      { title: 'Estado del Sistema', value: 'Operativo', icon: 'Ã¢Å“â€Ã¯Â¸Â' },
      { title: 'SRI IntegraciÃƒÂ³n', value: 'Simulador Local', icon: 'Ã°Å¸â€Å’' },
      { title: 'ÃƒÅ¡ltima Actividad', value: 'Hace un momento', icon: 'Ã¢ÂÂ³' }
    ]
  }
};

export default function App() {
  const { user, token, loading, login, signup, logout, error: authError } = useAuth();

  // Navigation State
  // Navigation State
  const [activeTab, setActiveTab] = useState<'kardex' | 'ventas' | 'proveedores' | 'caja' | 'contabilidad' | 'sri' | 'assets' | 'admin'>('kardex');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Auto-collapse sidebar on smaller laptop viewports on mount & resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1200) {
        setIsSidebarCollapsed(true);
      } else {
        setIsSidebarCollapsed(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Reconciliation States
  const [recoSummary, setRecoSummary] = useState<ReconciliationSummary | null>(null);
  const [recoLoading, setRecoLoading] = useState(false);
  const [cashType, setCashType] = useState<'INGRESS' | 'EGRESS'>('INGRESS');
  const [cashSource, setCashSource] = useState<'SALE' | 'PURCHASE' | 'MANUAL'>('MANUAL');
  const [cashAmount, setCashAmount] = useState(0);
  const [cashDesc, setCashDesc] = useState('');
  const [cashInvoiceId, setCashInvoiceId] = useState('');
  const [cashPurchaseId, setCashPurchaseId] = useState('');

  // SRI Configuration States
  const [sriSubTab, setSriSubTab] = useState<'formulario' | 'ats' | 'config'>('formulario');
  const [sriSimulate, setSriSimulate] = useState(true);
  const [sriEnvironment, setSriEnvironment] = useState('1');
  const [sriSignatureBase64, setSriSignatureBase64] = useState('');
  const [sriSignaturePassword, setSriSignaturePassword] = useState('');
  const [sriConfigHasSignature, setSriConfigHasSignature] = useState(false);
  const [sriIsBranch, setSriIsBranch] = useState(false);
  const [sriParentCompanyRuc, setSriParentCompanyRuc] = useState('');
  const [sriEstablishmentCode, setSriEstablishmentCode] = useState('001');
  const [sriEmissionPoint, setSriEmissionPoint] = useState('002');
  const [sriEstablishmentAddress, setSriEstablishmentAddress] = useState('Av. de los Granados N45 y Eloy Alfaro, Quito');
  const [sriConfigLoading, setSriConfigLoading] = useState(false);
  const [isProductsDropdownOpen, setIsProductsDropdownOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'landing' | 'login' | 'signup' | 'app'>('landing');
  const [sriSaving, setSriSaving] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(1);


  const [isLoginView, setIsLoginView] = useState(true);
  const [nameInput, setNameInput] = useState('');
  const [rucInput, setRucInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authFormError, setAuthFormError] = useState<string | null>(null);

  // New signup fields
  const [addressInput, setAddressInput] = useState('');
  const [provinceInput, setProvinceInput] = useState('');
  const [cityInput, setCityInput] = useState('');
  const [whatsappInput, setWhatsappInput] = useState('');
  const [businessTypesInput, setBusinessTypesInput] = useState<string[]>([]);
  const [businessTypesSearch, setBusinessTypesSearch] = useState('');
  const [businessTypesDropdownOpen, setBusinessTypesDropdownOpen] = useState(false);
  const [activeEnvironment, setActiveEnvironment] = useState<string>('default');

  // Company management and Administration states
  const [isAdministrationExpanded, setIsAdministrationExpanded] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any | null>(null);
  const [companyViewMode, setCompanyViewMode] = useState<'list' | 'form'>('list');
  const [companyFormAction, setCompanyFormAction] = useState<'create' | 'edit'>('create');
  const [adminSubTab, setAdminSubTab] = useState<'empresas' | 'sucursales' | 'integraciones' | 'actividades'>('empresas');

  // Company Form fields
  const [compType, setCompType] = useState('RUC');
  const [compIdentificacion, setCompIdentificacion] = useState('');
  const [compRazonSocial, setCompRazonSocial] = useState('');
  const [compDescripcion, setCompDescripcion] = useState('');
  const [compNombreDB, setCompNombreDB] = useState('');
  const [isBannerClosed, setIsBannerClosed] = useState(false);

  // Expanded/collapsed states for sidebar dropdown sub-menus
  const [isCreatingCompany, setIsCreatingCompany] = useState(false);
  const [isVentasExpanded, setIsVentasExpanded] = useState(false);
  const [isComprasExpanded, setIsComprasExpanded] = useState(false);
  const [isTesoreriaExpanded, setIsTesoreriaExpanded] = useState(false);
  const [isCarteraExpanded, setIsCarteraExpanded] = useState(false);
  const [isPagosExpanded, setIsPagosExpanded] = useState(false);
  const [isNominaExpanded, setIsNominaExpanded] = useState(false);
  const [isActivosExpanded, setIsActivosExpanded] = useState(false);
  const [isContabilidadExpanded, setIsContabilidadExpanded] = useState(false);
  const [isProduccionExpanded, setIsProduccionExpanded] = useState(false);
  const [isGarantiasExpanded, setIsGarantiasExpanded] = useState(false);
  const [isTalleresExpanded, setIsTalleresExpanded] = useState(false);
  const [isRestauranteExpanded, setIsRestauranteExpanded] = useState(false);
  const [isInformesExpanded, setIsInformesExpanded] = useState(false);
  const [newProductPurpose, setNewProductPurpose] = useState<'VENTA' | 'GASTO' | 'ACTIVO_FIJO'>('VENTA');
  const [newProductAssetType, setNewProductAssetType] = useState<'COMPUTO' | 'VEHICULO' | 'MAQUINARIA'>('COMPUTO');
  const [productSearch, setProductSearch] = useState('');
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [selectedDetailsInvoice, setSelectedDetailsInvoice] = useState<any | null>(null);
  const [autoSyncInterval, setAutoSyncInterval] = useState<'OFF' | '5' | '15' | '30'>('OFF');
  const [simulatedModule, setSimulatedModule] = useState<string | null>(null);
  const [isProductCollapseOpen, setIsProductCollapseOpen] = useState(true);
  const [isCategoryCollapseOpen, setIsCategoryCollapseOpen] = useState(false);
  const [isTxCollapseOpen, setIsTxCollapseOpen] = useState(false);
  const [activeFlyout, setActiveFlyout] = useState<string | null>(null);

  // Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [depreciations, setDepreciations] = useState<Depreciation[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [trialBalance, setTrialBalance] = useState<any[]>([]);

  // Loading States
  const [productsLoading, setProductsLoading] = useState(false);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [depreciationsLoading, setDepreciationsLoading] = useState(false);
  const [purchasesLoading, setPurchasesLoading] = useState(false);
  const [accountingLoading, setAccountingLoading] = useState(false);

  // Barcode scanner configuration state
  const [scannerEnabled, setScannerEnabled] = useState(true);
  const [scannerMode, setScannerMode] = useState<'GLOBAL' | 'FOCUSED'>('GLOBAL');
  const [scannerTerminator, setScannerTerminator] = useState<'Enter' | 'Tab' | 'None'>('Enter');

  // Form States (New Product)
  const [newProductSku, setNewProductSku] = useState('');
  const [newProductName, setNewProductName] = useState('');
  const [newProductCost, setNewProductCost] = useState(0);
  const [newProductPrice, setNewProductPrice] = useState(0);
  const [newProductStock, setNewProductStock] = useState(0);
  const [newProductIva, setNewProductIva] = useState(true);
  const [globalIvaRate, setGlobalIvaRate] = useState<number>(() => {
    const saved = localStorage.getItem('globalIvaRate');
    return saved ? parseInt(saved, 10) : 15;
  });
  const [newProductIvaRate, setNewProductIvaRate] = useState<number>(() => {
    const saved = localStorage.getItem('globalIvaRate');
    return saved ? parseInt(saved, 10) : 15;
  });
  const [setAsDefault, setSetAsDefault] = useState<boolean>(false);
  const [ivaFilter, setIvaFilter] = useState<'all' | 'with' | 'without'>('all');
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Employee management states
  const [ventasSubTab, setVentasSubTab] = useState<'facturas' | 'empleados' | 'facturacion_avanzada' | 'clientes' | 'proformas' | 'nomina'>('facturacion_avanzada');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [empName, setEmpName] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empPassword, setEmpPassword] = useState('');
  const [empConfirmPassword, setEmpConfirmPassword] = useState('');

  // Ã¢â€â‚¬Ã¢â€â‚¬ Customer Directory States Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  const [customers, setCustomers] = useState<Customer[]>(() => {
    try { return JSON.parse(localStorage.getItem('aura_customers') || '[]'); } catch { return []; }
  });
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerFormMode, setCustomerFormMode] = useState<'create' | 'edit'>('create');
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [custName, setCustName] = useState('');
  const [custRuc, setCustRuc] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custAddress, setCustAddress] = useState('');

  // Ã¢â€â‚¬Ã¢â€â‚¬ Proformas States Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  const [proformas, setProformas] = useState<Proforma[]>(() => {
    try { return JSON.parse(localStorage.getItem('aura_proformas') || '[]'); } catch { return []; }
  });
  const [proformaSearch, setProformaSearch] = useState('');
  const [proformaView, setProformaView] = useState<'list' | 'create'>('list');
  const [proformaClientName, setProformaClientName] = useState('');
  const [proformaClientRuc, setProformaClientRuc] = useState('');
  const [proformaNotes, setProformaNotes] = useState('');
  const [proformaItems, setProformaItems] = useState<{ productId: string; quantity: number }[]>([
    { productId: '', quantity: 1 }
  ]);

  // Ã¢â€â‚¬Ã¢â€â‚¬ Payroll / NÃƒÂ³mina States Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  const [payrollEmployeeId, setPayrollEmployeeId] = useState('');
  const [payrollSalary, setPayrollSalary] = useState(450);
  const [payrollBonus, setPayrollBonus] = useState(0);
  const [payrollExtras, setPayrollExtras] = useState(0);
  const [payrollOtherDeductions, setPayrollOtherDeductions] = useState(0);
  const [payrollRoles, setPayrollRoles] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem('aura_payroll') || '[]'); } catch { return []; }
  });
  const [payrollMonth, setPayrollMonth] = useState(() => new Date().toISOString().slice(0, 7));

  // Ã¢â€â‚¬Ã¢â€â‚¬ Bank Accounts States Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(() => {
    try { return JSON.parse(localStorage.getItem('aura_banks') || '[]'); } catch { return []; }
  });
  const [bankMovements, setBankMovements] = useState<BankMovement[]>(() => {
    try { return JSON.parse(localStorage.getItem('aura_bank_movements') || '[]'); } catch { return []; }
  });
  const [bankView, setBankView] = useState<'list' | 'form' | 'movements'>('list');
  const [selectedBankAccountId, setSelectedBankAccountId] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankType, setBankType] = useState<'CORRIENTE' | 'AHORRO'>('CORRIENTE');
  const [bankNumber, setBankNumber] = useState('');
  const [bankInitialBalance, setBankInitialBalance] = useState(0);
  const [movType, setMovType] = useState<'DEPOSITO' | 'RETIRO' | 'TRANSFERENCIA'>('DEPOSITO');
  const [movAmount, setMovAmount] = useState(0);
  const [movDesc, setMovDesc] = useState('');
  const [movDate, setMovDate] = useState(new Date().toISOString().slice(0, 10));


  // Form States (New Product & Modification)
  const [productFormMode, setProductFormMode] = useState<'create' | 'update'>('create');
  const [searchSku, setSearchSku] = useState('');
  const [updateProductPrice, setUpdateProductPrice] = useState(0);
  const [updateProductCategoryId, setUpdateProductCategoryId] = useState('');
  const [updateProductAddedStock, setUpdateProductAddedStock] = useState(0);

  const foundProduct = React.useMemo(() => {
    if (!searchSku.trim()) return null;
    return products.find(p => p.sku.trim().toLowerCase() === searchSku.trim().toLowerCase()) || null;
  }, [searchSku, products]);

  const skuSuggestions = React.useMemo(() => {
    if (!searchSku.trim()) return [];
    return products.filter(p =>
      p.sku.toLowerCase().includes(searchSku.toLowerCase()) ||
      p.name.toLowerCase().includes(searchSku.toLowerCase())
    ).slice(0, 100);
  }, [searchSku, products]);

  const showSuggestions = React.useMemo(() => {
    if (!searchSku.trim()) return false;
    if (foundProduct && foundProduct.sku.toLowerCase() === searchSku.trim().toLowerCase()) return false;
    return skuSuggestions.length > 0;
  }, [searchSku, foundProduct, skuSuggestions]);

  React.useEffect(() => {
    if (foundProduct) {
      setUpdateProductPrice(foundProduct.price);
      setUpdateProductCategoryId(foundProduct.categoryId || '');
      setUpdateProductAddedStock(0);
    } else {
      setUpdateProductPrice(0);
      setUpdateProductCategoryId('');
      setUpdateProductAddedStock(0);
    }
  }, [foundProduct]);




  // Form States (New Transaction)
  const [selectedProductId, setSelectedProductId] = useState('');
  const [txType, setTxType] = useState<'INGRESS' | 'EGRESS'>('INGRESS');
  const [txQty, setTxQty] = useState(1);
  const [kardexFilterCategoryId, setKardexFilterCategoryId] = useState('all');

  const filteredKardexProducts = React.useMemo(() => {
    if (kardexFilterCategoryId === 'all') return products;
    return products.filter(p => p.categoryId === kardexFilterCategoryId);
  }, [products, kardexFilterCategoryId]);

  React.useEffect(() => {
    if (filteredKardexProducts.length > 0) {
      if (!filteredKardexProducts.some(p => p.id === selectedProductId)) {
        setSelectedProductId(filteredKardexProducts[0].id);
      }
    } else {
      setSelectedProductId('');
    }
  }, [filteredKardexProducts, selectedProductId]);

  // Form States (New Asset)
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetValue, setNewAssetValue] = useState(0);
  const [newAssetResidual, setNewAssetResidual] = useState(0);
  const [newAssetYears, setNewAssetYears] = useState(3);

  // Form States (New Invoice)
  const [newClientName, setNewClientName] = useState('');
  const [invoiceItems, setInvoiceItems] = useState<{ productId: string; quantity: number }[]>([
    { productId: '', quantity: 1 }
  ]);

  const calculatedInvoiceTotals = React.useMemo(() => {
    let subtotal = 0;
    let iva = 0;
    let total = 0;

    invoiceItems.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      if (prod) {
        const lineTotal = prod.price * item.quantity;
        total += lineTotal;
        if (prod.hasIva) {
          const lineSubtotal = lineTotal / (1 + globalIvaRate / 100);
          subtotal += lineSubtotal;
          iva += (lineTotal - lineSubtotal);
        } else {
          subtotal += lineTotal;
        }
      }
    });

    return {
      subtotal: Number(subtotal.toFixed(2)),
      iva: Number(iva.toFixed(2)),
      total: Number(total.toFixed(2))
    };
  }, [invoiceItems, products, globalIvaRate]);

  // Form States (New Purchase)
  const [newPurInvoiceNum, setNewPurInvoiceNum] = useState('');
  const [newPurProviderRuc, setNewPurProviderRuc] = useState('');
  const [newPurProviderName, setNewPurProviderName] = useState('');
  const [newPurAmount, setNewPurAmount] = useState(0);
  const [newPurDate, setNewPurDate] = useState(new Date().toISOString().slice(0, 10));
  const [newPurIva, setNewPurIva] = useState(true);
  const [newPurStockUpdate, setNewPurStockUpdate] = useState(false);
  const [newPurSku, setNewPurSku] = useState('');
  const [newPurQty, setNewPurQty] = useState(1);

  // Form States (Manual Accounting Entry)
  const [manualEntryDesc, setManualEntryDesc] = useState('');
  const [manualEntryDate, setManualEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [manualEntryLines, setManualEntryLines] = useState<any[]>([
    { accountCode: '1.01.01', accountName: 'Caja/Bancos', debit: 0, credit: 0 },
    { accountCode: '4.01.01', accountName: 'Ventas de Servicios/MercaderÃƒÂ­as', debit: 0, credit: 0 }
  ]);

  // Modal / XML states
  const [activeXml, setActiveXml] = useState<string | null>(null);

  // Fetch Data Helpers
  const fetchProducts = React.useCallback(async () => {
    if (!token) return;
    setProductsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = (await res.json()) as Product[];
        setProducts(data);
        if (data.length > 0) {
          setSelectedProductId((prev) => prev || data[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setProductsLoading(false);
    }
  }, [token]);

  const fetchCategories = React.useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = (await res.json()) as Category[];
        setCategories(data);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }, [token]);

  const fetchAssets = React.useCallback(async () => {
    if (!token) return;
    setAssetsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/assets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = (await res.json()) as Asset[];
        setAssets(data);
      }
    } catch (err) {
      console.error('Error fetching assets:', err);
    } finally {
      setAssetsLoading(false);
    }
  }, [token]);

  const fetchInvoices = React.useCallback(async () => {
    if (!token || !user) return;
    setInvoicesLoading(true);
    try {
      const res = await fetch(`${BILLING_API_BASE}/invoices`, {
        headers: {
          'x-user-id': user.id,
        },
      });
      if (res.ok) {
        const data = (await res.json()) as Invoice[];
        setInvoices(data);
      }
    } catch (err) {
      console.error('Error fetching invoices:', err);
    } finally {
      setInvoicesLoading(false);
    }
  }, [token, user]);

  const fetchDepreciations = React.useCallback(async () => {
    if (!token) return;
    setDepreciationsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/assets/depreciations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = (await res.json()) as Depreciation[];
        setDepreciations(data);
      }
    } catch (err) {
      console.error('Error fetching depreciations:', err);
    } finally {
      setDepreciationsLoading(false);
    }
  }, [token]);

  const fetchPurchases = React.useCallback(async () => {
    if (!token) return;
    setPurchasesLoading(true);
    try {
      const res = await fetch(`${API_BASE}/purchases`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = (await res.json()) as Purchase[];
        setPurchases(data);
      }
    } catch (err) {
      console.error('Error fetching purchases:', err);
    } finally {
      setPurchasesLoading(false);
    }
  }, [token]);

  const fetchEmployees = React.useCallback(async () => {
    if (!token) return;
    setEmployeesLoading(true);
    try {
      const res = await fetch(`${API_BASE}/employees`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = (await res.json()) as Employee[];
        setEmployees(data);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
    } finally {
      setEmployeesLoading(false);
    }
  }, [token]);

  const fetchReconciliationSummary = React.useCallback(async () => {
    if (!token) return;
    setRecoLoading(true);
    try {
      const res = await fetch(`${API_BASE}/reconciliation/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRecoSummary(data);
      }
    } catch (err) {
      console.error('Error fetching reconciliation summary:', err);
    } finally {
      setRecoLoading(false);
    }
  }, [token]);

  const fetchAccountingData = React.useCallback(async () => {
    if (!token) return;
    setAccountingLoading(true);
    try {
      const [resEntries, resBalance] = await Promise.all([
        fetch(`${API_BASE}/accounting/entries`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/accounting/trial-balance`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (resEntries.ok) {
        setJournalEntries((await resEntries.json()) as JournalEntry[]);
      }
      if (resBalance.ok) {
        setTrialBalance(await resBalance.json());
      }
    } catch (err) {
      console.error('Error fetching accounting data:', err);
    } finally {
      setAccountingLoading(false);
    }
  }, [token]);

  const fetchSriConfig = React.useCallback(async () => {
    if (!token) return;
    setSriConfigLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/profile/sri-config`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSriSimulate(data.sriSimulate);
        setSriEnvironment(data.sriEnvironment);
        setSriConfigHasSignature(data.hasSignature);
        setSriIsBranch(data.isBranch || false);
        setSriParentCompanyRuc(data.parentCompanyRuc || '');
        setSriEstablishmentCode(data.establishmentCode || '001');
        setSriEmissionPoint(data.emissionPoint || '002');
        setSriEstablishmentAddress(data.establishmentAddress || 'Av. de los Granados N45 y Eloy Alfaro, Quito');
      }
    } catch (err) {
      console.error('Error fetching SRI config:', err);
    } finally {
      setSriConfigLoading(false);
    }
  }, [token]);

  const fetchCompanies = React.useCallback(async () => {
    if (!token) return;
    setCompaniesLoading(true);
    try {
      const res = await fetch(`${API_BASE}/companies`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCompanies(data);
      }
    } catch (err) {
      console.error('Error fetching companies:', err);
    } finally {
      setCompaniesLoading(false);
    }
  }, [token]);

  // Autogenerate DB Name
  useEffect(() => {
    if (companyFormAction === 'create') {
      const cleanName = compRazonSocial
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/(^_|_$)/g, '');
      setCompNombreDB((cleanName || compIdentificacion) ? `db_${cleanName}_${compIdentificacion}` : '');
    }
  }, [compRazonSocial, compIdentificacion, companyFormAction]);

  // Initial fetch of companies to check for banner
  useEffect(() => {
    if (user && token) {
      void fetchCompanies();
    }
  }, [user, token, fetchCompanies]);

  // Load active tab data
  useEffect(() => {
    if (user && token) {
      const timer = setTimeout(() => {
        if (activeTab === 'kardex') {
          void fetchProducts();
          void fetchCategories();
        }
        if (activeTab === 'ventas') void fetchInvoices();
        if (activeTab === 'proveedores') {
          void fetchPurchases();
          void fetchProducts();
        }
        if (activeTab === 'caja') void fetchReconciliationSummary();
        if (activeTab === 'contabilidad') void fetchAccountingData();
        if (activeTab === 'sri') {
          void fetchInvoices();
          void fetchPurchases();
          void fetchReconciliationSummary();
          void fetchSriConfig();
        }
        if (activeTab === 'assets') {
          void fetchAssets();
          void fetchDepreciations();
        }
        if (activeTab === 'admin') {
          void fetchCompanies();
          void fetchSriConfig();
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [
    user,
    token,
    activeTab,
    fetchProducts,
    fetchCategories,
    fetchAssets,
    fetchDepreciations,
    fetchInvoices,
    fetchPurchases,
    fetchReconciliationSummary,
    fetchAccountingData,
    fetchSriConfig,
    fetchCompanies,
  ]);

  // Load employees when on Ventas -> Employees tab
  useEffect(() => {
    if (user && token && activeTab === 'ventas' && ventasSubTab === 'empleados') {
      void fetchEmployees();
    }
  }, [user, token, activeTab, ventasSubTab, fetchEmployees]);

  // Periodic polling for invoices to update SRI authorization status
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (user && token && (activeTab === 'ventas' || activeTab === 'sri')) {
      interval = setInterval(() => {
        void fetchInvoices();
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [user, token, activeTab, fetchInvoices]);

  // Unified Periodic Auto-sync hook
  useEffect(() => {
    if (!user || !token || autoSyncInterval === 'OFF') return;
    const sec = parseInt(autoSyncInterval, 10);
    if (isNaN(sec)) return;

    const interval = setInterval(() => {
      void fetchInvoices();
      void fetchProducts();
      void fetchPurchases();
      void fetchAssets();
      void fetchAccountingData();
      void fetchReconciliationSummary();
    }, sec * 1000);

    return () => clearInterval(interval);
  }, [user, token, autoSyncInterval, fetchInvoices, fetchProducts, fetchPurchases, fetchAssets, fetchAccountingData, fetchReconciliationSummary]);

  // Barcode scanner Keyboard Emulation listener hook
  React.useEffect(() => {
    if (!scannerEnabled || scannerMode !== 'GLOBAL') return;

    let buffer = '';
    let timeout: any;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Control' || e.key === 'Shift' || e.key === 'Alt' || e.key === 'Meta') return;
      
      if (e.key === scannerTerminator || (scannerTerminator === 'None' && buffer.length >= 8)) {
        if (buffer.length > 2) {
          e.preventDefault();
          const barcode = buffer.trim();
          buffer = '';
          const product = products.find((p: any) => p.sku.toLowerCase() === barcode.toLowerCase() || p.name.toLowerCase().includes(barcode.toLowerCase()));
          if (product) {
            setSelectedProductId(product.id);
            setProductSearch(product.sku);
            alert('Lector detectó SKU: ' + product.sku + ' - ' + product.name + ' (Stock: ' + product.stock + ')');
          } else {
            alert('Lector detectó SKU: ' + barcode + ' (No encontrado en catálogo)');
          }
        }
      } else {
        if (e.key.length === 1) {
          buffer += e.key;
        }
      }

      clearTimeout(timeout);
      timeout = setTimeout(() => {
        buffer = '';
      }, 150);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timeout);
    };
  }, [scannerEnabled, scannerMode, scannerTerminator, products]);



  // Clear auth forms when toggling
  useEffect(() => {
    setNameInput('');
    setRucInput('');
    setEmailInput('');
    setPasswordInput('');
    setAddressInput('');
    setProvinceInput('');
    setCityInput('');
    setWhatsappInput('');
    setBusinessTypesInput([]);
    setBusinessTypesSearch('');
    setBusinessTypesDropdownOpen(false);
    setAuthFormError(null);
  }, [isLoginView, user]);

  // Active Environment switcher effect
  useEffect(() => {
    if (user?.businessTypes && user.businessTypes.length > 0) {
      const savedEnv = localStorage.getItem(`aura_active_env_${user.id}`);
      if (savedEnv && user.businessTypes.includes(savedEnv)) {
        setActiveEnvironment(savedEnv);
      } else {
        setActiveEnvironment(user.businessTypes[0]);
      }
    } else {
      setActiveEnvironment('default');
    }
  }, [user]);

  const handleSwitchEnvironment = (env: string) => {
    setActiveEnvironment(env);
    if (user?.id) {
      localStorage.setItem(`aura_active_env_${user.id}`, env);
    }
  };

  // Environment styling overrides
  useEffect(() => {
    const theme = BUSINESS_THEMES[activeEnvironment] || BUSINESS_THEMES.default;
    const root = document.documentElement;
    root.style.setProperty('--cyan', theme.accent);
    root.style.setProperty('--cyan-glow', theme.accentGlow);
    root.style.setProperty('--border-hover', theme.accent);

    if (user) {
      root.style.setProperty('--bg-gradient-start', theme.bgDark);
      root.style.setProperty('--bg-gradient-end', '#090d1a');
      root.style.setProperty('--bg-main', theme.bgDark);
      root.style.setProperty('--bg-card', theme.panelDark);
      root.style.setProperty('--bg-card-hover', 'rgb(255, 255, 255)');
      root.style.setProperty('--text-primary', theme.textPrimary);
      root.style.setProperty('--text-secondary', theme.textPrimary);
      root.style.setProperty('--text-muted', theme.textPrimary);
      root.style.setProperty('--border', 'rgb(255, 255, 255)');
    } else {
      // Reset variables on landing page/logout
      root.style.setProperty('--bg-gradient-start', '#E8EAE9');
      root.style.setProperty('--bg-gradient-end', '#F5F7F6');
      root.style.setProperty('--bg-main', '#E8EAE9');
      root.style.setProperty('--bg-card', '#FFFFFF');
      root.style.setProperty('--bg-card-hover', '#F3F5F4');
      root.style.setProperty('--text-primary', '#111827');
      root.style.setProperty('--text-secondary', '#111827');
      root.style.setProperty('--text-muted', '#111827');
      root.style.setProperty('--border', '#D8DCDB');
    }
  }, [activeEnvironment, user]);

  // Auto-redirect to dashboard if user has active session
  useEffect(() => {
    if (user && (viewMode === 'landing' || viewMode === 'login' || viewMode === 'signup')) {
      setViewMode('app');
    }
  }, [user, viewMode]);

  if (loading) {
    return (
      <div className="flex-center loading-screen">
        <div className="spinner"></div>
        <p>Cargando sesiÃƒÂ³n contable...</p>
      </div>
    );
  }

  // Handle Authentication submit
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthFormError(null);
    try {
      if (isLoginView) {
        await login(emailInput, passwordInput);
      } else {
        if (businessTypesInput.length === 0) {
          throw new Error('Debe elegir al menos 1 tipo de negocio.');
        }
        await signup(
          nameInput,
          rucInput,
          emailInput,
          passwordInput,
          addressInput || 'Av. de los Granados N45 y Eloy Alfaro, Quito',
          provinceInput || 'Pichincha',
          cityInput || 'Quito',
          whatsappInput || '',
          businessTypesInput
        );
      }
      setViewMode('app');
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setAuthFormError(errMsg || 'Error en la autenticaciÃƒÂ³n');
    }
  };

  // Actions - Companies
  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compIdentificacion || !compRazonSocial) {
      alert('Por favor complete la identificaciÃƒÂ³n y razÃƒÂ³n social.');
      return;
    }

    setIsCreatingCompany(true);
    try {
      const url = companyFormAction === 'create'
        ? `${API_BASE}/companies`
        : `${API_BASE}/companies/${selectedCompany?.id}`;
      const method = companyFormAction === 'create' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: compType,
          identification: compIdentificacion,
          name: compRazonSocial,
          description: compDescripcion,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || 'Error al guardar la empresa');
        setIsCreatingCompany(false);
        return;
      }

      // Sutil retraso artificial para visualizar la barra de progreso
      await new Promise((resolve) => setTimeout(resolve, 1500));

      alert(companyFormAction === 'create' ? 'Empresa creada con ÃƒÂ©xito' : 'Empresa modificada con ÃƒÂ©xito');
      setCompType('RUC');
      setCompIdentificacion('');
      setCompRazonSocial('');
      setCompDescripcion('');
      setCompNombreDB('');
      setSelectedCompany(null);
      setCompanyViewMode('list');
      void fetchCompanies();
    } catch (err) {
      console.error(err);
      alert('Error de conexiÃƒÂ³n con el servidor.');
    } finally {
      setIsCreatingCompany(false);
    }
  };

  const handleDeleteCompany = async (id: string, name: string) => {
    if (!confirm(`Ã‚Â¿EstÃƒÂ¡ seguro de eliminar la empresa "${name}"? Esta acciÃƒÂ³n no se puede deshacer.`)) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/companies/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.message || 'Error al eliminar la empresa');
        return;
      }

      alert('Empresa eliminada con ÃƒÂ©xito');
      if (selectedCompany?.id === id) {
        setSelectedCompany(null);
      }
      void fetchCompanies();
    } catch (err) {
      console.error(err);
      alert('Error de conexiÃƒÂ³n con el servidor.');
    }
  };

  const handleEditCompanySelect = () => {
    if (!selectedCompany) {
      alert('Por favor seleccione una empresa de la lista para modificar.');
      return;
    }
    setCompType(selectedCompany.type);
    setCompIdentificacion(selectedCompany.identification);
    setCompRazonSocial(selectedCompany.name);
    setCompDescripcion(selectedCompany.description || '');
    setCompNombreDB(selectedCompany.dbName);
    setCompanyFormAction('edit');
    setCompanyViewMode('form');
  };

  const handleNewCompanyClick = () => {
    setCompType('RUC');
    setCompIdentificacion('');
    setCompRazonSocial('');
    setCompDescripcion('');
    setCompNombreDB('');
    setCompanyFormAction('create');
    setCompanyViewMode('form');
  };

  // Actions - Kardex
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (newProductIva && setAsDefault) {
        localStorage.setItem('globalIvaRate', String(newProductIvaRate));
        setGlobalIvaRate(newProductIvaRate);
      }

      const res = await fetch(`${API_BASE}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sku: newProductSku,
          name: newProductName,
          cost: newProductCost,
          price: newProductPrice,
          stock: newProductStock,
          hasIva: newProductIva,
          categoryId: selectedCategoryId || null,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        alert(errData.message || 'Error al crear producto');
        return;
      }

      // If product purpose is ACTIVO_FIJO, automatically create a Fixed Asset
      if (newProductPurpose === 'ACTIVO_FIJO') {
        const yearsOfLife = newProductAssetType === 'COMPUTO' ? 3 : (newProductAssetType === 'VEHICULO' ? 5 : 10);
        await fetch(`${API_BASE}/assets`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: `${newProductName} (${newProductSku})`,
            value: newProductCost,
            residualValue: 0,
            yearsOfLife: yearsOfLife,
          }),
        }).then(resAsset => {
          if (resAsset.ok) {
            console.log('Activo Fijo creado automÃƒÂ¡ticamente desde producto.');
            void fetchAssets();
          }
        }).catch(errAsset => console.error('Failed to create asset automatically:', errAsset));
      }

      setNewProductSku('');
      setNewProductName('');
      setNewProductCost(0);
      setNewProductPrice(0);
      setNewProductStock(0);
      setNewProductIva(true);
      setNewProductPurpose('VENTA');
      setNewProductAssetType('COMPUTO');
      const savedRate = localStorage.getItem('globalIvaRate');
      setNewProductIvaRate(savedRate ? parseInt(savedRate, 10) : 15);
      setSetAsDefault(false);
      setSelectedCategoryId('');
      fetchProducts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foundProduct) return;
    try {
      const res = await fetch(`${API_BASE}/products/${foundProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          price: updateProductPrice,
          categoryId: updateProductCategoryId || null,
          addedStock: updateProductAddedStock,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        alert(errData.message || 'Error al actualizar producto');
        return;
      }

      alert('Producto actualizado con ÃƒÂ©xito');
      setSearchSku('');
      setUpdateProductPrice(0);
      setUpdateProductCategoryId('');
      setUpdateProductAddedStock(0);
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert('Error al conectar con el servidor.');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newCategoryName,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        alert(errData.message || 'Error al crear categorÃƒÂ­a');
        return;
      }

      setNewCategoryName('');
      fetchCategories();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!window.confirm(`Ã‚Â¿EstÃƒÂ¡s seguro de que deseas eliminar el producto "${productName}" y todos sus movimientos de KÃƒÂ¡rdex asociados?`)) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/products/${productId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errData = await res.json();
        alert(errData.message || 'Error al eliminar producto');
        return;
      }

      fetchProducts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) return;
    try {
      const res = await fetch(`${API_BASE}/products/transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: selectedProductId,
          type: txType,
          quantity: txQty,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        alert(errData.message || 'Error al registrar movimiento');
        return;
      }

      setTxQty(1);
      fetchProducts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleProductIva = async (productId: string) => {
    try {
      const res = await fetch(`${API_BASE}/products/${productId}/toggle-iva`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchProducts();
      } else {
        alert('Error al modificar IVA del producto');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Actions - Ventas
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const validItems = invoiceItems.filter(item => item.productId !== '');
    if (validItems.length === 0) {
      alert('Debe agregar al menos un producto a la factura');
      return;
    }

    try {
      const res = await fetch(`${BILLING_API_BASE}/invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientName: newClientName,
          amount: calculatedInvoiceTotals.total,
          hasIva: calculatedInvoiceTotals.iva > 0,
          ivaRate: globalIvaRate,
          items: validItems,
          user: {
            id: user.id,
            ruc: user.ruc || '1792455894001',
            name: user.name || 'Aura Contable User',
            sriEnvironment: sriEnvironment || '1',
            signatureBase64: sriSignatureBase64 || '',
            signaturePassword: sriSignaturePassword || '',
            sriSimulate: sriSimulate !== undefined ? sriSimulate : true,
            isBranch: sriIsBranch,
            parentCompanyRuc: sriParentCompanyRuc,
            establishmentCode: sriEstablishmentCode,
            emissionPoint: sriEmissionPoint,
            establishmentAddress: sriEstablishmentAddress,
          }
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        alert(errData.message || 'Error al emitir factura');
        return;
      }

      setNewClientName('');
      setInvoiceItems([{ productId: '', quantity: 1 }]);
      fetchInvoices();
      fetchProducts(); // Refresh products catalog to show updated stock
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendInvoice = async (invoiceId: string) => {
    try {
      const res = await fetch(`${BILLING_API_BASE}/invoices/${invoiceId}/send`, {
        method: 'POST',
      });
      if (res.ok) {
        alert('Factura firmada y autorizada enviada con ÃƒÂ©xito al correo del cliente.');
        fetchInvoices();
      } else {
        alert('Error al enviar factura al cliente');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadXml = async (invoiceId: string) => {
    try {
      const res = await fetch(`${BILLING_API_BASE}/invoices/${invoiceId}/xml?userId=${user?.id || ''}`);
      if (res.ok) {
        const data = await res.json();
        setActiveXml(data.xml);
      } else {
        alert('Error al descargar XML');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleP12FileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const base64 = (event.target.result as string).split(',')[1];
        setSriSignatureBase64(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSriConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSriSaving(true);
    try {
      const body: any = {
        sriSimulate,
        sriEnvironment,
        isBranch: sriIsBranch,
        parentCompanyRuc: sriIsBranch ? sriParentCompanyRuc : null,
        establishmentCode: sriEstablishmentCode,
        emissionPoint: sriEmissionPoint,
        establishmentAddress: sriEstablishmentAddress,
      };
      if (sriSignatureBase64) {
        body.signatureBase64 = sriSignatureBase64;
      }
      if (sriSignaturePassword) {
        body.signaturePassword = sriSignaturePassword;
      }
      const res = await fetch(`${API_BASE}/auth/profile/sri-config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        setSriConfigHasSignature(data.hasSignature);
        setSriSignatureBase64('');
        setSriSignaturePassword('');
        alert('ConfiguraciÃƒÂ³n del SRI guardada correctamente.');
      } else {
        alert('Error al guardar la configuraciÃƒÂ³n del SRI.');
      }
    } catch (err) {
      console.error('Error saving SRI config:', err);
      alert('Error de conexiÃƒÂ³n al guardar la configuraciÃƒÂ³n.');
    } finally {
      setSriSaving(false);
    }
  };

  // Actions - Proveedores
  const handleCreatePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const items = newPurStockUpdate && newPurSku
        ? [{ sku: newPurSku, quantity: Number(newPurQty), unitCost: Number(newPurAmount) / Number(newPurQty) }]
        : undefined;

      const res = await fetch(`${API_BASE}/purchases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          invoiceNum: newPurInvoiceNum,
          providerRuc: newPurProviderRuc,
          providerName: newPurProviderName,
          amount: newPurAmount,
          date: newPurDate,
          hasIva: newPurIva,
          ivaRate: globalIvaRate,
          items,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        alert(errData.message || 'Error al ingresar compra');
        return;
      }

      setNewPurInvoiceNum('');
      setNewPurProviderRuc('');
      setNewPurProviderName('');
      setNewPurAmount(0);
      setNewPurIva(true);
      setNewPurStockUpdate(false);
      setNewPurSku('');
      setNewPurQty(1);
      fetchPurchases();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSyncPurchases = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/purchases/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          alert(`SincronizaciÃƒÂ³n exitosa. Se descargaron instantÃƒÂ¡neamente del SRI ${data.length} facturas de compras de proveedores y se actualizÃƒÂ³ el inventario.`);
        } else {
          alert('SincronizaciÃƒÂ³n exitosa. No hay nuevas compras pendientes en el SRI.');
        }
        fetchPurchases();
        fetchProducts();
      } else {
        alert('Error al sincronizar con el SRI');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Actions - Caja / ConciliaciÃƒÂ³n
  const handleCreateCashTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/reconciliation/cash-transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: cashType,
          source: cashSource,
          amount: Number(cashAmount),
          description: cashDesc,
          invoiceId: cashInvoiceId || undefined,
          purchaseId: cashPurchaseId || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        alert(errData.message || 'Error al registrar transacciÃƒÂ³n de caja');
        return;
      }

      setCashAmount(0);
      setCashDesc('');
      setCashInvoiceId('');
      setCashPurchaseId('');
      fetchReconciliationSummary();
    } catch (err) {
      console.error(err);
    }
  };


  const handleSyncWithholdings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/reconciliation/sri-sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        alert('Error al sincronizar retenciones con el SRI');
        return;
      }

      const data = await res.json();
      if (data.length > 0) {
        alert(`SincronizaciÃƒÂ³n de retenciones exitosa. Se importaron ${data.length} retenciones del SRI y se aplicÃƒÂ³ la auto-conciliaciÃƒÂ³n.`);
      } else {
        alert('SincronizaciÃƒÂ³n de retenciones exitosa. No hay nuevas retenciones en el SRI.');
      }
      fetchReconciliationSummary();
    } catch (err) {
      console.error(err);
    }
  };

  // Actions - Accounting
  const handleCreateManualEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/accounting/entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          description: manualEntryDesc,
          date: manualEntryDate,
          lines: manualEntryLines.map(l => ({
            accountCode: l.accountCode,
            accountName: l.accountName,
            debit: Number(l.debit),
            credit: Number(l.credit)
          }))
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        alert(errData.message || 'Error al ingresar asiento manual');
        return;
      }

      setManualEntryDesc('');
      setManualEntryLines([
        { accountCode: '1.01.01', accountName: 'Caja/Bancos', debit: 0, credit: 0 },
        { accountCode: '4.01.01', accountName: 'Ventas de Servicios/MercaderÃƒÂ­as', debit: 0, credit: 0 }
      ]);
      fetchAccountingData();
    } catch (err) {
      console.error(err);
    }
  };

  // Actions - Employees
  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (empPassword !== empConfirmPassword) {
      alert('Las contraseÃƒÂ±as no coinciden.');
      return;
    }
    if (empPassword.length < 6) {
      alert('La contraseÃƒÂ±a debe tener al menos 6 caracteres.');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/employees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: empName,
          email: empEmail,
          password: empPassword,
        }),
      });

      if (res.ok) {
        alert('Empleado registrado exitosamente.');
        setEmpName('');
        setEmpEmail('');
        setEmpPassword('');
        setEmpConfirmPassword('');
        void fetchEmployees();
      } else {
        const err = await res.json();
        alert(err.message || 'Error al registrar empleado.');
      }
    } catch (err) {
      console.error('Error creating employee:', err);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm('Ã‚Â¿EstÃƒÂ¡s seguro de que deseas eliminar este empleado? Ya no podrÃƒÂ¡ ingresar al sistema de facturaciÃƒÂ³n.')) return;
    try {
      const res = await fetch(`${API_BASE}/employees/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        alert('Empleado eliminado.');
        void fetchEmployees();
      } else {
        const err = await res.json();
        alert(err.message || 'Error al eliminar empleado.');
      }
    } catch (err) {
      console.error('Error deleting employee:', err);
    }
  };


  // -- Handlers: Customer Directory ------------------------------------------
  const saveCustomersToStorage = (list: Customer[]) => {
    localStorage.setItem('aura_customers', JSON.stringify(list));
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (customerFormMode === 'create') {
      const newCust = {
        id: crypto.randomUUID(),
        name: custName, ruc: custRuc, email: custEmail, phone: custPhone, address: custAddress,
        createdAt: new Date().toISOString(),
      };
      const updated = [...customers, newCust];
      setCustomers(updated); saveCustomersToStorage(updated);
    } else {
      const updated = customers.map(c =>
        c.id === editingCustomerId
          ? { ...c, name: custName, ruc: custRuc, email: custEmail, phone: custPhone, address: custAddress }
          : c
      );
      setCustomers(updated); saveCustomersToStorage(updated);
    }
    setCustName(''); setCustRuc(''); setCustEmail(''); setCustPhone(''); setCustAddress('');
    setCustomerFormMode('create'); setEditingCustomerId(null);
  };

  const handleEditCustomer = (c: Customer) => {
    setCustomerFormMode('edit'); setEditingCustomerId(c.id);
    setCustName(c.name); setCustRuc(c.ruc); setCustEmail(c.email);
    setCustPhone(c.phone); setCustAddress(c.address);
  };

  const handleDeleteCustomer = (id: string) => {
    if (!confirm('Eliminar este cliente del directorio?')) return;
    const updated = customers.filter(c => c.id !== id);
    setCustomers(updated); saveCustomersToStorage(updated);
  };

  // -- Handlers: Proformas ---------------------------------------------------
  const saveProformasToStorage = (list: Proforma[]) => {
    localStorage.setItem('aura_proformas', JSON.stringify(list));
  };

  const handleCreateProforma = (e: React.FormEvent) => {
    e.preventDefault();
    let subtotal = 0, iva = 0, total = 0;
    const items: ProformaItem[] = [];
    proformaItems.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      if (prod) {
        const lineTotal = prod.price * item.quantity;
        total += lineTotal;
        if (prod.hasIva) {
          const ls = lineTotal / (1 + globalIvaRate / 100);
          subtotal += ls; iva += lineTotal - ls;
        } else { subtotal += lineTotal; }
        items.push({ productId: prod.id, productName: prod.name, productSku: prod.sku,
          price: prod.price, quantity: item.quantity, hasIva: prod.hasIva });
      }
    });
    const newProforma = {
      id: crypto.randomUUID(), clientName: proformaClientName, clientRuc: proformaClientRuc,
      items, subtotal: Number(subtotal.toFixed(2)), iva: Number(iva.toFixed(2)),
      total: Number(total.toFixed(2)), status: 'BORRADOR' as const,
      createdAt: new Date().toISOString(), notes: proformaNotes,
    };
    const updated = [...proformas, newProforma];
    setProformas(updated); saveProformasToStorage(updated);
    setProformaClientName(''); setProformaClientRuc(''); setProformaNotes('');
    setProformaItems([{ productId: '', quantity: 1 }]); setProformaView('list');
  };

  const handleUpdateProformaStatus = (id: string, status: Proforma['status']) => {
    const updated = proformas.map(p => p.id === id ? { ...p, status } : p);
    setProformas(updated); saveProformasToStorage(updated);
  };

  const handleConvertProformaToInvoice = (p: Proforma) => {
    setNewClientName(p.clientName);
    const items = p.items.map(i => ({ productId: i.productId, quantity: i.quantity }));
    setInvoiceItems(items.length > 0 ? items : [{ productId: '', quantity: 1 }]);
    handleUpdateProformaStatus(p.id, 'CONVERTIDA');
    setActiveTab('ventas'); setVentasSubTab('facturas');
  };

  const handleDeleteProforma = (id: string) => {
    if (!confirm('Eliminar esta proforma?')) return;
    const updated = proformas.filter(p => p.id !== id);
    setProformas(updated); saveProformasToStorage(updated);
  };

  // -- Handlers: Payroll (Nomina) --------------------------------------------
  const IESS_EMPLOYEE_RATE = 0.0945;
  const IESS_EMPLOYER_RATE = 0.1115;

  const payrollCalc = React.useMemo(() => {
    const gross = payrollSalary + payrollBonus + payrollExtras;
    const iessEmployee = Number((gross * IESS_EMPLOYEE_RATE).toFixed(2));
    const iessEmployer = Number((gross * IESS_EMPLOYER_RATE).toFixed(2));
    const net = Number((gross - iessEmployee - payrollOtherDeductions).toFixed(2));
    return { gross, iessEmployee, iessEmployer, net };
  }, [payrollSalary, payrollBonus, payrollExtras, payrollOtherDeductions]);

  const handleGeneratePayroll = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(em => em.id === payrollEmployeeId);
    const newRole = {
      id: crypto.randomUUID(), employeeId: payrollEmployeeId,
      employeeName: emp?.name || 'Empleado', month: payrollMonth,
      salary: payrollSalary, bonus: payrollBonus, extras: payrollExtras,
      gross: payrollCalc.gross, iessEmployee: payrollCalc.iessEmployee,
      iessEmployer: payrollCalc.iessEmployer, otherDeductions: payrollOtherDeductions,
      net: payrollCalc.net, createdAt: new Date().toISOString(),
    };
    const updated = [...payrollRoles, newRole];
    setPayrollRoles(updated); localStorage.setItem('aura_payroll', JSON.stringify(updated));
    alert('Rol de pago generado para ' + (emp?.name || 'Empleado') + ' - ' + payrollMonth);
  };

  const handleExportPayrollCSV = () => {
    if (payrollRoles.length === 0) { alert('No hay roles de pago generados.'); return; }
    const headers = 'Empleado,Periodo,Salario Base,Bonos,Horas Extra,Ingreso Bruto,IESS Empleado (9.45%),Patronal (11.15%),Otras Deducciones,Salario Neto';
    const rows = payrollRoles.map(r =>
      '"' + r.employeeName + '","' + r.month + '",' + r.salary + ',' + r.bonus + ',' + r.extras + ',' +
      r.gross + ',' + r.iessEmployee + ',' + r.iessEmployer + ',' + r.otherDeductions + ',' + r.net
    ).join('\n');
    const csv = headers + '\n' + rows;
    const el = document.createElement('a');
    el.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    el.download = 'nomina_' + payrollMonth + '.csv';
    document.body.appendChild(el); el.click(); document.body.removeChild(el);
  };

  // -- Handlers: Bank Accounts -----------------------------------------------
  const saveBanksToStorage = (accounts: BankAccount[], movements: BankMovement[]) => {
    localStorage.setItem('aura_banks', JSON.stringify(accounts));
    localStorage.setItem('aura_bank_movements', JSON.stringify(movements));
  };

  const handleCreateBankAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const newAcc = {
      id: crypto.randomUUID(), bankName, accountType: bankType,
      accountNumber: bankNumber, balance: bankInitialBalance,
      currency: 'USD', createdAt: new Date().toISOString(),
    };
    const updatedAccounts = [...bankAccounts, newAcc];
    setBankAccounts(updatedAccounts); saveBanksToStorage(updatedAccounts, bankMovements);
    setBankName(''); setBankNumber(''); setBankInitialBalance(0); setBankView('list');
  };

  const handleDeleteBankAccount = (id: string) => {
    if (!confirm('Eliminar esta cuenta bancaria?')) return;
    const updatedAccounts = bankAccounts.filter(a => a.id !== id);
    const updatedMov = bankMovements.filter(m => m.accountId !== id);
    setBankAccounts(updatedAccounts); setBankMovements(updatedMov);
    saveBanksToStorage(updatedAccounts, updatedMov);
    if (selectedBankAccountId === id) setSelectedBankAccountId('');
  };

  const handleCreateBankMovement = (e: React.FormEvent) => {
    e.preventDefault();
    const sign = movType === 'DEPOSITO' ? 1 : -1;
    const newMov = {
      id: crypto.randomUUID(), accountId: selectedBankAccountId,
      type: movType, amount: movAmount, description: movDesc, date: movDate,
    };
    const updatedMov = [...bankMovements, newMov];
    const updatedAccounts = bankAccounts.map(a =>
      a.id === selectedBankAccountId
        ? { ...a, balance: Number((a.balance + sign * movAmount).toFixed(2)) }
        : a
    );
    setBankMovements(updatedMov); setBankAccounts(updatedAccounts);
    saveBanksToStorage(updatedAccounts, updatedMov);
    setMovAmount(0); setMovDesc('');
  };

  // Actions - Assets
  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/assets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newAssetName,
          value: newAssetValue,
          residualValue: newAssetResidual,
          yearsOfLife: newAssetYears,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        alert(errData.message || 'Error al crear activo');
        return;
      }

      setNewAssetName('');
      setNewAssetValue(0);
      setNewAssetResidual(0);
      fetchAssets();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRunDepreciation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const period = new Date().toISOString().slice(0, 7); // AAAA-MM
      const res = await fetch(`${API_BASE}/assets/depreciate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ period }),
      });
      if (res.ok) {
        alert('DepreciaciÃƒÂ³n de fin de mes calculada y contabilizada exitosamente en el Libro Diario.');
        fetchDepreciations();
      } else {
        const errData = await res.json();
        alert(errData.message || 'Error al calcular depreciaciÃƒÂ³n');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportReconciliation = () => {
    if (!recoSummary) {
      alert('No hay datos de conciliaciÃƒÂ³n disponibles para exportar.');
      return;
    }
    
    let csv = 'Tipo;Nombre;Monto Total;Cobrado/Pagado;Retenido;Saldo;Estado\n';
    
    recoSummary.invoices?.forEach((i: any) => {
      csv += `Venta;${i.clientName};${i.amount};${i.cashPaid};${i.withheld};${i.balance};${i.status}\n`;
    });
    
    recoSummary.purchases?.forEach((p: any) => {
      csv += `Compra;${p.providerName};${p.amount};${p.cashPaid};${p.withheld};${p.balance};${p.status}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `conciliacion_caja_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Data processors for dashboard
  // Kardex recent logs
  const recentTransactions: { product: string; sku: string; tx: KardexTransaction }[] = [];
  products.forEach((p) => {
    if (p.transactions) {
      p.transactions.forEach((t) => {
        recentTransactions.push({ product: p.name, sku: p.sku, tx: t });
      });
    }
  });
  recentTransactions.sort((a, b) => new Date(b.tx.date).getTime() - new Date(a.tx.date).getTime());

  // Filter products by IVA & Category & Search text
  const filteredProducts = products.filter(p => {
    if (ivaFilter === 'with' && !p.hasIva) return false;
    if (ivaFilter === 'without' && p.hasIva) return false;
    if (categoryFilter === 'none') {
      if (p.categoryId) return false;
    } else if (categoryFilter !== 'all') {
      if (p.categoryId !== categoryFilter) return false;
    }
    if (productSearch.trim()) {
      const q = productSearch.toLowerCase();
      if (!p.sku.toLowerCase().includes(q) && !p.name.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  // Filter invoices by search text
  const filteredInvoices = invoices.filter(inv => {
    if (invoiceSearch.trim()) {
      const q = invoiceSearch.toLowerCase();
      if (!inv.clientName.toLowerCase().includes(q) && !inv.claveAcceso.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  // Ventas metrics
  const totalSales = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalIvaCollected = invoices.reduce((sum, inv) => sum + inv.iva, 0);
  const netSales = totalSales - totalIvaCollected;
  const avgTicket = invoices.length > 0 ? totalSales / invoices.length : 0;

  // Group by client
  const clientSummary: Record<string, { name: string; total: number; count: number; unpaid: number }> = {};
  invoices.forEach(inv => {
    if (!clientSummary[inv.clientName]) {
      clientSummary[inv.clientName] = { name: inv.clientName, total: 0, count: 0, unpaid: 0 };
    }
    clientSummary[inv.clientName].total += inv.amount;
    clientSummary[inv.clientName].count += 1;

    // Cross check with reconciliation summary if available to find remaining balances
    const match = recoSummary?.invoices?.find(i => i.claveAcceso === inv.claveAcceso);
    if (match) {
      clientSummary[inv.clientName].unpaid += match.balance;
    } else {
      clientSummary[inv.clientName].unpaid += inv.amount;
    }
  });
  const clientList = Object.values(clientSummary).sort((a, b) => b.total - a.total);

  // Accounting variables debits/credits sum check
  const totalDebits = trialBalance.reduce((sum, b) => sum + b.debit, 0);
  const totalCredits = trialBalance.reduce((sum, b) => sum + b.credit, 0);

  // SRI Form 104 simulation
  // Sales
  const salesWithIva = invoices.filter(i => i.iva > 0).reduce((sum, i) => sum + i.subtotal, 0);
  const salesWithoutIva = invoices.filter(i => i.iva === 0).reduce((sum, i) => sum + i.subtotal, 0);
  const salesTaxCollected = invoices.reduce((sum, i) => sum + i.iva, 0);
  // Purchases
  const purchasesWithIva = purchases.filter(p => p.iva > 0).reduce((sum, p) => sum + p.subtotal, 0);
  const purchasesWithoutIva = purchases.filter(p => p.iva === 0).reduce((sum, p) => sum + p.subtotal, 0);
  const purchasesTaxPaid = purchases.reduce((sum, p) => sum + p.iva, 0);

  const sriVatPayable = salesTaxCollected - purchasesTaxPaid;

  // Mock ATS structure representation
  const atsJson = JSON.stringify({
    AnexoTransaccional: {
      anio: new Date().getFullYear(),
      mes: String(new Date().getMonth() + 1).padStart(2, '0'),
      RUC: user?.ruc || '1792455894001',
      RazonSocial: user?.name || 'EMPRESA CONTABLE',
      compras: purchases.map(p => ({
        codSustento: '01',
        tpIdProv: '01',
        idProv: p.providerRuc,
        tipoComprobante: '01',
        fechaRegistro: p.date.slice(0, 10),
        establecimiento: p.invoiceNum.split('-')[0] || '001',
        puntoEmision: p.invoiceNum.split('-')[1] || '001',
        secuencial: p.invoiceNum.split('-')[2] || '000100',
        fechaEmision: p.date.slice(0, 10),
        autorizacion: p.claveAcceso,
        baseNoGravIva: 0.00,
        baseImponible: p.iva > 0 ? p.subtotal : 0.00,
        baseImpGrav: p.iva > 0 ? 0.00 : p.subtotal,
        montoIva: p.iva,
      })),
      ventas: invoices.map(i => ({
        tpIdCliente: '04',
        idCliente: '1790012345001',
        tipoComprobante: '01',
        numeroComprobantes: 1,
        baseNoGravIva: 0.00,
        baseImponible: i.iva > 0 ? i.subtotal : 0.00,
        baseImpGrav: i.iva > 0 ? 0.00 : i.subtotal,
        montoIva: i.iva,
        valorRetIva: recoSummary?.withholdings?.find(w => w.invoiceId === i.id)?.amountIva || 0.00,
        valorRetRenta: recoSummary?.withholdings?.find(w => w.invoiceId === i.id)?.amountRenta || 0.00,
      }))
    }
  }, null, 2);

  const renderAccordion = (
    key: string,
    icon: string,
    label: string,
    _isExpanded: boolean,
    _setIsExpanded: (expanded: boolean) => void,
    subItems: { label: string; icon: string; onClick: () => void; isActive?: boolean }[]
  ) => {
    const isAnyActive = subItems.some(item => item.isActive);
    const isFlyoutOpen = activeFlyout === key;

    return (
      <div 
        className="admin-menu-accordion" 
        style={{ position: 'relative' }}
        onMouseEnter={() => setActiveFlyout(key)}
        onMouseLeave={() => setActiveFlyout(null)}
      >
        <button
          type="button"
          className={`tab-btn ${isAnyActive ? 'active' : ''}`}
          onClick={() => {
            setActiveFlyout(isFlyoutOpen ? null : key);
          }}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            background: isAnyActive ? 'rgba(33, 57, 147, 0.08)' : 'transparent',
            border: isAnyActive ? '1px solid rgba(33, 57, 147, 0.15)' : 'none',
            cursor: 'pointer',
            padding: '10px 15px',
            color: isAnyActive ? '#213993' : '#0f172a',
            fontSize: '11px',
            textAlign: 'left',
            borderRadius: '10px',
            fontWeight: isAnyActive ? '700' : '600',
            transition: 'all 0.2s ease',
            height: '46px',
            boxSizing: 'border-box'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="icon" style={{ fontSize: '1.0125rem' }}>{icon}</span>
            {!isSidebarCollapsed && <span>{label}</span>}
          </div>
          {!isSidebarCollapsed && (
            <span style={{ fontSize: '9px', color: isAnyActive ? '#213993' : 'var(--text-muted)', transform: 'scale(0.85)' }}>Ã¢â€“Âº</span>
          )}
        </button>

        {isFlyoutOpen && (
          <div 
            className="glass-panel flyout-submenu" 
            style={{
              position: 'absolute',
              left: isSidebarCollapsed ? '62px' : '224px',
              top: '0',
              width: '230px',
              background: '#ffffff',
              border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: '12px',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
              padding: '8px',
              zIndex: 99999,
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}
          >
            {subItems.map((item, idx) => (
              <button
                key={idx}
                type="button"
                className={`sub-tab-btn ${item.isActive ? 'active' : ''}`}
                onClick={() => {
                  item.onClick();
                  setActiveFlyout(null);
                }}
                style={{
                  background: item.isActive ? 'rgba(33, 57, 147, 0.08)' : 'transparent',
                  border: 'none',
                  color: item.isActive ? '#213993' : '#334155',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '10px',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: item.isActive ? '700' : '500',
                  width: '100%',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  if (!item.isActive) {
                    e.currentTarget.style.background = '#f1f5f9';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!item.isActive) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <span style={{ fontSize: '0.9125rem' }}>{item.icon}</span> 
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderRoadmapAccordion = () => {
    const roadmapData = [
      {
        id: 'facturacion', icon: 'Ã°Å¸â€ºâ€™', label: 'FacturaciÃƒÂ³n',
        items: [
          'Correo con datos (cliente, productos, total)',
          'Ver detalles de la factura',
          'Restricciones de cambios',
          'LÃƒÂ­mite consumidor final ($50)'
        ]
      },
      {
        id: 'productos', icon: 'Ã°Å¸â€œÂ¦', label: 'Productos e Inventario',
        items: [
          'Tipo de productos (Gasto / Venta)',
          'MÃƒÂ³dulo de escÃƒÂ¡ner cÃƒÂ³digo de barras'
        ]
      },
      {
        id: 'configuracion', icon: 'Ã¢Å¡â„¢Ã¯Â¸Â', label: 'ConfiguraciÃƒÂ³n y Empresas',
        items: [
          'Panel de servicio para configurar',
          'Tipos de empresa (Comercial, Servicios, ProducciÃƒÂ³n, Transporte)',
          'Sincronizaciones automÃƒÂ¡ticas programadas'
        ]
      },
      {
        id: 'activos', icon: 'Ã°Å¸ÂÂ ', label: 'Activos Fijos',
        items: [
          'Tipo de activo fijo por tipo de producto'
        ]
      },
      {
        id: 'sistema', icon: 'Ã°Å¸Å¡â‚¬', label: 'Sistema y Mejoras',
        items: [
          'Buscadores mejorados',
          'Funciones mejoradas asÃƒÂ­ncronas (async)',
          'ExportaciÃƒÂ³n de datos opcional (conciliaciones)'
        ]
      }
    ];

    const isFlyoutOpen = activeFlyout === 'roadmap';

    if (isSidebarCollapsed) {
      return (
        <button
          type="button"
          className="tab-btn"
          onClick={() => {
            setActiveFlyout(isFlyoutOpen ? null : 'roadmap');
          }}
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '52px',
            height: '52px',
            padding: '0',
            margin: '6px auto',
            borderRadius: '14px',
            background: 'rgba(255, 255, 255, 0.8)',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.04)',
            cursor: 'pointer',
            transition: 'all 0.25s ease'
          }}
          title="Nuevas Funciones"
        >
          <span className="icon" style={{ fontSize: '1.3125rem', margin: 0 }}>Ã°Å¸Å½Â¯</span>
        </button>
      );
    }

    return (
      <div 
        className="admin-menu-accordion" 
        style={{ position: 'relative' }}
        onMouseEnter={() => setActiveFlyout('roadmap')}
        onMouseLeave={() => setActiveFlyout(null)}
      >
        <button
          type="button"
          onClick={() => {
            setActiveFlyout(isFlyoutOpen ? null : 'roadmap');
          }}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '10px 15px',
            color: '#0f172a',
            fontSize: '11px',
            textAlign: 'left',
            borderRadius: '10px',
            fontWeight: '600',
            transition: 'all 0.2s ease',
            height: '46px',
            boxSizing: 'border-box'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="icon" style={{ fontSize: '1.0125rem' }}>Ã°Å¸Å½Â¯</span>
            {!isSidebarCollapsed && <span>Nuevas Funciones</span>}
          </div>
          {!isSidebarCollapsed && (
            <span style={{ fontSize: '9px', color: 'var(--text-muted)', transform: 'scale(0.85)' }}>Ã¢â€“Âº</span>
          )}
        </button>

        {isFlyoutOpen && (
          <div 
            className="glass-panel flyout-submenu" 
            style={{
              position: 'absolute',
              left: isSidebarCollapsed ? '62px' : '224px',
              top: '0',
              width: '280px',
              background: '#ffffff',
              border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: '12px',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
              padding: '12px',
              zIndex: 99999,
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              maxHeight: '380px',
              overflowY: 'auto'
            }}
          >
            <h4 style={{ margin: '0 0 6px 0', fontSize: '10px', fontWeight: '700', color: '#000', borderBottom: '1px solid rgba(0,0,0,0.08)', paddingBottom: '6px' }}>
              Nuevas Funciones
            </h4>
            {roadmapData.map(group => (
              <div key={group.id} style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: '8px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>{group.icon}</span> {group.label}
                </div>
                <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '8.5px', color: '#334155', listStyleType: 'disc' }}>
                  {group.items.map((item, idx) => (
                    <li key={idx} style={{ marginBottom: '2px' }}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={viewMode === 'app' && user ? `app-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}` : ''} style={viewMode === 'app' && user ? {} : { width: '100%' }}>
      {viewMode === 'app' && user ? (
        <>
          {/* Sidebar Nav */}
          <aside className={"sidebar glass-panel " + (isMobileMenuOpen ? "mobile-open" : "")}>
            <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', justifyContent: isSidebarCollapsed ? 'center' : 'space-between', width: '100%', marginBottom: '1.5rem' }}>
              {!isSidebarCollapsed && (
                <h1 className="brand-title" style={{ fontSize: '1.4125rem', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', fontFamily: 'var(--font-sans)', letterSpacing: '-0.5px' }}>
                  <span style={{ color: '#213993' }}>Aura</span>
                  <span style={{ color: '#ED3833' }}>Contable</span>
                </h1>
              )}
              <button className="sidebar-toggle" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} style={{ flexShrink: 0 }}>
                {isSidebarCollapsed ? 'Ã¢â‚¬Âº' : 'Ã¢â‚¬Â¹'}
              </button>
            </div>

            <nav className="sidebar-nav" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 180px)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {renderRoadmapAccordion()}
              {renderAccordion('admin', 'Ã¢Å¡â„¢Ã¯Â¸Â', 'AdministraciÃƒÂ³n', isAdministrationExpanded, setIsAdministrationExpanded, [
                { label: 'GestiÃƒÂ³n Empresas', icon: 'Ã°Å¸ÂÂ¢', onClick: () => { setActiveTab('admin'); setAdminSubTab('empresas'); }, isActive: activeTab === 'admin' && adminSubTab === 'empresas' },
                { label: 'Administrador Sucursales', icon: 'Ã°Å¸ÂÂª', onClick: () => { setActiveTab('admin'); setAdminSubTab('sucursales'); }, isActive: activeTab === 'admin' && adminSubTab === 'sucursales' },
                { label: 'Integraciones', icon: 'Ã°Å¸â€Å’', onClick: () => { setActiveTab('admin'); setAdminSubTab('integraciones'); }, isActive: activeTab === 'admin' && adminSubTab === 'integraciones' },
                { label: 'Actividades Sistema', icon: 'Ã¢Å¡â„¢Ã¯Â¸Â', onClick: () => { setActiveTab('admin'); setAdminSubTab('actividades'); }, isActive: activeTab === 'admin' && adminSubTab === 'actividades' }
              ])}

              {renderAccordion('ventas', 'Ã°Å¸â€ºâ€™', 'Ventas', isVentasExpanded, setIsVentasExpanded, [
                { label: 'FacturaciÃƒÂ³n', icon: 'Ã°Å¸â€ºâ€™', onClick: () => { setActiveTab('ventas'); setVentasSubTab('facturas'); }, isActive: activeTab === 'ventas' && ventasSubTab === 'facturas' },
                { label: 'Proformas', icon: 'Ã°Å¸â€œÆ’', onClick: () => { setActiveTab('ventas'); setVentasSubTab('proformas'); } },
                { label: 'Pedidos', icon: 'Ã°Å¸â€œÂ¦', onClick: () => setSimulatedModule('Pedidos de Clientes') },
                { label: 'Entregas por Facturar', icon: 'Ã°Å¸Å¡Å¡', onClick: () => setSimulatedModule('Entregas por Facturar') },
                { label: 'Entregas Parciales', icon: 'Ã°Å¸Å¡â€º', onClick: () => setSimulatedModule('Entregas Parciales') },
                { label: 'Autorizar Documentos', icon: 'Ã¢Å“â€°Ã¯Â¸Â', onClick: () => setSimulatedModule('Autorizar Documentos SRI') },
                { label: 'Clientes', icon: 'Ã°Å¸â„¢â€š', onClick: () => { setActiveTab('ventas'); setVentasSubTab('clientes'); }, isActive: activeTab === 'ventas' && ventasSubTab === 'clientes' },
                { label: 'Prospecto', icon: 'Ã°Å¸Å½Â¯', onClick: () => setSimulatedModule('Prospectos y Leads') },
                { label: 'Marketing Whatsapp', icon: 'Ã°Å¸â€™Â¬', onClick: () => setSimulatedModule('Marketing Whatsapp') },
                { label: 'Grupo Clientes', icon: 'Ã°Å¸â€˜Â¥', onClick: () => setSimulatedModule('Grupos de Clientes') },
                { label: 'Zonas Clientes', icon: 'Ã°Å¸â€œÅ’', onClick: () => setSimulatedModule('Zonas de Cobertura') },
                { label: 'Rutas Clientes', icon: 'Ã°Å¸â€œÂ', onClick: () => setSimulatedModule('Rutas de Despacho') },
                { label: 'Secuencias', icon: 'Ã°Å¸â€Â¢', onClick: () => setSimulatedModule('Secuencias de FacturaciÃƒÂ³n') },
                { label: 'Agentes Ventas', icon: 'Ã°Å¸â€˜Â¤', onClick: () => setSimulatedModule('Vendedores y Comisiones') },
                { label: 'Tarjetas de CrÃƒÂ©dito', icon: 'Ã°Å¸â€™Â³', onClick: () => setSimulatedModule('Tarjetas de CrÃƒÂ©dito y POS') },
                { label: 'FacturaciÃƒÂ³n por Lotes', icon: 'Ã°Å¸â€ºâ€™', onClick: () => setSimulatedModule('FacturaciÃƒÂ³n Masiva') },
                { label: 'Facturas Servicios', icon: 'Ã°Å¸â€œâ€ž', onClick: () => setSimulatedModule('Facturas de Servicios') },
                { label: 'Localizar Vendedores', icon: 'Ã°Å¸â€”ÂºÃ¯Â¸Â', onClick: () => setSimulatedModule('LocalizaciÃƒÂ³n GPS Vendedores') },
                { label: 'Despacho', icon: 'Ã°Å¸â€œÂ¦', onClick: () => setSimulatedModule('MÃƒÂ³dulo de Despacho') },
                { label: 'RecepciÃƒÂ³n', icon: 'Ã°Å¸â€œÂ¥', onClick: () => setSimulatedModule('MÃƒÂ³dulo de RecepciÃƒÂ³n') }
              ])}

              {renderAccordion('compras', 'Ã°Å¸Å¡Å¡', 'Compras', isComprasExpanded, setIsComprasExpanded, [
                { label: 'Orden Compra', icon: 'Ã°Å¸â€œâ€¹', onClick: () => setSimulatedModule('Ãƒâ€œrdenes de Compra') },
                { label: 'RecepciÃƒÂ³n Compra', icon: 'Ã°Å¸Å¡Å¡', onClick: () => setSimulatedModule('RecepciÃƒÂ³n de MercaderÃƒÂ­as') },
                { label: 'Compras', icon: 'Ã°Å¸â€ºâ€™', onClick: () => setActiveTab('proveedores'), isActive: activeTab === 'proveedores' },
                { label: 'Proveedores', icon: 'Ã°Å¸â€˜Â¤', onClick: () => setSimulatedModule('Directorio de Proveedores') },
                { label: 'Grupo Proveedores', icon: 'Ã°Å¸â€˜Â¥', onClick: () => setSimulatedModule('Grupos de Proveedores') },
                { label: 'Tarifas', icon: 'Ã°Å¸â€™Âµ', onClick: () => setSimulatedModule('Tarifas de Precios') },
                { label: 'Productos', icon: 'Ã°Å¸â€œÂ¦', onClick: () => setActiveTab('kardex'), isActive: activeTab === 'kardex' },
                { label: 'Servicios', icon: 'Ã¢Å¡â„¢Ã¯Â¸Â', onClick: () => setSimulatedModule('CatÃƒÂ¡logo de Servicios') },
                { label: 'Gastos', icon: 'Ã°Å¸â€œâ€°', onClick: () => setSimulatedModule('Registro de Gastos') },
                { label: 'Kardex', icon: 'Ã°Å¸â€œÅ ', onClick: () => setActiveTab('kardex'), isActive: activeTab === 'kardex' },
                { label: 'Actualizar Existencias', icon: 'Ã°Å¸â€â€ž', onClick: () => setSimulatedModule('ActualizaciÃƒÂ³n de Existencias') },
                { label: 'AnÃƒÂ¡lisis de Compra', icon: 'Ã°Å¸â€œË†', onClick: () => setSimulatedModule('AnÃƒÂ¡lisis de Compras') },
                { label: 'LÃƒÂ­nea Productos', icon: 'Ã°Å¸â€œÂ¦', onClick: () => setSimulatedModule('LÃƒÂ­neas de Productos') },
                { label: 'Productos Categorias', icon: 'Ã°Å¸â€œÂ', onClick: () => setSimulatedModule('CategorÃƒÂ­as de Productos') },
                { label: 'Sub CategorÃƒÂ­as', icon: 'Ã°Å¸â€œâ€š', onClick: () => setSimulatedModule('Sub CategorÃƒÂ­as') },
                { label: 'Sub Grupos', icon: 'Ã°Å¸â€˜Â¥', onClick: () => setSimulatedModule('Sub Grupos') },
                { label: 'Almacenes', icon: 'Ã°Å¸ÂÂ¬', onClick: () => setSimulatedModule('Bodegas y Almacenes') },
                { label: 'Kits', icon: 'Ã°Å¸â€œÂ¦', onClick: () => setSimulatedModule('Kits de Productos') },
                { label: 'Medidas', icon: 'Ã°Å¸â€œÂ', onClick: () => setSimulatedModule('Unidades de Medida') },
                { label: 'Movimientos Inventario', icon: 'Ã°Å¸â€™Â³', onClick: () => setSimulatedModule('Movimientos de Bodega') },
                { label: 'Toma FÃƒÂ­sica', icon: 'Ã°Å¸â€œÂ', onClick: () => setSimulatedModule('Inventario FÃƒÂ­sico') },
                { label: 'Ingresos', icon: 'Ã¢Å¾â€¢', onClick: () => setSimulatedModule('Ingresos de Bodega') },
                { label: 'Salidas', icon: 'Ã¢Å¾â€“', onClick: () => setSimulatedModule('Salidas de Bodega') },
                { label: 'Aprobar Transferencias', icon: 'Ã°Å¸â€œâ€¹', onClick: () => setSimulatedModule('AprobaciÃƒÂ³n de Transferencias') },
                { label: 'Transferencias de Almacenes', icon: 'Ã°Å¸â€â€ž', onClick: () => setSimulatedModule('Transferencias entre Bodegas') }
              ])}

              {renderAccordion('tesoreria', 'Ã°Å¸â€™Âµ', 'TesorerÃƒÂ­a', isTesoreriaExpanded, setIsTesoreriaExpanded, [
                { label: 'Cajas', icon: 'Ã°Å¸â€˜â€º', onClick: () => setActiveTab('caja'), isActive: activeTab === 'caja' },
                { label: 'Movimientos de Caja', icon: 'Ã°Å¸â€™Âµ', onClick: () => setSimulatedModule('Movimientos de Caja') },
                { label: 'DepÃƒÂ³sitos', icon: 'Ã°Å¸Ââ€ºÃ¯Â¸Â', onClick: () => setSimulatedModule('DepÃƒÂ³sitos') },
                { label: 'LiquidaciÃƒÂ³n Vouchers', icon: 'Ã°Å¸â€™Â³', onClick: () => setSimulatedModule('LiquidaciÃƒÂ³n Vouchers') },
                { label: 'Bancos', icon: 'Ã°Å¸Ââ€ºÃ¯Â¸Â', onClick: () => { setActiveTab('caja'); setBankView('list'); setSimulatedModule(null); } },
                { label: 'Movimientos de Bancos', icon: 'Ã°Å¸â€™Â³', onClick: () => setSimulatedModule('Movimientos de Bancos') },
                { label: 'Cierre Caja', icon: 'Ã°Å¸â€â€™', onClick: () => setSimulatedModule('Cierre Caja') }
              ])}

              {renderAccordion('cartera', 'Ã°Å¸â€™Â¼', 'Cartera', isCarteraExpanded, setIsCarteraExpanded, [
                { label: 'Control de Cobros', icon: 'Ã°Å¸â€œâ€˜', onClick: () => setSimulatedModule('Control de Cobros') },
                { label: 'AntigÃƒÂ¼edad de Cartera', icon: 'Ã°Å¸â€œÅ ', onClick: () => setSimulatedModule('AntigÃƒÂ¼edad de Cartera') }
              ])}

              {renderAccordion('pagos', 'Ã°Å¸â€˜â€º', 'Pagos', isPagosExpanded, setIsPagosExpanded, [
                { label: 'Pago a Proveedores', icon: 'Ã°Å¸â€™Â¸', onClick: () => setSimulatedModule('Pago a Proveedores') },
                { label: 'Egresos de Caja', icon: 'Ã°Å¸Â§Â¾', onClick: () => setSimulatedModule('Egresos de Caja') }
              ])}

              {renderAccordion('nomina', 'Ã°Å¸â€˜Â¥', 'NÃƒÂ³mina', isNominaExpanded, setIsNominaExpanded, [
                { label: 'Empleados', icon: 'Ã°Å¸â€˜Â¥', onClick: () => { setActiveTab('ventas'); setVentasSubTab('empleados'); }, isActive: activeTab === 'ventas' && ventasSubTab === 'empleados' },
                { label: 'Roles de Pago', icon: 'Ã°Å¸â€œâ€ž', onClick: () => { setActiveTab('ventas'); setVentasSubTab('nomina'); void fetchEmployees(); } }
              ])}

              {renderAccordion('activos', 'Ã°Å¸ÂÂ ', 'Activos', isActivosExpanded, setIsActivosExpanded, [
                { label: 'DepreciaciÃƒÂ³n Activos', icon: 'Ã°Å¸â€œâ€°', onClick: () => setActiveTab('assets'), isActive: activeTab === 'assets' },
                { label: 'Registro de Activos', icon: 'Ã°Å¸â€œâ€¹', onClick: () => setActiveTab('assets'), isActive: activeTab === 'assets' }
              ])}

              {renderAccordion('contabilidad', 'Ã¢Å¡â€“Ã¯Â¸Â', 'Contabilidad', isContabilidadExpanded, setIsContabilidadExpanded, [
                { label: 'Libro Diario', icon: 'Ã¢Å¡â€“Ã¯Â¸Â', onClick: () => setActiveTab('contabilidad'), isActive: activeTab === 'contabilidad' },
                { label: 'Balance de ComprobaciÃƒÂ³n', icon: 'Ã°Å¸â€œÅ ', onClick: () => setActiveTab('contabilidad'), isActive: activeTab === 'contabilidad' },
                { label: 'Asiento Manual', icon: 'Ã°Å¸â€œÂ', onClick: () => setActiveTab('contabilidad'), isActive: activeTab === 'contabilidad' }
              ])}

              {renderAccordion('produccion', 'Ã°Å¸ÂÂ­', 'ProducciÃƒÂ³n', isProduccionExpanded, setIsProduccionExpanded, [
                { label: 'Ãƒâ€œrdenes de FabricaciÃƒÂ³n', icon: 'Ã°Å¸ÂÂ­', onClick: () => setSimulatedModule('Ãƒâ€œrdenes de FabricaciÃƒÂ³n') },
                { label: 'FÃƒÂ³rmulas y Recetas', icon: 'Ã°Å¸â€œâ€¹', onClick: () => setSimulatedModule('FÃƒÂ³rmulas y Recetas') }
              ])}

              {renderAccordion('garantias', 'Ã°Å¸â€Â§', 'GarantÃƒÂ­as', isGarantiasExpanded, setIsGarantiasExpanded, [
                { label: 'Orden de Servicio', icon: 'Ã°Å¸â€Â§', onClick: () => setSimulatedModule('Orden de Servicio') },
                { label: 'Control de Equipos', icon: 'Ã°Å¸â€œÂ¦', onClick: () => setSimulatedModule('Control de Equipos') }
              ])}

              {renderAccordion('talleres', 'Ã°Å¸Å¡â€”', 'Talleres VehÃƒÂ­culos', isTalleresExpanded, setIsTalleresExpanded, [
                { label: 'Orden de Trabajo', icon: 'Ã°Å¸Å¡â€”', onClick: () => setSimulatedModule('Orden de Trabajo') },
                { label: 'Historial de VehÃƒÂ­culos', icon: 'Ã°Å¸â€ºÂ Ã¯Â¸Â', onClick: () => setSimulatedModule('Historial de VehÃƒÂ­culos') }
              ])}

              {renderAccordion('restaurante', 'Ã°Å¸ÂÂ½Ã¯Â¸Â', 'Restaurante', isRestauranteExpanded, setIsRestauranteExpanded, [
                { label: 'Control de Mesas', icon: 'Ã°Å¸ÂÂ½Ã¯Â¸Â', onClick: () => setSimulatedModule('Control de Mesas') },
                { label: 'MenÃƒÂº y CategorÃƒÂ­as', icon: 'Ã°Å¸Ââ€¢', onClick: () => setSimulatedModule('MenÃƒÂº y CategorÃƒÂ­as') }
              ])}

              {renderAccordion('informes', 'Ã°Å¸â€œË†', 'Informes', isInformesExpanded, setIsInformesExpanded, [
                { label: 'SRI Reporte Form 104', icon: 'Ã°Å¸Ââ€ºÃ¯Â¸Â', onClick: () => { setActiveTab('sri'); setSriSubTab('formulario'); }, isActive: activeTab === 'sri' && sriSubTab === 'formulario' },
                { label: 'Reportes ATS', icon: 'Ã°Å¸â€œâ€š', onClick: () => { setActiveTab('sri'); setSriSubTab('ats'); }, isActive: activeTab === 'sri' && sriSubTab === 'ats' }
              ])}
            </nav>

            <div className="sidebar-footer">
              <div className="user-profile-badge" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="user-avatar" style={{ fontSize: '1.3125rem' }}>Ã°Å¸ÂÂ¢</span>
                {!isSidebarCollapsed && (
                  <div className="user-info" style={{ display: 'flex', flexDirection: 'column', fontSize: '9px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <strong style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '110px' }}>{user.name}</strong>
                      <button
                        onClick={() => {
                          setActiveTab('sri');
                          setSriSubTab('config');
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          padding: '2px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'transform 0.2s ease',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'rotate(30deg) scale(1.15)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'rotate(0deg) scale(1)'}
                        title="Configurar SOAP SRI"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <defs>
                            <linearGradient id="gearGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#d946ef" />
                              <stop offset="50%" stopColor="#8b5cf6" />
                              <stop offset="100%" stopColor="#06b6d4" />
                            </linearGradient>
                          </defs>
                          <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41l-1.92-.01c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h1.92c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"
                            fill="url(#gearGradient)"
                          />
                        </svg>
                      </button>
                    </div>
                    <span style={{}}>RUC: {user.ruc}</span>
                  </div>
                )}
              </div>
              <button className="logout-btn" onClick={logout} style={{ fontSize: isSidebarCollapsed ? '0px' : '12px' }}>
                {isSidebarCollapsed ? 'Ã°Å¸Å¡Âª' : 'Cerrar SesiÃƒÂ³n'}
              </button>
            </div>
          </aside>
          {isMobileMenuOpen && (
            <div
              className="sidebar-backdrop"
              onClick={() => setIsMobileMenuOpen(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(4px)',
                zIndex: 95
              }}
            />
          )}

          {/* Main Content Area */}
          <div className="main-content">
            <header className="top-bar glass-panel animate-slideup">
              <button
                className="mobile-menu-toggle-btn"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '19px',
                  cursor: 'pointer',
                  display: 'none',
                  padding: '4px 8px',
                  marginRight: '8px'
                }}
              >
                ☰
              </button>
              <div className="top-bar-left" style={{ display: 'flex', alignItems: 'center', gap: '15px', height: '120px' }}>
                {isSidebarCollapsed && (
                  <button className="sidebar-toggle" onClick={() => setIsSidebarCollapsed(false)}>
                    Ã¢ËœÂ°
                  </button>
                )}
                <div>
                  <h2 style={{ fontSize: '1.2125rem', fontWeight: 'bold', margin: 0 }}>
                    {activeTab === 'kardex' ? 'Ã°Å¸â€œÂ¦ Inventario & KÃƒÂ¡rdex' :
                      activeTab === 'ventas' ? 'Ã°Å¸â€œË† Control de Ventas' :
                        activeTab === 'proveedores' ? 'Ã°Å¸Â¤Â GestiÃƒÂ³n de Proveedores' :
                          activeTab === 'caja' ? 'Ã°Å¸â€™Âµ Caja & ConciliaciÃƒÂ³n' :
                            activeTab === 'contabilidad' ? 'Ã¢Å¡â€“Ã¯Â¸Â Libro Diario Contable' :
                              activeTab === 'sri' ? 'Ã°Å¸Ââ€ºÃ¯Â¸Â Reportes SRI Form 104' : 'Ã°Å¸â€œâ€° DepreciaciÃƒÂ³n de Activos Fijos'}
                  </h2>
                  {activeEnvironment !== 'default' && (
                    <div style={{ fontSize: '8px', color: 'var(--cyan)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                      <span>{BUSINESS_THEMES[activeEnvironment]?.icon} {BUSINESS_THEMES[activeEnvironment]?.banner}</span>
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                {user?.businessTypes && user.businessTypes.length > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ fontSize: '8px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Entorno:</label>
                    <select
                      value={activeEnvironment}
                      onChange={(e) => handleSwitchEnvironment(e.target.value)}
                      style={{
                        background: 'rgb(255, 255, 255)',
                        border: '1px solid rgb(255, 255, 255)',
                        borderRadius: '6px',
                        color: 'var(--text-primary)',
                        fontSize: '9.5px',
                        padding: '4px 8px',
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                    >
                      {user.businessTypes.map(type => (
                        <option key={type} value={type} style={{ color: '#000' }}>
                          {BUSINESS_THEMES[type]?.name || type}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <span className="top-bar-text" style={{ fontSize: '9px', }}>Ecosistema AutÃƒÂ³nomo AuraContable</span>

                {/* Global Auto Sync Selector */}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginLeft: 'auto', marginRight: '10px' }}>
                  <span style={{ fontSize: '8px', color: 'var(--text-secondary)' }}>Ã°Å¸â€â€ž Auto-Sync:</span>
                  <select
                    value={autoSyncInterval}
                    onChange={(e) => setAutoSyncInterval(e.target.value as any)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '4px',
                      color: '#fff',
                      fontSize: '8px',
                      padding: '3px 6px',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  >
                    <option value="OFF" style={{ color: '#000' }}>Desactivada</option>
                    <option value="5" style={{ color: '#000' }}>Cada 5s</option>
                    <option value="15" style={{ color: '#000' }}>Cada 15s</option>
                    <option value="30" style={{ color: '#000' }}>Cada 30s</option>
                  </select>
                </div>

                <button
                  onClick={() => {
                    if (activeTab === 'kardex') {
                      void fetchProducts();
                      void fetchCategories();
                    } else if (activeTab === 'ventas') {
                      void fetchInvoices();
                    } else if (activeTab === 'proveedores') {
                      void fetchPurchases();
                      void fetchProducts();
                    } else if (activeTab === 'caja') {
                      void fetchReconciliationSummary();
                    } else if (activeTab === 'contabilidad') {
                      void fetchAccountingData();
                    } else if (activeTab === 'sri') {
                      void fetchInvoices();
                      void fetchPurchases();
                      void fetchReconciliationSummary();
                      void fetchSriConfig();
                    } else if (activeTab === 'assets') {
                      void fetchAssets();
                      void fetchDepreciations();
                    }
                  }}
                  className="btn-sm"
                  style={{
                    background: 'rgb(255, 255, 255)',
                    border: '1px solid rgb(255, 255, 255)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    padding: '6px 10px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: 'black',
                    fontWeight: 'bold',
                    transition: 'all 0.2s ease',
                  }}
                  title="Refrescar Datos"
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgb(255, 255, 255)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgb(255, 255, 255)'}
                >
                  <span style={{ fontSize: '11px' }}>Ã°Å¸â€â€ž</span> Refrescar
                </button>
              </div>
            </header>

            {/* Main Dashboard Layout */}
            <main className="tab-content">

              {/* Banner de aviso para crear primera empresa */}
              {companies.length === 0 && !isBannerClosed && (
                <div className="glass-panel" style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 20px',
                  margin: '0 0 1.5rem 0',
                  borderRadius: '12px',
                  border: '1px solid rgb(6, 182, 212)',
                  background: 'rgb(15, 23, 42)',
                  backdropFilter: 'none',
                  boxShadow: '0 8px 32px 0 rgb(6, 182, 212)',
                  position: 'relative',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img
                      src="/logo_auracontable.svg"
                      alt="Aura Logo"
                      style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                    />
                    <span
                      onClick={() => {
                        setActiveTab('admin');
                        setAdminSubTab('empresas');
                        setCompanyViewMode('form');
                        setCompanyFormAction('create');
                      }}
                      style={{
                        color: '#f8fafc',
                        textDecoration: 'underline',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '11px',
                      }}
                    >
                      Clic Para Crear una Empresa
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingRight: '20px' }}>
                    <button
                      onClick={() => {
                        setActiveTab('admin');
                        setAdminSubTab('empresas');
                        setCompanyViewMode('form');
                        setCompanyFormAction('create');
                      }}
                      style={{
                        background: 'var(--cyan)',
                        border: 'none',
                        color: 'white',
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '13px',
                        boxShadow: '0 0 10px rgb(6, 182, 212)',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => setIsBannerClosed(true)}
                    style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      background: '#ef4444',
                      border: 'none',
                      color: 'white',
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '7px',
                      fontWeight: 'bold',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#dc2626'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#ef4444'}
                  >
                    Ã¢Å“â€¢
                  </button>
                </div>
              )}

              {/* TAB: KARDEX */}
              {activeTab === 'kardex' && (
                <div className="fade-in">
                  {/* Dynamic Industry Metrics */}
                  {activeEnvironment !== 'default' && (
                    <div className="metrics-summary-grid" style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '1.5rem',
                      marginBottom: '1.5rem'
                    }}>
                      {(BUSINESS_THEMES[activeEnvironment]?.metrics || []).map((m, idx) => (
                        <div key={idx} className="card glass-panel" style={{
                          padding: '1.2rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '15px',
                          borderLeft: `4px solid ${BUSINESS_THEMES[activeEnvironment]?.accent || 'var(--cyan)'}`
                        }}>
                          <span style={{ fontSize: '21px' }}>{m.icon}</span>
                          <div>
                            <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{m.title}</span>
                            <strong style={{ fontSize: '13px', color: 'var(--text-primary)', marginTop: '2px', display: 'block' }}>{m.value}</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="dashboard-grid">
                    {/* Products Table */}
                    <div className="table-container glass-panel" style={{ padding: '1.5rem', margin: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '10px' }}>
                        <h3 style={{ margin: 0 }}>CatÃƒÂ¡logo de Productos e IVA</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <input
                            type="text"
                            placeholder="Ã°Å¸â€Â Buscar SKU o nombre..."
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '10px', width: '200px', background: 'rgba(255,255,255,0.05)', color: '#fff' }}
                          />
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button className={`btn-sm ${ivaFilter === 'all' ? 'status-aura' : ''}`} onClick={() => setIvaFilter('all')}>Todos</button>
                            <button className={`btn-sm ${ivaFilter === 'with' ? 'status-yes' : ''}`} onClick={() => setIvaFilter('with')}>Con IVA ({globalIvaRate}%)</button>
                            <button className={`btn-sm ${ivaFilter === 'without' ? 'status-no' : ''}`} onClick={() => setIvaFilter('without')}>Sin IVA (0%)</button>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', marginBottom: '1.5rem', borderTop: '1px solid rgb(255, 255, 255)', paddingTop: '0.8rem' }}>
                        <span style={{ fontSize: '9px', fontWeight: 'bold', marginRight: '6px', }}>CategorÃƒÂ­as:</span>
                        <button className={`btn-sm ${categoryFilter === 'all' ? 'status-aura' : ''}`} onClick={() => setCategoryFilter('all')}>Todas</button>
                        <button className={`btn-sm ${categoryFilter === 'none' ? 'status-no' : ''}`} onClick={() => setCategoryFilter('none')}>Sin CategorÃƒÂ­a</button>
                        {categories.map(cat => (
                          <button
                            key={cat.id}
                            className={`btn-sm ${categoryFilter === cat.id ? 'status-yes' : ''}`}
                            onClick={() => setCategoryFilter(cat.id)}
                          >
                            {cat.name}
                          </button>
                        ))}
                      </div>
                      {productsLoading ? (
                        <p>Cargando catÃƒÂ¡logo...</p>
                      ) : filteredProducts.length === 0 ? (
                        <p>No se encontraron productos.</p>
                      ) : (
                        <table>
                          <thead>
                            <tr>
                              <th>SKU</th>
                              <th>Nombre</th>
                              <th>Stock</th>
                              <th>Costo ($)</th>
                              <th>Precio ($)</th>
                              <th>Afecto IVA</th>
                              <th>ValorizaciÃƒÂ³n ($)</th>
                              <th>Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredProducts.map(p => (
                              <tr key={p.id}>
                                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>{p.sku}</td>
                                <td>
                                  <div>{p.name}</div>
                                  {p.category && (
                                    <span style={{ fontSize: '7px', background: 'rgb(255, 255, 255)', padding: '2px 6px', borderRadius: '4px', marginTop: '2px', display: 'inline-block' }}>
                                      Ã°Å¸â€œâ€š {p.category.name}
                                    </span>
                                  )}
                                </td>
                                <td>
                                  <span className={`badge-status ${p.stock < 10 ? 'status-partial' : 'status-yes'}`}>
                                    {p.stock} uds
                                  </span>
                                </td>
                                <td>${p.cost.toFixed(2)}</td>
                                <td>${p.price.toFixed(2)}</td>
                                <td>
                                  <button className={`badge-status ${p.hasIva ? 'status-yes' : 'status-no'}`} onClick={() => handleToggleProductIva(p.id)} title="Haz clic para alternar IVA">
                                    {p.hasIva ? `${globalIvaRate}% IVA` : '0% IVA'}
                                  </button>
                                </td>
                                <td style={{ fontWeight: '600' }}>${(p.stock * p.cost).toFixed(2)}</td>
                                <td>
                                  <button
                                    onClick={() => handleDeleteProduct(p.id, p.name)}
                                    className="badge-status status-no"
                                    style={{
                                      border: 'none',
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      padding: '4px 8px',
                                      gap: '4px',
                                      borderRadius: '4px',
                                      fontSize: '8px',
                                      fontWeight: '600',
                                      color: '#ef4444',
                                      background: 'rgb(239, 68, 68)',
                                      transition: 'all 0.2s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background = 'rgb(239, 68, 68)';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background = 'rgb(239, 68, 68)';
                                    }}
                                    title="Eliminar producto y movimientos"
                                  >
                                    Ã°Å¸â€”â€˜Ã¯Â¸Â Eliminar
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>

                    {/* Sidebar forms */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      
                      {/* ACCORDION 1: Producto */}
                      <div className="card glass-panel" style={{ padding: '1.25rem', overflow: 'visible', zIndex: 10, display: 'flex', flexDirection: 'column' }}>
                        <div 
                          onClick={() => setIsProductCollapseOpen(!isProductCollapseOpen)}
                          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
                        >
                          <h4 style={{ margin: 0, fontSize: '0.8625rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                            Ã°Å¸â€œÂ¦ {productFormMode === 'create' ? 'Nuevo Producto' : 'Modificar Producto'}
                          </h4>
                          <span style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>{isProductCollapseOpen ? 'Ã¢â€“Â² Opciones' : 'Ã¢â€“Â¼ Opciones'}</span>
                        </div>
                        
                        {isProductCollapseOpen && (
                          <div style={{ marginTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.25rem' }}>
                            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '1rem' }}>
                              <button
                                type="button"
                                onClick={() => setProductFormMode('create')}
                                style={{
                                  flex: 1,
                                  padding: '8px',
                                  background: 'none',
                                  border: 'none',
                                  borderBottom: productFormMode === 'create' ? '2px solid var(--accent-cyan, #06b6d4)' : '2px solid transparent',
                                  color: productFormMode === 'create' ? '#fff' : 'var(--text-secondary)',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  fontSize: '0.6625rem',
                                }}
                              >
                                Crear Nuevo
                              </button>
                              <button
                                type="button"
                                onClick={() => setProductFormMode('update')}
                                style={{
                                  flex: 1,
                                  padding: '8px',
                                  background: 'none',
                                  border: 'none',
                                  borderBottom: productFormMode === 'update' ? '2px solid var(--accent-cyan, #06b6d4)' : '2px solid transparent',
                                  color: productFormMode === 'update' ? '#fff' : 'var(--text-secondary)',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  fontSize: '0.6625rem',
                                }}
                              >
                                Modificar Existente
                              </button>
                            </div>

                            {productFormMode === 'create' ? (
                              <form onSubmit={handleCreateProduct}>
                                <div className="form-group">
                                  <label>SKU (CÃƒÂ³digo ÃƒÂºnico):</label>
                                  <input type="text" required value={newProductSku} onChange={e => setNewProductSku(e.target.value)} placeholder="Ej: BOOK-002" />
                                </div>
                                <div className="form-group">
                                  <label>Nombre del Producto:</label>
                                  <input type="text" required value={newProductName} onChange={e => setNewProductName(e.target.value)} placeholder="Ej: Cuaderno de Cuentas" />
                                </div>
                                <div className="grid-2-form">
                                  <div className="form-group">
                                    <label>Costo ($):</label>
                                    <input type="number" required min={0} step="0.01" value={newProductCost} onChange={e => setNewProductCost(parseFloat(e.target.value) || 0)} />
                                  </div>
                                  <div className="form-group">
                                    <label>Precio Venta ($):</label>
                                    <input type="number" required min={0} step="0.01" value={newProductPrice} onChange={e => setNewProductPrice(parseFloat(e.target.value) || 0)} />
                                  </div>
                                </div>
                                <div className="grid-2-form" style={{ alignItems: 'flex-start' }}>
                                  <div className="form-group">
                                    <label>Stock Inicial:</label>
                                    <input type="number" required min={0} value={newProductStock} onChange={e => setNewProductStock(parseInt(e.target.value) || 0)} />
                                  </div>
                                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '0.4rem', paddingLeft: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <input type="checkbox" id="newProductIva" checked={newProductIva} onChange={e => setNewProductIva(e.target.checked)} />
                                      <label htmlFor="newProductIva" style={{ margin: 0, cursor: 'pointer' }}>Graba IVA</label>
                                    </div>
                                    {newProductIva && (
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                          <label style={{ margin: 0, fontSize: '8px', whiteSpace: 'nowrap' }}>IVA (%):</label>
                                          <input
                                            type="number"
                                            min={0}
                                            max={100}
                                            style={{ width: '60px', padding: '4px 6px', fontSize: '9px' }}
                                            value={newProductIvaRate}
                                            onChange={e => setNewProductIvaRate(parseInt(e.target.value) || 0)}
                                          />
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                          <input
                                            type="checkbox"
                                            id="setAsDefault"
                                            checked={setAsDefault}
                                            onChange={e => setSetAsDefault(e.target.checked)}
                                          />
                                          <label htmlFor="setAsDefault" style={{ margin: 0, fontSize: '7px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                            Predeterminar valor
                                          </label>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="form-group">
                                  <label>CategorÃƒÂ­a (Opcional):</label>
                                  <select value={selectedCategoryId} onChange={e => setSelectedCategoryId(e.target.value)}>
                                    <option value="">Sin CategorÃƒÂ­a</option>
                                    {categories.map(cat => (
                                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                  </select>
                                </div>
                                <div className="grid-2-form" style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                                  <div className="form-group">
                                    <label>PropÃƒÂ³sito de Compra/Venta:</label>
                                    <select value={newProductPurpose} onChange={e => setNewProductPurpose(e.target.value as any)}>
                                      <option value="VENTA">Para Venta</option>
                                      <option value="GASTO">Para Gasto (Compra)</option>
                                      <option value="ACTIVO_FIJO">Activo Fijo (Autoregistro)</option>
                                    </select>
                                  </div>
                                  {newProductPurpose === 'ACTIVO_FIJO' && (
                                    <div className="form-group">
                                      <label>Tipo de Activo Fijo (LORTI):</label>
                                      <select value={newProductAssetType} onChange={e => setNewProductAssetType(e.target.value as any)}>
                                        <option value="COMPUTO">Equipos de CÃƒÂ³mputo (3 aÃƒÂ±os)</option>
                                        <option value="VEHICULO">VehÃƒÂ­culos (5 aÃƒÂ±os)</option>
                                        <option value="MAQUINARIA">Maquinaria / Muebles (10 aÃƒÂ±os)</option>
                                      </select>
                                    </div>
                                  )}
                                </div>
                                <button type="submit" className="btn btn-cyan w-full" style={{ marginTop: '0.5rem' }}>Crear Producto</button>
                              </form>
                            ) : (
                              <form onSubmit={handleUpdateProduct}>
                                <div className="form-group" style={{ position: 'relative' }}>
                                  <label>Buscar por SKU:</label>
                                  <input
                                    type="text"
                                    required
                                    value={searchSku}
                                    onChange={e => setSearchSku(e.target.value)}
                                    placeholder="Ej: MON-41d5"
                                    autoComplete="off"
                                  />
                                  {showSuggestions && (
                                    <div
                                      style={{
                                        position: 'absolute',
                                        zIndex: 1000,
                                        background: '#1e293b',
                                        border: '1px solid rgb(255, 255, 255)',
                                        borderRadius: '6px',
                                        width: '100%',
                                        maxHeight: '250px',
                                        overflowY: 'auto',
                                        boxShadow: '0 10px 15px -3px rgb(0, 0, 0)',
                                        marginTop: '4px'
                                      }}
                                    >
                                      {skuSuggestions.map(p => (
                                        <div
                                          key={p.id}
                                          onClick={() => {
                                            setSearchSku(p.sku);
                                          }}
                                          style={{
                                            padding: '8px 12px',
                                            cursor: 'pointer',
                                            borderBottom: '1px solid rgb(255, 255, 255)',
                                            fontSize: '10px',
                                            color: '#fff',
                                            transition: 'background 0.2s'
                                          }}
                                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgb(6, 182, 212)'}
                                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                          <strong>{p.sku}</strong> - {p.name}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {searchSku.trim() && (
                                  <>
                                    {foundProduct ? (
                                      <div
                                        style={{
                                          background: 'rgb(6, 182, 212)',
                                          border: '1px solid rgb(6, 182, 212)',
                                          padding: '10px',
                                          borderRadius: '6px',
                                          marginBottom: '1rem',
                                          fontSize: '9px',
                                        }}
                                      >
                                        <div style={{ color: '#fff', fontWeight: 'bold', marginBottom: '4px' }}>
                                          Ã¢Å“â€œ Producto Identificado:
                                        </div>
                                        <div style={{ color: 'var(--text-secondary)' }}>
                                          <strong>Nombre:</strong> {foundProduct.name}
                                        </div>
                                        <div style={{ color: 'var(--text-secondary)' }}>
                                          <strong>Costo:</strong> ${foundProduct.cost.toFixed(2)}
                                        </div>
                                        <div style={{ color: 'var(--text-secondary)' }}>
                                          <strong>Stock Actual:</strong> {foundProduct.stock} uds
                                        </div>
                                      </div>
                                    ) : (
                                      <div
                                        style={{
                                          background: 'rgb(239, 68, 68)',
                                          border: '1px solid rgb(239, 68, 68)',
                                          padding: '10px',
                                          borderRadius: '6px',
                                          marginBottom: '1rem',
                                          fontSize: '9px',
                                          color: '#f87171',
                                          fontWeight: '500',
                                        }}
                                      >
                                        Ã¢Å¡Â  No se encontrÃƒÂ³ ningÃƒÂºn producto con este SKU en el catÃƒÂ¡logo.
                                      </div>
                                    )}
                                  </>
                                )}

                                {foundProduct && (
                                  <>
                                    <div className="form-group">
                                      <label>Precio Venta ($):</label>
                                      <input
                                        type="number"
                                        required
                                        min={0}
                                        step="0.01"
                                        value={updateProductPrice}
                                        onChange={e => setUpdateProductPrice(parseFloat(e.target.value) || 0)}
                                      />
                                    </div>

                                    <div className="form-group">
                                      <label>AÃƒÂ±adir Stock (Cantidad):</label>
                                      <input
                                        type="number"
                                        min={0}
                                        value={updateProductAddedStock}
                                        onChange={e => setUpdateProductAddedStock(parseInt(e.target.value) || 0)}
                                      />
                                      <small style={{ fontSize: '7px', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
                                        Se registrarÃƒÂ¡ un ingreso en KÃƒÂ¡rdex por esta cantidad.
                                      </small>
                                    </div>

                                    <div className="form-group">
                                      <label>CategorÃƒÂ­a:</label>
                                      <select
                                        value={updateProductCategoryId}
                                        onChange={e => setUpdateProductCategoryId(e.target.value)}
                                      >
                                        <option value="">Sin CategorÃƒÂ­a</option>
                                        {categories.map(cat => (
                                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                      </select>
                                    </div>

                                    <button type="submit" className="btn btn-cyan w-full">
                                      Actualizar Producto
                                    </button>
                                  </>
                                )}
                              </form>
                            )}
                          </div>
                        )}
                      </div>

                      {/* ACCORDION 2: CategorÃƒÂ­a */}
                      <div className="card glass-panel" style={{ padding: '1.25rem', overflow: 'visible', display: 'flex', flexDirection: 'column' }}>
                        <div 
                          onClick={() => setIsCategoryCollapseOpen(!isCategoryCollapseOpen)}
                          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
                        >
                          <h4 style={{ margin: 0, fontSize: '0.8625rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                            Ã°Å¸â€œÂ Nueva CategorÃƒÂ­a
                          </h4>
                          <span style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>{isCategoryCollapseOpen ? 'Ã¢â€“Â² Opciones' : 'Ã¢â€“Â¼ Opciones'}</span>
                        </div>
                        
                        {isCategoryCollapseOpen && (
                          <div style={{ marginTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.25rem' }}>
                            <form onSubmit={handleCreateCategory}>
                              <div className="form-group">
                                <label>Nombre de la CategorÃƒÂ­a:</label>
                                <input
                                  type="text"
                                  required
                                  value={newCategoryName}
                                  onChange={e => setNewCategoryName(e.target.value)}
                                  placeholder="Ej: ElectrÃƒÂ³nica, Servicios..."
                                />
                              </div>
                              <button type="submit" className="btn btn-cyan w-full">Crear CategorÃƒÂ­a</button>
                            </form>
                          </div>
                        )}
                      </div>

                      {/* ACCORDION 3: Movimiento KÃƒÂ¡rdex */}
                      <div className="card glass-panel" style={{ padding: '1.25rem', overflow: 'visible', display: 'flex', flexDirection: 'column' }}>
                        <div 
                          onClick={() => setIsTxCollapseOpen(!isTxCollapseOpen)}
                          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
                        >
                          <h4 style={{ margin: 0, fontSize: '0.8625rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                            Ã°Å¸â€â€ž Movimiento KÃƒÂ¡rdex
                          </h4>
                          <span style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>{isTxCollapseOpen ? 'Ã¢â€“Â² Opciones' : 'Ã¢â€“Â¼ Opciones'}</span>
                        </div>
                        
                        {isTxCollapseOpen && (
                          <div style={{ marginTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.25rem' }}>
                            <form onSubmit={handleCreateTransaction}>
                              <div className="form-group">
                                <label>Filtrar por CategorÃƒÂ­a:</label>
                                <select value={kardexFilterCategoryId} onChange={e => setKardexFilterCategoryId(e.target.value)}>
                                  <option value="all">Todas las CategorÃƒÂ­as</option>
                                  {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="form-group">
                                <label>Seleccionar Producto:</label>
                                <select value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)}>
                                  {filteredKardexProducts.length === 0 ? (
                                    <option value="">No hay productos en esta categorÃƒÂ­a</option>
                                  ) : (
                                    filteredKardexProducts.map(p => (
                                      <option key={p.id} value={p.id}>{p.name} ({p.sku}) - Stock: {p.stock}</option>
                                    ))
                                  )}
                                </select>
                              </div>
                              <div className="grid-2-form">
                                <div className="form-group">
                                  <label>Tipo de Movimiento:</label>
                                  <select value={txType} onChange={e => setTxType(e.target.value as 'INGRESS' | 'EGRESS')}>
                                    <option value="INGRESS">Ingreso (Entrada)</option>
                                    <option value="EGRESS">Egreso (Salida)</option>
                                  </select>
                                </div>
                                <div className="form-group">
                                  <label>Cantidad:</label>
                                  <input type="number" required min={1} value={txQty} onChange={e => setTxQty(parseInt(e.target.value) || 1)} />
                                </div>
                              </div>
                              <button type="submit" className="btn btn-indigo w-full">Guardar TransacciÃƒÂ³n</button>
                            </form>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Kardex logs */}
                  <div className="table-container glass-panel" style={{ padding: '1.5rem', paddingTop: '2rem', marginTop: '1.5rem' }}>
                    <h3>ÃƒÅ¡ltimos Movimientos de KÃƒÂ¡rdex</h3>
                    {recentTransactions.length === 0 ? (
                      <p>No se han registrado movimientos de inventario.</p>
                    ) : (
                      <table>
                        <thead>
                          <tr>
                            <th>Fecha</th>
                            <th>Producto</th>
                            <th>SKU</th>
                            <th>Tipo</th>
                            <th>Cantidad</th>
                            <th>Costo Unitario ($)</th>
                            <th>Total Costo ($)</th>
                            <th>Stock Resultante</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentTransactions.slice(0, 10).map((item, idx) => (
                            <tr key={item.tx.id || idx}>
                              <td style={{ fontFamily: 'var(--font-mono)', fontSize: '9px' }}>
                                {new Date(item.tx.date).toLocaleString()}
                              </td>
                              <td>{item.product}</td>
                              <td style={{ fontFamily: 'var(--font-mono)' }}>{item.sku}</td>
                              <td>
                                <span className={`badge-status ${item.tx.type === 'INGRESS' ? 'status-yes' : 'status-no'}`}>
                                  {item.tx.type === 'INGRESS' ? 'INGRESO' : 'EGRESO'}
                                </span>
                              </td>
                              <td>{item.tx.quantity} uds</td>
                              <td>${item.tx.unitCost.toFixed(2)}</td>
                              <td>${item.tx.totalCost.toFixed(2)}</td>
                              <td style={{ fontWeight: '600' }}>{item.tx.balanceStock} uds</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}

              {/* TAB: VENTAS */}
              {activeTab === 'ventas' && (
                <div className="fade-in">
                  {/* Ventas Sub-navigation tabs */}
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                    <button className={`btn-sm ${ventasSubTab === 'facturas' ? 'status-aura' : ''}`} onClick={() => setVentasSubTab('facturas')}>
                      Ã°Å¸â€œË† Registro de Ventas y Clientes
                    </button>
                    <button className={`btn-sm ${ventasSubTab === 'empleados' ? 'status-aura' : ''}`} onClick={() => setVentasSubTab('empleados')}>
                      Ã°Å¸â€˜Â¥ Administrar Empleados
                    </button>
                    <button className={`btn-sm ${ventasSubTab === 'facturacion_avanzada' ? 'status-aura' : ''}`} onClick={() => setVentasSubTab('facturacion_avanzada')}>
                      Ã°Å¸â€™Â» FacturaciÃƒÂ³n Avanzada (POS)
                    </button>
                  </div>

                  {ventasSubTab === 'facturacion_avanzada' && (
                    <BillingSystem
                      products={products}
                      globalIvaRate={globalIvaRate}
                      sriEnvironment={sriEnvironment}
                      sriSignatureBase64={sriSignatureBase64}
                      sriSignaturePassword={sriSignaturePassword}
                      sriSimulate={sriSimulate}
                      sriIsBranch={sriIsBranch}
                      sriParentCompanyRuc={sriParentCompanyRuc}
                      sriEstablishmentCode={sriEstablishmentCode}
                      sriEmissionPoint={sriEmissionPoint}
                      sriEstablishmentAddress={sriEstablishmentAddress}
                      fetchInvoices={fetchInvoices}
                      fetchProducts={fetchProducts}
                    />
                  )}

                  {ventasSubTab === 'facturas' && (
                    <div className="fade-in">
                      {/* Metrics Row */}
                      <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
                        <div className="card glass-panel" style={{ padding: '1.25rem', marginBottom: '2rem' }}>
                          <div className="card-header">
                            <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Venta Total Bruta</span>
                            <span>Ã°Å¸â€œË†</span>
                          </div>
                          <h3 style={{ margin: '8px 0', fontSize: '17px', color: 'var(--cyan)' }}>${totalSales.toFixed(2)}</h3>
                          <p style={{ fontSize: '8px', color: 'var(--text-muted)' }}>Venta Neta (sin IVA): ${netSales.toFixed(2)}</p>
                        </div>
                        <div className="card glass-panel" style={{ padding: '1.25rem' }}>
                          <div className="card-header">
                            <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>IVA Ventas Cobrado</span>
                            <span>Ã°Å¸Ââ€ºÃ¯Â¸Â</span>
                          </div>
                          <h3 style={{ margin: '8px 0', fontSize: '17px', color: 'var(--indigo)' }}>${totalIvaCollected.toFixed(2)}</h3>
                          <p style={{ fontSize: '8px', color: 'var(--text-muted)' }}>{globalIvaRate}% IVA acumulado para declarar al SRI</p>
                        </div>
                        <div className="card glass-panel" style={{ padding: '1.25rem' }}>
                          <div className="card-header">
                            <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Venta Promedio / Factura</span>
                            <span>Ã°Å¸â€™Â°</span>
                          </div>
                          <h3 style={{ margin: '8px 0', fontSize: '17px', color: 'var(--emerald)' }}>${avgTicket.toFixed(2)}</h3>
                          <p style={{ fontSize: '8px', color: 'var(--text-muted)' }}>Ticket promedio para {invoices.length} facturas</p>
                        </div>
                      </div>

                      <div className="dashboard-grid">
                        {/* Invoices List */}
                        <div className="table-container glass-panel" style={{ padding: '1.5rem', margin: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '10px' }}>
                            <h3 style={{ margin: 0 }}>Facturas ElectrÃƒÂ³nicas Emitidas</h3>
                            <input
                              type="text"
                              placeholder="Ã°Å¸â€Â Buscar por cliente o clave..."
                              value={invoiceSearch}
                              onChange={(e) => setInvoiceSearch(e.target.value)}
                              style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '10px', width: '240px', background: 'rgba(255,255,255,0.05)', color: '#fff' }}
                            />
                          </div>
                          {invoicesLoading && invoices.length === 0 ? (
                            <p>Cargando facturas...</p>
                          ) : filteredInvoices.length === 0 ? (
                            <p>No se encontraron facturas de ventas.</p>
                          ) : (
                            <table>
                              <thead>
                                <tr>
                                  <th>Fecha</th>
                                  <th>Cliente</th>
                                  <th>Subtotal</th>
                                  <th>IVA ({globalIvaRate}%)</th>
                                  <th>Total ($)</th>
                                  <th>Estado SRI</th>
                                  <th>EnvÃƒÂ­o</th>
                                  <th>Acciones</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredInvoices.map(inv => (
                                  <tr key={inv.id}>
                                    <td style={{ fontSize: '9px' }}>{new Date(inv.createdAt).toLocaleDateString()}</td>
                                    <td><strong>{inv.clientName}</strong></td>
                                    <td>${inv.subtotal.toFixed(2)}</td>
                                    <td>${inv.iva.toFixed(2)}</td>
                                    <td style={{ fontWeight: 'bold', color: 'var(--cyan)' }}>${inv.amount.toFixed(2)}</td>
                                    <td>
                                      <span className={`badge-status ${inv.status === 'AUTHORIZED' ? 'status-yes' : inv.status === 'RECEIVED' ? 'status-partial' : 'status-no'}`}>
                                        {inv.status === 'AUTHORIZED' ? 'AUTORIZADO' : inv.status === 'RECEIVED' ? 'RECIBIDO' : 'RECHAZADO'}
                                      </span>
                                    </td>
                                    <td>
                                      <span className={`badge-status ${inv.sentToClient ? 'status-yes' : 'status-no'}`}>
                                        {inv.sentToClient ? 'ENVIADO' : 'PENDIENTE'}
                                      </span>
                                    </td>
                                    <td style={{ whiteSpace: 'nowrap' }}>
                                      <button className="btn-sm" onClick={() => setSelectedDetailsInvoice(inv)} style={{ marginRight: '6px', background: 'rgba(255, 255, 255, 0.1)', color: '#fff', border: 'none', cursor: 'pointer' }}>Detalle</button>
                                      <button className="btn-sm btn-cyan" onClick={() => handleDownloadXml(inv.id)} style={{ marginRight: '6px' }}>XML</button>
                                      <button className="btn-sm btn-indigo" onClick={() => handleSendInvoice(inv.id)} disabled={inv.status !== 'AUTHORIZED'}>Enviar</button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>

                        {/* Sidebar Create Invoice */}
                        <div className="card glass-panel" style={{ padding: '1.5rem', overflow: 'visible', zIndex: 10 }}>
                          <h4 style={{ marginBottom: '1rem', fontSize: '0.9125rem', fontWeight: 'bold' }}>Emitir Factura de Venta</h4>
                          <form onSubmit={handleCreateInvoice}>
                            <div className="form-group">
                              <label>Cliente (Nombre o RazÃƒÂ³n Social):</label>
                              <input type="text" required value={newClientName} onChange={e => setNewClientName(e.target.value)} placeholder="Ej: CORPORACION EL ROSADO S.A." />
                            </div>

                            <div style={{ marginBottom: '1rem', borderTop: '1px solid rgb(255, 255, 255)', paddingTop: '0.8rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <label style={{ fontSize: '9px', fontWeight: 'bold' }}>Detalle de Productos:</label>
                                <button
                                  type="button"
                                  className="btn-sm btn-cyan"
                                  style={{ padding: '2px 8px', fontSize: '8px' }}
                                  onClick={() => setInvoiceItems([...invoiceItems, { productId: '', quantity: 1 }])}
                                >
                                  + Agregar ÃƒÂtem
                                </button>
                              </div>

                              {invoiceItems.map((item, idx) => {
                                const selectedProd = products.find(p => p.id === item.productId);
                                return (
                                  <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                                    <select
                                      value={item.productId}
                                      required
                                      onChange={e => {
                                        const updated = [...invoiceItems];
                                        updated[idx].productId = e.target.value;
                                        setInvoiceItems(updated);
                                      }}
                                      style={{ flex: 2, padding: '4px 6px', fontSize: '9px' }}
                                    >
                                      <option value="">-- Elegir Producto --</option>
                                      {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} (${p.price.toFixed(2)})</option>
                                      ))}
                                    </select>

                                    <input
                                      type="number"
                                      required
                                      min={1}
                                      value={item.quantity}
                                      onChange={e => {
                                        const updated = [...invoiceItems];
                                        updated[idx].quantity = parseInt(e.target.value) || 1;
                                        setInvoiceItems(updated);
                                      }}
                                      style={{ width: '60px', padding: '4px 6px', fontSize: '9px' }}
                                      placeholder="Cant"
                                    />

                                    <span style={{ fontSize: '9px', width: '60px', textAlign: 'right', }}>
                                      ${selectedProd ? (selectedProd.price * item.quantity).toFixed(2) : '0.00'}
                                    </span>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (invoiceItems.length === 1) {
                                          setInvoiceItems([{ productId: '', quantity: 1 }]);
                                        } else {
                                          setInvoiceItems(invoiceItems.filter((_, i) => i !== idx));
                                        }
                                      }}
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--red, #f9acacff)',
                                        cursor: 'pointer',
                                        fontSize: '11px',
                                        padding: '4px'
                                      }}
                                      title="Eliminar ÃƒÂ­tem"
                                    >
                                      Ã°Å¸â€”â€˜Ã¯Â¸Â
                                    </button>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Breakdown Totals */}
                            <div style={{
                              background: 'rgb(255, 255, 255)',
                              padding: '10px',
                              borderRadius: '8px',
                              marginBottom: '1rem',
                              fontSize: '9px',
                              border: '1px solid rgb(255, 255, 255)'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Subtotal:</span>
                                <strong>${calculatedInvoiceTotals.subtotal.toFixed(2)}</strong>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>IVA ({globalIvaRate}%):</span>
                                <strong>${calculatedInvoiceTotals.iva.toFixed(2)}</strong>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgb(255, 255, 255)', paddingTop: '4px', fontWeight: 'bold' }}>
                                <span>Total a Cobrar:</span>
                                <span style={{ color: 'var(--cyan)' }}>${calculatedInvoiceTotals.total.toFixed(2)}</span>
                              </div>
                            </div>

                            <button type="submit" className="btn btn-cyan w-full">Firmar y Transmitir al SRI</button>
                          </form>
                        </div>
                      </div>

                      {/* Clients Ledger Directory */}
                      <div className="table-container glass-panel" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
                        <h3>Directorio de Clientes y Volumen de Ventas</h3>
                        {clientList.length === 0 ? (
                          <p>No hay registro de clientes.</p>
                        ) : (
                          <table>
                            <thead>
                              <tr>
                                <th>Cliente</th>
                                <th>NÃ‚Âº Facturas</th>
                                <th>Total Comprado ($)</th>
                                <th>Saldo Pendiente de Cobro ($)</th>
                                <th>Estado General</th>
                              </tr>
                            </thead>
                            <tbody>
                              {clientList.map((c, idx) => (
                                <tr key={idx}>
                                  <td><strong>{c.name}</strong></td>
                                  <td>{c.count} facturas</td>
                                  <td style={{ fontWeight: 'bold', color: 'var(--cyan)' }}>${c.total.toFixed(2)}</td>
                                  <td style={{ fontWeight: 'bold', color: c.unpaid > 0 ? 'var(--amber)' : 'var(--emerald)' }}>
                                    ${c.unpaid.toFixed(2)}
                                  </td>
                                  <td>
                                    <span className={`badge-status ${c.unpaid <= 0 ? 'status-yes' : 'status-partial'}`}>
                                      {c.unpaid <= 0 ? 'AL DÃƒÂA' : 'SALDO PENDIENTE'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>
                  )}

                  {ventasSubTab === 'empleados' && (
                    <div className="fade-in">
                      <div className="dashboard-grid">
                        {/* List of employees */}
                        <div className="table-container glass-panel" style={{ padding: '1.5rem', margin: 0 }}>
                          <h3 style={{ marginTop: 0 }}>Empleados Registrados</h3>
                          <p style={{ fontSize: '9.5px', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                            Estos son los usuarios autorizados para facturar a nombre de tu empresa en el **Sistema de FacturaciÃƒÂ³n**.
                          </p>

                          {employeesLoading && employees.length === 0 ? (
                            <p>Cargando empleados...</p>
                          ) : employees.length === 0 ? (
                            <p>No has registrado ningÃƒÂºn empleado. Agrega uno a la derecha para permitir el acceso a FacturaciÃƒÂ³n.</p>
                          ) : (
                            <table>
                              <thead>
                                <tr>
                                  <th>Nombre</th>
                                  <th>Email (Usuario de Acceso)</th>
                                  <th>Fecha Registro</th>
                                  <th style={{ textAlign: 'center' }}>AcciÃƒÂ³n</th>
                                </tr>
                              </thead>
                              <tbody>
                                {employees.map(emp => (
                                  <tr key={emp.id}>
                                    <td><strong>{emp.name}</strong></td>
                                    <td style={{ fontFamily: 'var(--font-mono)' }}>{emp.email}</td>
                                    <td>{new Date(emp.createdAt).toLocaleDateString()}</td>
                                    <td style={{ textAlign: 'center' }}>
                                      <button
                                        className="btn-sm btn-cyan"
                                        onClick={() => handleDeleteEmployee(emp.id)}
                                        style={{ background: 'rgb(239, 68, 68)', color: '#f87171', border: '1px solid rgb(239, 68, 68)' }}
                                      >
                                        Ã°Å¸â€”â€˜Ã¯Â¸Â Eliminar
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>

                        {/* Add Employee Form */}
                        <div className="card glass-panel" style={{ padding: '1.5rem' }}>
                          <h4 style={{ marginBottom: '1rem', fontSize: '0.9125rem', fontWeight: 'bold' }}>Agregar Nuevo Empleado</h4>
                          <form onSubmit={handleCreateEmployee}>
                            <div className="form-group">
                              <label>Nombre Completo:</label>
                              <input
                                type="text"
                                required
                                value={empName}
                                onChange={e => setEmpName(e.target.value)}
                                placeholder="Ej: Juan PÃƒÂ©rez"
                              />
                            </div>
                            <div className="form-group">
                              <label>Correo ElectrÃƒÂ³nico:</label>
                              <input
                                type="email"
                                required
                                value={empEmail}
                                onChange={e => setEmpEmail(e.target.value)}
                                placeholder="Ej: juan@miempresa.com"
                              />
                            </div>
                            <div className="form-group">
                              <label>ContraseÃƒÂ±a:</label>
                              <input
                                type="password"
                                required
                                value={empPassword}
                                onChange={e => setEmpPassword(e.target.value)}
                                placeholder="MÃƒÂ­nimo 6 caracteres"
                              />
                            </div>
                            <div className="form-group">
                              <label>Confirmar ContraseÃƒÂ±a:</label>
                              <input
                                type="password"
                                required
                                value={empConfirmPassword}
                                onChange={e => setEmpConfirmPassword(e.target.value)}
                                placeholder="Repite la contraseÃƒÂ±a"
                              />
                            </div>
                            <button type="submit" className="btn btn-cyan w-full" style={{ marginTop: '1.25rem' }}>
                              Registrar Empleado
                            </button>
                          </form>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── SUB-TAB: DIRECTORIO DE CLIENTES ── */}
                  {ventasSubTab === 'clientes' && (
                    <div className="fade-in">
                      <div className="dashboard-grid">
                        {/* Customer List */}
                        <div className="table-container glass-panel" style={{ padding: '1.5rem', margin: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '10px' }}>
                            <h3 style={{ margin: 0 }}>🙋 Directorio de Clientes</h3>
                            <input
                              type="text"
                              placeholder="🔍 Buscar cliente..."
                              value={customerSearch}
                              onChange={e => setCustomerSearch(e.target.value)}
                              style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '10px', width: '200px', background: 'rgba(255,255,255,0.05)', color: '#fff' }}
                            />
                          </div>
                          {customers.filter(c =>
                            c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                            c.ruc.includes(customerSearch) ||
                            c.email.toLowerCase().includes(customerSearch.toLowerCase())
                          ).length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                              <span style={{ fontSize: '2.8125rem', display: 'block', marginBottom: '1rem' }}>🙋</span>
                              <p>No hay clientes registrados. Agrega uno desde el formulario.</p>
                            </div>
                          ) : (
                            <table>
                              <thead>
                                <tr>
                                  <th>Nombre / Razón Social</th>
                                  <th>RUC / Cédula</th>
                                  <th>Correo</th>
                                  <th>Teléfono</th>
                                  <th>Dirección</th>
                                  <th style={{ textAlign: 'right' }}>Acciones</th>
                                </tr>
                              </thead>
                              <tbody>
                                {customers.filter(c =>
                                  c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                                  c.ruc.includes(customerSearch) ||
                                  c.email.toLowerCase().includes(customerSearch.toLowerCase())
                                ).map(c => (
                                  <tr key={c.id}>
                                    <td><strong>{c.name}</strong></td>
                                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '9px' }}>{c.ruc || '—'}</td>
                                    <td style={{ fontSize: '9px' }}>{c.email || '—'}</td>
                                    <td style={{ fontSize: '9px' }}>{c.phone || '—'}</td>
                                    <td style={{ fontSize: '9px', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.address || '—'}</td>
                                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                                      <button className="btn-sm" onClick={() => handleEditCustomer(c)} style={{ marginRight: '6px', background: 'rgba(99,102,241,0.2)', border: '1px solid var(--indigo)', color: 'var(--indigo)', cursor: 'pointer' }}>✏️ Editar</button>
                                      <button className="btn-sm" onClick={() => handleDeleteCustomer(c.id)} style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid #f87171', color: '#f87171', cursor: 'pointer' }}>🗑️</button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>

                        {/* Customer Form */}
                        <div className="card glass-panel" style={{ padding: '1.5rem' }}>
                          <h4 style={{ marginBottom: '1rem', fontSize: '0.8625rem', fontWeight: 'bold' }}>
                            {customerFormMode === 'create' ? '➕ Nuevo Cliente' : '✏️ Editar Cliente'}
                          </h4>
                          <form onSubmit={handleSaveCustomer}>
                            <div className="form-group">
                              <label>Nombre / Razón Social:</label>
                              <input type="text" required value={custName} onChange={e => setCustName(e.target.value)} placeholder="Ej: CORP. EL ROSADO S.A." />
                            </div>
                            <div className="form-group">
                              <label>RUC / Cédula:</label>
                              <input type="text" value={custRuc} onChange={e => setCustRuc(e.target.value)} placeholder="Ej: 0923456789001" maxLength={13} style={{ fontFamily: 'var(--font-mono)' }} />
                            </div>
                            <div className="form-group">
                              <label>Correo Electrónico:</label>
                              <input type="email" value={custEmail} onChange={e => setCustEmail(e.target.value)} placeholder="cliente@empresa.com" />
                            </div>
                            <div className="grid-2-form">
                              <div className="form-group">
                                <label>Teléfono:</label>
                                <input type="text" value={custPhone} onChange={e => setCustPhone(e.target.value)} placeholder="0999000000" />
                              </div>
                              <div className="form-group">
                                <label>Dirección:</label>
                                <input type="text" value={custAddress} onChange={e => setCustAddress(e.target.value)} placeholder="Av. Ejemplo 123" />
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button type="submit" className="btn btn-cyan w-full">{customerFormMode === 'create' ? 'Guardar Cliente' : 'Actualizar Cliente'}</button>
                              {customerFormMode === 'edit' && (
                                <button type="button" className="btn-sm w-full" onClick={() => { setCustomerFormMode('create'); setEditingCustomerId(null); setCustName(''); setCustRuc(''); setCustEmail(''); setCustPhone(''); setCustAddress(''); }} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer', borderRadius: '8px' }}>Cancelar</button>
                              )}
                            </div>
                          </form>
                          <div style={{ marginTop: '1.5rem', padding: '10px', background: 'rgba(6,182,212,0.08)', borderRadius: '8px', fontSize: '9px', color: 'var(--text-secondary)', border: '1px solid rgba(6,182,212,0.2)' }}>
                            💡 Los clientes del directorio pueden ser referenciados rápidamente al emitir facturas y proformas.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── SUB-TAB: PROFORMAS / COTIZACIONES ── */}
                  {ventasSubTab === 'proformas' && (
                    <div className="fade-in">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <h3 style={{ margin: 0 }}>📄 Proformas y Cotizaciones</h3>
                          <span className="badge-status status-aura">{proformas.filter(p => p.status === 'BORRADOR').length} Activas</span>
                        </div>
                        <button className="btn btn-cyan" onClick={() => { setProformaView(proformaView === 'list' ? 'create' : 'list'); }}
                          style={{ padding: '8px 16px', borderRadius: '8px', fontWeight: '600' }}>
                          {proformaView === 'list' ? '➕ Nueva Proforma' : '← Volver a Lista'}
                        </button>
                      </div>

                      {proformaView === 'list' ? (
                        <div className="table-container glass-panel" style={{ padding: '1.5rem' }}>
                          <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem' }}>
                            <input type="text" placeholder="🔍 Buscar proformas..." value={proformaSearch}
                              onChange={e => setProformaSearch(e.target.value)}
                              style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '10px', width: '220px', background: 'rgba(255,255,255,0.05)', color: '#fff' }} />
                          </div>
                          {proformas.filter(p => p.clientName.toLowerCase().includes(proformaSearch.toLowerCase())).length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                              <span style={{ fontSize: '2.8125rem', display: 'block', marginBottom: '1rem' }}>📄</span>
                              <p>No hay proformas. Crea una nueva con el botón superior.</p>
                            </div>
                          ) : (
                            <table>
                              <thead>
                                <tr>
                                  <th>Fecha</th>
                                  <th>Cliente</th>
                                  <th>Items</th>
                                  <th>Total ($)</th>
                                  <th>Estado</th>
                                  <th style={{ textAlign: 'right' }}>Acciones</th>
                                </tr>
                              </thead>
                              <tbody>
                                {proformas.filter(p => p.clientName.toLowerCase().includes(proformaSearch.toLowerCase())).map(p => (
                                  <tr key={p.id}>
                                    <td style={{ fontSize: '9px' }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                                    <td><strong>{p.clientName}</strong><br /><span style={{ fontSize: '8px', color: 'var(--text-muted)' }}>{p.clientRuc}</span></td>
                                    <td>{p.items.length} ítem(s)</td>
                                    <td style={{ fontWeight: 'bold', color: 'var(--cyan)' }}>${p.total.toFixed(2)}</td>
                                    <td>
                                      <span className={`badge-status ${p.status === 'BORRADOR' ? 'status-partial' : p.status === 'ENVIADA' ? 'status-aura' : 'status-yes'}`}>
                                        {p.status}
                                      </span>
                                    </td>
                                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                                      {p.status === 'BORRADOR' && (
                                        <button className="btn-sm" onClick={() => handleUpdateProformaStatus(p.id, 'ENVIADA')} style={{ marginRight: '4px', background: 'rgba(99,102,241,0.2)', border: '1px solid var(--indigo)', color: 'var(--indigo)', cursor: 'pointer' }}>📤 Enviada</button>
                                      )}
                                      {p.status !== 'CONVERTIDA' && (
                                        <button className="btn-sm btn-cyan" onClick={() => handleConvertProformaToInvoice(p)} style={{ marginRight: '4px', fontWeight: '600' }}>⚡ Facturar</button>
                                      )}
                                      <button className="btn-sm" onClick={() => handleDeleteProforma(p.id)} style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid #f87171', color: '#f87171', cursor: 'pointer' }}>🗑️</button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      ) : (
                        <div className="dashboard-grid">
                          <div className="card glass-panel" style={{ padding: '1.5rem' }}>
                            <h4 style={{ marginBottom: '1rem', fontWeight: 'bold' }}>Nueva Proforma</h4>
                            <form onSubmit={handleCreateProforma}>
                              <div className="grid-2-form">
                                <div className="form-group">
                                  <label>Cliente (Nombre):</label>
                                  <input type="text" required value={proformaClientName} onChange={e => setProformaClientName(e.target.value)} placeholder="Nombre del cliente" list="proforma-clients-list" />
                                  <datalist id="proforma-clients-list">
                                    {customers.map(c => <option key={c.id} value={c.name} />)}
                                  </datalist>
                                </div>
                                <div className="form-group">
                                  <label>RUC / Cédula:</label>
                                  <input type="text" value={proformaClientRuc} onChange={e => setProformaClientRuc(e.target.value)} placeholder="Ej: 0923456789001" style={{ fontFamily: 'var(--font-mono)' }} />
                                </div>
                              </div>

                              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.8rem', marginBottom: '0.8rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                  <label style={{ fontSize: '9px', fontWeight: 'bold' }}>Productos:</label>
                                  <button type="button" className="btn-sm btn-cyan" style={{ padding: '2px 8px', fontSize: '8px' }} onClick={() => setProformaItems([...proformaItems, { productId: '', quantity: 1 }])}>+ Agregar</button>
                                </div>
                                {proformaItems.map((item, idx) => (
                                  <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                                    <select value={item.productId} required onChange={e => { const u = [...proformaItems]; u[idx].productId = e.target.value; setProformaItems(u); }} style={{ flex: 2, padding: '4px 6px', fontSize: '9px' }}>
                                      <option value="">-- Producto --</option>
                                      {products.map(p => <option key={p.id} value={p.id}>{p.name} (${p.price.toFixed(2)})</option>)}
                                    </select>
                                    <input type="number" min={1} value={item.quantity} onChange={e => { const u = [...proformaItems]; u[idx].quantity = parseInt(e.target.value) || 1; setProformaItems(u); }} style={{ width: '55px', padding: '4px 6px', fontSize: '9px' }} />
                                    <span style={{ fontSize: '9px', width: '60px', textAlign: 'right' }}>${((products.find(p => p.id === item.productId)?.price || 0) * item.quantity).toFixed(2)}</span>
                                    <button type="button" onClick={() => setProformaItems(proformaItems.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '11px', padding: '4px' }}>🗑️</button>
                                  </div>
                                ))}
                              </div>

                              <div className="form-group">
                                <label>Notas / Condiciones:</label>
                                <input type="text" value={proformaNotes} onChange={e => setProformaNotes(e.target.value)} placeholder="Ej: Válida por 15 días. Precios sujetos a cambio sin previo aviso." />
                              </div>

                              <button type="submit" className="btn btn-cyan w-full" style={{ marginTop: '0.5rem' }}>Guardar Proforma</button>
                            </form>
                          </div>
                          <div className="card glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                            <span style={{ fontSize: '2.8125rem' }}>📄</span>
                            <h4 style={{ margin: 0 }}>Flujo de Proformas</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '10px', color: 'var(--text-secondary)', width: '100%', textAlign: 'left' }}>
                              {[['BORRADOR', 'Proforma creada y en edición', 'status-partial'], ['ENVIADA', 'Proforma enviada al cliente', 'status-aura'], ['CONVERTIDA', 'Convertida en Factura Electrónica', 'status-yes']].map(([st, desc, cls]) => (
                                <div key={st} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                  <span className={`badge-status ${cls}`}>{st}</span>
                                  <span>{desc}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── SUB-TAB: NOMINA / ROLES DE PAGO ── */}
                  {ventasSubTab === 'nomina' && (
                    <div className="fade-in">
                      <div className="dashboard-grid">
                        {/* Payroll Calculator */}
                        <div className="card glass-panel" style={{ padding: '1.5rem' }}>
                          <h4 style={{ marginBottom: '1rem', fontWeight: 'bold' }}>💰 Calculadora de Nómina (IESS)</h4>
                          <form onSubmit={handleGeneratePayroll}>
                            <div className="form-group">
                              <label>Empleado:</label>
                              <select required value={payrollEmployeeId} onChange={e => setPayrollEmployeeId(e.target.value)} style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '11px' }}>
                                <option value="">-- Seleccionar Empleado --</option>
                                {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                              </select>
                              {employees.length === 0 && <p style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '4px' }}>No hay empleados. Regístralos primero en la pestaña de Empleados.</p>}
                            </div>
                            <div className="form-group">
                              <label>Período (Mes):</label>
                              <input type="month" required value={payrollMonth} onChange={e => setPayrollMonth(e.target.value)} style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '11px' }} />
                            </div>
                            <div className="grid-2-form">
                              <div className="form-group">
                                <label>Salario Base ($):</label>
                                <input type="number" required min={460} step="0.01" value={payrollSalary} onChange={e => setPayrollSalary(parseFloat(e.target.value) || 460)} />
                              </div>
                              <div className="form-group">
                                <label>Bonificaciones ($):</label>
                                <input type="number" min={0} step="0.01" value={payrollBonus} onChange={e => setPayrollBonus(parseFloat(e.target.value) || 0)} />
                              </div>
                            </div>
                            <div className="grid-2-form">
                              <div className="form-group">
                                <label>Horas Extra ($):</label>
                                <input type="number" min={0} step="0.01" value={payrollExtras} onChange={e => setPayrollExtras(parseFloat(e.target.value) || 0)} />
                              </div>
                              <div className="form-group">
                                <label>Otras Deducciones ($):</label>
                                <input type="number" min={0} step="0.01" value={payrollOtherDeductions} onChange={e => setPayrollOtherDeductions(parseFloat(e.target.value) || 0)} />
                              </div>
                            </div>

                            {/* Live Calculation Preview */}
                            <div style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: '12px', padding: '1rem', marginBottom: '1rem', fontSize: '10px' }}>
                              <div style={{ fontWeight: 'bold', color: 'var(--cyan)', marginBottom: '10px', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Vista Previa del Rol</div>
                              {[
                                ['Salario Base', payrollSalary],
                                ['+ Bonificaciones', payrollBonus],
                                ['+ Horas Extra', payrollExtras],
                              ].map(([label, val]) => (
                                <div key={String(label)} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '4px' }}>
                                  <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                                  <span>${Number(val).toFixed(2)}</span>
                                </div>
                              ))}
                              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '4px', fontWeight: 'bold' }}>
                                <span>= Ingreso Bruto</span>
                                <span style={{ color: 'var(--emerald)' }}>${payrollCalc.gross.toFixed(2)}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '4px' }}>
                                <span style={{ color: '#f87171' }}>- IESS Empleado (9.45%)</span>
                                <span style={{ color: '#f87171' }}>-${payrollCalc.iessEmployee.toFixed(2)}</span>
                              </div>
                              {payrollOtherDeductions > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '4px' }}>
                                  <span style={{ color: '#f87171' }}>- Otras Deducciones</span>
                                  <span style={{ color: '#f87171' }}>-${payrollOtherDeductions.toFixed(2)}</span>
                                </div>
                              )}
                              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '6px', fontWeight: 'bold', fontSize: '12px' }}>
                                <span>= SALARIO NETO</span>
                                <span style={{ color: 'var(--cyan)' }}>${payrollCalc.net.toFixed(2)}</span>
                              </div>
                              <div style={{ marginTop: '8px', padding: '6px 8px', background: 'rgba(16,185,129,0.1)', borderRadius: '6px', color: 'var(--emerald)', fontSize: '9px', display: 'flex', justifyContent: 'space-between' }}>
                                <span>Aporte Patronal IESS (11.15%)</span>
                                <strong>${payrollCalc.iessEmployer.toFixed(2)}</strong>
                              </div>
                            </div>

                            <button type="submit" className="btn btn-cyan w-full" disabled={!payrollEmployeeId}>Generar Rol de Pago</button>
                          </form>
                        </div>

                        {/* Payroll History */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                          <div className="table-container glass-panel" style={{ padding: '1.5rem', margin: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                              <h3 style={{ margin: 0 }}>Historial de Roles de Pago</h3>
                              <button className="btn-sm" onClick={handleExportPayrollCSV} style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid var(--emerald)', color: 'var(--emerald)', cursor: 'pointer' }}>📥 Exportar CSV</button>
                            </div>
                            {payrollRoles.length === 0 ? (
                              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem' }}>No hay roles generados aún.</p>
                            ) : (
                              <table>
                                <thead>
                                  <tr>
                                    <th>Empleado</th>
                                    <th>Período</th>
                                    <th>Bruto</th>
                                    <th>IESS Emp.</th>
                                    <th>Patronal</th>
                                    <th>Neto</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {payrollRoles.slice().reverse().map((r: any) => (
                                    <tr key={r.id}>
                                      <td><strong>{r.employeeName}</strong></td>
                                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '9px' }}>{r.month}</td>
                                      <td>${r.gross.toFixed(2)}</td>
                                      <td style={{ color: '#f87171' }}>-${r.iessEmployee.toFixed(2)}</td>
                                      <td style={{ color: 'var(--emerald)', fontSize: '9px' }}>${r.iessEmployer.toFixed(2)}</td>
                                      <td style={{ fontWeight: 'bold', color: 'var(--cyan)' }}>${r.net.toFixed(2)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                          <div className="card glass-panel" style={{ padding: '1.25rem', background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.2)' }}>
                            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                              <strong style={{ color: '#eab308' }}>📋 Normativa IESS 2026:</strong>
                              <ul style={{ margin: '8px 0 0 1rem', paddingLeft: 0, listStyleType: 'disc' }}>
                                <li>Salario Básico Unificado (SBU): $460.00/mes</li>
                                <li>Aporte Personal al IESS: 9.45% del salario bruto</li>
                                <li>Aporte Patronal al IESS: 11.15% del salario bruto</li>
                                <li>Décimo Tercero: 1/12 del ingreso anual (Dic.)</li>
                                <li>Décimo Cuarto: equivalente al SBU (Ago./Mar.)</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}


                </div>
              )}

              {/* TAB: PROVEEDORES / COMPRAS */}
              {activeTab === 'proveedores' && (
                <div className="fade-in">
                  <div className="dashboard-grid">
                    {/* Purchases List */}
                    <div className="table-container glass-panel" style={{ padding: '1.5rem', margin: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <h3 style={{ margin: 0 }}>Compras y Facturas de Proveedores</h3>
                        <button onClick={handleSyncPurchases} className="btn btn-emerald">
                          Sincronizar Compras (SRI Scraper)
                        </button>
                      </div>
                      {purchasesLoading ? (
                        <p>Cargando compras...</p>
                      ) : purchases.length === 0 ? (
                        <p>No hay facturas de compras registradas.</p>
                      ) : (
                        <table>
                          <thead>
                            <tr>
                              <th>Fecha</th>
                              <th>NÃ‚Âº Factura</th>
                              <th>Proveedor</th>
                              <th>RUC Proveedor</th>
                              <th>Subtotal ($)</th>
                              <th>IVA ($)</th>
                              <th>Total ($)</th>
                              <th>Tipo</th>
                              <th>AcciÃƒÂ³n</th>
                            </tr>
                          </thead>
                          <tbody>
                            {purchases.map(p => (
                              <tr key={p.id}>
                                <td style={{ fontSize: '9px' }}>{new Date(p.date).toLocaleDateString()}</td>
                                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '9px' }}>{p.invoiceNum}</td>
                                <td><strong>{p.providerName}</strong></td>
                                <td style={{ fontFamily: 'var(--font-mono)' }}>{p.providerRuc}</td>
                                <td>${p.subtotal.toFixed(2)}</td>
                                <td>${p.iva.toFixed(2)}</td>
                                <td style={{ fontWeight: 'bold', color: 'var(--emerald)' }}>${p.amount.toFixed(2)}</td>
                                <td>
                                  <span className={`badge-status ${p.synced ? 'status-yes' : 'status-aura'}`}>
                                    {p.synced ? 'SRI SYNC' : 'MANUAL'}
                                  </span>
                                </td>
                                <td>
                                  <button className="btn-sm btn-emerald" onClick={() => alert(`Visualizando mock XML SRI para factura ${p.invoiceNum}`)}>MOCK XML</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>

                    {/* Manual Purchase Registry Sidebar */}
                    <div className="card glass-panel" style={{ padding: '1.5rem' }}>
                      <h4 style={{ marginBottom: '1rem', fontSize: '0.9125rem', fontWeight: 'bold' }}>Subir Compra / Proveedor</h4>
                      <form onSubmit={handleCreatePurchase}>
                        <div className="form-group">
                          <label>Proveedor (RazÃƒÂ³n Social):</label>
                          <input type="text" required value={newPurProviderName} onChange={e => setNewPurProviderName(e.target.value)} placeholder="Ej: TELCONET S.A." />
                        </div>
                        <div className="form-group">
                          <label>RUC Proveedor:</label>
                          <input type="text" required value={newPurProviderRuc} onChange={e => setNewPurProviderRuc(e.target.value)} placeholder="Ej: 1792144567001" />
                        </div>
                        <div className="grid-2-form">
                          <div className="form-group">
                            <label>Factura NÃ‚Âº:</label>
                            <input type="text" required value={newPurInvoiceNum} onChange={e => setNewPurInvoiceNum(e.target.value)} placeholder="001-002-12345" />
                          </div>
                          <div className="form-group">
                            <label>Fecha Compra:</label>
                            <input type="date" required value={newPurDate} onChange={e => setNewPurDate(e.target.value)} style={{ width: '100%', background: 'rgb(0, 0, 0)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', fontSize: '11px', outline: 'none' }} />
                          </div>
                        </div>
                        <div className="form-group">
                          <label>Monto Total ($):</label>
                          <input type="number" required min={0.01} step="0.01" value={newPurAmount} onChange={e => setNewPurAmount(parseFloat(e.target.value) || 0)} />
                        </div>
                        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0.75rem 0' }}>
                          <input type="checkbox" id="newPurIva" checked={newPurIva} onChange={e => setNewPurIva(e.target.checked)} />
                          <label htmlFor="newPurIva" style={{ margin: 0, cursor: 'pointer' }}>Tiene IVA ({globalIvaRate}%)</label>
                        </div>

                        {/* Optional Stock Sync */}
                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
                          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0.5rem 0' }}>
                            <input type="checkbox" id="newPurStockUpdate" checked={newPurStockUpdate} onChange={e => setNewPurStockUpdate(e.target.checked)} />
                            <label htmlFor="newPurStockUpdate" style={{ margin: 0, cursor: 'pointer', fontWeight: 'bold' }}>Ã‚Â¿Ingresar stock a KÃƒÂ¡rdex?</label>
                          </div>
                          {newPurStockUpdate && (
                            <div className="grid-2-form">
                              <div className="form-group">
                                <label>Producto SKU:</label>
                                <select value={newPurSku} onChange={e => setNewPurSku(e.target.value)} required={newPurStockUpdate}>
                                  <option value="">-- Seleccionar --</option>
                                  {products.map(p => (
                                    <option key={p.id} value={p.sku}>{p.name} ({p.sku})</option>
                                  ))}
                                </select>
                              </div>
                              <div className="form-group">
                                <label>Cantidad:</label>
                                <input type="number" required={newPurStockUpdate} min={1} value={newPurQty} onChange={e => setNewPurQty(parseInt(e.target.value) || 1)} />
                              </div>
                            </div>
                          )}
                        </div>

                        <button type="submit" className="btn btn-emerald w-full" style={{ marginTop: '1rem' }}>Registrar Factura de Compra</button>
                      </form>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: CAJA Y CONCILIACION */}
              {activeTab === 'caja' && (
                <div className="fade-in">
                  {/* Metrics Row */}
                  <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
                    <div className="card glass-panel" style={{ padding: '1.25rem' }}>
                      <div className="card-header">
                        <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Total Ingresos (Cobros)</span>
                        <span style={{ color: 'var(--emerald)' }}>Ã°Å¸â€™Âµ</span>
                      </div>
                      <h3 style={{ margin: '8px 0', fontSize: '17px', color: 'var(--emerald)' }}>
                        ${recoSummary?.metrics?.totalRecaudado?.toFixed(2) || '0.00'}
                      </h3>
                      <p style={{ fontSize: '8px', color: 'var(--text-muted)' }}>Dinero recaudado de cobros a clientes</p>
                    </div>
                    <div className="card glass-panel" style={{ padding: '1.25rem' }}>
                      <div className="card-header">
                        <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Total Egresos (Pagos)</span>
                        <span style={{ color: '#f87171' }}>Ã°Å¸â€™Â¸</span>
                      </div>
                      <h3 style={{ margin: '8px 0', fontSize: '17px', color: '#f87171' }}>
                        ${recoSummary?.metrics?.totalPagado?.toFixed(2) || '0.00'}
                      </h3>
                      <p style={{ fontSize: '8px', color: 'var(--text-muted)' }}>Dinero pagado a proveedores</p>
                    </div>
                    <div className="card glass-panel" style={{ padding: '1.25rem' }}>
                      <div className="card-header">
                        <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Saldo Neto Caja / Bancos</span>
                        <span style={{ color: 'var(--cyan)' }}>Ã¢Å¡â€“Ã¯Â¸Â</span>
                      </div>
                      <h3 style={{ margin: '8px 0', fontSize: '17px', color: (recoSummary?.metrics?.flujoNeto || 0) >= 0 ? 'var(--cyan)' : '#f87171' }}>
                        ${recoSummary?.metrics?.flujoNeto?.toFixed(2) || '0.00'}
                      </h3>
                      <p style={{ fontSize: '8px', color: 'var(--text-muted)' }}>Saldo neto disponible en cuenta principal</p>
                    </div>
                  </div>

                  <div className="dashboard-grid">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      {/* Cruce balances summary table */}
                      <div className="table-container glass-panel" style={{ padding: '1.5rem', margin: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '10px' }}>
                          <h3 style={{ margin: 0 }}>Saldos de Facturas y Caja {recoLoading && <span style={{ fontSize: '9px', color: 'var(--indigo)' }}>(Cargando...)</span>}</h3>
                          <button onClick={handleExportReconciliation} className="btn btn-sm btn-indigo" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            Ã°Å¸â€œÂ¥ Exportar Conciliaciones (CSV)
                          </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                          <div>
                            <h4 style={{ marginBottom: '8px', fontSize: '10px', textTransform: 'uppercase', color: 'var(--cyan)' }}>Facturas de Ventas Pendientes de Cobro</h4>
                            {recoSummary?.invoices?.filter(i => i.balance > 0).length === 0 ? (
                              <p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>No hay cobros pendientes.</p>
                            ) : (
                              <table>
                                <thead>
                                  <tr>
                                    <th>Cliente</th>
                                    <th>Monto Total</th>
                                    <th>Cobrado en Caja</th>
                                    <th>Retenciones</th>
                                    <th>Saldo</th>
                                    <th>AcciÃƒÂ³n</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {recoSummary?.invoices?.filter(i => i.balance > 0).map(inv => (
                                    <tr key={inv.id}>
                                      <td><strong>{inv.clientName}</strong></td>
                                      <td>${inv.amount.toFixed(2)}</td>
                                      <td>${inv.cashPaid.toFixed(2)}</td>
                                      <td>${inv.withheld.toFixed(2)}</td>
                                      <td style={{ color: 'var(--amber)', fontWeight: 'bold' }}>${inv.balance.toFixed(2)}</td>
                                      <td>
                                        <button className="btn-sm btn-cyan" onClick={() => {
                                          setCashSource('SALE');
                                          setCashInvoiceId(inv.id);
                                          setCashAmount(inv.balance);
                                          setCashType('INGRESS');
                                        }}>Cobrar</button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>

                          <div>
                            <h4 style={{ marginBottom: '8px', fontSize: '10px', textTransform: 'uppercase', color: 'var(--indigo)' }}>Facturas de Compras Pendientes de Pago</h4>
                            {recoSummary?.purchases?.filter(p => p.balance > 0).length === 0 ? (
                              <p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>No hay pagos pendientes.</p>
                            ) : (
                              <table>
                                <thead>
                                  <tr>
                                    <th>Proveedor</th>
                                    <th>Monto Total</th>
                                    <th>Pagado en Caja</th>
                                    <th>Retenciones</th>
                                    <th>Saldo</th>
                                    <th>AcciÃƒÂ³n</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {recoSummary?.purchases?.filter(p => p.balance > 0).map(pur => (
                                    <tr key={pur.id}>
                                      <td><strong>{pur.providerName}</strong></td>
                                      <td>${pur.amount.toFixed(2)}</td>
                                      <td>${pur.cashPaid.toFixed(2)}</td>
                                      <td>${pur.withheld.toFixed(2)}</td>
                                      <td style={{ color: 'var(--amber)', fontWeight: 'bold' }}>${pur.balance.toFixed(2)}</td>
                                      <td>
                                        <button className="btn-sm btn-indigo" onClick={() => {
                                          setCashSource('PURCHASE');
                                          setCashPurchaseId(pur.id);
                                          setCashAmount(pur.balance);
                                          setCashType('EGRESS');
                                        }}>Pagar</button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Cash movements history list */}
                      <div className="table-container glass-panel" style={{ padding: '1.5rem', margin: 0 }}>
                        <h3 style={{ marginTop: 0 }}>Historial de Transacciones de Caja</h3>
                        {recoSummary?.cashTransactions?.length === 0 ? (
                          <p>No hay movimientos registrados.</p>
                        ) : (
                          <table>
                            <thead>
                              <tr>
                                <th>Fecha</th>
                                <th>DescripciÃƒÂ³n</th>
                                <th>Origen</th>
                                <th>Monto ($)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {recoSummary?.cashTransactions?.map(tx => (
                                <tr key={tx.id}>
                                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '8px' }}>{new Date(tx.date).toLocaleString()}</td>
                                  <td><strong>{tx.description}</strong></td>
                                  <td>
                                    <span className={`badge-status ${tx.source === 'SALE' ? 'status-yes' : tx.source === 'PURCHASE' ? 'status-no' : 'status-aura'}`}>
                                      {tx.source === 'SALE' ? 'COBRO VENTA' : tx.source === 'PURCHASE' ? 'PAGO COMPRA' : 'AJUSTE MANUAL'}
                                    </span>
                                  </td>
                                  <td style={{ fontWeight: 'bold', color: tx.type === 'INGRESS' ? 'var(--emerald)' : '#f87171' }}>
                                    {tx.type === 'INGRESS' ? '+' : '-'}${tx.amount.toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>

                    {/* Sidebar Forms */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <div className="card glass-panel" style={{ padding: '1.5rem' }}>
                        <h4 style={{ marginBottom: '1rem', fontSize: '0.9125rem', fontWeight: 'bold' }}>Registrar Pago / Cobro (Caja)</h4>
                        <form onSubmit={handleCreateCashTransaction}>
                          <div className="form-group">
                            <label>Origen de Fondos:</label>
                            <select value={cashSource} onChange={e => {
                              const val = e.target.value as 'SALE' | 'PURCHASE' | 'MANUAL';
                              setCashSource(val);
                              if (val === 'SALE') setCashType('INGRESS');
                              if (val === 'PURCHASE') setCashType('EGRESS');
                            }}>
                              <option value="MANUAL">Ajuste Manual / Varios</option>
                              <option value="SALE">Cobro de Factura Venta</option>
                              <option value="PURCHASE">Pago de Factura Compra</option>
                            </select>
                          </div>
                          {cashSource === 'SALE' && (
                            <div className="form-group">
                              <label>Factura de Venta:</label>
                              <select value={cashInvoiceId} onChange={e => setCashInvoiceId(e.target.value)} required>
                                <option value="">-- Seleccionar Factura --</option>
                                {recoSummary?.invoices?.filter(i => i.balance > 0).map(i => (
                                  <option key={i.id} value={i.id}>{i.clientName} - Saldo: ${i.balance.toFixed(2)}</option>
                                ))}
                              </select>
                            </div>
                          )}
                          {cashSource === 'PURCHASE' && (
                            <div className="form-group">
                              <label>Factura de Compra:</label>
                              <select value={cashPurchaseId} onChange={e => setCashPurchaseId(e.target.value)} required>
                                <option value="">-- Seleccionar Compra --</option>
                                {recoSummary?.purchases?.filter(p => p.balance > 0).map(p => (
                                  <option key={p.id} value={p.id}>{p.providerName} - Saldo: ${p.balance.toFixed(2)}</option>
                                ))}
                              </select>
                            </div>
                          )}
                          <div className="grid-2-form">
                            <div className="form-group">
                              <label>Tipo:</label>
                              <select value={cashType} onChange={e => setCashType(e.target.value as 'INGRESS' | 'EGRESS')} disabled={cashSource !== 'MANUAL'}>
                                <option value="INGRESS">Ingreso (+)</option>
                                <option value="EGRESS">Egreso (-)</option>
                              </select>
                            </div>
                            <div className="form-group">
                              <label>Monto ($):</label>
                              <input type="number" required min={0.01} step="0.01" value={cashAmount} onChange={e => setCashAmount(parseFloat(e.target.value) || 0)} />
                            </div>
                          </div>
                          <div className="form-group">
                            <label>DescripciÃƒÂ³n / Concepto:</label>
                            <input type="text" required={cashSource === 'MANUAL'} value={cashDesc} onChange={e => setCashDesc(e.target.value)} placeholder="Concepto del movimiento" />
                          </div>
                          <button type="submit" className="btn btn-cyan w-full">Guardar y Contabilizar Caja</button>
                        </form>
                      </div>

                      <div className="card glass-panel" style={{ padding: '1.5rem' }}>
                        <h4 style={{ marginBottom: '1rem', fontSize: '0.9125rem', fontWeight: 'bold' }}>Sincronizar Retenciones SRI</h4>
                        <p style={{ fontSize: '9.5px', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                          Descarga las retenciones de impuestos emitidas por tus clientes y las que emitiste a tus proveedores, y concÃƒÂ­lialas.
                        </p>
                        <button onClick={handleSyncWithholdings} className="btn btn-emerald w-full">Sincronizar Retenciones (SRI)</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}


              {/* ── BANKS MODULE: injected within Caja tab ── */}
              {activeTab === 'caja' && (
                <div className="fade-in" style={{ marginTop: '1.5rem' }}>
                  {/* Banks Sub-nav */}
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', flexWrap: 'wrap' }}>
                    <button className={`btn-sm ${bankView === 'list' ? 'status-aura' : ''}`} onClick={() => setBankView('list')}>🏛️ Cuentas Bancarias</button>
                    <button className={`btn-sm ${bankView === 'form' ? 'status-aura' : ''}`} onClick={() => setBankView('form')}>➕ Nueva Cuenta</button>
                    {bankAccounts.length > 0 && (
                      <button className={`btn-sm ${bankView === 'movements' ? 'status-aura' : ''}`} onClick={() => { setBankView('movements'); if (!selectedBankAccountId && bankAccounts.length > 0) setSelectedBankAccountId(bankAccounts[0].id); }}>💳 Movimientos</button>
                    )}
                  </div>

                  {/* Bank Summary Cards */}
                  {bankAccounts.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                      {bankAccounts.map(acc => (
                        <div key={acc.id} className="card glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid var(--cyan)', cursor: 'pointer' }} onClick={() => { setSelectedBankAccountId(acc.id); setBankView('movements'); }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                            <div>
                              <div style={{ fontWeight: 'bold', fontSize: '11px' }}>{acc.bankName}</div>
                              <div style={{ fontSize: '8px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{acc.accountType} ···{acc.accountNumber.slice(-4)}</div>
                            </div>
                            <span className="badge-status status-yes">{acc.accountType}</span>
                          </div>
                          <div style={{ fontSize: '19px', fontWeight: 'bold', color: acc.balance >= 0 ? 'var(--cyan)' : '#f87171' }}>${acc.balance.toFixed(2)}</div>
                          <div style={{ fontSize: '8px', color: 'var(--text-muted)', marginTop: '4px' }}>Saldo disponible</div>
                        </div>
                      ))}
                      <div className="card glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid var(--emerald)', background: 'rgba(16,185,129,0.05)' }}>
                        <div style={{ fontSize: '9px', color: 'var(--text-secondary)', marginBottom: '4px' }}>TOTAL CONSOLIDADO</div>
                        <div style={{ fontSize: '23px', fontWeight: 'bold', color: 'var(--emerald)' }}>${bankAccounts.reduce((s, a) => s + a.balance, 0).toFixed(2)}</div>
                        <div style={{ fontSize: '8px', color: 'var(--text-muted)', marginTop: '4px' }}>{bankAccounts.length} cuenta(s) bancaria(s)</div>
                      </div>
                    </div>
                  )}

                  {/* Bank List View */}
                  {bankView === 'list' && (
                    bankAccounts.length === 0 ? (
                      <div className="table-container glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
                        <span style={{ fontSize: '2.8125rem', display: 'block', marginBottom: '1rem' }}>🏛️</span>
                        <p style={{ color: 'var(--text-secondary)' }}>No hay cuentas bancarias. Agrega una con "Nueva Cuenta".</p>
                        <button className="btn btn-cyan" onClick={() => setBankView('form')} style={{ marginTop: '1rem', padding: '8px 20px', borderRadius: '8px' }}>Agregar Primera Cuenta</button>
                      </div>
                    ) : (
                      <div className="table-container glass-panel" style={{ padding: '1.5rem' }}>
                        <h3 style={{ marginTop: 0 }}>Cuentas Bancarias Registradas</h3>
                        <table>
                          <thead>
                            <tr>
                              <th>Banco</th>
                              <th>Tipo</th>
                              <th>Número de Cuenta</th>
                              <th>Saldo ($)</th>
                              <th>Moneda</th>
                              <th style={{ textAlign: 'right' }}>Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bankAccounts.map(acc => (
                              <tr key={acc.id}>
                                <td><strong>{acc.bankName}</strong></td>
                                <td><span className="badge-status status-aura">{acc.accountType}</span></td>
                                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '9px' }}>{acc.accountNumber}</td>
                                <td style={{ fontWeight: 'bold', color: acc.balance >= 0 ? 'var(--cyan)' : '#f87171' }}>${acc.balance.toFixed(2)}</td>
                                <td>USD</td>
                                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                                  <button className="btn-sm btn-cyan" onClick={() => { setSelectedBankAccountId(acc.id); setBankView('movements'); }} style={{ marginRight: '6px' }}>💳 Movimientos</button>
                                  <button className="btn-sm" onClick={() => handleDeleteBankAccount(acc.id)} style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid #f87171', color: '#f87171', cursor: 'pointer' }}>🗑️</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                  )}

                  {/* New Bank Account Form */}
                  {bankView === 'form' && (
                    <div className="dashboard-grid">
                      <div className="card glass-panel" style={{ padding: '1.5rem' }}>
                        <h4 style={{ marginBottom: '1rem', fontWeight: 'bold' }}>➕ Registrar Cuenta Bancaria</h4>
                        <form onSubmit={handleCreateBankAccount}>
                          <div className="form-group">
                            <label>Nombre del Banco:</label>
                            <input type="text" required value={bankName} onChange={e => setBankName(e.target.value)} placeholder="Ej: Banco Pichincha" list="bank-names-list" />
                            <datalist id="bank-names-list">
                              {['Banco Pichincha', 'Banco del Pacífico', 'Banco Guayaquil', 'Produbanco', 'Banco Internacional', 'Banco Bolivariano', 'Banco del Austro', 'Mutualista Pichincha', 'Cooperativa JEP'].map(b => <option key={b} value={b} />)}
                            </datalist>
                          </div>
                          <div className="grid-2-form">
                            <div className="form-group">
                              <label>Tipo de Cuenta:</label>
                              <select value={bankType} onChange={e => setBankType(e.target.value as 'CORRIENTE' | 'AHORRO')} style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '11px' }}>
                                <option value="CORRIENTE">Corriente</option>
                                <option value="AHORRO">Ahorro</option>
                              </select>
                            </div>
                            <div className="form-group">
                              <label>Número de Cuenta:</label>
                              <input type="text" required value={bankNumber} onChange={e => setBankNumber(e.target.value)} placeholder="Ej: 2200123456" style={{ fontFamily: 'var(--font-mono)' }} />
                            </div>
                          </div>
                          <div className="form-group">
                            <label>Saldo Inicial ($):</label>
                            <input type="number" required min={0} step="0.01" value={bankInitialBalance} onChange={e => setBankInitialBalance(parseFloat(e.target.value) || 0)} />
                          </div>
                          <button type="submit" className="btn btn-cyan w-full">Guardar Cuenta Bancaria</button>
                        </form>
                      </div>
                      <div className="card glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: '1rem' }}>
                        <span style={{ fontSize: '2.8125rem' }}>🏛️</span>
                        <h4 style={{ margin: 0 }}>Gestión Bancaria</h4>
                        <p style={{ fontSize: '10px', color: 'var(--text-secondary)', maxWidth: '280px', lineHeight: '1.5' }}>Registra todas tus cuentas bancarias y sus movimientos. El saldo se actualiza automáticamente con cada depósito o retiro.</p>
                      </div>
                    </div>
                  )}

                  {/* Bank Movements */}
                  {bankView === 'movements' && selectedBankAccountId && (
                    <div className="dashboard-grid">
                      <div className="table-container glass-panel" style={{ padding: '1.5rem', margin: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '10px' }}>
                          <div>
                            <h3 style={{ margin: 0 }}>Movimientos Bancarios</h3>
                            <p style={{ margin: '4px 0 0', fontSize: '9px', color: 'var(--text-muted)' }}>
                              {bankAccounts.find(a => a.id === selectedBankAccountId)?.bankName} — {bankAccounts.find(a => a.id === selectedBankAccountId)?.accountNumber}
                            </p>
                          </div>
                          <select value={selectedBankAccountId} onChange={e => setSelectedBankAccountId(e.target.value)} style={{ padding: '6px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '10px' }}>
                            {bankAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.bankName} (···{acc.accountNumber.slice(-4)})</option>)}
                          </select>
                        </div>
                        {bankMovements.filter(m => m.accountId === selectedBankAccountId).length === 0 ? (
                          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem' }}>No hay movimientos registrados para esta cuenta.</p>
                        ) : (
                          <table>
                            <thead>
                              <tr>
                                <th>Fecha</th>
                                <th>Tipo</th>
                                <th>Descripción</th>
                                <th style={{ textAlign: 'right' }}>Monto ($)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {bankMovements.filter(m => m.accountId === selectedBankAccountId).slice().reverse().map(m => (
                                <tr key={m.id}>
                                  <td style={{ fontSize: '9px' }}>{new Date(m.date).toLocaleDateString()}</td>
                                  <td>
                                    <span className={`badge-status ${m.type === 'DEPOSITO' ? 'status-yes' : m.type === 'TRANSFERENCIA' ? 'status-aura' : 'status-no'}`}>{m.type}</span>
                                  </td>
                                  <td>{m.description}</td>
                                  <td style={{ textAlign: 'right', fontWeight: 'bold', color: m.type === 'DEPOSITO' ? 'var(--emerald)' : '#f87171' }}>
                                    {m.type === 'DEPOSITO' ? '+' : '-'}${m.amount.toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>

                      {/* Movement Form */}
                      <div className="card glass-panel" style={{ padding: '1.5rem' }}>
                        <h4 style={{ marginBottom: '1rem', fontWeight: 'bold' }}>Registrar Movimiento</h4>
                        <form onSubmit={handleCreateBankMovement}>
                          <div className="form-group">
                            <label>Tipo de Movimiento:</label>
                            <select value={movType} onChange={e => setMovType(e.target.value as 'DEPOSITO' | 'RETIRO' | 'TRANSFERENCIA')} style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '11px' }}>
                              <option value="DEPOSITO">Depósito (+)</option>
                              <option value="RETIRO">Retiro (-)</option>
                              <option value="TRANSFERENCIA">Transferencia (-)</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Monto ($):</label>
                            <input type="number" required min={0.01} step="0.01" value={movAmount} onChange={e => setMovAmount(parseFloat(e.target.value) || 0)} />
                          </div>
                          <div className="form-group">
                            <label>Fecha:</label>
                            <input type="date" required value={movDate} onChange={e => setMovDate(e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px', color: 'var(--text-primary)', fontSize: '11px' }} />
                          </div>
                          <div className="form-group">
                            <label>Descripción:</label>
                            <input type="text" required value={movDesc} onChange={e => setMovDesc(e.target.value)} placeholder="Ej: Depósito de clientes del día" />
                          </div>
                          <button type="submit" className={`btn w-full ${movType === 'DEPOSITO' ? 'btn-emerald' : 'btn-indigo'}`}>Registrar {movType}</button>
                        </form>
                        <div style={{ marginTop: '1rem', padding: '10px', background: 'rgba(6,182,212,0.06)', borderRadius: '8px', fontSize: '9px', color: 'var(--text-secondary)' }}>
                          <strong>Saldo actual:</strong> <span style={{ color: 'var(--cyan)' }}>${(bankAccounts.find(a => a.id === selectedBankAccountId)?.balance || 0).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB: CONTABILIDAD / DIARIO */}
              {activeTab === 'contabilidad' && (
                <div className="fade-in">
                  <div className="dashboard-grid-wide">
                    {/* Journal entries */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      {/* Trial balance verification */}
                      <div className="table-container glass-panel" style={{ padding: '1.5rem', margin: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                          <h3 style={{ margin: 0 }}>Balance de ComprobaciÃƒÂ³n Sumas y Saldos</h3>
                          <span className={`badge-status ${Math.abs(totalDebits - totalCredits) < 0.1 ? 'status-yes' : 'status-no'}`}>
                            {Math.abs(totalDebits - totalCredits) < 0.1 ? 'CONTABILIDAD CUADRADA' : 'CUENTAS DESCUADRADAS'}
                          </span>
                        </div>
                        <table>
                          <thead>
                            <tr>
                              <th>CÃƒÂ³digo</th>
                              <th>Cuenta Contable</th>
                              <th>Debe (DÃƒÂ©bitos)</th>
                              <th>Haber (CrÃƒÂ©ditos)</th>
                              <th>Saldo Neto</th>
                            </tr>
                          </thead>
                          <tbody>
                            {trialBalance.map(b => (
                              <tr key={b.code}>
                                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '9px' }}>{b.code}</td>
                                <td><strong>{b.name}</strong></td>
                                <td>${b.debit.toFixed(2)}</td>
                                <td>${b.credit.toFixed(2)}</td>
                                <td style={{ fontWeight: 'bold', color: b.balance >= 0 ? 'var(--cyan)' : '#f87171' }}>
                                  ${Math.abs(b.balance).toFixed(2)} {b.balance >= 0 ? 'Db' : 'Cr'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr style={{ background: 'rgb(0, 0, 0)', fontWeight: 'bold' }}>
                              <td colSpan={2}>TOTALES GENERALES</td>
                              <td style={{ color: 'var(--cyan)' }}>${totalDebits.toFixed(2)}</td>
                              <td style={{ color: 'var(--cyan)' }}>${totalCredits.toFixed(2)}</td>
                              <td style={{ color: 'var(--emerald)' }}>$0.00 (OK)</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>

                      {/* Ledger Entries List */}
                      <div className="table-container glass-panel" style={{ padding: '1.5rem', margin: 0 }}>
                        <h3 style={{ marginTop: 0 }}>Libro Diario (General Ledger)</h3>
                        {accountingLoading && journalEntries.length === 0 ? (
                          <p>Cargando diario contable...</p>
                        ) : journalEntries.length === 0 ? (
                          <p>No se han registrado asientos contables.</p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {journalEntries.map(entry => (
                              <div key={entry.id} className="journal-entry glass-panel" style={{ padding: '1.25rem', border: '1px solid rgb(99, 102, 241)', background: 'rgb(18, 21, 32)' }}>
                                <div className="journal-header" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', borderBottom: '1px solid rgb(255, 255, 255)', paddingBottom: '6px', marginBottom: '8px' }}>
                                  <span><strong>REF:</strong> {entry.id.slice(0, 8).toUpperCase()} ({entry.type})</span>
                                  <span>{new Date(entry.date).toLocaleString()}</span>
                                </div>
                                <h5 style={{ margin: '0 0 10px', fontSize: '10px', fontWeight: '700', color: 'var(--indigo)' }}>{entry.description}</h5>
                                <table className="journal-table">
                                  <thead>
                                    <tr>
                                      <th style={{ textTransform: 'none', background: 'transparent', padding: '4px' }}>CÃƒÂ³digo</th>
                                      <th style={{ textTransform: 'none', background: 'transparent', padding: '4px' }}>Detalle de Cuenta</th>
                                      <th style={{ textTransform: 'none', background: 'transparent', padding: '4px', textAlign: 'right' }}>Debe</th>
                                      <th style={{ textTransform: 'none', background: 'transparent', padding: '4px', textAlign: 'right' }}>Haber</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {entry.lines.map(line => (
                                      <tr key={line.id} style={{ background: 'transparent' }}>
                                        <td style={{ padding: '4px', fontSize: '9px', fontFamily: 'var(--font-mono)', border: 'none' }}>{line.accountCode}</td>
                                        <td style={{ padding: '4px', fontSize: '9px', paddingLeft: line.credit > 0 ? '24px' : '4px', border: 'none' }}>
                                          {line.accountName}
                                        </td>
                                        <td style={{ padding: '4px', fontSize: '9px', textAlign: 'right', border: 'none', fontFamily: 'var(--font-mono)' }}>
                                          {line.debit > 0 ? `$${line.debit.toFixed(2)}` : '-'}
                                        </td>
                                        <td style={{ padding: '4px', fontSize: '9px', textAlign: 'right', border: 'none', fontFamily: 'var(--font-mono)' }}>
                                          {line.credit > 0 ? `$${line.credit.toFixed(2)}` : '-'}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Manual Journal Entry Sidebar */}
                    <div className="card glass-panel" style={{ padding: '1.5rem' }}>
                      <h4 style={{ marginBottom: '1rem', fontSize: '0.9125rem', fontWeight: 'bold' }}>Ingresar Asiento Diario</h4>
                      <form onSubmit={handleCreateManualEntry}>
                        <div className="form-group">
                          <label>DescripciÃƒÂ³n del Asiento:</label>
                          <input type="text" required value={manualEntryDesc} onChange={e => setManualEntryDesc(e.target.value)} placeholder="Ej. DepÃƒÂ³sito inicial del socio" />
                        </div>
                        <div className="form-group">
                          <label>Fecha Contable:</label>
                          <input type="date" required value={manualEntryDate} onChange={e => setManualEntryDate(e.target.value)} style={{ width: '100%', background: 'rgb(0, 0, 0)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', fontSize: '11px', outline: 'none' }} />
                        </div>

                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '8px', marginTop: '8px' }}>
                          <label style={{ fontSize: '8px', color: 'var(--indigo)', marginBottom: '8px', display: 'block' }}>LÃƒÂ­neas de Asiento (Deben cuadrar):</label>
                          {manualEntryLines.map((line, idx) => (
                            <div key={idx} className="journal-entry-line-form">
                              <select value={line.accountCode} onChange={e => {
                                const code = e.target.value;
                                const names: Record<string, string> = {
                                  '1.01.01': 'Caja/Bancos',
                                  '1.01.02': 'Cuentas por Cobrar Clientes',
                                  '1.01.03': 'CrÃƒÂ©dito Tributario IVA (Compras)',
                                  '1.01.04': 'Inventario de MercaderÃƒÂ­as',
                                  '1.02.01': 'DepreciaciÃƒÂ³n Acumulada Activos Fijos',
                                  '2.01.01': 'Cuentas por Pagar Proveedores',
                                  '2.01.03': 'IVA Ventas Cobrado',
                                  '3.01.01': 'Capital Social (Patrimonio)',
                                  '4.01.01': 'Ventas de Servicios/MercaderÃƒÂ­as',
                                  '5.01.01': 'Costo de Ventas / Gasto Compra',
                                  '5.01.02': 'Gasto DepreciaciÃƒÂ³n Activos Fijos',
                                  '5.01.03': 'Otros Gastos / Ajuste Caja'
                                };
                                const updated = [...manualEntryLines];
                                updated[idx].accountCode = code;
                                updated[idx].accountName = names[code] || 'Cuenta Contable';
                                setManualEntryLines(updated);
                              }}>
                                <option value="1.01.01">1.01.01 Caja/Bancos</option>
                                <option value="1.01.02">1.01.02 Cuentas Cobrar</option>
                                <option value="1.01.03">1.01.03 CrÃƒÂ©dito IVA</option>
                                <option value="1.01.04">1.01.04 Inventario</option>
                                <option value="1.02.01">1.02.01 Depr. Acumulada</option>
                                <option value="2.01.01">2.01.01 Cuentas Pagar</option>
                                <option value="2.01.03">2.01.03 IVA Ventas</option>
                                <option value="3.01.01">3.01.01 Capital Social</option>
                                <option value="4.01.01">4.01.01 Ventas</option>
                                <option value="5.01.01">5.01.01 Costo/Gasto Compra</option>
                                <option value="5.01.02">5.01.02 Gasto DepreciaciÃƒÂ³n</option>
                                <option value="5.01.03">5.01.03 Otros Gastos</option>
                              </select>
                              <input type="number" min={0} step="0.01" value={line.debit} onChange={e => {
                                const val = parseFloat(e.target.value) || 0;
                                const updated = [...manualEntryLines];
                                updated[idx].debit = val;
                                if (val > 0) updated[idx].credit = 0;
                                setManualEntryLines(updated);
                              }} placeholder="Debe" />
                              <input type="number" min={0} step="0.01" value={line.credit} onChange={e => {
                                const val = parseFloat(e.target.value) || 0;
                                const updated = [...manualEntryLines];
                                updated[idx].credit = val;
                                if (val > 0) updated[idx].debit = 0;
                                setManualEntryLines(updated);
                              }} placeholder="Haber" />
                            </div>
                          ))}
                          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                            <button type="button" className="btn-sm w-full" onClick={() => {
                              setManualEntryLines([...manualEntryLines, { accountCode: '5.01.03', accountName: 'Otros Gastos / Ajuste Caja', debit: 0, credit: 0 }]);
                            }}>+ LÃƒÂ­nea</button>
                            <button type="button" className="btn-sm w-full status-no" onClick={() => {
                              if (manualEntryLines.length > 2) {
                                setManualEntryLines(manualEntryLines.slice(0, -1));
                              }
                            }}>Remover</button>
                          </div>
                        </div>
                        <button type="submit" className="btn btn-indigo w-full" style={{ marginTop: '1.25rem' }}>Cuadrar y Registrar Asiento</button>
                      </form>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: REPORTES SRI */}
              {activeTab === 'sri' && (
                <div className="fade-in">
                  {/* SRI Sub-navigation tabs */}
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                    <button className={`btn-sm ${sriSubTab === 'formulario' ? 'status-aura' : ''}`} onClick={() => setSriSubTab('formulario')}>
                      Ã°Å¸â€œÅ  Formulario 104 (IVA)
                    </button>
                    <button className={`btn-sm ${sriSubTab === 'ats' ? 'status-aura' : ''}`} onClick={() => setSriSubTab('ats')}>
                      Ã°Å¸â€œÂ¦ Anexo Transaccional (ATS)
                    </button>
                    <button className={`btn-sm ${sriSubTab === 'config' ? 'status-aura' : ''}`} onClick={() => setSriSubTab('config')}>
                      Ã¢Å¡â„¢Ã¯Â¸Â ConfiguraciÃƒÂ³n SRI & Firma
                    </button>
                  </div>

                  {sriSubTab === 'formulario' && (
                    <div className="table-container glass-panel fade-in" style={{ padding: '1.5rem', margin: 0 }}>
                      <h3 style={{ marginTop: 0 }}>Simulador del Formulario 104 (IVA Ecuador)</h3>
                      <p style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                        CÃƒÂ¡lculo en tiempo real de los casilleros de ventas y adquisiciones del SRI segÃƒÂºn facturaciÃƒÂ³n electrÃƒÂ³nica emitida y compras sincronizadas.
                      </p>

                      <table style={{ marginBottom: '1.5rem' }}>
                        <thead>
                          <tr>
                            <th>Casillero</th>
                            <th>DescripciÃƒÂ³n del Rubro</th>
                            <th style={{ textAlign: 'right' }}>Valor Base Imponible</th>
                            <th style={{ textAlign: 'right' }}>Impuesto Generado (IVA {globalIvaRate}%)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>411</td>
                            <td>Ventas Locales gravadas con tarifa {globalIvaRate}% IVA</td>
                            <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>${salesWithIva.toFixed(2)}</td>
                            <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--cyan)' }}>${salesTaxCollected.toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td>412</td>
                            <td>Ventas Locales gravadas con tarifa 0% IVA</td>
                            <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>${salesWithoutIva.toFixed(2)}</td>
                            <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>$0.00</td>
                          </tr>
                          <tr style={{ fontWeight: 'bold', background: 'rgb(0, 0, 0)' }}>
                            <td>499</td>
                            <td>TOTAL VENTAS Y RENDIMIENTOS</td>
                            <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>${(salesWithIva + salesWithoutIva).toFixed(2)}</td>
                            <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--cyan)' }}>${salesTaxCollected.toFixed(2)}</td>
                          </tr>
                          <tr style={{ height: '15px' }}><td colSpan={4} style={{ border: 'none' }}></td></tr>
                          <tr>
                            <td>511</td>
                            <td>Adquisiciones locales gravadas con tarifa {globalIvaRate}% IVA</td>
                            <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>${purchasesWithIva.toFixed(2)}</td>
                            <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--emerald)' }}>${purchasesTaxPaid.toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td>512</td>
                            <td>Adquisiciones locales gravadas con tarifa 0% IVA</td>
                            <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>${purchasesWithoutIva.toFixed(2)}</td>
                            <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>$0.00</td>
                          </tr>
                          <tr style={{ fontWeight: 'bold', background: 'rgb(0, 0, 0)' }}>
                            <td>599</td>
                            <td>TOTAL ADQUISICIONES Y COMPRAS</td>
                            <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>${(purchasesWithIva + purchasesWithoutIva).toFixed(2)}</td>
                            <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--emerald)' }}>${purchasesTaxPaid.toFixed(2)}</td>
                          </tr>
                        </tbody>
                      </table>

                      <div className="card glass-panel" style={{ padding: '1.25rem', border: '1px solid rgb(99, 102, 241)', background: 'rgb(99, 102, 241)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <strong style={{ fontSize: '12px', color: 'var(--text-primary)' }}>IMPUESTO A LIQUIDAR (Casillero 601 / 602):</strong>
                            <p style={{ fontSize: '8px', color: 'var(--text-muted)', margin: '4px 0 0' }}>FÃƒÂ³rmula: IVA Cobrado en Ventas - IVA Pagado en Compras (CrÃƒÂ©dito Tributario)</p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span className={`badge-status ${sriVatPayable >= 0 ? 'status-no' : 'status-yes'}`} style={{ fontSize: '12px', padding: '6px 12px' }}>
                              {sriVatPayable >= 0 ? `A PAGAR: $${sriVatPayable.toFixed(2)}` : `CRÃƒâ€°DITO FISCAL: $${Math.abs(sriVatPayable).toFixed(2)}`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {sriSubTab === 'ats' && (
                    <div className="card glass-panel flex-column fade-in" style={{ padding: '1.5rem', margin: 0 }}>
                      <h3 style={{ marginTop: 0 }}>Generador del Anexo Transaccional (ATS)</h3>
                      <p style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                        Estructura oficial XML/JSON para la declaraciÃƒÂ³n simplificada del anexo transaccional del SRI. Contiene datos de ventas y compras del periodo.
                      </p>
                      <div className="console-box" style={{ flex: 1, minHeight: '350px' }}>
                        <div className="console-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>ats_decl_2026.json</span>
                          <button className="btn-sm" onClick={() => {
                            navigator.clipboard.writeText(atsJson);
                            alert('Copiado al portapapeles.');
                          }}>Copiar</button>
                        </div>
                        <pre style={{ margin: 0, padding: '10px', fontSize: '8px', fontFamily: 'var(--font-mono)', overflowY: 'auto', maxHeight: '380px', color: '#67e8f9' }}>
                          {atsJson}
                        </pre>
                      </div>
                    </div>
                  )}

                  {sriSubTab === 'config' && (
                    <div className="grid-2 fade-in">
                      <div className="flex-column" style={{ gap: '1.5rem' }}>
                        {/* SelecciÃƒÂ³n del Entorno SRI SOAP */}
                        <div className="card glass-panel" style={{ padding: '1.5rem', margin: 0 }}>
                          <h3 style={{ marginTop: 0 }}>Modo de ConexiÃƒÂ³n SOAP</h3>
                          <p style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                            Selecciona el entorno para interactuar con los servicios web (SOAP) del SRI.
                          </p>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            {/* OpciÃƒÂ³n 1: Simulador Local (Demo) */}
                            <div
                              onClick={() => {
                                setSriSimulate(true);
                                setSriEnvironment('1');
                              }}
                              className="card glass-panel card-compact"
                              style={{
                                cursor: 'pointer',
                                border: sriSimulate
                                  ? '2px solid var(--cyan)'
                                  : '1px solid var(--border)',
                                background: sriSimulate
                                  ? 'rgb(6, 182, 212)'
                                  : 'rgb(0, 0, 0)',
                                boxShadow: sriSimulate
                                  ? '0 0 15px var(--cyan-glow)'
                                  : 'none',
                                transition: 'all 0.3s ease',
                                position: 'relative',
                                display: 'flex',
                                gap: '12px',
                                alignItems: 'center'
                              }}
                            >
                              <div style={{ fontSize: '17px' }}>Ã°Å¸Â§Âª</div>
                              <div style={{ flex: 1 }}>
                                <h4 style={{ margin: '0 0 2px 0', fontSize: '11px', fontWeight: 'bold', color: sriSimulate ? 'var(--cyan)' : 'var(--text-primary)' }}>
                                  Simulador SOAP (Demo de Pruebas)
                                </h4>
                                <p style={{ fontSize: '8px', color: 'var(--text-muted)', lineHeight: '1.3', margin: 0 }}>
                                  Respuestas locales inmediatas. No requiere conexiÃƒÂ³n a internet, firma electrÃƒÂ³nica real ni genera obligaciones tributarias.
                                </p>
                              </div>
                              {sriSimulate && (
                                <span style={{ background: 'var(--cyan)', color: '#090a0f', fontSize: '6px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
                                  Activo
                                </span>
                              )}
                            </div>

                            {/* OpciÃƒÂ³n 2: SOAP SRI - Entorno de Pruebas */}
                            <div
                              onClick={() => {
                                setSriSimulate(false);
                                setSriEnvironment('1');
                              }}
                              className="card glass-panel card-compact"
                              style={{
                                cursor: 'pointer',
                                border: (!sriSimulate && sriEnvironment === '1')
                                  ? '2px solid var(--indigo)'
                                  : '1px solid var(--border)',
                                background: (!sriSimulate && sriEnvironment === '1')
                                  ? 'rgb(99, 102, 241)'
                                  : 'rgb(0, 0, 0)',
                                boxShadow: (!sriSimulate && sriEnvironment === '1')
                                  ? '0 0 15px var(--indigo-glow)'
                                  : 'none',
                                transition: 'all 0.3s ease',
                                position: 'relative',
                                display: 'flex',
                                gap: '12px',
                                alignItems: 'center'
                              }}
                            >
                              <div style={{ fontSize: '17px' }}>Ã°Å¸â€œÂ¡</div>
                              <div style={{ flex: 1 }}>
                                <h4 style={{ margin: '0 0 2px 0', fontSize: '11px', fontWeight: 'bold', color: (!sriSimulate && sriEnvironment === '1') ? 'var(--indigo)' : 'var(--text-primary)' }}>
                                  SOAP SRI - Entorno de Pruebas
                                </h4>
                                <p style={{ fontSize: '8px', color: 'var(--text-muted)', lineHeight: '1.3', margin: 0 }}>
                                  ConexiÃƒÂ³n real con el servidor de pruebas (`celcer.sri.gob.ec`). Valida tu firma electrÃƒÂ³nica (.p12) sin valor tributario legal.
                                </p>
                              </div>
                              {(!sriSimulate && sriEnvironment === '1') && (
                                <span style={{ background: 'var(--indigo)', color: '#ffffff', fontSize: '6px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
                                  Activo
                                </span>
                              )}
                            </div>

                            {/* OpciÃƒÂ³n 3: SOAP SRI - Entorno de ProducciÃƒÂ³n (Real) */}
                            <div
                              onClick={() => {
                                setSriSimulate(false);
                                setSriEnvironment('2');
                              }}
                              className="card glass-panel card-compact"
                              style={{
                                cursor: 'pointer',
                                border: (!sriSimulate && sriEnvironment === '2')
                                  ? '2px solid var(--emerald)'
                                  : '1px solid var(--border)',
                                background: (!sriSimulate && sriEnvironment === '2')
                                  ? 'rgb(16, 185, 129)'
                                  : 'rgb(0, 0, 0)',
                                boxShadow: (!sriSimulate && sriEnvironment === '2')
                                  ? '0 0 15px var(--emerald-glow)'
                                  : 'none',
                                transition: 'all 0.3s ease',
                                position: 'relative',
                                display: 'flex',
                                gap: '12px',
                                alignItems: 'center'
                              }}
                            >
                              <div style={{ fontSize: '17px' }}>Ã°Å¸Ââ€ºÃ¯Â¸Â</div>
                              <div style={{ flex: 1 }}>
                                <h4 style={{ margin: '0 0 2px 0', fontSize: '11px', fontWeight: 'bold', color: (!sriSimulate && sriEnvironment === '2') ? 'var(--emerald)' : 'var(--text-primary)' }}>
                                  SOAP SRI - Entorno de ProducciÃƒÂ³n (Principal y Real)
                                </h4>
                                <p style={{ fontSize: '8px', color: 'var(--text-muted)', lineHeight: '1.3', margin: 0 }}>
                                  ConexiÃƒÂ³n en vivo con el servidor oficial (`cel.sri.gob.ec`). Emite facturas reales con plena validez legal y tributaria.
                                </p>
                              </div>
                              {(!sriSimulate && sriEnvironment === '2') && (
                                <span style={{ background: 'var(--emerald)', color: '#090a0f', fontSize: '6px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
                                  Activo Real
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* ConfiguraciÃƒÂ³n especÃƒÂ­fica segÃƒÂºn la selecciÃƒÂ³n */}
                        <div className="card glass-panel" style={{ padding: '1.5rem', margin: 0 }}>
                          {sriConfigLoading ? (
                            <p>Cargando configuraciÃƒÂ³n...</p>
                          ) : sriSimulate ? (
                            /* Interfaz para el Simulador */
                            <div className="fade-in">
                              <h4 style={{ margin: '0 0 10px', color: 'var(--cyan)' }}>Ã°Å¸â€Â¬ Simulador SOAP Activo</h4>
                              <p style={{ fontSize: '9px', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                                El sistema estÃƒÂ¡ configurado en modo educativo y de pruebas locales. Las facturas emitidas simularÃƒÂ¡n su firma y el flujo SOAP del SRI de manera automÃƒÂ¡tica.
                              </p>

                              <div style={{ background: 'rgb(6, 182, 212)', border: '1px solid rgb(6, 182, 212)', borderRadius: '8px', padding: '12px', marginBottom: '1.5rem' }}>
                                <h5 style={{ margin: '0 0 6px', fontSize: '9px', fontWeight: 'bold', color: 'var(--cyan)' }}>GuÃƒÂ­a RÃƒÂ¡pida de InteracciÃƒÂ³n:</h5>
                                <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '8px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  <li>DirÃƒÂ­gete a la pestaÃƒÂ±a <strong>Control de Ventas</strong>.</li>
                                  <li>Ingresa un cliente ficticio y el monto de la venta.</li>
                                  <li>Haz clic en <strong>Firmar y Transmitir al SRI</strong>.</li>
                                  <li>La factura se autorizarÃƒÂ¡ de inmediato, calculando el IVA.</li>
                                </ul>
                              </div>

                              <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                  type="button"
                                  className="btn btn-cyan"
                                  onClick={() => { setShowTutorial(true); setTutorialStep(1); }}
                                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '10px' }}
                                >
                                  Ã°Å¸â€œâ€“ Iniciar tutorial
                                </button>

                                <button
                                  type="button"
                                  className="btn"
                                  onClick={handleSaveSriConfig}
                                  style={{ border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-primary)' }}
                                  disabled={sriSaving}
                                >
                                  {sriSaving ? 'Guardando...' : 'Guardar ConfiguraciÃƒÂ³n'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* Formulario para el Sistema Real (Pruebas / ProducciÃƒÂ³n) */
                            <form onSubmit={handleSaveSriConfig} className="fade-in">
                              <h4 style={{ margin: '0 0 10px', color: sriEnvironment === '2' ? 'var(--emerald)' : 'var(--indigo)' }}>
                                {sriEnvironment === '2' ? 'Ã¢Å¡â„¢Ã¯Â¸Â ParÃƒÂ¡metros del Entorno de ProducciÃƒÂ³n' : 'Ã¢Å¡â„¢Ã¯Â¸Â ParÃƒÂ¡metros del Entorno de Pruebas'}
                              </h4>
                              <p style={{ fontSize: '9px', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                                Introduce tu firma electrÃƒÂ³nica para la conexiÃƒÂ³n real al servidor SOAP del SRI.
                              </p>

                              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem', marginTop: '1.25rem' }}>
                                <h5 style={{ margin: '0 0 8px', fontSize: '10px', fontWeight: 'bold' }}>Firma ElectrÃƒÂ³nica (Formato .p12)</h5>
                                <p style={{ fontSize: '8px', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                                  Archivo pkcs12 necesario para firmar digitalmente cada documento XML bajo el estÃƒÂ¡ndar XAdES-BES.
                                </p>

                                <div className="form-group" style={{ marginBottom: '1rem' }}>
                                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '9px' }}>Archivo de Firma (.p12):</label>
                                  <input
                                    type="file"
                                    accept=".p12"
                                    onChange={handleP12FileChange}
                                    style={{
                                      background: 'rgb(0, 0, 0)',
                                      border: '1px dashed var(--border)',
                                      borderRadius: '8px',
                                      padding: '10px',
                                      color: 'var(--text-primary)',
                                      width: '100%',
                                    }}
                                  />
                                  <span style={{ fontSize: '8px', color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
                                    {sriConfigHasSignature ? 'Ã¢Å“â€Ã¯Â¸Â Firma guardada anteriormente en el servidor.' : 'Ã¢Å¡Â Ã¯Â¸Â No se ha subido ninguna firma electrÃƒÂ³nica aÃƒÂºn.'}
                                  </span>
                                </div>

                                <div className="form-group">
                                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '9px' }}>ContraseÃƒÂ±a de la Firma:</label>
                                  <input
                                    type="password"
                                    value={sriSignaturePassword}
                                    onChange={(e) => setSriSignaturePassword(e.target.value)}
                                    placeholder={sriConfigHasSignature ? 'Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢' : 'Ingresa la contraseÃƒÂ±a del certificado'}
                                    style={{ width: '100%', padding: '10px', background: 'rgb(0, 0, 0)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                                  />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                                  <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '9px' }}>CÃƒÂ³digo de Establecimiento:</label>
                                    <input
                                      type="text"
                                      value={sriEstablishmentCode}
                                      onChange={(e) => setSriEstablishmentCode(e.target.value.slice(0, 3))}
                                      placeholder="001"
                                      style={{ width: '100%', padding: '10px', background: 'rgb(0, 0, 0)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                                    />
                                  </div>
                                  <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '9px' }}>Punto de EmisiÃƒÂ³n:</label>
                                    <input
                                      type="text"
                                      value={sriEmissionPoint}
                                      onChange={(e) => setSriEmissionPoint(e.target.value.slice(0, 3))}
                                      placeholder="002"
                                      style={{ width: '100%', padding: '10px', background: 'rgb(0, 0, 0)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                                    />
                                  </div>
                                </div>

                                <div className="form-group" style={{ marginTop: '1rem' }}>
                                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '9px' }}>DirecciÃƒÂ³n de la Sucursal/Matriz:</label>
                                  <input
                                    type="text"
                                    value={sriEstablishmentAddress}
                                    onChange={(e) => setSriEstablishmentAddress(e.target.value)}
                                    placeholder="Av. de los Granados N45 y Eloy Alfaro, Quito"
                                    style={{ width: '100%', padding: '10px', background: 'rgb(0, 0, 0)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                                  />
                                </div>

                                <div style={{ marginTop: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <input
                                    type="checkbox"
                                    id="isBranchCheckbox"
                                    checked={sriIsBranch}
                                    onChange={(e) => setSriIsBranch(e.target.checked)}
                                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                  />
                                  <label htmlFor="isBranchCheckbox" style={{ fontSize: '10px', cursor: 'pointer', color: 'var(--text-primary)' }}>
                                    Ã‚Â¿Es una sucursal de una empresa principal?
                                  </label>
                                </div>

                                {sriIsBranch && (
                                  <div className="form-group" style={{ marginTop: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '9px' }}>RUC de la Empresa Principal/Matriz:</label>
                                    <input
                                      type="text"
                                      value={sriParentCompanyRuc}
                                      onChange={(e) => setSriParentCompanyRuc(e.target.value.slice(0, 13))}
                                      placeholder="1792455894001"
                                      style={{ width: '100%', padding: '10px', background: 'rgb(0, 0, 0)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                                    />
                                  </div>
                                )}
                              </div>

                              <button
                                type="submit"
                                className={`btn w-full ${sriEnvironment === '2' ? 'btn-emerald' : 'btn-indigo'}`}
                                style={{ marginTop: '1.5rem' }}
                                disabled={sriSaving}
                              >
                                {sriSaving ? 'Guardando...' : `Guardar ConfiguraciÃƒÂ³n de ${sriEnvironment === '2' ? 'ProducciÃƒÂ³n' : 'Pruebas'}`}
                              </button>
                            </form>
                          )}
                        </div>
                      </div>

                      {/* Lado derecho: Estado del SOAP y DiagnÃƒÂ³stico */}
                      <div className="card glass-panel" style={{ padding: '1.5rem', margin: 0, display: 'flex', flexDirection: 'column' }}>
                        <h3 style={{ marginTop: 0 }}>Estado del SOAP y DiagnÃƒÂ³stico</h3>
                        <p style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                          Detalles sobre los endpoints y pruebas de conexiÃƒÂ³n fÃƒÂ­sica con el SRI.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem', flex: 1, maxWidth: '700px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                            <span style={{ fontWeight: '600' }}>WSDL RecepciÃƒÂ³n:</span>
                            <span style={{ fontSize: '8px', fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>
                              {sriSimulate ? 'Simulador Local (N/A)' : (sriEnvironment === '2' ? 'https://cel.sri.gob.ec/...' : 'https://celcer.sri.gob.ec/...')}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                            <span style={{ fontWeight: '600' }}>WSDL AutorizaciÃƒÂ³n:</span>
                            <span style={{ fontSize: '8px', fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>
                              {sriSimulate ? 'Simulador Local (N/A)' : (sriEnvironment === '2' ? 'https://cel.sri.gob.ec/...' : 'https://celcer.sri.gob.ec/...')}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                            <span style={{ fontWeight: '600' }}>ConexiÃƒÂ³n SRI SOAP:</span>
                            <span>
                              {sriSimulate ? (
                                <span className="badge-status status-aura">MOCK SIMULADO</span>
                              ) : sriEnvironment === '2' ? (
                                <span className="badge-status status-yes" style={{ background: 'rgb(16, 185, 129)', color: 'var(--emerald)', border: '1px solid rgb(16, 185, 129)' }}>PRODUCCIÃƒâ€œN REAL</span>
                              ) : (
                                <span className="badge-status status-yes">PRUEBAS REAL</span>
                              )}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                            <span style={{ fontWeight: '600' }}>Certificado XAdES-BES:</span>
                            <span>
                              {sriSimulate ? (
                                <span className="badge-status status-aura">MOCK EN MEMORIA</span>
                              ) : sriConfigHasSignature ? (
                                <span className="badge-status status-yes">CARGADO (.p12)</span>
                              ) : (
                                <span className="badge-status status-partial">MOCK EN MEMORIA</span>
                              )}
                            </span>
                          </div>
                        </div>

                        <div style={{ marginTop: '2rem', padding: '1.25rem', borderRadius: '8px', background: 'rgb(0, 0, 0)', fontSize: '9px', border: '1px solid var(--border)', maxWidth: '700px' }}>
                          <strong style={{ display: 'block', marginBottom: '8px', color: 'var(--text-primary)' }}>GuÃƒÂ­a de ComprobaciÃƒÂ³n:</strong>
                          <ol style={{ paddingLeft: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {sriSimulate ? (
                              <>
                                <li>AsegÃƒÂºrate de que la configuraciÃƒÂ³n estÃƒÂ© guardada.</li>
                                <li>Inicia el tutorial con el botÃƒÂ³n <strong>"Iniciar tutorial"</strong> para entender el flujo completo.</li>
                                <li>Ve al panel de Ventas y emite una nueva factura para ver la simulaciÃƒÂ³n en acciÃƒÂ³n.</li>
                              </>
                            ) : sriEnvironment === '2' ? (
                              <>
                                <li>EstÃƒÂ¡s en el entorno de ProducciÃƒÂ³n Real.</li>
                                <li>Sube tu archivo de firma electrÃƒÂ³nica `.p12` real y digita su contraseÃƒÂ±a.</li>
                                <li>Toda factura emitida aquÃƒÂ­ se enviarÃƒÂ¡ y registrarÃƒÂ¡ en la base de datos oficial del SRI.</li>
                              </>
                            ) : (
                              <>
                                <li>EstÃƒÂ¡s en el entorno de Pruebas Real.</li>
                                <li>Sube tu archivo de firma electrÃƒÂ³nica `.p12` (incluso de pruebas/real) y digita su contraseÃƒÂ±a.</li>
                                <li>Ve al panel de Ventas y emite una nueva factura. El sistema validarÃƒÂ¡ la estructura contra el SRI de pruebas.</li>
                              </>
                            )}
                          </ol>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}


              {/* TAB: FIXED ASSETS */}
              {activeTab === 'assets' && (
                <div className="fade-in">
                  <div className="dashboard-grid">
                    {/* Assets list */}
                    <div className="table-container glass-panel" style={{ padding: '1.5rem', margin: 0 }}>
                      <h3>Activos Fijos Registrados</h3>
                      {assetsLoading ? (
                        <p>Cargando activos...</p>
                      ) : assets.length === 0 ? (
                        <p>No hay activos registrados.</p>
                      ) : (
                        <table>
                          <thead>
                            <tr>
                              <th>Nombre del Activo</th>
                              <th>Valor Compra</th>
                              <th>Valor Residual</th>
                              <th>Vida ÃƒÅ¡til (AÃƒÂ±os)</th>
                              <th>DepreciaciÃƒÂ³n Mensual</th>
                              <th>Fecha Registro</th>
                            </tr>
                          </thead>
                          <tbody>
                            {assets.map(a => {
                              const deprBase = a.value - a.residualValue;
                              const monthlyDepr = deprBase / (a.yearsOfLife * 12);
                              return (
                                <tr key={a.id}>
                                  <td><strong>{a.name}</strong></td>
                                  <td>${a.value.toFixed(2)}</td>
                                  <td>${a.residualValue.toFixed(2)}</td>
                                  <td>{a.yearsOfLife} aÃƒÂ±os</td>
                                  <td style={{ color: 'var(--indigo)', fontWeight: 'bold' }}>
                                    ${monthlyDepr.toFixed(2)} / mes
                                  </td>
                                  <td style={{ fontSize: '9px' }}>
                                    {new Date(a.purchaseDate).toLocaleDateString()}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>

                    {/* Sidebar forms */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <div className="card glass-panel" style={{ padding: '1.5rem' }}>
                        <h4 style={{ marginBottom: '1rem', fontSize: '0.9125rem', fontWeight: 'bold' }}>Registrar Activo Fijo</h4>
                        <form onSubmit={handleCreateAsset}>
                          <div className="form-group">
                            <label>Nombre del Activo:</label>
                            <input type="text" required value={newAssetName} onChange={e => setNewAssetName(e.target.value)} placeholder="Ej: Servidor Dell PowerEdge" />
                          </div>
                          <div className="grid-2-form">
                            <div className="form-group">
                              <label>Valor de AdquisiciÃƒÂ³n ($):</label>
                              <input type="number" required min={0.01} step="0.01" value={newAssetValue} onChange={e => setNewAssetValue(parseFloat(e.target.value) || 0)} />
                            </div>
                            <div className="form-group">
                              <label>Valor Residual ($):</label>
                              <input type="number" required min={0} step="0.01" value={newAssetResidual} onChange={e => setNewAssetResidual(parseFloat(e.target.value) || 0)} />
                            </div>
                          </div>
                          <div className="form-group">
                            <label>Tipo de Activo (Norma LORTI):</label>
                            <select value={newAssetYears} onChange={e => setNewAssetYears(parseInt(e.target.value) || 3)}>
                              <option value="3">Equipos de CÃƒÂ³mputo (3 aÃƒÂ±os - 33.3% anual)</option>
                              <option value="5">VehÃƒÂ­culos / LogÃƒÂ­stica (5 aÃƒÂ±os - 20% anual)</option>
                              <option value="10">Maquinarias / Muebles (10 aÃƒÂ±os - 10% anual)</option>
                            </select>
                          </div>
                          <button type="submit" className="btn btn-indigo w-full">Calcular y Registrar</button>
                        </form>
                      </div>

                      <div className="card glass-panel" style={{ padding: '1.5rem' }}>
                        <h4 style={{ marginBottom: '1rem', fontSize: '0.9125rem', fontWeight: 'bold' }}>DepreciaciÃƒÂ³n Automatizada</h4>
                        <p style={{ fontSize: '9px', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                          Calcula y genera de forma automÃƒÂ¡tica los asientos contables mensuales de depreciaciÃƒÂ³n acumulada para todos los activos segÃƒÂºn el reglamento de la LORTI.
                        </p>
                        <button onClick={handleRunDepreciation} className="btn btn-indigo w-full">
                          Ejecutar DepreciaciÃƒÂ³n Mensual
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Depreciation logs */}
                  <div className="table-container glass-panel" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
                    <h3>Registro Diario de DepreciaciÃƒÂ³n Acumulada</h3>
                    {depreciationsLoading ? (
                      <p>Cargando registros...</p>
                    ) : depreciations.length === 0 ? (
                      <p>No se han registrado asientos de depreciaciÃƒÂ³n mensual.</p>
                    ) : (
                      <table>
                        <thead>
                          <tr>
                            <th>PerÃƒÂ­odo</th>
                            <th>Activo Fijo</th>
                            <th>Gasto Amortizado ($)</th>
                            <th>Fecha Ajuste</th>
                            <th>Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {depreciations.map((dep) => (
                            <tr key={dep.id}>
                              <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>{dep.period}</td>
                              <td><strong>{dep.asset?.name}</strong></td>
                              <td style={{ color: 'var(--indigo)', fontWeight: 'bold' }}>${dep.amount.toFixed(2)}</td>
                              <td>{new Date(dep.date).toLocaleString()}</td>
                              <td><span className="badge-status status-yes">CONTABILIZADO</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}

              {/* TAB: ADMINISTRATION & COMPANY MANAGEMENT */}
              {activeTab === 'admin' && (
                <div className="fade-in animate-slideup">
                  {/* Sub tab content: GestiÃƒÂ³n Empresas */}
                  {adminSubTab === 'empresas' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      {/* Top Action Buttons */}
                      <div className="glass-panel" style={{
                        padding: '1rem 1.5rem',
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        borderRadius: '12px',
                        marginBottom: '1rem',
                        background: 'rgb(15, 23, 42)'
                      }}>
                        <button
                          onClick={() => setCompanyViewMode('list')}
                          disabled={companyViewMode === 'list'}
                          className="btn-sm"
                          style={{
                            background: companyViewMode === 'list' ? 'rgb(255, 255, 255)' : 'rgb(255, 255, 255)',
                            border: '1px solid rgb(255, 255, 255)',
                            color: companyViewMode === 'list' ? 'var(--text-muted)' : 'var(--text-primary)',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            cursor: companyViewMode === 'list' ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontWeight: '600',
                            fontSize: '10px'
                          }}
                        >
                          Ã¢Â¬â€¦Ã¯Â¸Â Volver
                        </button>

                        <button
                          onClick={handleSaveCompany}
                          disabled={companyViewMode === 'list'}
                          className="btn-sm"
                          style={{
                            background: companyViewMode === 'list' ? 'rgb(255, 255, 255)' : 'var(--cyan)',
                            border: 'none',
                            color: companyViewMode === 'list' ? 'var(--text-muted)' : '#070a13',
                            padding: '8px 18px',
                            borderRadius: '8px',
                            cursor: companyViewMode === 'list' ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontWeight: '700',
                            fontSize: '10px',
                            boxShadow: companyViewMode === 'list' ? 'none' : '0 0 12px rgb(6, 182, 212)'
                          }}
                        >
                          Ã°Å¸â€™Â¾ Guardar
                        </button>

                        <button
                          onClick={handleNewCompanyClick}
                          disabled={companyViewMode === 'form' && companyFormAction === 'create'}
                          className="btn-sm"
                          style={{
                            background: (companyViewMode === 'form' && companyFormAction === 'create') ? 'rgb(255, 255, 255)' : 'rgb(6, 182, 212)',
                            border: '1px solid rgb(6, 182, 212)',
                            color: (companyViewMode === 'form' && companyFormAction === 'create') ? 'var(--text-muted)' : 'var(--cyan)',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            cursor: (companyViewMode === 'form' && companyFormAction === 'create') ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontWeight: '600',
                            fontSize: '10px'
                          }}
                        >
                          Ã¢Å¾â€¢ Nuevo
                        </button>

                        <button
                          onClick={handleEditCompanySelect}
                          disabled={!selectedCompany || (companyViewMode === 'form' && companyFormAction === 'edit')}
                          className="btn-sm"
                          style={{
                            background: (!selectedCompany || (companyViewMode === 'form' && companyFormAction === 'edit')) ? 'rgb(255, 255, 255)' : 'rgb(16, 185, 129)',
                            border: '1px solid rgb(16, 185, 129)',
                            color: (!selectedCompany || (companyViewMode === 'form' && companyFormAction === 'edit')) ? 'var(--text-muted)' : '#10b981',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            cursor: (!selectedCompany || (companyViewMode === 'form' && companyFormAction === 'edit')) ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontWeight: '600',
                            fontSize: '10px'
                          }}
                        >
                          Ã¢Å“ÂÃ¯Â¸Â Modificar
                        </button>
                      </div>

                      {/* Main panel for companies */}
                      {companyViewMode === 'list' ? (
                        <div className="table-container glass-panel" style={{ padding: '1.5rem', margin: 0 }}>
                          <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Empresas Registradas</h3>
                          {companiesLoading ? (
                            <p>Cargando empresas...</p>
                          ) : companies.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                              <p style={{ color: 'var(--text-secondary)' }}>No hay empresas registradas.</p>
                              <button onClick={handleNewCompanyClick} className="btn btn-cyan" style={{ marginTop: '1rem', padding: '8px 20px', borderRadius: '8px' }}>
                                Crear Primera Empresa
                              </button>
                            </div>
                          ) : (
                            <table>
                              <thead>
                                <tr>
                                  <th>RazÃƒÂ³n Social</th>
                                  <th>IdentificaciÃƒÂ³n</th>
                                  <th>Tipo</th>
                                  <th>DescripciÃƒÂ³n</th>
                                  <th>Nombre DB</th>
                                  <th style={{ textAlign: 'right' }}>Acciones</th>
                                </tr>
                              </thead>
                              <tbody>
                                {companies.map((c) => (
                                  <tr
                                    key={c.id}
                                    onClick={() => setSelectedCompany(c)}
                                    style={{
                                      cursor: 'pointer',
                                      background: selectedCompany?.id === c.id ? 'rgb(6, 182, 212)' : 'transparent',
                                      borderLeft: selectedCompany?.id === c.id ? '3px solid var(--cyan)' : '3px solid transparent'
                                    }}
                                  >
                                    <td><strong>{c.name}</strong></td>
                                    <td style={{ fontFamily: 'var(--font-mono)' }}>{c.identification}</td>
                                    <td><span className="badge-status status-yes">{c.type}</span></td>
                                    <td>{c.description || <span style={{}}>Sin descripciÃƒÂ³n</span>}</td>
                                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--cyan)' }}>{c.dbName}</td>
                                    <td style={{ textAlign: 'right' }}>
                                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }} onClick={(e) => e.stopPropagation()}>
                                        <button
                                          onClick={() => {
                                            setSelectedCompany(c);
                                            setCompType(c.type);
                                            setCompIdentificacion(c.identification);
                                            setCompRazonSocial(c.name);
                                            setCompDescripcion(c.description || '');
                                            setCompNombreDB(c.dbName);
                                            setCompanyFormAction('edit');
                                            setCompanyViewMode('form');
                                          }}
                                          className="btn-sm"
                                          style={{ padding: '4px 8px', background: 'rgb(255, 255, 255)', border: '1px solid rgb(255, 255, 255)', borderRadius: '4px', cursor: 'pointer' }}
                                          title="Editar"
                                        >
                                          Ã¢Å“ÂÃ¯Â¸Â
                                        </button>
                                        <button
                                          onClick={() => handleDeleteCompany(c.id, c.name)}
                                          className="btn-sm"
                                          style={{ padding: '4px 8px', background: 'rgb(239, 68, 68)', border: '1px solid rgb(239, 68, 68)', borderRadius: '4px', cursor: 'pointer' }}
                                          title="Eliminar"
                                        >
                                          Ã°Å¸â€”â€˜Ã¯Â¸Â
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      ) : (
                        /* Form View */
                        <div className="card glass-panel" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
                          <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>
                            {companyFormAction === 'create' ? 'Ã°Å¸ÂÂ¢ Registrar Nueva Empresa' : 'Ã¢Å“ÂÃ¯Â¸Â Modificar Empresa'}
                          </h3>
                          <form onSubmit={handleSaveCompany} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div className="form-group">
                              <label style={{ display: 'block', marginBottom: '6px', fontSize: '10px', fontWeight: '600' }}>Tipo:</label>
                              <select
                                value={compType}
                                onChange={(e) => setCompType(e.target.value)}
                                style={{ width: '100%', padding: '10px', background: 'rgb(0, 0, 0)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none' }}
                              >
                                <option value="RUC">RUC</option>
                                <option value="CÃƒâ€°DULA">CÃƒÂ©dula</option>
                                <option value="PASAPORTE">Pasaporte</option>
                              </select>
                            </div>

                            <div className="form-group">
                              <label style={{ display: 'block', marginBottom: '6px', fontSize: '10px', fontWeight: '600' }}>IdentificaciÃƒÂ³n:</label>
                              <input
                                type="text"
                                required
                                value={compIdentificacion}
                                onChange={(e) => setCompIdentificacion(e.target.value)}
                                placeholder="IdentificaciÃƒÂ³n (RUC o CÃƒÂ©dula)"
                                style={{ width: '100%', padding: '10px', background: 'rgb(0, 0, 0)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none' }}
                              />
                            </div>

                            <div className="form-group">
                              <label style={{ display: 'block', marginBottom: '6px', fontSize: '10px', fontWeight: '600' }}>RazÃƒÂ³n Social:</label>
                              <input
                                type="text"
                                required
                                value={compRazonSocial}
                                onChange={(e) => setCompRazonSocial(e.target.value)}
                                placeholder="Nombre Oficial o RazÃƒÂ³n Social"
                                style={{ width: '100%', padding: '10px', background: 'rgb(0, 0, 0)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none' }}
                              />
                            </div>

                            <div className="form-group">
                              <label style={{ display: 'block', marginBottom: '6px', fontSize: '10px', fontWeight: '600' }}>DescripciÃƒÂ³n:</label>
                              <input
                                type="text"
                                value={compDescripcion}
                                onChange={(e) => setCompDescripcion(e.target.value)}
                                placeholder="Nombre Comercial o DescripciÃƒÂ³n"
                                style={{ width: '100%', padding: '10px', background: 'rgb(0, 0, 0)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none' }}
                              />
                            </div>

                            <div className="form-group">
                              <label style={{ display: 'block', marginBottom: '6px', fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)' }}>Nombre DB:</label>
                              <input
                                type="text"
                                disabled
                                readOnly
                                value={compNombreDB}
                                style={{ width: '100%', padding: '10px', background: 'rgb(255, 255, 255)', border: '1px solid rgb(255, 255, 255)', borderRadius: '8px', color: 'var(--cyan)', outline: 'none', cursor: 'not-allowed', fontFamily: 'var(--font-mono)' }}
                              />
                            </div>

                            <button type="submit" className="btn btn-cyan w-full" style={{ marginTop: '1rem', padding: '12px', fontWeight: 'bold' }}>
                              {companyFormAction === 'create' ? 'Registrar Empresa' : 'Guardar Cambios'}
                            </button>
                          </form>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Sub tab content: Administrador Sucursales */}
                  {adminSubTab === 'sucursales' && (
                    <div className="dashboard-grid">
                      <div className="card glass-panel" style={{ padding: '1.5rem', margin: 0 }}>
                        <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Establecimiento y Sucursal</h3>
                        <form onSubmit={handleSaveSriConfig} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                          <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '10px', fontWeight: '600' }}>CÃƒÂ³digo Establecimiento (SRI):</label>
                            <input
                              type="text"
                              required
                              value={sriEstablishmentCode}
                              onChange={(e) => setSriEstablishmentCode(e.target.value.slice(0, 3))}
                              placeholder="001"
                              style={{ width: '100%', padding: '10px', background: 'rgb(0, 0, 0)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
                            />
                          </div>

                          <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '10px', fontWeight: '600' }}>Punto de EmisiÃƒÂ³n (SRI):</label>
                            <input
                              type="text"
                              required
                              value={sriEmissionPoint}
                              onChange={(e) => setSriEmissionPoint(e.target.value.slice(0, 3))}
                              placeholder="002"
                              style={{ width: '100%', padding: '10px', background: 'rgb(0, 0, 0)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
                            />
                          </div>

                          <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '10px', fontWeight: '600' }}>DirecciÃƒÂ³n de Establecimiento/Sucursal:</label>
                            <input
                              type="text"
                              required
                              value={sriEstablishmentAddress}
                              onChange={(e) => setSriEstablishmentAddress(e.target.value)}
                              placeholder="Av. de los Granados N45 y Eloy Alfaro, Quito"
                              style={{ width: '100%', padding: '10px', background: 'rgb(0, 0, 0)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                            />
                          </div>

                          <div style={{ margin: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                              type="checkbox"
                              id="adminIsBranchCheckbox"
                              checked={sriIsBranch}
                              onChange={(e) => setSriIsBranch(e.target.checked)}
                              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                            />
                            <label htmlFor="adminIsBranchCheckbox" style={{ fontSize: '10px', cursor: 'pointer', color: 'var(--text-primary)', fontWeight: '600' }}>
                              Ã‚Â¿Esta cuenta es una sucursal de una Matriz principal?
                            </label>
                          </div>

                          {sriIsBranch && (
                            <div className="form-group">
                              <label style={{ display: 'block', marginBottom: '6px', fontSize: '10px', fontWeight: '600' }}>RUC de la Matriz Principal:</label>
                              <input
                                type="text"
                                required
                                value={sriParentCompanyRuc}
                                onChange={(e) => setSriParentCompanyRuc(e.target.value.slice(0, 13))}
                                placeholder="1792455894001"
                                style={{ width: '100%', padding: '10px', background: 'rgb(0, 0, 0)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}
                              />
                            </div>
                          )}

                          <button type="submit" className="btn btn-cyan w-full" style={{ marginTop: '1rem', padding: '12px', fontWeight: 'bold' }} disabled={sriSaving}>
                            {sriSaving ? 'Guardando...' : 'Ã°Å¸â€™Â¾ Guardar ConfiguraciÃƒÂ³n de Sucursal'}
                          </button>
                        </form>
                      </div>

                      <div className="card glass-panel" style={{ padding: '1.5rem', margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                        <span style={{ fontSize: '2.8125rem', marginBottom: '1rem' }}>Ã°Å¸ÂÂª</span>
                        <h4 style={{ margin: '0 0 10px 0' }}>SincronizaciÃƒÂ³n de Sucursales</h4>
                        <p style={{ fontSize: '10px', color: 'var(--text-secondary)', maxWidth: '300px', lineHeight: '1.5' }}>
                          El establecimiento <strong>{sriEstablishmentCode}</strong> y punto de emisiÃƒÂ³n <strong>{sriEmissionPoint}</strong> identifican de forma ÃƒÂºnica esta sucursal fÃƒÂ­sica en los comprobantes autorizados por el SRI.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Sub tab content: Integraciones */}
                  {adminSubTab === 'integraciones' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <div className="dashboard-grid">
                        <div className="card glass-panel" style={{ padding: '1.5rem', margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <div>
                            <h3 style={{ marginTop: 0 }}>Microservicio de FacturaciÃƒÂ³n</h3>
                            <p style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                              ConexiÃƒÂ³n local independiente para el firmado digital XAdES-BES de XMLs y comunicaciÃƒÂ³n SOAP con el SRI.
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                                <span>Endpoint del Servicio:</span>
                                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--cyan)' }}>http://localhost:3001</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                                <span>Base de datos:</span>
                                <span style={{ fontFamily: 'var(--font-mono)' }}>SQLite Local (/app/prisma)</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                                <span>Estado de ConexiÃƒÂ³n:</span>
                                <span>
                                  <span className="badge-status status-yes" style={{ background: 'rgb(16, 185, 129)', color: 'var(--emerald)', border: '1px solid rgb(16, 185, 129)' }}>Ã¢Å¡Â¡ ONLINE</span>
                                </span>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => window.open('http://localhost:5174', '_blank')}
                            className="btn btn-cyan"
                            style={{ width: '100%', marginTop: '1.5rem', padding: '10px', fontSize: '9.5px', fontWeight: 'bold' }}
                          >
                            Abrir Consola de FacturaciÃƒÂ³n Express
                          </button>
                        </div>

                        <div className="card glass-panel" style={{ padding: '1.5rem', margin: 0 }}>
                          <h3 style={{ marginTop: 0 }}>Portal SRI (Servicio de Rentas Internas)</h3>
                          <p style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                            Entorno y certificado configurados para la transmisiÃƒÂ³n oficial de comprobantes tributarios.
                          </p>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                              <span>Entorno Actual:</span>
                              <span>
                                {sriSimulate ? (
                                  <span className="badge-status status-aura">MOCK SIMULADO</span>
                                ) : sriEnvironment === '2' ? (
                                  <span className="badge-status status-yes" style={{ background: 'rgb(16, 185, 129)', color: 'var(--emerald)', border: '1px solid rgb(16, 185, 129)' }}>PRODUCCIÃƒâ€œN REAL</span>
                                ) : (
                                  <span className="badge-status status-yes">PRUEBAS REAL</span>
                                )}
                              </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                              <span>Firma ElectrÃƒÂ³nica (.p12):</span>
                              <span>
                                {sriConfigHasSignature ? (
                                  <span className="badge-status status-yes">CARGADO</span>
                                ) : (
                                  <span className="badge-status status-no">FALTA SUBIR</span>
                                )}
                              </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                              <span>TransmisiÃƒÂ³n SOAP:</span>
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px' }}>
                                {sriSimulate ? 'Desactivado' : 'Activo (celcer.sri.gob.ec)'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="card glass-panel" style={{ padding: '1.5rem', margin: 0 }}>
                          <h3 style={{ marginTop: 0 }}>Lector de CÃƒÂ³digo de Barras</h3>
                          <p style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                            ConfiguraciÃƒÂ³n del hardware del lector en emulaciÃƒÂ³n de teclado USB/inalÃƒÂ¡mbrico.
                          </p>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <label style={{ fontSize: '8px', color: 'var(--text-secondary)' }}>Estado del Lector:</label>
                              <select
                                value={scannerEnabled ? 'ON' : 'OFF'}
                                onChange={(e) => setScannerEnabled(e.target.value === 'ON')}
                                style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', color: '#fff', padding: '6px', borderRadius: '4px' }}
                              >
                                <option value="ON">Habilitado (Escucha Activa)</option>
                                <option value="OFF">Deshabilitado</option>
                              </select>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <label style={{ fontSize: '8px', color: 'var(--text-secondary)' }}>Modo de Captura:</label>
                              <select
                                value={scannerMode}
                                onChange={(e) => setScannerMode(e.target.value as 'GLOBAL' | 'FOCUSED')}
                                style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', color: '#fff', padding: '6px', borderRadius: '4px' }}
                              >
                                <option value="GLOBAL">Global (Captura en cualquier vista)</option>
                                <option value="FOCUSED">Enfocado (Solo con foco en catÃƒÂ¡logo)</option>
                              </select>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <label style={{ fontSize: '8px', color: 'var(--text-secondary)' }}>Tecla de TÃƒÂ©rmino (Sufijo):</label>
                              <select
                                value={scannerTerminator}
                                onChange={(e) => setScannerTerminator(e.target.value as 'Enter' | 'Tab' | 'None')}
                                style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', color: '#fff', padding: '6px', borderRadius: '4px' }}
                              >
                                <option value="Enter">Enter (Retorno de Carro)</option>
                                <option value="Tab">Tabulador</option>
                                <option value="None">Ninguno (LÃƒÂ­mite 8 caracteres)</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Sub tab content: Actividades Sistema */}
                  {adminSubTab === 'actividades' && (
                    <div className="table-container glass-panel" style={{ padding: '1.5rem', margin: 0 }}>
                      <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>BitÃƒÂ¡cora de Actividades del Sistema</h3>
                      <table style={{ width: '100%' }}>
                        <thead>
                          <tr>
                            <th>Fecha/Hora</th>
                            <th>Usuario</th>
                            <th>MÃƒÂ³dulo</th>
                            <th>AcciÃƒÂ³n</th>
                            <th>Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr style={{ background: 'rgb(255, 255, 255)' }}>
                            <td style={{ fontSize: '9px', fontFamily: 'var(--font-mono)' }}>{new Date().toLocaleString()}</td>
                            <td>{user.email}</td>
                            <td><span className="badge-status status-aura">ADMINISTRACIÃƒâ€œN</span></td>
                            <td><strong>Consulta de bitÃƒÂ¡cora de auditorÃƒÂ­a del sistema</strong></td>
                            <td><span className="badge-status status-yes">COMPLETADO</span></td>
                          </tr>
                          {companies.length > 0 && (
                            <tr>
                              <td style={{ fontSize: '9px', fontFamily: 'var(--font-mono)' }}>
                                {new Date(companies[0].createdAt).toLocaleString()}
                              </td>
                              <td>{user.email}</td>
                              <td><span className="badge-status status-aura">COMPANIES</span></td>
                              <td>Registro/Acceso a empresa <strong>{companies[0].name}</strong></td>
                              <td><span className="badge-status status-yes">COMPLETADO</span></td>
                            </tr>
                          )}
                          <tr style={{ background: 'rgb(255, 255, 255)' }}>
                            <td style={{ fontSize: '9px', fontFamily: 'var(--font-mono)' }}>
                              {new Date(Date.now() - 3600000).toLocaleString()}
                            </td>
                            <td>{user.email}</td>
                            <td><span className="badge-status status-yes">SRI CONFIG</span></td>
                            <td>Consulta de credenciales y firmas de facturaciÃƒÂ³n</td>
                            <td><span className="badge-status status-yes">COMPLETADO</span></td>
                          </tr>
                          <tr>
                            <td style={{ fontSize: '9px', fontFamily: 'var(--font-mono)' }}>
                              {new Date(Date.now() - 7200000).toLocaleString()}
                            </td>
                            <td>{user.email}</td>
                            <td><span className="badge-status status-no">AUTH</span></td>
                            <td>Inicio de sesiÃƒÂ³n exitoso en el sistema principal</td>
                            <td><span className="badge-status status-yes">EXITOSO</span></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

            </main>
            <footer style={{ marginTop: 'auto', paddingTop: '2rem', paddingBottom: '1rem', textAlign: 'center', fontSize: '8px' }}>
              <p>AuraContable Ã¢â‚¬â€ Ecosistema Contable AutÃƒÂ³nomo Real &copy; 2026</p>
            </footer>
          </div >
        </>
      ) : (viewMode === 'login' || viewMode === 'signup') ? (
        /* DEDICATED AUTH PAGE */
        <div style={{
          background: '#070a13',
          color: '#e2e8f0',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1rem',
          boxSizing: 'border-box',
          width: '100%'
        }}>
          {/* Back Button */}
          <div style={{ maxWidth: '440px', width: '100%', marginBottom: '1.5rem', display: 'flex', justifyContent: 'flex-start' }}>
            <button
              type="button"
              onClick={() => setViewMode('landing')}
              style={{
                background: 'transparent',
                border: '1px solid rgb(255, 255, 255)',
                color: 'var(--text-secondary)',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: 'inherit'
              }}
            >
              Ã¢â€ Â Volver al Inicio
            </button>
          </div>

          <div
            className="auth-container glass-panel animate-slideup"
            style={{
              padding: '2.5rem 2rem',
              position: 'relative',
              maxWidth: '440px',
              width: '100%',
              boxShadow: '0 20px 50px rgb(0, 0, 0)',
              border: '1px solid rgb(6, 182, 212)',
            }}
          >
            <div className="header-glow"></div>
            <div className="auth-header text-center" style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.4125rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>
                {isLoginView ? 'Iniciar SesiÃƒÂ³n' : 'Registrar Contribuyente'}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '10px', marginTop: '6px', margin: 0 }}>
                Acceso al Ecosistema Contable AutÃƒÂ³nomo Ã¢â‚¬â€ AuraContable
              </p>
            </div>

            <form onSubmit={async (e) => {
              await handleAuthSubmit(e);
            }}>
              {!isLoginView && (
                <>
                  {/* RUC Input */}
                  <div className="form-group">
                    <label>RUC (13 dÃƒÂ­gitos):</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px' }}>Ã°Å¸ÂªÂª</span>
                      <input
                        type="text"
                        required
                        maxLength={13}
                        value={rucInput}
                        placeholder="Ej. 1792455894001"
                        onChange={(e) => setRucInput(e.target.value.replace(/\D/g, ''))}
                        style={{ paddingLeft: '38px', width: '100%' }}
                      />
                    </div>
                  </div>

                  {/* RazÃƒÂ³n Social Input */}
                  <div className="form-group">
                    <label>RazÃƒÂ³n social o nombre completo:</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px' }}>Ã°Å¸â€˜Â¤</span>
                      <input
                        type="text"
                        required
                        value={nameInput}
                        placeholder="RazÃƒÂ³n social o nombre completo"
                        onChange={(e) => setNameInput(e.target.value)}
                        style={{ paddingLeft: '38px', width: '100%' }}
                      />
                    </div>
                  </div>

                  {/* DirecciÃƒÂ³n Input */}
                  <div className="form-group">
                    <label>DirecciÃƒÂ³n:</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px' }}>Ã°Å¸â€œÂ</span>
                      <input
                        type="text"
                        required
                        value={addressInput}
                        placeholder="DirecciÃƒÂ³n del establecimiento principal"
                        onChange={(e) => setAddressInput(e.target.value)}
                        style={{ paddingLeft: '38px', width: '100%' }}
                      />
                    </div>
                  </div>

                  {/* Provincia & Ciudad (2-col grid) */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div className="form-group">
                      <label>Provincia:</label>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px' }}>Ã°Å¸â€œÂ</span>
                        <select
                          required
                          value={provinceInput}
                          onChange={(e) => {
                            const prov = e.target.value;
                            setProvinceInput(prov);
                            const cities = ECUADOR_PROVINCES[prov] || [];
                            setCityInput(cities[0] || '');
                          }}
                          style={{ paddingLeft: '38px', width: '100%', WebkitAppearance: 'none', appearance: 'none' }}
                        >
                          <option value="" disabled>Provincia</option>
                          {Object.keys(ECUADOR_PROVINCES).map(prov => (
                            <option key={prov} value={prov} style={{ color: '#000' }}>{prov}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Ciudad:</label>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px' }}>Ã°Å¸â€œÂ</span>
                        <select
                          required
                          value={cityInput}
                          onChange={(e) => setCityInput(e.target.value)}
                          style={{ paddingLeft: '38px', width: '100%', WebkitAppearance: 'none', appearance: 'none' }}
                          disabled={!provinceInput}
                        >
                          <option value="" disabled>Ciudad</option>
                          {(ECUADOR_PROVINCES[provinceInput] || []).map(city => (
                            <option key={city} value={city} style={{ color: '#000' }}>{city}</option>
                          ))}
                        </select>
                      </div>
                    </div >
                  </div >

                  {/* Tipo de negocio (searchable, up to 4 selected badges) */}
                  < div className="form-group" style={{ position: 'relative' }}>
                    <label>Tipo de negocio (Elige de 1 a 4):</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px' }}>Ã°Å¸ÂÂ¢</span>
                      <input
                        type="text"
                        placeholder="Buscar tipo..."
                        value={businessTypesSearch}
                        onChange={(e) => {
                          setBusinessTypesSearch(e.target.value);
                          setBusinessTypesDropdownOpen(true);
                        }}
                        onFocus={() => setBusinessTypesDropdownOpen(true)}
                        style={{ paddingLeft: '38px', width: '100%' }}
                      />
                    </div >

                    {/* Selected badges chips container */}
                    {
                      businessTypesInput.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                          {businessTypesInput.map(type => (
                            <span key={type} className="business-type-badge" style={{
                              background: 'var(--cyan, #213993)',
                              color: '#ffffff',
                              padding: '4px 10px',
                              borderRadius: '16px',
                              fontSize: '8px',
                              fontWeight: 'bold',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              border: '1px solid rgb(255, 255, 255)'
                            }}>
                              {BUSINESS_THEMES[type]?.name || type}
                              <button
                                type="button"
                                onClick={() => setBusinessTypesInput(businessTypesInput.filter(t => t !== type))}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: '#ffffff',
                                  cursor: 'pointer',
                                  fontSize: '7px',
                                  fontWeight: 'bold',
                                  padding: 0,
                                  lineHeight: 1
                                }}
                              >
                                Ã¢Å“â€¢
                              </button>
                            </span>
                          ))}
                        </div>
                      )
                    }

                    {/* Filtered Dropdown */}
                    {
                      businessTypesDropdownOpen && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          width: '100%',
                          maxHeight: '180px',
                          overflowY: 'auto',
                          background: '#ffffff',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          boxShadow: '0 8px 24px rgb(0, 0, 0)',
                          zIndex: 1000,
                          marginTop: '4px'
                        }}>
                          {AVAILABLE_BUSINESS_TYPES.filter(type =>
                            type.toLowerCase().includes(businessTypesSearch.toLowerCase())
                          ).length === 0 ? (
                            <div style={{ padding: '10px', fontSize: '9.5px', color: '#666', textAlign: 'center' }}>
                              No se encontraron resultados
                            </div>
                          ) : (
                            AVAILABLE_BUSINESS_TYPES.filter(type =>
                              type.toLowerCase().includes(businessTypesSearch.toLowerCase())
                            ).map(type => {
                              const isSelected = businessTypesInput.includes(type);
                              return (
                                <div
                                  key={type}
                                  onClick={() => {
                                    if (isSelected) {
                                      setBusinessTypesInput(businessTypesInput.filter(t => t !== type));
                                    } else {
                                      if (businessTypesInput.length >= 4) {
                                        alert('Puedes elegir un mÃƒÂ¡ximo de 4 tipos de negocio.');
                                        return;
                                      }
                                      setBusinessTypesInput([...businessTypesInput, type]);
                                    }
                                    setBusinessTypesSearch('');
                                    setBusinessTypesDropdownOpen(false);
                                  }}
                                  style={{
                                    padding: '10px 14px',
                                    fontSize: '9.5px',
                                    color: '#000000',
                                    cursor: 'pointer',
                                    background: isSelected ? 'rgb(33, 57, 147)' : 'transparent',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    borderBottom: '1px solid #f1f5f9'
                                  }}
                                >
                                  <span>{type}</span>
                                  {isSelected && <span style={{ color: 'var(--cyan)', fontWeight: 'bold' }}>Ã¢Å“â€œ</span>}
                                </div>
                              );
                            })
                          )}
                        </div>
                      )
                    }
                  </div >

                  {/* WhatsApp (1-col) */}
                  < div className="form-group" >
                    <label>WhatsApp:</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px' }}>Ã°Å¸â€œÅ¾</span>
                      <input
                        type="text"
                        value={whatsappInput}
                        placeholder="WhatsApp"
                        onChange={(e) => setWhatsappInput(e.target.value)}
                        style={{ paddingLeft: '38px', width: '100%' }}
                      />
                    </div >
                  </div >
                </>
              )}

              <div className="form-group">
                <label>Correo ElectrÃƒÂ³nico:</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px' }}>Ã¢Å“â€°Ã¯Â¸Â</span>
                  <input
                    type="email"
                    required
                    value={emailInput}
                    placeholder="ejemplo@aura.com"
                    onChange={(e) => setEmailInput(e.target.value)}
                    style={{ paddingLeft: '38px', width: '100%' }}
                  />
                </div>
              </div >

              <div className="form-group">
                <label>ContraseÃƒÂ±a:</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px' }}>Ã°Å¸â€â€™</span>
                  <input
                    type="password"
                    required
                    value={passwordInput}
                    placeholder="Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢Ã¢â‚¬Â¢"
                    onChange={(e) => setPasswordInput(e.target.value)}
                    style={{ paddingLeft: '38px', width: '100%' }}
                  />
                </div>
              </div >

              {authFormError && <div className="error-alert">{authFormError}</div>}
              {authError && <div className="error-alert">{authError}</div>}

              <button type="submit" className="btn btn-cyan w-full" style={{ marginTop: '1rem' }}>
                {isLoginView ? 'Ingresar al Sistema' : 'Crear Cuenta'}
              </button>
            </form >

            <div className="auth-toggle" style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '10px' }}>
              {isLoginView ? (
                <p>
                  Ã‚Â¿No tienes una cuenta registrada?{' '}
                  <button type="button" onClick={() => {
                    setIsLoginView(false);
                    setViewMode('signup');
                  }} style={{ background: 'transparent', border: 'none', color: 'var(--cyan)', cursor: 'pointer', fontWeight: '600', textDecoration: 'underline' }}>
                    Crea una cuenta aquÃƒÂ­
                  </button>
                </p>
              ) : (
                <p>
                  Ã‚Â¿Ya posees una cuenta activa?{' '}
                  <button type="button" onClick={() => {
                    setIsLoginView(true);
                    setViewMode('login');
                  }} style={{ background: 'transparent', border: 'none', color: 'var(--cyan)', cursor: 'pointer', fontWeight: '600', textDecoration: 'underline' }}>
                    Inicia sesiÃƒÂ³n aquÃƒÂ­
                  </button>
                </p>
              )}
            </div>
          </div >
        </div >
      ) : (
        /* LANDING PAGE VIEW */
        <div style={{ background: '#070a13', color: '#e2e8f0', minHeight: '100vh', display: 'flex', flexDirection: 'column', width: '100%', boxSizing: 'border-box' }}>

          {/* NAV BAR */}
          <nav className="landing-nav" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem 2rem',
            background: 'rgb(10, 15, 30)',
            backdropFilter: 'none',
            borderBottom: '1px solid rgb(255, 255, 255)',
            position: 'sticky',
            top: 0,
            zIndex: 500,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '21px', filter: 'drop-shadow(0 0 8px var(--cyan))' }}>Ã¢Å“Â¨</span>
              <strong style={{
                fontSize: '15px',
                fontWeight: 'bold',
                letterSpacing: '1px',
                background: 'linear-gradient(90deg, #22d3ee, #818cf8)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 10px rgb(6, 182, 212))'
              }}>
                AURA CONTABLE
              </strong>
            </div>

            <div className="landing-nav-links" style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
              <a href="#hero" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontSize: '11px' }}>Inicio</a>

              {/* PRODUCT DROP DOWN */}
              <div
                style={{ position: 'relative' }}
                onMouseEnter={() => setIsProductsDropdownOpen(true)}
                onMouseLeave={() => setIsProductsDropdownOpen(false)}
              >
                <button style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '11px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 0',
                }}>
                  Productos <span style={{ fontSize: '7px' }}>Ã¢â€“Â¼</span>
                </button>

                {isProductsDropdownOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    width: '240px',
                    background: '#0d1326',
                    border: '1px solid rgb(255, 255, 255)',
                    borderRadius: '8px',
                    boxShadow: '0 10px 25px rgb(0, 0, 0)',
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    zIndex: 600,
                  }}>
                    <a
                      href="#products-aura"
                      onClick={() => setIsProductsDropdownOpen(false)}
                      style={{
                        padding: '10px',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        color: '#e2e8f0',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgb(255, 255, 255)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <strong style={{ fontSize: '10px', color: '#22d3ee' }}>Ã°Å¸Ââ€ºÃ¯Â¸Â Aura Contable</strong>
                      <span style={{ fontSize: '8px', color: 'var(--text-primary)', marginTop: '2px' }}>GestiÃƒÂ³n de diarios, Kardex y reportes.</span>
                    </a>
                    <a
                      href="#products-billing"
                      onClick={() => setIsProductsDropdownOpen(false)}
                      style={{
                        padding: '10px',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        color: '#e2e8f0',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgb(255, 255, 255)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <strong style={{ fontSize: '10px', color: '#818cf8' }}>Ã¢Å¡Â¡ FacturaciÃƒÂ³n ElectrÃƒÂ³nica</strong>
                      <span style={{ fontSize: '8px', color: 'var(--text-primary)', marginTop: '2px' }}>Microservicio de emisiÃƒÂ³n y firmas SRI.</span>
                    </a>
                    {/* Direct access to billing frontend */}
                    <div style={{ borderTop: '1px solid rgb(255, 255, 255)', margin: '4px 0', paddingTop: '6px' }}>
                      <a
                        href="http://localhost:5174"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setIsProductsDropdownOpen(false)}
                        style={{
                          padding: '9px 12px',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          color: '#0b0f19',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          background: 'linear-gradient(90deg, #818cf8, #6366f1)',
                          fontWeight: '700',
                          fontSize: '9.5px',
                          boxShadow: '0 0 12px rgb(129, 140, 248)',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.boxShadow = '0 0 20px rgb(129, 140, 248)';
                          e.currentTarget.style.transform = 'scale(1.02)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = '0 0 12px rgb(129, 140, 248)';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        <span style={{ fontSize: '11px' }}>Ã¢Å¡Â¡</span>
                        Iniciar SesiÃƒÂ³n Ã¢â‚¬â€ FacturaciÃƒÂ³n
                      </a>
                    </div>
                  </div>
                )}
              </div>

              <a href="#features" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontSize: '11px' }}>CaracterÃƒÂ­sticas</a>
            </div>

            <div className="landing-nav-auth" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              {user ? (
                <>
                  <span style={{ fontSize: '10.5px', color: 'var(--text-primary)' }}>Hola, <strong style={{ color: '#22d3ee' }}>{user.name}</strong></span>
                  <button
                    className="btn btn-cyan"
                    onClick={() => setViewMode('app')}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '6px',
                      fontSize: '10px',
                      fontWeight: '600',
                      boxShadow: '0 0 15px rgb(6, 182, 212)',
                    }}
                  >
                    Ir al Sistema
                  </button>
                  <button
                    className="btn"
                    onClick={async () => {
                      await logout();
                      setViewMode('landing');
                    }}
                    style={{
                      background: 'transparent',
                      border: '1px solid rgb(239, 68, 68)',
                      color: '#f87171',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontSize: '10px',
                      cursor: 'pointer',
                    }}
                  >
                    Cerrar SesiÃƒÂ³n
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="btn"
                    onClick={() => {
                      setIsLoginView(true);
                      setViewMode('login');
                    }}
                    style={{
                      background: 'transparent',
                      border: '1px solid rgb(6, 182, 212)',
                      color: '#22d3ee',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontSize: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgb(6, 182, 212)';
                      e.currentTarget.style.boxShadow = '0 0 10px rgb(6, 182, 212)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    Iniciar SesiÃƒÂ³n
                  </button>
                  <button
                    className="btn btn-cyan"
                    onClick={() => {
                      setIsLoginView(false);
                      setViewMode('signup');
                    }}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '6px',
                      fontSize: '10px',
                      fontWeight: '600',
                      boxShadow: '0 0 15px rgb(6, 182, 212)',
                    }}
                  >
                    Registrarse
                  </button>
                </>
              )}
            </div>
          </nav>

          {/* HERO SECTION */}
          <section id="hero" style={{
            padding: '5rem 2rem',
            textAlign: 'center',
            background: 'radial-gradient(circle at top, rgb(99, 102, 241), transparent 60%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
          }}>
            <h1 className="landing-hero-title" style={{
              fontSize: '3.0125rem',
              fontWeight: '800',
              lineHeight: '1.2',
              maxWidth: '800px',
              margin: '0 0 1.5rem 0',
              background: 'linear-gradient(135deg, #ffffff 0%, var(--text-primary) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-1.5px',
            }}>
              Ecosistema Contable y FacturaciÃƒÂ³n ElectrÃƒÂ³nica AutÃƒÂ³noma
            </h1>
            <p className="landing-hero-subtitle" style={{
              fontSize: '0.9125rem',
              color: 'var(--text-primary)',
              maxWidth: '650px',
              lineHeight: '1.6',
              margin: '0 0 2.5rem 0',
            }}>
              La suite integral diseÃƒÂ±ada para el control diario de tu contabilidad, conciliaciones de caja, inventarios KÃƒÂ¡rdex y facturaciÃƒÂ³n oficial ante el SRI.
            </p>
            <div style={{ display: 'flex', gap: '1.2rem', justifyContent: 'center' }}>
              {user ? (
                <button
                  className="btn btn-cyan"
                  onClick={() => setViewMode('app')}
                  style={{
                    padding: '12px 28px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '600',
                    boxShadow: '0 0 20px rgb(6, 182, 212)',
                  }}
                >
                  Ir al Sistema
                </button>
              ) : (
                <button
                  className="btn btn-cyan"
                  onClick={() => {
                    setIsLoginView(false);
                    setViewMode('signup');
                  }}
                  style={{
                    padding: '12px 28px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '600',
                    boxShadow: '0 0 20px rgb(6, 182, 212)',
                  }}
                >
                  Comenzar Gratis
                </button>
              )}
              <a
                href="#products"
                style={{
                  padding: '12px 28px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '600',
                  background: 'rgb(255, 255, 255)',
                  border: '1px solid rgb(255, 255, 255)',
                  color: 'var(--text-primary)',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgb(255, 255, 255)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgb(255, 255, 255)'}
              >
                Ver Soluciones
              </a>
            </div>
          </section>

          {/* PRODUCTS SECTION */}
          <section id="products" style={{
            padding: '5rem 2rem',
            background: 'rgb(10, 15, 30)',
            borderTop: '1px solid rgb(255, 255, 255)',
            borderBottom: '1px solid rgb(255, 255, 255)',
          }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
                <span style={{ color: '#22d3ee', textTransform: 'uppercase', fontSize: '9px', fontWeight: 'bold', letterSpacing: '2px' }}>Portafolio de Aplicaciones</span>
                <h2 style={{ fontSize: '2.0125rem', fontWeight: '700', color: '#fff', marginTop: '8px' }}>Nuestras Soluciones Integradas</h2>
                <p style={{ color: 'var(--text-primary)', fontSize: '12px', marginTop: '10px' }}>Ecosistemas desacoplados y diseÃƒÂ±ados para trabajar en armonÃƒÂ­a.</p>
              </div>

              <div className="landing-products-grid" style={{ gap: '2.5rem' }}>

                {/* PRODUCT 1: AURA CONTABLE */}
                <div id="products-aura" className="glass-panel" style={{
                  padding: '2.5rem',
                  borderRadius: '12px',
                  border: '1px solid rgb(6, 182, 212)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.2rem',
                  textAlign: 'left',
                  background: 'linear-gradient(135deg, rgb(6, 182, 212) 0%, transparent 100%)',
                }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '10px',
                    background: 'rgb(6, 182, 212)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '21px',
                    color: '#22d3ee',
                    boxShadow: '0 0 15px rgb(6, 182, 212)',
                  }}>
                    Ã°Å¸Ââ€ºÃ¯Â¸Â
                  </div>
                  <h3 style={{ fontSize: '1.3125rem', margin: 0, color: '#fff', fontWeight: 'bold' }}>Aura Contable</h3>
                  <p style={{ color: 'var(--text-primary)', fontSize: '10.5px', lineHeight: '1.6', margin: 0 }}>
                    La herramienta completa para el control financiero. Administra el libro diario con asientos automÃƒÂ¡ticos desencadenados de tus actividades de venta y compra, controla el stock mediante movimientos de KÃƒÂ¡rdex y amortiza activos fijos en segundos. Genera reportes listos para la declaraciÃƒÂ³n mensual de IVA del SRI.
                  </p>
                  <ul style={{ color: 'var(--text-primary)', fontSize: '9.5px', paddingLeft: '1.2rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <li>Asientos contables automÃƒÂ¡ticos (Debe/Haber).</li>
                    <li>Libro Mayor y balances al instante.</li>
                    <li>KÃƒÂ¡rdex de stock y valorizaciÃƒÂ³n de inventario.</li>
                    <li>Simulador de Formulario 104 del SRI.</li>
                  </ul>
                  {/* CTA Button Ã¢â‚¬â€ Aura Contable */}
                  <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
                    <button
                      onClick={() => { if (user) { setViewMode('app'); } else { setIsLoginView(true); setViewMode('login'); } }}
                      style={{
                        width: '100%',
                        padding: '10px 0',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                        background: 'linear-gradient(90deg, #06b6d4, #22d3ee)',
                        color: '#0b0f19',
                        fontWeight: '700',
                        fontSize: '10.5px',
                        letterSpacing: '0.4px',
                        boxShadow: '0 0 14px rgb(6, 182, 212)',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 0 22px rgb(6, 182, 212)'; e.currentTarget.style.transform = 'scale(1.02)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 0 14px rgb(6, 182, 212)'; e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                      Ã°Å¸Ââ€ºÃ¯Â¸Â {user ? 'Ir al Sistema Contable' : 'Iniciar en Aura Contable'}
                    </button>
                  </div>
                </div>

                {/* PRODUCT 2: BILLING SERVICE */}
                <div id="products-billing" className="glass-panel" style={{
                  padding: '2.5rem',
                  borderRadius: '12px',
                  border: '1px solid rgb(129, 140, 248)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.2rem',
                  textAlign: 'left',
                  background: 'linear-gradient(135deg, rgb(129, 140, 248) 0%, transparent 100%)',
                }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '10px',
                    background: 'rgb(129, 140, 248)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '21px',
                    color: '#818cf8',
                    boxShadow: '0 0 15px rgb(129, 140, 248)',
                  }}>
                    Ã¢Å¡Â¡
                  </div>
                  <h3 style={{ fontSize: '1.3125rem', margin: 0, color: '#fff', fontWeight: 'bold' }}>Sistema de FacturaciÃƒÂ³n</h3>
                  <p style={{ color: 'var(--text-primary)', fontSize: '10.5px', lineHeight: '1.6', margin: 0 }}>
                    Un microservicio desacoplado y altamente reutilizable para facturaciÃƒÂ³n electrÃƒÂ³nica en el Ecuador. Firma digitalmente archivos XML de comprobantes con certificados PKCS#12 (.p12), se comunica de forma segura mediante SOAP con el SRI y gestiona sucursales y puntos de emisiÃƒÂ³n dinÃƒÂ¡micamente.
                  </p>
                  <ul style={{ color: 'var(--text-primary)', fontSize: '9.5px', paddingLeft: '1.2rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <li>Firma XML independiente con certificados .p12.</li>
                    <li>Conectividad SOAP directa con el SRI (Real y Simulado).</li>
                    <li>Soporte para mÃƒÂºltiples sucursales y puntos de emisiÃƒÂ³n.</li>
                    <li>Control de estado y reintentos automÃƒÂ¡ticos de autorizaciÃƒÂ³n.</li>
                  </ul>
                  {/* CTA Button Ã¢â‚¬â€ Sistema de FacturaciÃƒÂ³n */}
                  <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
                    <a
                      href="http://localhost:5174"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '10px 0',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        textAlign: 'center',
                        background: 'linear-gradient(90deg, #818cf8, #6366f1)',
                        color: '#0b0f19',
                        fontWeight: '700',
                        fontSize: '10.5px',
                        letterSpacing: '0.4px',
                        boxShadow: '0 0 14px rgb(129, 140, 248)',
                        transition: 'all 0.2s',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 0 22px rgb(129, 140, 248)'; e.currentTarget.style.transform = 'scale(1.02)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 0 14px rgb(129, 140, 248)'; e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                      Ã¢Å¡Â¡ Iniciar en FacturaciÃƒÂ³n
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* FEATURES SECTION */}
          <section id="features" style={{ padding: '5rem 2rem' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
              <div style={{ marginBottom: '3.5rem' }}>
                <span style={{ color: '#22d3ee', textTransform: 'uppercase', fontSize: '9px', fontWeight: 'bold', letterSpacing: '2px' }}>CaracterÃƒÂ­sticas Clave</span>
                <h2 style={{ fontSize: '2.0125rem', fontWeight: '700', color: '#fff', marginTop: '8px' }}>Potencia Contable en un Solo Lugar</h2>
              </div>

              <div className="landing-features-grid" style={{ gap: '2rem' }}>
                <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                  <span style={{ fontSize: '29px', display: 'block', marginBottom: '12px' }}>Ã¢Å¡â„¢Ã¯Â¸Â</span>
                  <h4 style={{ color: '#fff', fontSize: '13px', fontWeight: '600', margin: '0 0 8px 0' }}>AutomatizaciÃƒÂ³n</h4>
                  <p style={{ color: 'var(--text-primary)', fontSize: '9.5px', lineHeight: '1.6', margin: 0 }}>Tus libros y balances contables se generan en tiempo real al emitir facturas y compras.</p>
                </div>
                <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                  <span style={{ fontSize: '29px', display: 'block', marginBottom: '12px' }}>Ã°Å¸â€â€™</span>
                  <h4 style={{ color: '#fff', fontSize: '13px', fontWeight: '600', margin: '0 0 8px 0' }}>Seguridad CriptogrÃƒÂ¡fica</h4>
                  <p style={{ color: 'var(--text-primary)', fontSize: '9.5px', lineHeight: '1.6', margin: 0 }}>Cifrado y firmas digitales PKCS#12 con contraseÃƒÂ±as seguras y protegidas en el backend.</p>
                </div>
                <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                  <span style={{ fontSize: '29px', display: 'block', marginBottom: '12px' }}>Ã¢Å¡â€“Ã¯Â¸Â</span>
                  <h4 style={{ color: '#fff', fontSize: '13px', fontWeight: '600', margin: '0 0 8px 0' }}>Cumplimiento Legal</h4>
                  <p style={{ color: 'var(--text-primary)', fontSize: '9.5px', lineHeight: '1.6', margin: 0 }}>Adaptado al 100% de la normativa ecuatoriana de retenciones e IVA diferenciado.</p>
                </div>
              </div>
            </div>
          </section>

          {/* LANDING FOOTER */}
          <footer style={{
            padding: '3rem 2rem',
            textAlign: 'center',
            borderTop: '1px solid rgb(255, 255, 255)',
            background: 'rgb(5, 8, 20)',
            marginTop: 'auto',
          }}>
            <p style={{ color: '#64748b', fontSize: '10px' }}>AuraContable Ã¢â‚¬â€ Ecosistema Contable y FacturaciÃƒÂ³n ElectrÃƒÂ³nica &copy; 2026</p>
            <p style={{ color: '#475569', fontSize: '8px', marginTop: '6px' }}>TecnologÃƒÂ­as: React Single-Page Application, NestJS, Prisma, PostgreSQL y SQLite</p>
          </footer>



        </div>
      )}

      {/* XML VIEW MODAL */}
      {
        activeXml && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgb(0, 0, 0)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="glass-panel" style={{ width: '80%', maxWidth: '800px', maxHeight: '80%', display: 'flex', flexDirection: 'column', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '12px' }}>
                <strong>Factura Autorizada por el SRI - Formato XML</strong>
                <button className="btn-sm status-no" onClick={() => setActiveXml(null)}>Cerrar</button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', background: '#05070f', padding: '10px', borderRadius: '8px', fontFamily: 'var(--font-mono)', fontSize: '8px', color: '#22d3ee', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {activeXml}
              </div>
              <button className="btn btn-cyan w-full" style={{ marginTop: '12px' }} onClick={() => {
                const element = document.createElement("a");
                const file = new Blob([activeXml], { type: 'text/xml' });
                element.href = URL.createObjectURL(file);
                element.download = "factura-sri-autorizada.xml";
                document.body.appendChild(element);
                element.click();
                document.body.removeChild(element);
              }}>Descargar Archivo .xml</button>
            </div>
          </div>
        )
      }

      {/* INTERACTIVE TUTORIAL MODAL */}
      {
        showTutorial && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgb(0, 0, 0)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'none' }}>
            <div className="glass-panel" style={{ width: '90%', maxWidth: '600px', padding: '2rem', display: 'flex', flexDirection: 'column', position: 'relative', border: '1px solid rgb(6, 182, 212)' }}>

              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '17px' }}>Ã°Å¸â€œâ€“</span>
                  <strong style={{ fontSize: '13px', color: 'var(--cyan)' }}>Tutorial: Simulador SOAP de Pruebas</strong>
                </div>
                <button
                  type="button"
                  className="btn-sm status-no"
                  onClick={() => setShowTutorial(false)}
                  style={{ background: 'rgb(239, 68, 68)', color: '#f87171', border: 'none', cursor: 'pointer', padding: '4px 10px', borderRadius: '4px' }}
                >
                  Omitir
                </button>
              </div>

              {/* Content based on Step */}
              <div style={{ flex: 1, minHeight: '220px', color: 'var(--text-secondary)', fontSize: '10px', lineHeight: '1.6' }}>
                {tutorialStep === 1 && (
                  <div className="fade-in">
                    <h4 style={{ margin: '0 0 10px 0', color: 'var(--text-primary)', fontSize: '12px' }}>
                      Paso 1 de 5: Ã‚Â¿QuÃƒÂ© es el Simulador SOAP de Pruebas?
                    </h4>
                    <p>
                      El <strong>Simulador SOAP (modo demo)</strong> es una herramienta educativa y de validaciÃƒÂ³n local integrada en AuraContable.
                    </p>
                    <p style={{ marginTop: '10px' }}>
                      Su principal funciÃƒÂ³n es emular de manera idÃƒÂ©ntica la respuesta de los servidores web del <strong>SRI</strong> (Servicio de Rentas Internas de Ecuador).
                      No requiere que tengas un certificado de firma digital real `.p12` cargado y funciona sin conexiÃƒÂ³n externa al SRI.
                    </p>
                    <div style={{ marginTop: '15px', background: 'rgb(6, 182, 212)', border: '1px solid rgb(6, 182, 212)', padding: '12px', borderRadius: '6px' }}>
                      Ã°Å¸â€™Â¡ <strong>Beneficio:</strong> Ideal para entrenamiento de personal o demostraciones inmediatas sin demoras de red ni errores de validaciÃƒÂ³n legal.
                    </div>
                  </div>
                )}

                {tutorialStep === 2 && (
                  <div className="fade-in">
                    <h4 style={{ margin: '0 0 10px 0', color: 'var(--text-primary)', fontSize: '12px' }}>
                      Paso 2 de 5: CÃƒÂ³mo emitir facturas de prueba
                    </h4>
                    <p>
                      Para interactuar con el simulador SOAP:
                    </p>
                    <ol style={{ paddingLeft: '1.25rem', margin: '10px 0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <li>Ve a la pestaÃƒÂ±a <strong>Ã°Å¸â€œË† Control de Ventas</strong> en el menÃƒÂº de navegaciÃƒÂ³n principal.</li>
                      <li>Usa el formulario lateral derecho <strong>Emitir Factura de Venta</strong>.</li>
                      <li>Escribe el nombre de un cliente ficticio (ej. <code>Consumidor Final</code>) y un monto.</li>
                      <li>Marca o desmarca <strong>Desglosar {globalIvaRate}% IVA</strong> segÃƒÂºn prefieras.</li>
                      <li>Haz clic en el botÃƒÂ³n <strong>Firmar y Transmitir al SRI</strong>.</li>
                    </ol>
                  </div>
                )}

                {tutorialStep === 3 && (
                  <div className="fade-in">
                    <h4 style={{ margin: '0 0 10px 0', color: 'var(--text-primary)', fontSize: '12px' }}>
                      Paso 3 de 5: Proceso de Firma y SOAP simulado
                    </h4>
                    <p>
                      Cuando presionas el botÃƒÂ³n de emitir en modo simulaciÃƒÂ³n, el sistema ejecuta en segundo plano lo siguiente:
                    </p>
                    <ul style={{ paddingLeft: '1.25rem', margin: '10px 0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <li><strong>GeneraciÃƒÂ³n del XML:</strong> Genera la estructura oficial offline del comprobante.</li>
                      <li><strong>Firma Digital:</strong> Firma digitalmente el archivo XML usando un certificado mock en memoria.</li>
                      <li><strong>TransmisiÃƒÂ³n SOAP:</strong> Se conecta al servicio local, el cual devuelve el estado <strong>RECIBIDO</strong> y posteriormente <strong>AUTORIZADO</strong> con un nÃƒÂºmero de autorizaciÃƒÂ³n y clave de acceso simulada de 49 dÃƒÂ­gitos de manera inmediata.</li>
                    </ul>
                  </div>
                )}

                {tutorialStep === 4 && (
                  <div className="fade-in">
                    <h4 style={{ margin: '0 0 10px 0', color: 'var(--text-primary)', fontSize: '12px' }}>
                      Paso 4 de 5: Reportes e Impuestos (Formulario 104)
                    </h4>
                    <p>
                      Al autorizarse la factura de pruebas:
                    </p>
                    <p style={{ marginTop: '10px' }}>
                      Los valores de la base imponible y el IVA desglosado se acumulan de inmediato en la contabilidad general de la empresa.
                    </p>
                    <p style={{ marginTop: '10px' }}>
                      Puedes dirigirte a la pestaÃƒÂ±a <strong>Ã°Å¸Ââ€ºÃ¯Â¸Â Reportes SRI Form 104</strong> y ver cÃƒÂ³mo se actualizan los casilleros 411 y 412 (ventas gravadas) y se calcula en tiempo real el impuesto a pagar o crÃƒÂ©dito fiscal, simulando una declaraciÃƒÂ³n de IVA real.
                    </p>
                  </div>
                )}

                {tutorialStep === 5 && (
                  <div className="fade-in">
                    <h4 style={{ margin: '0 0 10px 0', color: 'var(--text-primary)', fontSize: '12px' }}>
                      Paso 5 de 5: ConfiguraciÃƒÂ³n para el Entorno Real
                    </h4>
                    <p>
                      Cuando decidas iniciar a facturar electrÃƒÂ³nicamente de forma real:
                    </p>
                    <ol style={{ paddingLeft: '1.25rem', margin: '10px 0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <li>Regresa a la pestaÃƒÂ±a <strong>Ã¢Å¡â„¢Ã¯Â¸Â ConfiguraciÃƒÂ³n SRI & Firma</strong>.</li>
                      <li>Selecciona la opciÃƒÂ³n <strong>Sistema Real SRI SOAP</strong>.</li>
                      <li>Carga tu archivo de firma electrÃƒÂ³nica <code>.p12</code> real y digita su contraseÃƒÂ±a.</li>
                      <li>Selecciona el ambiente deseado: <strong>Pruebas</strong> (para verificar que tu firma firme bien y el SRI responda) o <strong>ProducciÃƒÂ³n</strong> (para facturaciÃƒÂ³n oficial legal).</li>
                    </ol>
                  </div>
                )}
              </div>

              {/* Step indicator */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', margin: '1.5rem 0 0.5rem 0' }}>
                {[1, 2, 3, 4, 5].map((step) => (
                  <div
                    key={step}
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: tutorialStep === step ? 'var(--cyan)' : 'rgb(255, 255, 255)',
                      boxShadow: tutorialStep === step ? '0 0 8px var(--cyan)' : 'none',
                      transition: 'all 0.3s ease'
                    }}
                  />
                ))}
              </div>

              {/* Footer Navigation Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setTutorialStep(prev => Math.max(1, prev - 1))}
                  disabled={tutorialStep === 1}
                  style={{ border: '1px solid var(--border)', background: 'transparent', color: tutorialStep === 1 ? 'var(--text-muted)' : 'var(--text-primary)', padding: '8px 16px', borderRadius: '6px', cursor: tutorialStep === 1 ? 'not-allowed' : 'pointer' }}
                >
                  Anterior
                </button>

                {tutorialStep < 5 ? (
                  <button
                    type="button"
                    className="btn btn-cyan"
                    onClick={() => setTutorialStep(prev => Math.min(5, prev + 1))}
                    style={{ padding: '8px 20px', borderRadius: '6px' }}
                  >
                    Siguiente
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-cyan"
                    onClick={() => setShowTutorial(false)}
                    style={{ padding: '8px 20px', borderRadius: '6px', boxShadow: '0 0 10px var(--cyan-glow)' }}
                  >
                    Finalizar tutorial
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      }

      {
        !user && (
          <footer style={{ marginTop: '3rem', textAlign: 'center', fontSize: '9px' }}>
            <p>AuraContable Ã¢â‚¬â€ Ecosistema Contable AutÃƒÂ³nomo Real</p>
            <p style={{ marginTop: '4px' }}>
              TecnologÃƒÂ­as: React SPA, Vite, NestJS, Prisma, PostgreSQL con Auth JWT.
            </p>
          </footer >
        )
      }

      {
        isCreatingCompany && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgb(0, 0, 0)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
          }}>
            <div style={{
              background: '#ffffff',
              padding: '2.5rem',
              borderRadius: '4px',
              width: '450px',
              boxShadow: '0 4px 20px rgb(0, 0, 0)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              animation: 'fadeIn 0.2s ease-out'
            }}>
              <span style={{
                color: '#333333',
                fontSize: '12px',
                fontWeight: '500',
                textAlign: 'left',
                fontFamily: 'sans-serif'
              }}>
                Creando Empresa ....
              </span>
              <div style={{
                width: '100%',
                height: '24px',
                background: '#1f2937',
                borderRadius: '2px',
                overflow: 'hidden',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  height: '100%',
                  width: '60%',
                  background: 'var(--cyan, #06b6d4)',
                  animation: 'loadingProgress 1.5s infinite ease-in-out'
                }} />
              </div>
            </div>
            <style>{`
            @keyframes loadingProgress {
              0% { left: -60%; }
              100% { left: 100%; }
            }
          `}</style>
          </div>
        )
      }

      {
        simulatedModule && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgb(0, 0, 0)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
          }}>
            <div className="glass-panel" style={{
              padding: '2.5rem',
              borderRadius: '16px',
              maxWidth: '500px',
              width: '90%',
              textAlign: 'center',
              border: '1px solid rgb(6, 182, 212)',
              background: 'rgb(15, 23, 42)',
              boxShadow: '0 10px 30px rgb(6, 182, 212)',
            }}>
              <span style={{ fontSize: '3.3125rem', display: 'block', marginBottom: '1rem' }}>Ã¢Å¡â„¢Ã¯Â¸Â</span>
              <h3 style={{ fontSize: '1.3125rem', color: 'var(--cyan)', marginBottom: '1rem' }}>MÃƒÂ³dulo Simulado: {simulatedModule}</h3>
              <p style={{ fontSize: '11px', lineHeight: '1.6', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                El panel para <strong>{simulatedModule}</strong> estÃƒÂ¡ configurado en este entorno de negocios general.
              </p>
              <div style={{
                background: 'rgb(255, 255, 255)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '9.5px',
                color: 'var(--text-muted)',
                textAlign: 'left',
                marginBottom: '1.5rem'
              }}>
                Ã°Å¸â€™Â¡ <strong>Nota del Desarrollador:</strong> Todos los datos de este apartado se guardarÃƒÂ¡n localmente de forma provisional y se sincronizarÃƒÂ¡n con los servidores oficiales del SRI una vez activada la licencia correspondiente.
              </div>
              <button
                onClick={() => setSimulatedModule(null)}
                className="btn btn-cyan"
                style={{ padding: '8px 24px', borderRadius: '8px', fontWeight: 'bold' }}
              >
                Entendido
              </button>
            </div>
          </div>
        )
      }
      {
        selectedDetailsInvoice && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 99999,
            padding: '20px'
          }}>
            <div className="glass-panel" style={{
              background: 'rgb(15, 23, 42)',
              border: '1px solid rgb(6, 182, 212)',
              borderRadius: '16px',
              maxWidth: '650px',
              width: '95%',
              padding: '2rem',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
              position: 'relative',
              color: '#fff',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <button
                onClick={() => setSelectedDetailsInvoice(null)}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: '1.0625rem',
                  cursor: 'pointer'
                }}
              >
                Ã¢Å“â€¢
              </button>
              <h3 style={{ marginTop: 0, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.8rem', color: 'var(--cyan)' }}>
                Detalle de Factura Emitida
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '15px', marginBottom: '1.5rem', fontSize: '10px' }}>
                <div>
                  <p style={{ margin: '4px 0' }}><strong>Cliente:</strong> {selectedDetailsInvoice.clientName}</p>
                  <p style={{ margin: '4px 0' }}><strong>RUC/C.I.:</strong> {selectedDetailsInvoice.clientRuc || '9999999999999'}</p>
                  <p style={{ margin: '4px 0' }}><strong>Correo:</strong> {selectedDetailsInvoice.clientEmail || 'N/D'}</p>
                </div>
                <div>
                  <p style={{ margin: '4px 0' }}><strong>Fecha:</strong> {new Date(selectedDetailsInvoice.createdAt).toLocaleString()}</p>
                  <p style={{ margin: '4px 0' }}><strong>Estado SRI:</strong> 
                    <span className={`badge-status ${selectedDetailsInvoice.status === 'AUTHORIZED' ? 'status-yes' : selectedDetailsInvoice.status === 'RECEIVED' ? 'status-partial' : 'status-no'}`} style={{ marginLeft: '6px' }}>
                      {selectedDetailsInvoice.status === 'AUTHORIZED' ? 'AUTORIZADO' : selectedDetailsInvoice.status === 'RECEIVED' ? 'RECIBIDO' : 'RECHAZADO'}
                    </span>
                  </p>
                  <p style={{ margin: '4px 0', wordBreak: 'break-all' }}><strong>Clave de Acceso:</strong> <span style={{ fontFamily: 'var(--font-mono)', fontSize: '7.5px' }}>{selectedDetailsInvoice.claveAcceso}</span></p>
                </div>
              </div>

              <h4 style={{ margin: '1rem 0 0.5rem 0', fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Productos / ÃƒÂtems Vendidos</h4>
              <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', marginBottom: '1.5rem' }}>
                <table style={{ margin: 0, fontSize: '9px', width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left' }}>
                      <th style={{ padding: '8px' }}>SKU</th>
                      <th style={{ padding: '8px' }}>Producto</th>
                      <th style={{ padding: '8px' }}>Precio Unit.</th>
                      <th style={{ padding: '8px' }}>Cant.</th>
                      <th style={{ padding: '8px' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(!selectedDetailsInvoice.items || selectedDetailsInvoice.items.length === 0) ? (
                      <tr>
                        <td colSpan={5} style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)' }}>Esta factura no registra desglose de ÃƒÂ­tems (Cargada desde webhook/sincronizaciÃƒÂ³n).</td>
                      </tr>
                    ) : (
                      selectedDetailsInvoice.items.map((item: any, idx: number) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '8px', fontFamily: 'var(--font-mono)' }}>{item.sku}</td>
                          <td style={{ padding: '8px' }}><strong>{item.name}</strong></td>
                          <td style={{ padding: '8px' }}>${item.price.toFixed(2)}</td>
                          <td style={{ padding: '8px' }}>{item.quantity}</td>
                          <td style={{ padding: '8px', fontWeight: 'bold' }}>${(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', fontSize: '10px' }}>
                <div>Subtotal: <strong>${selectedDetailsInvoice.subtotal.toFixed(2)}</strong></div>
                <div>IVA ({globalIvaRate}%): <strong>${selectedDetailsInvoice.iva.toFixed(2)}</strong></div>
                <div style={{ fontSize: '13px', color: 'var(--cyan)' }}>Total Facturado: <strong>${selectedDetailsInvoice.amount.toFixed(2)}</strong></div>
              </div>
              <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => setSelectedDetailsInvoice(null)} className="btn btn-cyan" style={{ padding: '8px 24px', borderRadius: '8px', fontWeight: 'bold' }}>Cerrar</button>
              </div>
            </div>
          </div>
        )
      }
    </div>
  );
}
