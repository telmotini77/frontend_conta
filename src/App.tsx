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
  status: 'RECEIVED' | 'AUTHORIZED' | 'REJECTED';
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

interface PurchaseItem {
  sku: string;
  quantity: number;
  unitCost: number;
}

interface Purchase {
  id: string;
  invoiceNum: string;
  claveAcceso: string;
  providerRuc: string;
  providerName: string;
  amount: number;
  date: string;
  items?: PurchaseItem[];
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

export default function App() {
  const { user, token, loading, login, signup, logout, error: authError } = useAuth();

  // Navigation State
  const [activeTab, setActiveTab] = useState<'kardex' | 'assets' | 'invoices' | 'reconciliation'>('kardex');

  // Reconciliation States
  const [recoSummary, setRecoSummary] = useState<ReconciliationSummary | null>(null);
  const [recoLoading, setRecoLoading] = useState(false);
  const [cashType, setCashType] = useState<'INGRESS' | 'EGRESS'>('INGRESS');
  const [cashSource, setCashSource] = useState<'SALE' | 'PURCHASE' | 'MANUAL'>('MANUAL');
  const [cashAmount, setCashAmount] = useState(0);
  const [cashDesc, setCashDesc] = useState('');
  const [cashInvoiceId, setCashInvoiceId] = useState('');
  const [cashPurchaseId, setCashPurchaseId] = useState('');
  const [withholdingNum, setWithholdingNum] = useState('');
  const [withholdingType, setWithholdingType] = useState<'RECEIVED' | 'EMITTED'>('RECEIVED');
  const [withholdingRuc, setWithholdingRuc] = useState('');
  const [withholdingName, setWithholdingName] = useState('');
  const [withholdingRenta, setWithholdingRenta] = useState(0);
  const [withholdingIva, setWithholdingIva] = useState(0);
  const [withholdingTotal, setWithholdingTotal] = useState(0);
  const [withholdingDate, setWithholdingDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedWithholdingId, setSelectedWithholdingId] = useState('');
  const [matchInvoiceId, setMatchInvoiceId] = useState('');
  const [matchPurchaseId, setMatchPurchaseId] = useState('');

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

  // Loading States
  const [productsLoading, setProductsLoading] = useState(false);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [invoicesLoading, setInvoicesLoading] = useState(false);

  // Week 3 state additions
  const [depreciations, setDepreciations] = useState<Depreciation[]>([]);
  const [depreciationsLoading, setDepreciationsLoading] = useState(false);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [purchasesLoading, setPurchasesLoading] = useState(false);

  // Form States (New Product)
  const [newProductSku, setNewProductSku] = useState('');
  const [newProductName, setNewProductName] = useState('');
  const [newProductCost, setNewProductCost] = useState(0);
  const [newProductPrice, setNewProductPrice] = useState(0);
  const [newProductStock, setNewProductStock] = useState(0);

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

  // API base URL
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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
          setSelectedProductId(prev => prev || data[0].id);
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

  // Load active tab data
  useEffect(() => {
    if (user && token) {
      const timer = setTimeout(() => {
        if (activeTab === 'kardex') void fetchProducts();
        if (activeTab === 'assets') {
          void fetchAssets();
          void fetchDepreciations();
        }
        if (activeTab === 'invoices') {
          void fetchInvoices();
          void fetchPurchases();
        }
        if (activeTab === 'reconciliation') {
          void fetchReconciliationSummary();
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [user, token, activeTab, fetchProducts, fetchAssets, fetchDepreciations, fetchInvoices, fetchPurchases, fetchReconciliationSummary]);

  // Periodic polling for invoices to update SRI authorization status
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (user && token && activeTab === 'invoices') {
      interval = setInterval(() => {
        void fetchInvoices();
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [user, token, activeTab, fetchInvoices]);

  // Clear forms when switching views or logging out/in
  useEffect(() => {
    const timer = setTimeout(() => {
      setNameInput('');
      setRucInput('');
      setEmailInput('');
      setPasswordInput('');
      setAuthFormError(null);
    }, 0);
    return () => clearTimeout(timer);
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

  // Actions
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
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
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        alert(errData.message || 'Error al emitir factura');
        return;
      }

      setNewClientName('');
      setNewInvoiceAmount(0);
      fetchInvoices();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRunDepreciation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/assets/depreciate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        alert('Depreciación de fin de mes calculada y asentada exitosamente.');
        fetchDepreciations();
      } else {
        const errData = await res.json();
        alert(errData.message || 'Error al calcular depreciación');
      }
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
          alert(`Sincronización exitosa. Se importaron ${data.length} compras desde el SRI y se actualizó el inventario/Kárdex.`);
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

  const handleCreateWithholding = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/reconciliation/withholdings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          numeroRetencion: withholdingNum,
          type: withholdingType,
          clientOrProviderRuc: withholdingRuc,
          clientOrProviderName: withholdingName,
          amountRenta: Number(withholdingRenta),
          amountIva: Number(withholdingIva),
          amountTotal: Number(withholdingTotal),
          date: withholdingDate,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        alert(errData.message || 'Error al registrar retención');
        return;
      }

      setWithholdingNum('');
      setWithholdingRuc('');
      setWithholdingName('');
      setWithholdingRenta(0);
      setWithholdingIva(0);
      setWithholdingTotal(0);
      fetchReconciliationSummary();
    } catch (err) {
      console.error(err);
    }
  };

  const handleManualMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWithholdingId) {
      alert('Por favor selecciona una retención huérfana');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/reconciliation/match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          withholdingId: selectedWithholdingId,
          invoiceId: matchInvoiceId || undefined,
          purchaseId: matchPurchaseId || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        alert(errData.message || 'Error al conciliar retención');
        return;
      }

      setSelectedWithholdingId('');
      setMatchInvoiceId('');
      setMatchPurchaseId('');
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
        alert(`Sincronización de retenciones exitosa. Se importaron ${data.length} comprobantes de retención y se ejecutó la auto-conciliación.`);
      } else {
        alert('Sincronización de retenciones exitosa. No hay nuevos comprobantes en el SRI.');
      }
      fetchReconciliationSummary();
    } catch (err) {
      console.error(err);
    }
  };

  // Extract recent transactions
  const recentTransactions: { product: string; sku: string; tx: KardexTransaction }[] = [];
  products.forEach(p => {
    if (p.transactions) {
      p.transactions.forEach(t => {
        recentTransactions.push({ product: p.name, sku: p.sku, tx: t });
      });
    }
  });
  recentTransactions.sort((a, b) => new Date(b.tx.date).getTime() - new Date(a.tx.date).getTime());

  return (
    <div className="container" style={{ maxWidth: user ? '1200px' : '450px', padding: '2rem 1rem', margin: '0 auto', width: '100%' }}>
      {user ? (
        <>
          {/* Header */}
          <header className="glass-panel" style={{ padding: '2rem', marginBottom: '1.5rem', position: 'relative' }}>
            <div className="header-glow"></div>
            <div className="user-profile-badge">
              <span className="user-avatar">👤</span>
              <div className="user-info">
                <strong>{user.name}</strong>
                <span>RUC: {user.ruc}</span>
              </div>
              <button className="btn-sm logout-btn" onClick={logout} style={{ marginLeft: '10px' }}>Cerrar Sesión</button>
            </div>
            <h1 style={{ fontSize: '2.2rem', margin: '0.5rem 0' }}>Aura Contable</h1>
            <p className="subtitle" style={{ fontSize: '1rem', opacity: 0.8 }}>
              Ecosistema Contable Autónomo - Panel de Control Real conectado a la Base de Datos.
            </p>
          </header>

          {/* Navigation */}
          <nav className="tabs-nav glass-panel" style={{ marginBottom: '1.5rem', padding: '6px' }}>
            <button
              className={`tab-btn ${activeTab === 'kardex' ? 'active' : ''}`}
              onClick={() => setActiveTab('kardex')}
            >
              <span className="icon">📦</span> Kárdex de Inventario
            </button>
            <button
              className={`tab-btn ${activeTab === 'assets' ? 'active' : ''}`}
              onClick={() => setActiveTab('assets')}
            >
              <span className="icon">📈</span> Activos Fijos
            </button>
            <button
              className={`tab-btn ${activeTab === 'invoices' ? 'active' : ''}`}
              onClick={() => setActiveTab('invoices')}
            >
              <span className="icon">📄</span> Facturación SRI
            </button>
            <button
              className={`tab-btn ${activeTab === 'reconciliation' ? 'active' : ''}`}
              onClick={() => setActiveTab('reconciliation')}
            >
              <span className="icon">⚖️</span> Retenciones & Caja
            </button>
          </nav>

          {/* Main Dashboard Layout */}
          <main className="tab-content">
            
            {/* KÁRDEX TAB */}
            {activeTab === 'kardex' && (
              <div className="fade-in">
                <div className="grid-2" style={{ gridTemplateColumns: '2fr 1.2fr', alignItems: 'start' }}>
                  {/* Products List */}
                  <div className="table-container glass-panel" style={{ padding: '1.5rem', margin: 0 }}>
                    <h3>Inventario Disponible</h3>
                    {productsLoading ? (
                      <p>Cargando catálogo...</p>
                    ) : products.length === 0 ? (
                      <p>No hay productos en inventario.</p>
                    ) : (
                      <table>
                        <thead>
                          <tr>
                            <th>SKU</th>
                            <th>Nombre</th>
                            <th>Stock</th>
                            <th>Costo ($)</th>
                            <th>Precio ($)</th>
                            <th>Total Valor ($)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {products.map(p => (
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
                              <td style={{ fontWeight: '600' }}>${(p.stock * p.cost).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* Sidebar forms */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Add Product Form */}
                    <div className="card glass-panel" style={{ padding: '1.5rem' }}>
                      <h4 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>Nuevo Producto</h4>
                      <form onSubmit={handleCreateProduct}>
                        <div className="form-group">
                          <label>SKU (Código único):</label>
                          <input type="text" required value={newProductSku} onChange={e => setNewProductSku(e.target.value)} placeholder="Ej: COMP-001" />
                        </div>
                        <div className="form-group">
                          <label>Nombre del Producto:</label>
                          <input type="text" required value={newProductName} onChange={e => setNewProductName(e.target.value)} placeholder="Ej: Laptop Intel i5" />
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
                        <div className="form-group">
                          <label>Stock Inicial:</label>
                          <input type="number" required min={0} value={newProductStock} onChange={e => setNewProductStock(parseInt(e.target.value) || 0)} />
                        </div>
                        <button type="submit" className="btn btn-cyan w-full">Crear Producto</button>
                      </form>
                    </div>

                    {/* Adjust Stock Form */}
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

                {/* Recent Transactions List */}
                <div className="table-container glass-panel" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
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

            {/* FIXED ASSETS TAB */}
            {activeTab === 'assets' && (
              <div className="fade-in">
                <div className="grid-2" style={{ gridTemplateColumns: '2fr 1.2fr', alignItems: 'start' }}>
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
                    {/* Add Asset Form */}
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

                    {/* Run Depreciation Card */}
                    <div className="card glass-panel" style={{ padding: '1.5rem' }}>
                      <h4 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>Depreciación Automatizada</h4>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                        Calcula y genera de forma automática los asientos contables mensuales de depreciación acumulada para todos los activos según el reglamento de la LORTI.
                      </p>
                      <button onClick={handleRunDepreciation} className="btn btn-indigo w-full">
                        Ejecutar Depreciación Mensual
                      </button>
                    </div>
                  </div>
                </div>

                {/* Depreciation logs list */}
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

            {/* INVOICES TAB */}
            {activeTab === 'invoices' && (
              <div className="fade-in">
                <div className="grid-2" style={{ gridTemplateColumns: '2fr 1.2fr', alignItems: 'start' }}>
                  {/* Invoices list */}
                  <div className="table-container glass-panel" style={{ padding: '1.5rem', margin: 0 }}>
                    <h3>Facturas Electrónicas Emitidas</h3>
                    {invoicesLoading && invoices.length === 0 ? (
                      <p>Cargando facturas...</p>
                    ) : invoices.length === 0 ? (
                      <p>No se han emitido facturas.</p>
                    ) : (
                      <table>
                        <thead>
                          <tr>
                            <th>Clave de Acceso (SRI)</th>
                            <th>Cliente</th>
                            <th>Monto ($)</th>
                            <th>Estado SRI</th>
                            <th>Fecha Emisión</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoices.map(inv => (
                            <tr key={inv.id}>
                              <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', wordBreak: 'break-all', maxWidth: '280px' }}>
                                {inv.claveAcceso}
                              </td>
                              <td><strong>{inv.clientName}</strong></td>
                              <td style={{ fontWeight: '600' }}>${inv.amount.toFixed(2)}</td>
                              <td>
                                <span className={`badge-status ${inv.status === 'AUTHORIZED' ? 'status-yes' : inv.status === 'RECEIVED' ? 'status-partial' : 'status-no'}`}>
                                  {inv.status === 'AUTHORIZED' ? 'AUTORIZADO' : inv.status === 'RECEIVED' ? 'RECIBIDO' : 'RECHAZADO'}
                                </span>
                              </td>
                              <td style={{ fontSize: '12px' }}>
                                {new Date(inv.createdAt).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* Sidebar forms */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Add/Simulate Invoice Form */}
                    <div className="card glass-panel" style={{ padding: '1.5rem' }}>
                      <h4 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>Emitir Factura Electrónica</h4>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                        Genera la clave de acceso criptográfica y simula de forma asíncrona la recepción y posterior autorización por el Web Service del SRI.
                      </p>
                      <form onSubmit={handleCreateInvoice}>
                        <div className="form-group">
                          <label>Cliente (Razón Social o Nombre):</label>
                          <input type="text" required value={newClientName} onChange={e => setNewClientName(e.target.value)} placeholder="Ej: Corporación Favorita S.A." />
                        </div>
                        <div className="form-group">
                          <label>Monto Total ($):</label>
                          <input type="number" required min={0.01} step="0.01" value={newInvoiceAmount} onChange={e => setNewInvoiceAmount(parseFloat(e.target.value) || 0)} />
                        </div>
                        <button type="submit" className="btn btn-cyan w-full">
                          Emitir y Firmar XML
                        </button>
                      </form>
                    </div>

                    {/* Sync Purchases Scraper */}
                    <div className="card glass-panel" style={{ padding: '1.5rem' }}>
                      <h4 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>Sincronizador SRI (Compras)</h4>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                        Activa el scraper nocturno para descargar las facturas electrónicas recibidas por tus proveedores y actualizar el inventario automáticamente.
                      </p>
                      <button onClick={handleSyncPurchases} className="btn btn-emerald w-full">
                        Sincronizar Compras (SRI Scraper)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Purchases list */}
                <div className="table-container glass-panel" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
                  <h3>Compras Sincronizadas (SRI Recibidos)</h3>
                  {purchasesLoading ? (
                    <p>Cargando compras...</p>
                  ) : purchases.length === 0 ? (
                    <p>No se han importado comprobantes de compra.</p>
                  ) : (
                    <table>
                      <thead>
                        <tr>
                          <th>Factura Nº</th>
                          <th>Proveedor</th>
                          <th>RUC Proveedor</th>
                          <th>Monto ($)</th>
                          <th>Fecha Emisión</th>
                          <th>Estado Kárdex</th>
                        </tr>
                      </thead>
                      <tbody>
                        {purchases.map((pur) => (
                          <tr key={pur.id}>
                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{pur.invoiceNum}</td>
                            <td><strong>{pur.providerName}</strong></td>
                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{pur.providerRuc}</td>
                            <td style={{ fontWeight: '600', color: 'var(--emerald)' }}>${pur.amount.toFixed(2)}</td>
                            <td>{new Date(pur.date).toLocaleDateString()}</td>
                            <td>
                              <span className={`badge-status ${pur.amount > 500 ? 'status-yes' : 'status-aura'}`}>
                                {pur.amount > 500 ? 'STOCK ACTUALIZADO' : 'REGISTRADO'}
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

            {/* RECONCILIATION TAB */}
            {activeTab === 'reconciliation' && (
              <div className="fade-in">
                {/* Metrics Summary cards */}
                <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
                  <div className="card glass-panel" style={{ padding: '1.25rem' }}>
                    <div className="card-header">
                      <span className="card-title" style={{ fontSize: '1.1rem' }}>Flujo de Caja</span>
                      <span style={{ fontSize: '1.5rem' }}>💵</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                        <span>Total Recaudado (Ventas):</span>
                        <strong style={{ color: 'var(--emerald)' }}>${recoSummary?.metrics?.totalRecaudado?.toFixed(2) || '0.00'}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                        <span>Total Pagado (Compras):</span>
                        <strong style={{ color: '#f87171' }}>${recoSummary?.metrics?.totalPagado?.toFixed(2) || '0.00'}</strong>
                      </div>
                      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '4px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                        <span>Flujo Neto:</span>
                        <span style={{ color: (recoSummary?.metrics?.flujoNeto || 0) >= 0 ? 'var(--cyan)' : '#f87171' }}>
                          ${recoSummary?.metrics?.flujoNeto?.toFixed(2) || '0.00'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="card glass-panel" style={{ padding: '1.25rem' }}>
                    <div className="card-header">
                      <span className="card-title" style={{ fontSize: '1.1rem' }}>Crédito Tributario (Retenciones)</span>
                      <span style={{ fontSize: '1.5rem' }}>🪙</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                        <span>Crédito Renta:</span>
                        <strong style={{ color: 'var(--amber)' }}>${recoSummary?.metrics?.creditRenta?.toFixed(2) || '0.00'}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                        <span>Crédito: IVA:</span>
                        <strong style={{ color: 'var(--amber)' }}>${recoSummary?.metrics?.creditIva?.toFixed(2) || '0.00'}</strong>
                      </div>
                      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '4px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                        <span>Total Crédito:</span>
                        <strong style={{ color: 'var(--amber)' }}>${recoSummary?.metrics?.creditoTotal?.toFixed(2) || '0.00'}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="card glass-panel" style={{ padding: '1.25rem' }}>
                    <div className="card-header">
                      <span className="card-title" style={{ fontSize: '1.1rem' }}>Resumen Conciliación</span>
                      <span style={{ fontSize: '1.5rem' }}>⚖️</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                        <span>Ventas por Cobrar:</span>
                        <strong>{recoSummary?.invoices?.filter(i => i.balance > 0).length || 0} pendientes</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                        <span>Compras por Pagar:</span>
                        <strong>{recoSummary?.purchases?.filter(p => p.balance > 0).length || 0} pendientes</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                        <span>Retenciones Huérfanas:</span>
                        <strong style={{ color: '#f87171' }}>
                          {recoSummary?.withholdings?.filter(w => !w.invoiceId && !w.purchaseId).length || 0} sin vincular
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid-2" style={{ gridTemplateColumns: '2fr 1.2fr', alignItems: 'start' }}>
                  {/* Left Column */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    
                    {/* Open Documents and Reconciliation status */}
                    <div className="table-container glass-panel" style={{ padding: '1.5rem', margin: 0 }}>
                      <h3>Cruce y Conciliación de Cuentas por Cobrar & Pagar</h3>
                      {recoLoading && !recoSummary ? (
                        <p>Cargando datos...</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                          <div>
                            <h4 style={{ marginBottom: '8px', fontSize: '13px', textTransform: 'uppercase', color: 'var(--cyan)' }}>Facturas de Venta (Clientes)</h4>
                            {recoSummary?.invoices?.length === 0 ? (
                              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>No hay facturas emitidas.</p>
                            ) : (
                              <table>
                                <thead>
                                  <tr>
                                    <th>Cliente</th>
                                    <th>Total ($)</th>
                                    <th>Abono Caja ($)</th>
                                    <th>Retenido ($)</th>
                                    <th>Saldo ($)</th>
                                    <th>Estado</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {recoSummary?.invoices?.map(inv => (
                                    <tr key={inv.id}>
                                      <td>
                                        <strong>{inv.clientName}</strong>
                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{inv.claveAcceso.slice(0, 20)}...</div>
                                      </td>
                                      <td>${inv.amount.toFixed(2)}</td>
                                      <td>${inv.cashPaid.toFixed(2)}</td>
                                      <td>${inv.withheld.toFixed(2)}</td>
                                      <td style={{ fontWeight: 'bold', color: inv.balance > 0 ? 'var(--amber)' : 'var(--emerald)' }}>
                                        ${inv.balance.toFixed(2)}
                                      </td>
                                      <td>
                                        <span className={`badge-status ${inv.status === 'CONCILIADO' ? 'status-yes' : inv.status === 'PARCIAL' ? 'status-partial' : 'status-no'}`}>
                                          {inv.status === 'CONCILIADO' ? 'CONCILIADO' : inv.status === 'PARCIAL' ? 'ABONADO' : 'PENDIENTE'}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>

                          <div>
                            <h4 style={{ marginBottom: '8px', fontSize: '13px', textTransform: 'uppercase', color: 'var(--indigo)' }}>Facturas de Compra (Proveedores)</h4>
                            {recoSummary?.purchases?.length === 0 ? (
                              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>No hay facturas de compra importadas.</p>
                            ) : (
                              <table>
                                <thead>
                                  <tr>
                                    <th>Proveedor</th>
                                    <th>Total ($)</th>
                                    <th>Pago Caja ($)</th>
                                    <th>Retenido ($)</th>
                                    <th>Saldo ($)</th>
                                    <th>Estado</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {recoSummary?.purchases?.map(pur => (
                                    <tr key={pur.id}>
                                      <td>
                                        <strong>{pur.providerName}</strong>
                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>RUC: {pur.providerRuc}</div>
                                      </td>
                                      <td>${pur.amount.toFixed(2)}</td>
                                      <td>${pur.cashPaid.toFixed(2)}</td>
                                      <td>${pur.withheld.toFixed(2)}</td>
                                      <td style={{ fontWeight: 'bold', color: pur.balance > 0 ? 'var(--amber)' : 'var(--emerald)' }}>
                                        ${pur.balance.toFixed(2)}
                                      </td>
                                      <td>
                                        <span className={`badge-status ${pur.status === 'CONCILIADO' ? 'status-yes' : pur.status === 'PARCIAL' ? 'status-partial' : 'status-no'}`}>
                                          {pur.status === 'CONCILIADO' ? 'CONCILIADO' : pur.status === 'PARCIAL' ? 'PAGADO PARCIAL' : 'PENDIENTE'}
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
                    </div>

                    {/* Withholdings History */}
                    <div className="table-container glass-panel" style={{ padding: '1.5rem', margin: 0 }}>
                      <h3>Comprobantes de Retención (SRI Sincronizados & Manuales)</h3>
                      {recoSummary?.withholdings?.length === 0 ? (
                        <p>No se han registrado retenciones.</p>
                      ) : (
                        <table>
                          <thead>
                            <tr>
                              <th>Retención Nº</th>
                              <th>Razón Social</th>
                              <th>RUC</th>
                              <th>Tipo</th>
                              <th>Ret. Renta ($)</th>
                              <th>Ret. IVA ($)</th>
                              <th>Total ($)</th>
                              <th>Cruce Documento</th>
                            </tr>
                          </thead>
                          <tbody>
                            {recoSummary?.withholdings?.map(w => (
                              <tr key={w.id}>
                                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{w.numeroRetencion}</td>
                                <td>{w.clientOrProviderName}</td>
                                <td style={{ fontFamily: 'var(--font-mono)' }}>{w.clientOrProviderRuc}</td>
                                <td>
                                  <span className={`badge-status ${w.type === 'RECEIVED' ? 'status-yes' : 'status-no'}`}>
                                    {w.type === 'RECEIVED' ? 'RECIBIDA' : 'EMITIDA'}
                                  </span>
                                </td>
                                <td>${w.amountRenta.toFixed(2)}</td>
                                <td>${w.amountIva.toFixed(2)}</td>
                                <td style={{ fontWeight: 'bold' }}>${w.amountTotal.toFixed(2)}</td>
                                <td>
                                  {w.invoiceId || w.purchaseId ? (
                                    <span className="badge-status status-aura">CONCILIADO</span>
                                  ) : (
                                    <span className="badge-status status-no">HUÉRFANO</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>

                    {/* Cash Transactions list */}
                    <div className="table-container glass-panel" style={{ padding: '1.5rem', margin: 0 }}>
                      <h3>Historial de Movimientos de Caja / Bancos</h3>
                      {recoSummary?.cashTransactions?.length === 0 ? (
                        <p>No se han registrado movimientos de caja.</p>
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
                                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                                  {new Date(tx.date).toLocaleString()}
                                </td>
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

                  {/* Right Column (Forms) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    
                    {/* Sync SRI Withholdings */}
                    <div className="card glass-panel" style={{ padding: '1.5rem' }}>
                      <h4 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>Sincronizador SRI (Retenciones)</h4>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                        Descarga las retenciones electrónicas emitidas por tus clientes y las emitidas por ti a proveedores, y ejecuta la auto-conciliación inteligente.
                      </p>
                      <button onClick={handleSyncWithholdings} className="btn btn-emerald w-full">
                        Sincronizar Retenciones (SRI)
                      </button>
                    </div>

                    {/* Record Cash Payment/Collection */}
                    <div className="card glass-panel" style={{ padding: '1.5rem' }}>
                      <h4 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>Registrar Pago / Cobro (Caja)</h4>
                      <form onSubmit={handleCreateCashTransaction}>
                        <div className="form-group">
                          <label>Origen de la Transacción:</label>
                          <select
                            value={cashSource}
                            onChange={(e) => {
                              const src = e.target.value as 'SALE' | 'PURCHASE' | 'MANUAL';
                              setCashSource(src);
                              if (src === 'SALE') setCashType('INGRESS');
                              if (src === 'PURCHASE') setCashType('EGRESS');
                            }}
                          >
                            <option value="MANUAL">Manual (Ajuste de caja)</option>
                            <option value="SALE">Cobro de Venta (Factura Emitida)</option>
                            <option value="PURCHASE">Pago de Compra (SRI Recibidos)</option>
                          </select>
                        </div>

                        {cashSource === 'SALE' && (
                          <div className="form-group">
                            <label>Seleccionar Factura:</label>
                            <select value={cashInvoiceId} onChange={(e) => setCashInvoiceId(e.target.value)} required>
                              <option value="">-- Seleccionar Factura --</option>
                              {recoSummary?.invoices?.filter(i => i.balance > 0).map(inv => (
                                <option key={inv.id} value={inv.id}>
                                  {inv.clientName} - Saldo: ${inv.balance.toFixed(2)}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {cashSource === 'PURCHASE' && (
                          <div className="form-group">
                            <label>Seleccionar Factura de Compra:</label>
                            <select value={cashPurchaseId} onChange={(e) => setCashPurchaseId(e.target.value)} required>
                              <option value="">-- Seleccionar Compra --</option>
                              {recoSummary?.purchases?.filter(p => p.balance > 0).map(pur => (
                                <option key={pur.id} value={pur.id}>
                                  {pur.providerName} - Saldo: ${pur.balance.toFixed(2)}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div className="grid-2-form">
                          <div className="form-group">
                            <label>Tipo Movimiento:</label>
                            <select value={cashType} onChange={(e) => setCashType(e.target.value as 'INGRESS' | 'EGRESS')} disabled={cashSource !== 'MANUAL'}>
                              <option value="INGRESS">Ingreso (Caja Entrada)</option>
                              <option value="EGRESS">Egreso (Caja Salida)</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Monto ($):</label>
                            <input
                              type="number"
                              required
                              min={0.01}
                              step="0.01"
                              value={cashAmount}
                              onChange={(e) => setCashAmount(parseFloat(e.target.value) || 0)}
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label>Descripción / Detalle:</label>
                          <input
                            type="text"
                            required={cashSource === 'MANUAL'}
                            value={cashDesc}
                            onChange={(e) => setCashDesc(e.target.value)}
                            placeholder={cashSource === 'MANUAL' ? "Ej. Apertura de caja chica" : "Opcional (se generará automáticamente)"}
                          />
                        </div>

                        <button type="submit" className="btn btn-cyan w-full">Registrar Movimiento</button>
                      </form>
                    </div>

                    {/* Manual Matching (Orphan withholdings) */}
                    <div className="card glass-panel" style={{ padding: '1.5rem' }}>
                      <h4 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>Conciliación Manual (Retenciones)</h4>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                        Cruza una retención huérfana (que no se auto-asoció al SRI) con su factura de venta o compra correspondiente.
                      </p>
                      <form onSubmit={handleManualMatch}>
                        <div className="form-group">
                          <label>Retención Huérfana:</label>
                          <select value={selectedWithholdingId} onChange={(e) => setSelectedWithholdingId(e.target.value)} required>
                            <option value="">-- Seleccionar Retención --</option>
                            {recoSummary?.withholdings?.filter(w => !w.invoiceId && !w.purchaseId).map(w => (
                              <option key={w.id} value={w.id}>
                                [{w.type === 'RECEIVED' ? 'REC' : 'EMI'}] {w.numeroRetencion} - {w.clientOrProviderName} (${w.amountTotal.toFixed(2)})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Determine matched document type based on withholding type */}
                        {(() => {
                          const selectedWithholding = recoSummary?.withholdings?.find(w => w.id === selectedWithholdingId);
                          if (!selectedWithholding) return null;

                          if (selectedWithholding.type === 'RECEIVED') {
                            return (
                              <div className="form-group">
                                <label>Vincular a Factura de Venta:</label>
                                <select value={matchInvoiceId} onChange={(e) => setMatchInvoiceId(e.target.value)} required>
                                  <option value="">-- Seleccionar Factura --</option>
                                  {recoSummary?.invoices?.filter(i => i.balance > 0).map(inv => (
                                    <option key={inv.id} value={inv.id}>
                                      {inv.clientName} - Saldo: ${inv.balance.toFixed(2)} (Monto: ${inv.amount.toFixed(2)})
                                    </option>
                                  ))}
                                </select>
                              </div>
                            );
                          } else {
                            return (
                              <div className="form-group">
                                <label>Vincular a Factura de Compra:</label>
                                <select value={matchPurchaseId} onChange={(e) => setMatchPurchaseId(e.target.value)} required>
                                  <option value="">-- Seleccionar Compra --</option>
                                  {recoSummary?.purchases?.filter(p => p.balance > 0).map(pur => (
                                    <option key={pur.id} value={pur.id}>
                                      {pur.providerName} - Saldo: ${pur.balance.toFixed(2)} (Monto: ${pur.amount.toFixed(2)})
                                    </option>
                                  ))}
                                </select>
                              </div>
                            );
                          }
                        })()}

                        <button type="submit" className="btn btn-indigo w-full">Vincular y Conciliar</button>
                      </form>
                    </div>

                    {/* Create Manual Withholding */}
                    <div className="card glass-panel" style={{ padding: '1.5rem' }}>
                      <h4 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>Ingresar Retención Física/Manual</h4>
                      <form onSubmit={handleCreateWithholding}>
                        <div className="grid-2-form">
                          <div className="form-group">
                            <label>Tipo Retención:</label>
                            <select value={withholdingType} onChange={(e) => setWithholdingType(e.target.value as 'RECEIVED' | 'EMITTED')}>
                              <option value="RECEIVED">Recibida (Ventas)</option>
                              <option value="EMITTED">Emitida (Compras)</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Nº Retención:</label>
                            <input
                              type="text"
                              required
                              value={withholdingNum}
                              onChange={(e) => setWithholdingNum(e.target.value)}
                              placeholder="Ej. 001-002-12345"
                            />
                          </div>
                        </div>

                        <div className="grid-2-form">
                          <div className="form-group">
                            <label>RUC Razón Social:</label>
                            <input
                              type="text"
                              required
                              value={withholdingRuc}
                              onChange={(e) => setWithholdingRuc(e.target.value)}
                              placeholder="1790012345001"
                            />
                          </div>
                          <div className="form-group">
                            <label>Razón Social / Nombre:</label>
                            <input
                              type="text"
                              required
                              value={withholdingName}
                              onChange={(e) => setWithholdingName(e.target.value)}
                              placeholder="Ej. Banco Pichincha"
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label>Fecha de Emisión:</label>
                          <input
                            type="date"
                            required
                            value={withholdingDate}
                            onChange={(e) => setWithholdingDate(e.target.value)}
                            style={{ width: '100%', background: 'rgba(0, 0, 0, 0.3)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', fontSize: '14px', outline: 'none' }}
                          />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                          <div className="form-group">
                            <label>Ret. Renta ($):</label>
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              value={withholdingRenta}
                              onChange={(e) => {
                                const r = parseFloat(e.target.value) || 0;
                                setWithholdingRenta(r);
                                setWithholdingTotal(r + withholdingIva);
                              }}
                            />
                          </div>
                          <div className="form-group">
                            <label>Ret. IVA ($):</label>
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              value={withholdingIva}
                              onChange={(e) => {
                                const v = parseFloat(e.target.value) || 0;
                                setWithholdingIva(v);
                                setWithholdingTotal(withholdingRenta + v);
                              }}
                            />
                          </div>
                          <div className="form-group">
                            <label>Total ($):</label>
                            <input
                              type="number"
                              min={0.01}
                              step="0.01"
                              value={withholdingTotal}
                              onChange={(e) => setWithholdingTotal(parseFloat(e.target.value) || 0)}
                            />
                          </div>
                        </div>

                        <button type="submit" className="btn btn-indigo w-full">Ingresar Retención</button>
                      </form>
                    </div>

                  </div>
                </div>
              </div>
            )}

          </main>
        </>
      ) : (
        /* AUTHENTICATION VIEW (LOGIN / SIGNUP) */
        <div className="auth-container glass-panel" style={{ padding: '2.5rem 2rem' }}>
          <div className="header-glow"></div>
          <div className="auth-header">
            <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{isLoginView ? 'Iniciar Sesión' : 'Registrar Contribuyente'}</h2>
            <p>Acceso al Ecosistema Contable Autónomo - Aura Contable</p>
          </div>

          <form onSubmit={handleAuthSubmit}>
            {!isLoginView && (
              <>
                <div className="form-group">
                  <label>Nombre de la Empresa o Contribuyente:</label>
                  <input
                    type="text"
                    required
                    value={nameInput}
                    placeholder="Ej. Corporación Equinox S.A."
                    onChange={(e) => setNameInput(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Número de RUC:</label>
                  <input
                    type="text"
                    required
                    value={rucInput}
                    placeholder="Ej. 1792455894001"
                    onChange={(e) => setRucInput(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label>Correo Electrónico:</label>
              <input
                type="email"
                required
                value={emailInput}
                placeholder="ejemplo@aura.com"
                onChange={(e) => setEmailInput(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Contraseña:</label>
              <input
                type="password"
                required
                value={passwordInput}
                placeholder="••••••••"
                onChange={(e) => setPasswordInput(e.target.value)}
              />
            </div>

            {authFormError && <div className="error-alert">{authFormError}</div>}
            {authError && <div className="error-alert">{authError}</div>}

            <button type="submit" className="btn btn-cyan w-full" style={{ marginTop: '1rem' }}>
              {isLoginView ? 'Ingresar al Sistema' : 'Crear Cuenta'}
            </button>
          </form>

          <div className="auth-toggle">
            {isLoginView ? (
              <p>
                ¿No tienes una cuenta registrada?{' '}
                <button type="button" onClick={() => setIsLoginView(false)}>
                  Crea una cuenta aquí
                </button>
              </p>
            ) : (
              <p>
                ¿Ya posees una cuenta activa?{' '}
                <button type="button" onClick={() => setIsLoginView(true)}>
                  Inicia sesión aquí
                </button>
              </p>
            )}
          </div>
        </div>
      )}

      <footer style={{ marginTop: '3rem', textAlign: 'center', opacity: 0.6, fontSize: '12px' }}>
        <p>Aura Contable — Ecosistema Contable Autónomo Real</p>
        <p style={{ opacity: 0.5, marginTop: '4px' }}>
          Tecnologías: React SPA, Vite, NestJS, Prisma, PostgreSQL con Auth JWT.
        </p>
      </footer>
    </div>
  );
}
