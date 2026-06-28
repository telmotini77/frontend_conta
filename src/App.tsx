import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
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

interface Product {
  id: string;
  sku: string;
  name: string;
  stock: number;
  cost: number;
  price: number;
  hasIva: boolean;
  transactions?: KardexTransaction[];
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

export default function App() {
  const { user, token, loading, login, signup, logout, error: authError } = useAuth();

  // Navigation State
  const [activeTab, setActiveTab] = useState<'kardex' | 'ventas' | 'proveedores' | 'caja' | 'contabilidad' | 'sri' | 'assets'>('kardex');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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
  const [sriConfigLoading, setSriConfigLoading] = useState(false);
  const [sriSaving, setSriSaving] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(1);


  // Auth State
  const [isLoginView, setIsLoginView] = useState(true);
  const [nameInput, setNameInput] = useState('');
  const [rucInput, setRucInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authFormError, setAuthFormError] = useState<string | null>(null);

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


  // Form States (New Transaction)
  const [selectedProductId, setSelectedProductId] = useState('');
  const [txType, setTxType] = useState<'INGRESS' | 'EGRESS'>('INGRESS');
  const [txQty, setTxQty] = useState(1);

  // Form States (New Asset)
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetValue, setNewAssetValue] = useState(0);
  const [newAssetResidual, setNewAssetResidual] = useState(0);
  const [newAssetYears, setNewAssetYears] = useState(3);

  // Form States (New Invoice)
  const [newClientName, setNewClientName] = useState('');
  const [newInvoiceAmount, setNewInvoiceAmount] = useState(0);
  const [newInvoiceIva, setNewInvoiceIva] = useState(true);

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
    { accountCode: '4.01.01', accountName: 'Ventas de Servicios/Mercaderías', debit: 0, credit: 0 }
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
    if (!token) return;
    setInvoicesLoading(true);
    try {
      const res = await fetch(`${API_BASE}/invoices`, {
        headers: { Authorization: `Bearer ${token}` },
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
  }, [token]);

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
      }
    } catch (err) {
      console.error('Error fetching SRI config:', err);
    } finally {
      setSriConfigLoading(false);
    }
  }, [token]);

  // Load active tab data
  useEffect(() => {
    if (user && token) {
      const timer = setTimeout(() => {
        if (activeTab === 'kardex') void fetchProducts();
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
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [
    user,
    token,
    activeTab,
    fetchProducts,
    fetchAssets,
    fetchDepreciations,
    fetchInvoices,
    fetchPurchases,
    fetchReconciliationSummary,
    fetchAccountingData,
    fetchSriConfig,
  ]);

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

  // Clear auth forms when toggling
  useEffect(() => {
    setNameInput('');
    setRucInput('');
    setEmailInput('');
    setPasswordInput('');
    setAuthFormError(null);
  }, [isLoginView, user]);

  if (loading) {
    return (
      <div className="flex-center loading-screen">
        <div className="spinner"></div>
        <p>Cargando sesión contable...</p>
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
        await signup(nameInput, rucInput, emailInput, passwordInput);
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setAuthFormError(errMsg || 'Error en la autenticación');
    }
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
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        alert(errData.message || 'Error al crear producto');
        return;
      }

      setNewProductSku('');
      setNewProductName('');
      setNewProductCost(0);
      setNewProductPrice(0);
      setNewProductStock(0);
      setNewProductIva(true);
      const savedRate = localStorage.getItem('globalIvaRate');
      setNewProductIvaRate(savedRate ? parseInt(savedRate, 10) : 15);
      setSetAsDefault(false);
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
    try {
      const res = await fetch(`${API_BASE}/invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          clientName: newClientName,
          amount: newInvoiceAmount,
          hasIva: newInvoiceIva,
          ivaRate: globalIvaRate,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        alert(errData.message || 'Error al emitir factura');
        return;
      }

      setNewClientName('');
      setNewInvoiceAmount(0);
      setNewInvoiceIva(true);
      fetchInvoices();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendInvoice = async (invoiceId: string) => {
    try {
      const res = await fetch(`${API_BASE}/invoices/${invoiceId}/send`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        alert('Factura firmada y autorizada enviada con éxito al correo del cliente.');
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
      const res = await fetch(`${API_BASE}/invoices/${invoiceId}/xml`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
        alert('Configuración del SRI guardada correctamente.');
      } else {
        alert('Error al guardar la configuración del SRI.');
      }
    } catch (err) {
      console.error('Error saving SRI config:', err);
      alert('Error de conexión al guardar la configuración.');
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
          alert(`Sincronización exitosa. Se descargaron instantáneamente del SRI ${data.length} facturas de compras de proveedores y se actualizó el inventario.`);
        } else {
          alert('Sincronización exitosa. No hay nuevas compras pendientes en el SRI.');
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

  // Actions - Caja / Conciliación
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
        alert(errData.message || 'Error al registrar transacción de caja');
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
        alert(`Sincronización de retenciones exitosa. Se importaron ${data.length} retenciones del SRI y se aplicó la auto-conciliación.`);
      } else {
        alert('Sincronización de retenciones exitosa. No hay nuevas retenciones en el SRI.');
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
        { accountCode: '4.01.01', accountName: 'Ventas de Servicios/Mercaderías', debit: 0, credit: 0 }
      ]);
      fetchAccountingData();
    } catch (err) {
      console.error(err);
    }
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
        alert('Depreciación de fin de mes calculada y contabilizada exitosamente en el Libro Diario.');
        fetchDepreciations();
      } else {
        const errData = await res.json();
        alert(errData.message || 'Error al calcular depreciación');
      }
    } catch (err) {
      console.error(err);
    }
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

  // Filter products by IVA
  const filteredProducts = products.filter(p => {
    if (ivaFilter === 'with') return p.hasIva;
    if (ivaFilter === 'without') return !p.hasIva;
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

  return (
    <div className={user ? `app-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}` : 'container'} style={user ? {} : { maxWidth: '450px', padding: '2rem 1rem', margin: '0 auto', width: '90%' }}>
      {user ? (
        <>
          {/* Sidebar Nav */}
          <aside className="sidebar glass-panel">
            <div className="sidebar-header">
              <h1 className="brand-title">AuraContable</h1>
              <button className="sidebar-toggle" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}>
                {isSidebarCollapsed ? '›' : '‹'}
              </button>
            </div>

            <nav className="sidebar-nav">
              <button className={`tab-btn ${activeTab === 'kardex' ? 'active' : ''}`} onClick={() => setActiveTab('kardex')}>
                <span className="icon">📦</span> {!isSidebarCollapsed && 'Inventario (Kárdex)'}
              </button>
              <button className={`tab-btn ${activeTab === 'ventas' ? 'active' : ''}`} onClick={() => setActiveTab('ventas')}>
                <span className="icon">📈</span> {!isSidebarCollapsed && 'Ventas (Clientes)'}
              </button>
              <button className={`tab-btn ${activeTab === 'proveedores' ? 'active' : ''}`} onClick={() => setActiveTab('proveedores')}>
                <span className="icon">🤝</span> {!isSidebarCollapsed && 'Compras (Proveedores)'}
              </button>
              <button className={`tab-btn ${activeTab === 'caja' ? 'active' : ''}`} onClick={() => setActiveTab('caja')}>
                <span className="icon">💵</span> {!isSidebarCollapsed && 'Caja y Conciliación'}
              </button>
              <button className={`tab-btn ${activeTab === 'contabilidad' ? 'active' : ''}`} onClick={() => setActiveTab('contabilidad')}>
                <span className="icon">⚖️</span> {!isSidebarCollapsed && 'Contabilidad (Diario)'}
              </button>
              <button className={`tab-btn ${activeTab === 'sri' ? 'active' : ''}`} onClick={() => setActiveTab('sri')}>
                <span className="icon">🏛️</span> {!isSidebarCollapsed && 'SRI Reportes'}
              </button>
              <button className={`tab-btn ${activeTab === 'assets' ? 'active' : ''}`} onClick={() => setActiveTab('assets')}>
                <span className="icon">📉</span> {!isSidebarCollapsed && 'Activos Fijos'}
              </button>
            </nav>

            <div className="sidebar-footer">
              <div className="user-profile-badge" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="user-avatar" style={{ fontSize: '1.5rem' }}>🏢</span>
                {!isSidebarCollapsed && (
                  <div className="user-info" style={{ display: 'flex', flexDirection: 'column', fontSize: '12px' }}>
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
                    <span style={{ opacity: 0.7 }}>RUC: {user.ruc}</span>
                  </div>
                )}
              </div>
              <button className="logout-btn" onClick={logout} style={{ fontSize: isSidebarCollapsed ? '0px' : '12px' }}>
                {isSidebarCollapsed ? '🚪' : 'Cerrar Sesión'}
              </button>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="main-content">
            <header className="top-bar glass-panel animate-slideup">
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                {isSidebarCollapsed && (
                  <button className="sidebar-toggle" onClick={() => setIsSidebarCollapsed(false)}>
                    ☰
                  </button>
                )}
                <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>
                  {activeTab === 'kardex' ? '📦 Inventario & Kárdex' :
                    activeTab === 'ventas' ? '📈 Control de Ventas' :
                      activeTab === 'proveedores' ? '🤝 Gestión de Proveedores' :
                        activeTab === 'caja' ? '💵 Caja & Conciliación' :
                          activeTab === 'contabilidad' ? '⚖️ Libro Diario Contable' :
                            activeTab === 'sri' ? '🏛️ Reportes SRI Form 104' : '📉 Depreciación de Activos Fijos'}
                </h2>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', opacity: 0.8 }}>Ecosistema Autónomo AuraContable</span>
              </div>
            </header>

            {/* Main Dashboard Layout */}
            <main className="tab-content">

              {/* TAB: KARDEX */}
              {activeTab === 'kardex' && (
                <div className="fade-in">
                  <div className="dashboard-grid">
                    {/* Products Table */}
                    <div className="table-container glass-panel" style={{ padding: '1.5rem', margin: '2rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0 }}>Catálogo de Productos e IVA</h3>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className={`btn-sm ${ivaFilter === 'all' ? 'status-aura' : ''}`} onClick={() => setIvaFilter('all')}>Todos</button>
                          <button className={`btn-sm ${ivaFilter === 'with' ? 'status-yes' : ''}`} onClick={() => setIvaFilter('with')}>Con IVA ({globalIvaRate}%)</button>
                          <button className={`btn-sm ${ivaFilter === 'without' ? 'status-no' : ''}`} onClick={() => setIvaFilter('without')}>Sin IVA (0%)</button>
                        </div>
                      </div>
                      {productsLoading ? (
                        <p>Cargando catálogo...</p>
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
                              <th>Valorización ($)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredProducts.map(p => (
                              <tr key={p.id}>
                                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>{p.sku}</td>
                                <td>{p.name}</td>
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
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>

                    {/* Sidebar forms */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <div className="card glass-panel" style={{ padding: '1.5rem' }}>
                        <h4 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>Nuevo Producto</h4>
                        <form onSubmit={handleCreateProduct}>
                          <div className="form-group">
                            <label>SKU (Código único):</label>
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
                                    <label style={{ margin: 0, fontSize: '11px', whiteSpace: 'nowrap' }}>IVA (%):</label>
                                    <input
                                      type="number"
                                      min={0}
                                      max={100}
                                      style={{ width: '60px', padding: '4px 6px', fontSize: '12px' }}
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
                                    <label htmlFor="setAsDefault" style={{ margin: 0, fontSize: '10px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                      Predeterminar valor
                                    </label>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          <button type="submit" className="btn btn-cyan w-full">Crear Producto</button>
                        </form>
                      </div>

                      <div className="card glass-panel" style={{ padding: '1.5rem' }}>
                        <h4 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>Registrar Movimiento Kárdex</h4>
                        <form onSubmit={handleCreateTransaction}>
                          <div className="form-group">
                            <label>Seleccionar Producto:</label>
                            <select value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)}>
                              {products.map(p => (
                                <option key={p.id} value={p.id}>{p.name} ({p.sku}) - Stock: {p.stock}</option>
                              ))}
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
                          <button type="submit" className="btn btn-indigo w-full">Guardar Transacción</button>
                        </form>
                      </div>
                    </div>
                  </div>

                  {/* Kardex logs */}
                  <div className="table-container glass-panel" style={{ padding: '1.5rem', paddingTop: '2rem', marginTop: '1.5rem' }}>
                    <h3>Últimos Movimientos de Kárdex</h3>
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
                              <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
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
                  {/* Metrics Row */}
                  <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
                    <div className="card glass-panel" style={{ padding: '1.25rem' }}>
                      <div className="card-header">
                        <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Venta Total Bruta</span>
                        <span>📈</span>
                      </div>
                      <h3 style={{ margin: '8px 0', fontSize: '20px', color: 'var(--cyan)' }}>${totalSales.toFixed(2)}</h3>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Venta Neta (sin IVA): ${netSales.toFixed(2)}</p>
                    </div>
                    <div className="card glass-panel" style={{ padding: '1.25rem' }}>
                      <div className="card-header">
                        <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>IVA Ventas Cobrado</span>
                        <span>🏛️</span>
                      </div>
                      <h3 style={{ margin: '8px 0', fontSize: '20px', color: 'var(--indigo)' }}>${totalIvaCollected.toFixed(2)}</h3>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{globalIvaRate}% IVA acumulado para declarar al SRI</p>
                    </div>
                    <div className="card glass-panel" style={{ padding: '1.25rem' }}>
                      <div className="card-header">
                        <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Venta Promedio / Factura</span>
                        <span>💰</span>
                      </div>
                      <h3 style={{ margin: '8px 0', fontSize: '20px', color: 'var(--emerald)' }}>${avgTicket.toFixed(2)}</h3>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Ticket promedio para {invoices.length} facturas</p>
                    </div>
                  </div>

                  <div className="dashboard-grid">
                    {/* Invoices List */}
                    <div className="table-container glass-panel" style={{ padding: '1.5rem', margin: 0 }}>
                      <h3 style={{ marginTop: 0 }}>Facturas Electrónicas Emitidas</h3>
                      {invoicesLoading && invoices.length === 0 ? (
                        <p>Cargando facturas...</p>
                      ) : invoices.length === 0 ? (
                        <p>No se han emitido facturas de ventas.</p>
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
                              <th>Envío</th>
                              <th>Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {invoices.map(inv => (
                              <tr key={inv.id}>
                                <td style={{ fontSize: '12px' }}>{new Date(inv.createdAt).toLocaleDateString()}</td>
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
                    <div className="card glass-panel" style={{ padding: '1.5rem' }}>
                      <h4 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>Emitir Factura de Venta</h4>
                      <form onSubmit={handleCreateInvoice}>
                        <div className="form-group">
                          <label>Cliente (Nombre o Razón Social):</label>
                          <input type="text" required value={newClientName} onChange={e => setNewClientName(e.target.value)} placeholder="Ej: CORPORACION EL ROSADO S.A." />
                        </div>
                        <div className="form-group">
                          <label>Monto Total ($):</label>
                          <input type="number" required min={0.01} step="0.01" value={newInvoiceAmount} onChange={e => setNewInvoiceAmount(parseFloat(e.target.value) || 0)} placeholder="Total cobrado al cliente" />
                        </div>
                        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '1rem 0' }}>
                          <input type="checkbox" id="newInvoiceIva" checked={newInvoiceIva} onChange={e => setNewInvoiceIva(e.target.checked)} />
                          <label htmlFor="newInvoiceIva" style={{ margin: 0, cursor: 'pointer' }}>Desglosar {globalIvaRate}% IVA</label>
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
                            <th>Nº Facturas</th>
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
                                  {c.unpaid <= 0 ? 'AL DÍA' : 'SALDO PENDIENTE'}
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
                              <th>Nº Factura</th>
                              <th>Proveedor</th>
                              <th>RUC Proveedor</th>
                              <th>Subtotal ($)</th>
                              <th>IVA ($)</th>
                              <th>Total ($)</th>
                              <th>Tipo</th>
                              <th>Acción</th>
                            </tr>
                          </thead>
                          <tbody>
                            {purchases.map(p => (
                              <tr key={p.id}>
                                <td style={{ fontSize: '12px' }}>{new Date(p.date).toLocaleDateString()}</td>
                                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{p.invoiceNum}</td>
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
                      <h4 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>Subir Compra / Proveedor</h4>
                      <form onSubmit={handleCreatePurchase}>
                        <div className="form-group">
                          <label>Proveedor (Razón Social):</label>
                          <input type="text" required value={newPurProviderName} onChange={e => setNewPurProviderName(e.target.value)} placeholder="Ej: TELCONET S.A." />
                        </div>
                        <div className="form-group">
                          <label>RUC Proveedor:</label>
                          <input type="text" required value={newPurProviderRuc} onChange={e => setNewPurProviderRuc(e.target.value)} placeholder="Ej: 1792144567001" />
                        </div>
                        <div className="grid-2-form">
                          <div className="form-group">
                            <label>Factura Nº:</label>
                            <input type="text" required value={newPurInvoiceNum} onChange={e => setNewPurInvoiceNum(e.target.value)} placeholder="001-002-12345" />
                          </div>
                          <div className="form-group">
                            <label>Fecha Compra:</label>
                            <input type="date" required value={newPurDate} onChange={e => setNewPurDate(e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', fontSize: '14px', outline: 'none' }} />
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
                            <label htmlFor="newPurStockUpdate" style={{ margin: 0, cursor: 'pointer', fontWeight: 'bold' }}>¿Ingresar stock a Kárdex?</label>
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
                        <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Total Ingresos (Cobros)</span>
                        <span style={{ color: 'var(--emerald)' }}>💵</span>
                      </div>
                      <h3 style={{ margin: '8px 0', fontSize: '20px', color: 'var(--emerald)' }}>
                        ${recoSummary?.metrics?.totalRecaudado?.toFixed(2) || '0.00'}
                      </h3>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Dinero recaudado de cobros a clientes</p>
                    </div>
                    <div className="card glass-panel" style={{ padding: '1.25rem' }}>
                      <div className="card-header">
                        <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Total Egresos (Pagos)</span>
                        <span style={{ color: '#f87171' }}>💸</span>
                      </div>
                      <h3 style={{ margin: '8px 0', fontSize: '20px', color: '#f87171' }}>
                        ${recoSummary?.metrics?.totalPagado?.toFixed(2) || '0.00'}
                      </h3>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Dinero pagado a proveedores</p>
                    </div>
                    <div className="card glass-panel" style={{ padding: '1.25rem' }}>
                      <div className="card-header">
                        <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Saldo Neto Caja / Bancos</span>
                        <span style={{ color: 'var(--cyan)' }}>⚖️</span>
                      </div>
                      <h3 style={{ margin: '8px 0', fontSize: '20px', color: (recoSummary?.metrics?.flujoNeto || 0) >= 0 ? 'var(--cyan)' : '#f87171' }}>
                        ${recoSummary?.metrics?.flujoNeto?.toFixed(2) || '0.00'}
                      </h3>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Saldo neto disponible en cuenta principal</p>
                    </div>
                  </div>

                  <div className="dashboard-grid">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      {/* Cruce balances summary table */}
                      <div className="table-container glass-panel" style={{ padding: '1.5rem', margin: 0 }}>
                        <h3>Saldos de Facturas y Caja {recoLoading && <span style={{ fontSize: '12px', color: 'var(--indigo)' }}>(Cargando...)</span>}</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                          <div>
                            <h4 style={{ marginBottom: '8px', fontSize: '13px', textTransform: 'uppercase', color: 'var(--cyan)' }}>Facturas de Ventas Pendientes de Cobro</h4>
                            {recoSummary?.invoices?.filter(i => i.balance > 0).length === 0 ? (
                              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No hay cobros pendientes.</p>
                            ) : (
                              <table>
                                <thead>
                                  <tr>
                                    <th>Cliente</th>
                                    <th>Monto Total</th>
                                    <th>Cobrado en Caja</th>
                                    <th>Retenciones</th>
                                    <th>Saldo</th>
                                    <th>Acción</th>
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
                            <h4 style={{ marginBottom: '8px', fontSize: '13px', textTransform: 'uppercase', color: 'var(--indigo)' }}>Facturas de Compras Pendientes de Pago</h4>
                            {recoSummary?.purchases?.filter(p => p.balance > 0).length === 0 ? (
                              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No hay pagos pendientes.</p>
                            ) : (
                              <table>
                                <thead>
                                  <tr>
                                    <th>Proveedor</th>
                                    <th>Monto Total</th>
                                    <th>Pagado en Caja</th>
                                    <th>Retenciones</th>
                                    <th>Saldo</th>
                                    <th>Acción</th>
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
                                <th>Descripción</th>
                                <th>Origen</th>
                                <th>Monto ($)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {recoSummary?.cashTransactions?.map(tx => (
                                <tr key={tx.id}>
                                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{new Date(tx.date).toLocaleString()}</td>
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
                        <h4 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>Registrar Pago / Cobro (Caja)</h4>
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
                            <label>Descripción / Concepto:</label>
                            <input type="text" required={cashSource === 'MANUAL'} value={cashDesc} onChange={e => setCashDesc(e.target.value)} placeholder="Concepto del movimiento" />
                          </div>
                          <button type="submit" className="btn btn-cyan w-full">Guardar y Contabilizar Caja</button>
                        </form>
                      </div>

                      <div className="card glass-panel" style={{ padding: '1.5rem' }}>
                        <h4 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>Sincronizar Retenciones SRI</h4>
                        <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                          Descarga las retenciones de impuestos emitidas por tus clientes y las que emitiste a tus proveedores, y concílialas.
                        </p>
                        <button onClick={handleSyncWithholdings} className="btn btn-emerald w-full">Sincronizar Retenciones (SRI)</button>
                      </div>
                    </div>
                  </div>
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
                          <h3 style={{ margin: 0 }}>Balance de Comprobación Sumas y Saldos</h3>
                          <span className={`badge-status ${Math.abs(totalDebits - totalCredits) < 0.1 ? 'status-yes' : 'status-no'}`}>
                            {Math.abs(totalDebits - totalCredits) < 0.1 ? 'CONTABILIDAD CUADRADA' : 'CUENTAS DESCUADRADAS'}
                          </span>
                        </div>
                        <table>
                          <thead>
                            <tr>
                              <th>Código</th>
                              <th>Cuenta Contable</th>
                              <th>Debe (Débitos)</th>
                              <th>Haber (Créditos)</th>
                              <th>Saldo Neto</th>
                            </tr>
                          </thead>
                          <tbody>
                            {trialBalance.map(b => (
                              <tr key={b.code}>
                                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{b.code}</td>
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
                            <tr style={{ background: 'rgba(0,0,0,0.3)', fontWeight: 'bold' }}>
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
                              <div key={entry.id} className="journal-entry glass-panel" style={{ padding: '1.25rem', border: '1px solid rgba(99, 102, 241, 0.15)', background: 'rgba(18, 21, 32, 0.4)' }}>
                                <div className="journal-header" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px', marginBottom: '8px' }}>
                                  <span><strong>REF:</strong> {entry.id.slice(0, 8).toUpperCase()} ({entry.type})</span>
                                  <span>{new Date(entry.date).toLocaleString()}</span>
                                </div>
                                <h5 style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: '700', color: 'var(--indigo)' }}>{entry.description}</h5>
                                <table className="journal-table">
                                  <thead>
                                    <tr>
                                      <th style={{ textTransform: 'none', background: 'transparent', padding: '4px' }}>Código</th>
                                      <th style={{ textTransform: 'none', background: 'transparent', padding: '4px' }}>Detalle de Cuenta</th>
                                      <th style={{ textTransform: 'none', background: 'transparent', padding: '4px', textAlign: 'right' }}>Debe</th>
                                      <th style={{ textTransform: 'none', background: 'transparent', padding: '4px', textAlign: 'right' }}>Haber</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {entry.lines.map(line => (
                                      <tr key={line.id} style={{ background: 'transparent' }}>
                                        <td style={{ padding: '4px', fontSize: '12px', fontFamily: 'var(--font-mono)', border: 'none' }}>{line.accountCode}</td>
                                        <td style={{ padding: '4px', fontSize: '12px', paddingLeft: line.credit > 0 ? '24px' : '4px', border: 'none' }}>
                                          {line.accountName}
                                        </td>
                                        <td style={{ padding: '4px', fontSize: '12px', textAlign: 'right', border: 'none', fontFamily: 'var(--font-mono)' }}>
                                          {line.debit > 0 ? `$${line.debit.toFixed(2)}` : '-'}
                                        </td>
                                        <td style={{ padding: '4px', fontSize: '12px', textAlign: 'right', border: 'none', fontFamily: 'var(--font-mono)' }}>
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
                      <h4 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>Ingresar Asiento Diario</h4>
                      <form onSubmit={handleCreateManualEntry}>
                        <div className="form-group">
                          <label>Descripción del Asiento:</label>
                          <input type="text" required value={manualEntryDesc} onChange={e => setManualEntryDesc(e.target.value)} placeholder="Ej. Depósito inicial del socio" />
                        </div>
                        <div className="form-group">
                          <label>Fecha Contable:</label>
                          <input type="date" required value={manualEntryDate} onChange={e => setManualEntryDate(e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', fontSize: '14px', outline: 'none' }} />
                        </div>

                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '8px', marginTop: '8px' }}>
                          <label style={{ fontSize: '11px', color: 'var(--indigo)', marginBottom: '8px', display: 'block' }}>Líneas de Asiento (Deben cuadrar):</label>
                          {manualEntryLines.map((line, idx) => (
                            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '6px', marginBottom: '8px' }}>
                              <select value={line.accountCode} onChange={e => {
                                const code = e.target.value;
                                const names: Record<string, string> = {
                                  '1.01.01': 'Caja/Bancos',
                                  '1.01.02': 'Cuentas por Cobrar Clientes',
                                  '1.01.03': 'Crédito Tributario IVA (Compras)',
                                  '1.01.04': 'Inventario de Mercaderías',
                                  '1.02.01': 'Depreciación Acumulada Activos Fijos',
                                  '2.01.01': 'Cuentas por Pagar Proveedores',
                                  '2.01.03': 'IVA Ventas Cobrado',
                                  '3.01.01': 'Capital Social (Patrimonio)',
                                  '4.01.01': 'Ventas de Servicios/Mercaderías',
                                  '5.01.01': 'Costo de Ventas / Gasto Compra',
                                  '5.01.02': 'Gasto Depreciación Activos Fijos',
                                  '5.01.03': 'Otros Gastos / Ajuste Caja'
                                };
                                const updated = [...manualEntryLines];
                                updated[idx].accountCode = code;
                                updated[idx].accountName = names[code] || 'Cuenta Contable';
                                setManualEntryLines(updated);
                              }}>
                                <option value="1.01.01">1.01.01 Caja/Bancos</option>
                                <option value="1.01.02">1.01.02 Cuentas Cobrar</option>
                                <option value="1.01.03">1.01.03 Crédito IVA</option>
                                <option value="1.01.04">1.01.04 Inventario</option>
                                <option value="1.02.01">1.02.01 Depr. Acumulada</option>
                                <option value="2.01.01">2.01.01 Cuentas Pagar</option>
                                <option value="2.01.03">2.01.03 IVA Ventas</option>
                                <option value="3.01.01">3.01.01 Capital Social</option>
                                <option value="4.01.01">4.01.01 Ventas</option>
                                <option value="5.01.01">5.01.01 Costo/Gasto Compra</option>
                                <option value="5.01.02">5.01.02 Gasto Depreciación</option>
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
                            }}>+ Línea</button>
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
                      📊 Formulario 104 (IVA)
                    </button>
                    <button className={`btn-sm ${sriSubTab === 'ats' ? 'status-aura' : ''}`} onClick={() => setSriSubTab('ats')}>
                      📦 Anexo Transaccional (ATS)
                    </button>
                    <button className={`btn-sm ${sriSubTab === 'config' ? 'status-aura' : ''}`} onClick={() => setSriSubTab('config')}>
                      ⚙️ Configuración SRI & Firma
                    </button>
                  </div>

                  {sriSubTab === 'formulario' && (
                    <div className="table-container glass-panel fade-in" style={{ padding: '1.5rem', margin: 0 }}>
                      <h3 style={{ marginTop: 0 }}>Simulador del Formulario 104 (IVA Ecuador)</h3>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                        Cálculo en tiempo real de los casilleros de ventas y adquisiciones del SRI según facturación electrónica emitida y compras sincronizadas.
                      </p>

                      <table style={{ marginBottom: '1.5rem' }}>
                        <thead>
                          <tr>
                            <th>Casillero</th>
                            <th>Descripción del Rubro</th>
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
                          <tr style={{ fontWeight: 'bold', background: 'rgba(0,0,0,0.1)' }}>
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
                          <tr style={{ fontWeight: 'bold', background: 'rgba(0,0,0,0.1)' }}>
                            <td>599</td>
                            <td>TOTAL ADQUISICIONES Y COMPRAS</td>
                            <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>${(purchasesWithIva + purchasesWithoutIva).toFixed(2)}</td>
                            <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--emerald)' }}>${purchasesTaxPaid.toFixed(2)}</td>
                          </tr>
                        </tbody>
                      </table>

                      <div className="card glass-panel" style={{ padding: '1.25rem', border: '1px solid rgba(99,102,241,0.2)', background: 'rgba(99,102,241,0.02)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <strong style={{ fontSize: '15px', color: 'var(--text-primary)' }}>IMPUESTO A LIQUIDAR (Casillero 601 / 602):</strong>
                            <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '4px 0 0' }}>Fórmula: IVA Cobrado en Ventas - IVA Pagado en Compras (Crédito Tributario)</p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span className={`badge-status ${sriVatPayable >= 0 ? 'status-no' : 'status-yes'}`} style={{ fontSize: '15px', padding: '6px 12px' }}>
                              {sriVatPayable >= 0 ? `A PAGAR: $${sriVatPayable.toFixed(2)}` : `CRÉDITO FISCAL: $${Math.abs(sriVatPayable).toFixed(2)}`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {sriSubTab === 'ats' && (
                    <div className="card glass-panel flex-column fade-in" style={{ padding: '1.5rem', margin: 0 }}>
                      <h3 style={{ marginTop: 0 }}>Generador del Anexo Transaccional (ATS)</h3>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                        Estructura oficial XML/JSON para la declaración simplificada del anexo transaccional del SRI. Contiene datos de ventas y compras del periodo.
                      </p>
                      <div className="console-box" style={{ flex: 1, minHeight: '350px' }}>
                        <div className="console-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>ats_decl_2026.json</span>
                          <button className="btn-sm" onClick={() => {
                            navigator.clipboard.writeText(atsJson);
                            alert('Copiado al portapapeles.');
                          }}>Copiar</button>
                        </div>
                        <pre style={{ margin: 0, padding: '10px', fontSize: '11px', fontFamily: 'var(--font-mono)', overflowY: 'auto', maxHeight: '380px', color: '#67e8f9' }}>
                          {atsJson}
                        </pre>
                      </div>
                    </div>
                  )}

                  {sriSubTab === 'config' && (
                    <div className="grid-2 fade-in">
                      <div className="flex-column" style={{ gap: '1.5rem' }}>
                        {/* Selección del Entorno SRI SOAP */}
                        <div className="card glass-panel" style={{ padding: '1.5rem', margin: 0 }}>
                          <h3 style={{ marginTop: 0 }}>Modo de Conexión SOAP</h3>
                          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                            Selecciona el entorno para interactuar con los servicios web (SOAP) del SRI.
                          </p>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            {/* Opción 1: Simulador Local (Demo) */}
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
                                  ? 'rgba(6, 182, 212, 0.05)'
                                  : 'rgba(0, 0, 0, 0.2)',
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
                              <div style={{ fontSize: '20px' }}>🧪</div>
                              <div style={{ flex: 1 }}>
                                <h4 style={{ margin: '0 0 2px 0', fontSize: '14px', fontWeight: 'bold', color: sriSimulate ? 'var(--cyan)' : 'var(--text-primary)' }}>
                                  Simulador SOAP (Demo de Pruebas)
                                </h4>
                                <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.3', margin: 0 }}>
                                  Respuestas locales inmediatas. No requiere conexión a internet, firma electrónica real ni genera obligaciones tributarias.
                                </p>
                              </div>
                              {sriSimulate && (
                                <span style={{ background: 'var(--cyan)', color: '#090a0f', fontSize: '9px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
                                  Activo
                                </span>
                              )}
                            </div>

                            {/* Opción 2: SOAP SRI - Entorno de Pruebas */}
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
                                  ? 'rgba(99, 102, 241, 0.05)'
                                  : 'rgba(0, 0, 0, 0.2)',
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
                              <div style={{ fontSize: '20px' }}>📡</div>
                              <div style={{ flex: 1 }}>
                                <h4 style={{ margin: '0 0 2px 0', fontSize: '14px', fontWeight: 'bold', color: (!sriSimulate && sriEnvironment === '1') ? 'var(--indigo)' : 'var(--text-primary)' }}>
                                  SOAP SRI - Entorno de Pruebas
                                </h4>
                                <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.3', margin: 0 }}>
                                  Conexión real con el servidor de pruebas (`celcer.sri.gob.ec`). Valida tu firma electrónica (.p12) sin valor tributario legal.
                                </p>
                              </div>
                              {(!sriSimulate && sriEnvironment === '1') && (
                                <span style={{ background: 'var(--indigo)', color: '#ffffff', fontSize: '9px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
                                  Activo
                                </span>
                              )}
                            </div>

                            {/* Opción 3: SOAP SRI - Entorno de Producción (Real) */}
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
                                  ? 'rgba(16, 185, 129, 0.05)'
                                  : 'rgba(0, 0, 0, 0.2)',
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
                              <div style={{ fontSize: '20px' }}>🏛️</div>
                              <div style={{ flex: 1 }}>
                                <h4 style={{ margin: '0 0 2px 0', fontSize: '14px', fontWeight: 'bold', color: (!sriSimulate && sriEnvironment === '2') ? 'var(--emerald)' : 'var(--text-primary)' }}>
                                  SOAP SRI - Entorno de Producción (Principal y Real)
                                </h4>
                                <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.3', margin: 0 }}>
                                  Conexión en vivo con el servidor oficial (`cel.sri.gob.ec`). Emite facturas reales con plena validez legal y tributaria.
                                </p>
                              </div>
                              {(!sriSimulate && sriEnvironment === '2') && (
                                <span style={{ background: 'var(--emerald)', color: '#090a0f', fontSize: '9px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
                                  Activo Real
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Configuración específica según la selección */}
                        <div className="card glass-panel" style={{ padding: '1.5rem', margin: 0 }}>
                          {sriConfigLoading ? (
                            <p>Cargando configuración...</p>
                          ) : sriSimulate ? (
                            /* Interfaz para el Simulador */
                            <div className="fade-in">
                              <h4 style={{ margin: '0 0 10px', color: 'var(--cyan)' }}>🔬 Simulador SOAP Activo</h4>
                              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                                El sistema está configurado en modo educativo y de pruebas locales. Las facturas emitidas simularán su firma y el flujo SOAP del SRI de manera automática.
                              </p>

                              <div style={{ background: 'rgba(6, 182, 212, 0.05)', border: '1px solid rgba(6, 182, 212, 0.2)', borderRadius: '8px', padding: '12px', marginBottom: '1.5rem' }}>
                                <h5 style={{ margin: '0 0 6px', fontSize: '12px', fontWeight: 'bold', color: 'var(--cyan)' }}>Guía Rápida de Interacción:</h5>
                                <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  <li>Dirígete a la pestaña <strong>Control de Ventas</strong>.</li>
                                  <li>Ingresa un cliente ficticio y el monto de la venta.</li>
                                  <li>Haz clic en <strong>Firmar y Transmitir al SRI</strong>.</li>
                                  <li>La factura se autorizará de inmediato, calculando el IVA.</li>
                                </ul>
                              </div>

                              <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                  type="button"
                                  className="btn btn-cyan"
                                  onClick={() => { setShowTutorial(true); setTutorialStep(1); }}
                                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '13px' }}
                                >
                                  📖 Iniciar tutorial
                                </button>

                                <button
                                  type="button"
                                  className="btn"
                                  onClick={handleSaveSriConfig}
                                  style={{ border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-primary)' }}
                                  disabled={sriSaving}
                                >
                                  {sriSaving ? 'Guardando...' : 'Guardar Configuración'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* Formulario para el Sistema Real (Pruebas / Producción) */
                            <form onSubmit={handleSaveSriConfig} className="fade-in">
                              <h4 style={{ margin: '0 0 10px', color: sriEnvironment === '2' ? 'var(--emerald)' : 'var(--indigo)' }}>
                                {sriEnvironment === '2' ? '⚙️ Parámetros del Entorno de Producción' : '⚙️ Parámetros del Entorno de Pruebas'}
                              </h4>
                              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                                Introduce tu firma electrónica para la conexión real al servidor SOAP del SRI.
                              </p>

                              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem', marginTop: '1.25rem' }}>
                                <h5 style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 'bold' }}>Firma Electrónica (Formato .p12)</h5>
                                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                                  Archivo pkcs12 necesario para firmar digitalmente cada documento XML bajo el estándar XAdES-BES.
                                </p>

                                <div className="form-group" style={{ marginBottom: '1rem' }}>
                                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px' }}>Archivo de Firma (.p12):</label>
                                  <input
                                    type="file"
                                    accept=".p12"
                                    onChange={handleP12FileChange}
                                    style={{
                                      background: 'rgba(0,0,0,0.3)',
                                      border: '1px dashed var(--border)',
                                      borderRadius: '8px',
                                      padding: '10px',
                                      color: 'var(--text-primary)',
                                      width: '100%',
                                    }}
                                  />
                                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
                                    {sriConfigHasSignature ? '✔️ Firma guardada anteriormente en el servidor.' : '⚠️ No se ha subido ninguna firma electrónica aún.'}
                                  </span>
                                </div>

                                <div className="form-group">
                                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px' }}>Contraseña de la Firma:</label>
                                  <input
                                    type="password"
                                    value={sriSignaturePassword}
                                    onChange={(e) => setSriSignaturePassword(e.target.value)}
                                    placeholder={sriConfigHasSignature ? '••••••••' : 'Ingresa la contraseña del certificado'}
                                    style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                                  />
                                </div>
                              </div>

                              <button
                                type="submit"
                                className={`btn w-full ${sriEnvironment === '2' ? 'btn-emerald' : 'btn-indigo'}`}
                                style={{ marginTop: '1.5rem' }}
                                disabled={sriSaving}
                              >
                                {sriSaving ? 'Guardando...' : `Guardar Configuración de ${sriEnvironment === '2' ? 'Producción' : 'Pruebas'}`}
                              </button>
                            </form>
                          )}
                        </div>
                      </div>

                      {/* Lado derecho: Estado del SOAP y Diagnóstico */}
                      <div className="card glass-panel" style={{ padding: '1.5rem', margin: 0, display: 'flex', flexDirection: 'column' }}>
                        <h3 style={{ marginTop: 0 }}>Estado del SOAP y Diagnóstico</h3>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                          Detalles sobre los endpoints y pruebas de conexión física con el SRI.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem', flex: 1, maxWidth: '700px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                            <span style={{ fontWeight: '600' }}>WSDL Recepción:</span>
                            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', opacity: 0.8, wordBreak: 'break-all' }}>
                              {sriSimulate ? 'Simulador Local (N/A)' : (sriEnvironment === '2' ? 'https://cel.sri.gob.ec/...' : 'https://celcer.sri.gob.ec/...')}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                            <span style={{ fontWeight: '600' }}>WSDL Autorización:</span>
                            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', opacity: 0.8, wordBreak: 'break-all' }}>
                              {sriSimulate ? 'Simulador Local (N/A)' : (sriEnvironment === '2' ? 'https://cel.sri.gob.ec/...' : 'https://celcer.sri.gob.ec/...')}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                            <span style={{ fontWeight: '600' }}>Conexión SRI SOAP:</span>
                            <span>
                              {sriSimulate ? (
                                <span className="badge-status status-aura">MOCK SIMULADO</span>
                              ) : sriEnvironment === '2' ? (
                                <span className="badge-status status-yes" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--emerald)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>PRODUCCIÓN REAL</span>
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

                        <div style={{ marginTop: '2rem', padding: '1.25rem', borderRadius: '8px', background: 'rgba(0,0,0,0.02)', fontSize: '12px', border: '1px solid var(--border)', maxWidth: '700px' }}>
                          <strong style={{ display: 'block', marginBottom: '8px', color: 'var(--text-primary)' }}>Guía de Comprobación:</strong>
                          <ol style={{ paddingLeft: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {sriSimulate ? (
                              <>
                                <li>Asegúrate de que la configuración esté guardada.</li>
                                <li>Inicia el tutorial con el botón <strong>"Iniciar tutorial"</strong> para entender el flujo completo.</li>
                                <li>Ve al panel de Ventas y emite una nueva factura para ver la simulación en acción.</li>
                              </>
                            ) : sriEnvironment === '2' ? (
                              <>
                                <li>Estás en el entorno de Producción Real.</li>
                                <li>Sube tu archivo de firma electrónica `.p12` real y digita su contraseña.</li>
                                <li>Toda factura emitida aquí se enviará y registrará en la base de datos oficial del SRI.</li>
                              </>
                            ) : (
                              <>
                                <li>Estás en el entorno de Pruebas Real.</li>
                                <li>Sube tu archivo de firma electrónica `.p12` (incluso de pruebas/real) y digita su contraseña.</li>
                                <li>Ve al panel de Ventas y emite una nueva factura. El sistema validará la estructura contra el SRI de pruebas.</li>
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
                              <th>Vida Útil (Años)</th>
                              <th>Depreciación Mensual</th>
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
                                  <td>{a.yearsOfLife} años</td>
                                  <td style={{ color: 'var(--indigo)', fontWeight: 'bold' }}>
                                    ${monthlyDepr.toFixed(2)} / mes
                                  </td>
                                  <td style={{ fontSize: '12px' }}>
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
                        <h4 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>Registrar Activo Fijo</h4>
                        <form onSubmit={handleCreateAsset}>
                          <div className="form-group">
                            <label>Nombre del Activo:</label>
                            <input type="text" required value={newAssetName} onChange={e => setNewAssetName(e.target.value)} placeholder="Ej: Servidor Dell PowerEdge" />
                          </div>
                          <div className="grid-2-form">
                            <div className="form-group">
                              <label>Valor de Adquisición ($):</label>
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
                              <option value="3">Equipos de Cómputo (3 años - 33.3% anual)</option>
                              <option value="5">Vehículos / Logística (5 años - 20% anual)</option>
                              <option value="10">Maquinarias / Muebles (10 años - 10% anual)</option>
                            </select>
                          </div>
                          <button type="submit" className="btn btn-indigo w-full">Calcular y Registrar</button>
                        </form>
                      </div>

                      <div className="card glass-panel" style={{ padding: '1.5rem' }}>
                        <h4 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>Depreciación Automatizada</h4>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                          Calcula y genera de forma automática los asientos contables mensuales de depreciación acumulada para todos los activos según el reglamento de la LORTI.
                        </p>
                        <button onClick={handleRunDepreciation} className="btn btn-indigo w-full">
                          Ejecutar Depreciación Mensual
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Depreciation logs */}
                  <div className="table-container glass-panel" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
                    <h3>Registro Diario de Depreciación Acumulada</h3>
                    {depreciationsLoading ? (
                      <p>Cargando registros...</p>
                    ) : depreciations.length === 0 ? (
                      <p>No se han registrado asientos de depreciación mensual.</p>
                    ) : (
                      <table>
                        <thead>
                          <tr>
                            <th>Período</th>
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



            </main>
            <footer style={{ marginTop: 'auto', paddingTop: '2rem', paddingBottom: '1rem', textAlign: 'center', opacity: 0.6, fontSize: '11px' }}>
              <p>AuraContable — Ecosistema Contable Autónomo Real &copy; 2026</p>
            </footer>
          </div>
        </>
      ) : (
        /* AUTHENTICATION VIEW */
        <div className="auth-container glass-panel animate-slideup" style={{ padding: '2.5rem 2rem' }}>
          <div className="header-glow"></div>
          <div className="auth-header text-center">
            <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              {isLoginView ? 'Iniciar Sesión' : 'Registrar Contribuyente'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginTop: '6px' }}>
              Acceso al Ecosistema Contable Autónomo — AuraContable
            </p>
          </div>

          <form onSubmit={handleAuthSubmit}>
            {!isLoginView && (
              <>
                <div className="form-group">
                  <label>Nombre de la Empresa o Contribuyente:</label>
                  <input type="text" required value={nameInput} placeholder="Ej. Corporación Equinox S.A." onChange={(e) => setNameInput(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Número de RUC:</label>
                  <input type="text" required value={rucInput} placeholder="Ej. 1792455894001" onChange={(e) => setRucInput(e.target.value)} />
                </div>
              </>
            )}

            <div className="form-group">
              <label>Correo Electrónico:</label>
              <input type="email" required value={emailInput} placeholder="ejemplo@aura.com" onChange={(e) => setEmailInput(e.target.value)} />
            </div>

            <div className="form-group">
              <label>Contraseña:</label>
              <input type="password" required value={passwordInput} placeholder="••••••••" onChange={(e) => setPasswordInput(e.target.value)} />
            </div>

            {authFormError && <div className="error-alert">{authFormError}</div>}
            {authError && <div className="error-alert">{authError}</div>}

            <button type="submit" className="btn btn-cyan w-full" style={{ marginTop: '1rem' }}>
              {isLoginView ? 'Ingresar al Sistema' : 'Crear Cuenta'}
            </button>
          </form>

          <div className="auth-toggle" style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '13px' }}>
            {isLoginView ? (
              <p>
                ¿No tienes una cuenta registrada?{' '}
                <button type="button" onClick={() => setIsLoginView(false)} style={{ background: 'transparent', border: 'none', color: 'var(--cyan)', cursor: 'pointer', fontWeight: '600', textDecoration: 'underline' }}>
                  Crea una cuenta aquí
                </button>
              </p>
            ) : (
              <p>
                ¿Ya posees una cuenta activa?{' '}
                <button type="button" onClick={() => setIsLoginView(true)} style={{ background: 'transparent', border: 'none', color: 'var(--cyan)', cursor: 'pointer', fontWeight: '600', textDecoration: 'underline' }}>
                  Inicia sesión aquí
                </button>
              </p>
            )}
          </div>
        </div>
      )}

      {/* XML VIEW MODAL */}
      {activeXml && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '80%', maxWidth: '800px', maxHeight: '80%', display: 'flex', flexDirection: 'column', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '12px' }}>
              <strong>Factura Autorizada por el SRI - Formato XML</strong>
              <button className="btn-sm status-no" onClick={() => setActiveXml(null)}>Cerrar</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', background: '#05070f', padding: '10px', borderRadius: '8px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#22d3ee', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
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
      )}

      {/* INTERACTIVE TUTORIAL MODAL */}
      {showTutorial && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(5px)' }}>
          <div className="glass-panel" style={{ width: '90%', maxWidth: '600px', padding: '2rem', display: 'flex', flexDirection: 'column', position: 'relative', border: '1px solid rgba(6, 182, 212, 0.3)' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>📖</span>
                <strong style={{ fontSize: '16px', color: 'var(--cyan)' }}>Tutorial: Simulador SOAP de Pruebas</strong>
              </div>
              <button
                type="button"
                className="btn-sm status-no"
                onClick={() => setShowTutorial(false)}
                style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: 'none', cursor: 'pointer', padding: '4px 10px', borderRadius: '4px' }}
              >
                Omitir
              </button>
            </div>

            {/* Content based on Step */}
            <div style={{ flex: 1, minHeight: '220px', color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.6' }}>
              {tutorialStep === 1 && (
                <div className="fade-in">
                  <h4 style={{ margin: '0 0 10px 0', color: 'var(--text-primary)', fontSize: '15px' }}>
                    Paso 1 de 5: ¿Qué es el Simulador SOAP de Pruebas?
                  </h4>
                  <p>
                    El <strong>Simulador SOAP (modo demo)</strong> es una herramienta educativa y de validación local integrada en AuraContable.
                  </p>
                  <p style={{ marginTop: '10px' }}>
                    Su principal función es emular de manera idéntica la respuesta de los servidores web del <strong>SRI</strong> (Servicio de Rentas Internas de Ecuador).
                    No requiere que tengas un certificado de firma digital real `.p12` cargado y funciona sin conexión externa al SRI.
                  </p>
                  <div style={{ marginTop: '15px', background: 'rgba(6, 182, 212, 0.05)', border: '1px solid rgba(6, 182, 212, 0.2)', padding: '12px', borderRadius: '6px' }}>
                    💡 <strong>Beneficio:</strong> Ideal para entrenamiento de personal o demostraciones inmediatas sin demoras de red ni errores de validación legal.
                  </div>
                </div>
              )}

              {tutorialStep === 2 && (
                <div className="fade-in">
                  <h4 style={{ margin: '0 0 10px 0', color: 'var(--text-primary)', fontSize: '15px' }}>
                    Paso 2 de 5: Cómo emitir facturas de prueba
                  </h4>
                  <p>
                    Para interactuar con el simulador SOAP:
                  </p>
                  <ol style={{ paddingLeft: '1.25rem', margin: '10px 0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <li>Ve a la pestaña <strong>📈 Control de Ventas</strong> en el menú de navegación principal.</li>
                    <li>Usa el formulario lateral derecho <strong>Emitir Factura de Venta</strong>.</li>
                    <li>Escribe el nombre de un cliente ficticio (ej. <code>Consumidor Final</code>) y un monto.</li>
                    <li>Marca o desmarca <strong>Desglosar {globalIvaRate}% IVA</strong> según prefieras.</li>
                    <li>Haz clic en el botón <strong>Firmar y Transmitir al SRI</strong>.</li>
                  </ol>
                </div>
              )}

              {tutorialStep === 3 && (
                <div className="fade-in">
                  <h4 style={{ margin: '0 0 10px 0', color: 'var(--text-primary)', fontSize: '15px' }}>
                    Paso 3 de 5: Proceso de Firma y SOAP simulado
                  </h4>
                  <p>
                    Cuando presionas el botón de emitir en modo simulación, el sistema ejecuta en segundo plano lo siguiente:
                  </p>
                  <ul style={{ paddingLeft: '1.25rem', margin: '10px 0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <li><strong>Generación del XML:</strong> Genera la estructura oficial offline del comprobante.</li>
                    <li><strong>Firma Digital:</strong> Firma digitalmente el archivo XML usando un certificado mock en memoria.</li>
                    <li><strong>Transmisión SOAP:</strong> Se conecta al servicio local, el cual devuelve el estado <strong>RECIBIDO</strong> y posteriormente <strong>AUTORIZADO</strong> con un número de autorización y clave de acceso simulada de 49 dígitos de manera inmediata.</li>
                  </ul>
                </div>
              )}

              {tutorialStep === 4 && (
                <div className="fade-in">
                  <h4 style={{ margin: '0 0 10px 0', color: 'var(--text-primary)', fontSize: '15px' }}>
                    Paso 4 de 5: Reportes e Impuestos (Formulario 104)
                  </h4>
                  <p>
                    Al autorizarse la factura de pruebas:
                  </p>
                  <p style={{ marginTop: '10px' }}>
                    Los valores de la base imponible y el IVA desglosado se acumulan de inmediato en la contabilidad general de la empresa.
                  </p>
                  <p style={{ marginTop: '10px' }}>
                    Puedes dirigirte a la pestaña <strong>🏛️ Reportes SRI Form 104</strong> y ver cómo se actualizan los casilleros 411 y 412 (ventas gravadas) y se calcula en tiempo real el impuesto a pagar o crédito fiscal, simulando una declaración de IVA real.
                  </p>
                </div>
              )}

              {tutorialStep === 5 && (
                <div className="fade-in">
                  <h4 style={{ margin: '0 0 10px 0', color: 'var(--text-primary)', fontSize: '15px' }}>
                    Paso 5 de 5: Configuración para el Entorno Real
                  </h4>
                  <p>
                    Cuando decidas iniciar a facturar electrónicamente de forma real:
                  </p>
                  <ol style={{ paddingLeft: '1.25rem', margin: '10px 0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <li>Regresa a la pestaña <strong>⚙️ Configuración SRI & Firma</strong>.</li>
                    <li>Selecciona la opción <strong>Sistema Real SRI SOAP</strong>.</li>
                    <li>Carga tu archivo de firma electrónica <code>.p12</code> real y digita su contraseña.</li>
                    <li>Selecciona el ambiente deseado: <strong>Pruebas</strong> (para verificar que tu firma firme bien y el SRI responda) o <strong>Producción</strong> (para facturación oficial legal).</li>
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
                    background: tutorialStep === step ? 'var(--cyan)' : 'rgba(255,255,255,0.1)',
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
      )}

      {!user && (
        <footer style={{ marginTop: '3rem', textAlign: 'center', opacity: 0.6, fontSize: '12px' }}>
          <p>AuraContable — Ecosistema Contable Autónomo Real</p>
          <p style={{ opacity: 0.5, marginTop: '4px' }}>
            Tecnologías: React SPA, Vite, NestJS, Prisma, PostgreSQL con Auth JWT.
          </p>
        </footer>
      )}
    </div>
  );
}
