import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import './BillingSystem.css';

interface BillingSystemProps {
  products: any[];
  globalIvaRate: number;
  sriEnvironment: string;
  sriSignatureBase64: string;
  sriSignaturePassword: string;
  sriSimulate: boolean;
  sriIsBranch: boolean;
  sriParentCompanyRuc: string;
  sriEstablishmentCode: string;
  sriEmissionPoint: string;
  sriEstablishmentAddress: string;
  fetchInvoices: () => Promise<void>;
  fetchProducts: () => Promise<void>;
}

const MOCK_CLIENTS = [
  { name: 'Consumidor Final', ruc: '9999999999999', email: 'consumidor@final.com' },
  { name: 'Juan Carlos Pérez', ruc: '1712345678001', email: 'juan.perez@gmail.com' },
  { name: 'Corporación GP S.A.', ruc: '1790012345001', email: 'contacto@gp.com.ec' },
  { name: 'Aura Contable Demo Client', ruc: '1792455894001', email: 'cliente@auracontable.com' },
];

export default function BillingSystem({
  products,
  globalIvaRate,
  sriEnvironment,
  sriSignatureBase64,
  sriSignaturePassword,
  sriSimulate,
  sriIsBranch,
  sriParentCompanyRuc,
  sriEstablishmentCode,
  sriEmissionPoint,
  sriEstablishmentAddress,
  fetchInvoices,
  fetchProducts
}: BillingSystemProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'mantenimiento' | 'forma_cobro'>('forma_cobro');
  
  // Grid invoices state represents the rows of items inside the current invoice
  const [invoices, setInvoices] = useState<any[]>([
    { id: Date.now(), productId: '', sku: '', name: '', quantity: 1, price: 0, discount: 0, iva: 0, total: 0, measure: 'Unidad', hasIva: false }
  ]);

  // Client and metadata states
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientRuc, setClientRuc] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));

  // Autocomplete UI states
  const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');

  const handleBarcodeKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const sku = barcodeInput.trim();
      if (!sku) return;

      const matchedProduct = products.find(p => p.sku.toLowerCase() === sku.toLowerCase());
      if (matchedProduct) {
        const updated = [...invoices];
        const emptyRowIdx = updated.findIndex(row => row.productId === '');

        if (emptyRowIdx !== -1) {
          updated[emptyRowIdx] = {
            ...updated[emptyRowIdx],
            productId: matchedProduct.id,
            sku: matchedProduct.sku,
            name: matchedProduct.name,
            price: matchedProduct.price,
            hasIva: matchedProduct.hasIva,
            quantity: 1,
            measure: 'Unidad'
          };
          const rowSub = matchedProduct.price * 1;
          const rowIva = matchedProduct.hasIva ? rowSub * (globalIvaRate / 100) : 0;
          updated[emptyRowIdx].iva = rowIva;
          updated[emptyRowIdx].total = rowSub + rowIva;
          setInvoices(updated);
        } else {
          const rowSub = matchedProduct.price * 1;
          const rowIva = matchedProduct.hasIva ? rowSub * (globalIvaRate / 100) : 0;
          setInvoices([...invoices, {
            id: Date.now(),
            productId: matchedProduct.id,
            sku: matchedProduct.sku,
            name: matchedProduct.name,
            quantity: 1,
            price: matchedProduct.price,
            discount: 0,
            iva: rowIva,
            total: rowSub + rowIva,
            measure: 'Unidad',
            hasIva: matchedProduct.hasIva
          }]);
        }
        setBarcodeInput('');
      } else {
        alert(`Producto con código SKU "${sku}" no encontrado en el catálogo.`);
      }
    }
  };

  // Filter clients suggestions
  const filteredClients = clientSearchQuery.trim()
    ? MOCK_CLIENTS.filter(c =>
        c.name.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
        c.ruc.includes(clientSearchQuery)
      )
    : [];

  // Filter products suggestions
  const filteredProducts = productSearchQuery.trim()
    ? products.filter(p =>
        p.sku.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
        p.name.toLowerCase().includes(productSearchQuery.toLowerCase())
      )
    : [];

  // Calculate live totals
  const getTotals = () => {
    let subtotalBase = 0;
    let totalDiscount = 0;
    let subtotalConIva = 0;
    let subtotalZeroIva = 0;
    let totalIva = 0;

    invoices.forEach(item => {
      const rowSubtotal = item.price * item.quantity;
      const rowDiscount = rowSubtotal * (item.discount / 100);
      const rowNetSubtotal = rowSubtotal - rowDiscount;

      subtotalBase += rowSubtotal;
      totalDiscount += rowDiscount;

      if (item.hasIva) {
        subtotalConIva += rowNetSubtotal;
        totalIva += rowNetSubtotal * (globalIvaRate / 100);
      } else {
        subtotalZeroIva += rowNetSubtotal;
      }
    });

    const subtotalNeto = subtotalBase - totalDiscount;
    const totalToPay = subtotalNeto + totalIva;

    return {
      subtotalBase,
      totalDiscount,
      subtotalNeto,
      subtotalConIva,
      subtotalZeroIva,
      totalIva,
      totalToPay
    };
  };

  const totals = getTotals();

  const handleAddRow = () => {
    setInvoices([...invoices, { id: Date.now(), productId: '', sku: '', name: '', quantity: 1, price: 0, discount: 0, iva: 0, total: 0, measure: 'Unidad', hasIva: false }]);
  };

  const handleRemoveRow = () => {
    if (invoices.length > 1) {
      setInvoices(invoices.slice(0, -1));
    }
  };

  const handleRowChange = (index: number, field: string, value: any) => {
    const updated = [...invoices];
    updated[index] = {
      ...updated[index],
      [field]: value
    };

    // Live calculate single row fields
    const qty = Number(updated[index].quantity) || 0;
    const price = Number(updated[index].price) || 0;
    const disc = Number(updated[index].discount) || 0;
    const isIva = updated[index].hasIva;

    const rowSubtotal = qty * price;
    const rowDisc = rowSubtotal * (disc / 100);
    const rowNet = rowSubtotal - rowDisc;
    const rowIva = isIva ? rowNet * (globalIvaRate / 100) : 0;

    updated[index].iva = rowIva;
    updated[index].total = rowNet + rowIva;

    setInvoices(updated);
  };

  const selectProduct = (index: number, product: any) => {
    const updated = [...invoices];
    updated[index] = {
      ...updated[index],
      productId: product.id,
      sku: product.sku,
      name: product.name,
      price: product.price,
      hasIva: product.hasIva,
      measure: 'Unidad'
    };

    // Calculate row metrics
    const qty = Number(updated[index].quantity) || 0;
    const price = Number(updated[index].price) || 0;
    const disc = Number(updated[index].discount) || 0;

    const rowSubtotal = qty * price;
    const rowDisc = rowSubtotal * (disc / 100);
    const rowNet = rowSubtotal - rowDisc;
    const rowIva = product.hasIva ? rowNet * (globalIvaRate / 100) : 0;

    updated[index].iva = rowIva;
    updated[index].total = rowNet + rowIva;

    setInvoices(updated);
    setActiveRowIndex(null);
    setProductSearchQuery('');
  };

  const handleSaveInvoice = async () => {
    if (saving) return;

    const validItems = invoices.filter(item => item.productId !== '');
    if (validItems.length === 0) {
      alert('Debe agregar al menos un producto válido al comprobante.');
      return;
    }

    if ((clientRuc === '9999999999999' || clientName.toLowerCase() === 'consumidor final' || !clientRuc.trim()) && totals.totalToPay > 50) {
      alert('Las facturas emitidas a Consumidor Final no pueden superar los $50.00 dólares según la regulación del SRI. Ingrese los datos identificativos del cliente.');
      return;
    }

    setSaving(true);
    try {
      const BILLING_API_BASE = import.meta.env.VITE_BILLING_API_URL || 'http://localhost:3001';
      const res = await fetch(`${BILLING_API_BASE}/invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientName: clientName || 'Consumidor Final',
          clientRuc: clientRuc || '9999999999999',
          clientEmail: clientEmail || 'consumidor@final.com',
          amount: Number(totals.totalToPay.toFixed(2)),
          hasIva: totals.totalIva > 0,
          ivaRate: globalIvaRate,
          items: validItems.map(item => ({
            productId: item.productId,
            sku: item.sku,
            name: item.name,
            price: item.price,
            hasIva: item.hasIva,
            quantity: item.quantity
          })),
          user: {
            id: user?.id,
            ruc: user?.ruc || '1792455894001',
            name: user?.name || 'Aura Contable User',
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
        throw new Error(errData.message || 'Error al emitir factura');
      }

      alert('¡Comprobante guardado y enviado al SRI con éxito!');
      
      // Reset Form
      setClientName('');
      setClientRuc('');
      setClientEmail('');
      setClientSearchQuery('');
      setInvoices([
        { id: Date.now(), productId: '', sku: '', name: '', quantity: 1, price: 0, discount: 0, iva: 0, total: 0, measure: 'Unidad', hasIva: false }
      ]);

      await fetchInvoices();
      await fetchProducts();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Error al guardar factura');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setClientName('');
    setClientRuc('');
    setClientEmail('');
    setClientSearchQuery('');
    setInvoices([
      { id: Date.now(), productId: '', sku: '', name: '', quantity: 1, price: 0, discount: 0, iva: 0, total: 0, measure: 'Unidad', hasIva: false }
    ]);
  };

  return (
    <div className="billing-app fade-in" style={{ padding: '20px', maxWidth: '100%', margin: '0 auto' }}>
      <div className="billing-container glass-panel">
        {/* Toolbar */}
        <div className="toolbar">
          <button className="btn warning" onClick={() => setShowClientSuggestions(true)}>🔍 Buscar</button>
          <button className="btn primary" onClick={handleSaveInvoice} disabled={saving}>
            {saving ? 'Guardando...' : '💾 Guardar'}
          </button>
          <button className="btn" onClick={handleReset}>➕ Nuevo</button>
          <button className="btn" disabled>✏️ Modificar</button>
          <button className="btn danger" onClick={handleRemoveRow}>🗑️ Eliminar</button>
          <button className="btn danger" onClick={handleReset}>❌ Cancelar</button>
          <button className="btn" onClick={() => window.print()}>🖨️ Imprimir</button>
          <button className="btn">⚙️ Opciones</button>
          <button className="btn" style={{ marginLeft: 'auto' }}>📺 Tutoriales</button>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <div className={`tab ${activeTab === 'mantenimiento' ? 'active' : ''}`} onClick={() => setActiveTab('mantenimiento')}>Mantenimiento</div>
          <div className={`tab ${activeTab === 'forma_cobro' ? 'active' : ''}`} onClick={() => setActiveTab('forma_cobro')}>Forma de Cobro</div>
        </div>

        <div className="content">
          <div className="mode-banner">
            MODO DE AUTORIZACIÓN: {sriSimulate ? 'SIMULACIÓN LOCAL' : (sriEnvironment === '2' ? 'PRODUCCIÓN REAL' : 'PRUEBAS REAL')}
          </div>

          {/* Barcode Scanner Input */}
          <div style={{ display: 'flex', gap: '15px', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '280px', position: 'relative' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'var(--bg-card, #ffffff)', padding: '6px 12px', border: '1px solid var(--border)', borderRadius: '8px' }}>
                <span style={{ fontSize: '18px' }}>🔌</span>
                <strong style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>ESCÁNER / SKU:</strong>
                <input
                  type="text"
                  placeholder="Escanea el código de barras o escribe el SKU y presiona Enter..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={handleBarcodeKeyPress}
                  style={{ flex: 1, border: 'none', background: 'transparent', color: 'var(--text-primary)', outline: 'none', fontSize: '13px' }}
                />
              </div>
            </div>
          </div>

          <div className="top-section">
            {/* Form Panel */}
            <div className="form-panel">
              <div className="form-group">
                <label>Emisión</label>
                <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Facturador</label>
                <select defaultValue="cajero_1">
                  <option value="cajero_1">Cajero 1 - {user?.name}</option>
                </select>
              </div>
              <div className="form-group checkbox-group" style={{ gridRow: 'span 2' }}>
                <label className="checkbox-label">
                  <input type="checkbox" defaultChecked /> Contabilizado
                </label>
                <label className="checkbox-label">
                  <input type="checkbox" defaultChecked /> Imprimir
                </label>
              </div>
              <div className="form-group">
                <label>Vence</label>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Vendedor</label>
                <select defaultValue="vendedor_1">
                  <option value="vendedor_1">Vendedor General</option>
                </select>
              </div>
              
              <div className="form-row-multi">
                <div className="form-group">
                  <label>Serie</label>
                  <input type="text" readOnly value={`${sriEstablishmentCode}-${sriEmissionPoint}`} style={{ fontFamily: 'var(--font-mono)' }} />
                </div>
                <div className="form-group">
                  <label>Secuencia</label>
                  <input type="text" readOnly placeholder="AUTOMÁTICO" style={{ fontFamily: 'var(--font-mono)' }} />
                </div>
              </div>
              <div className="form-group">
                <label>Almacén</label>
                <select defaultValue="bodega_1">
                  <option value="bodega_1">Bodega Principal</option>
                </select>
              </div>
              
              {/* RUC / C.I. Cliente Input (replaced the empty div) */}
              <div className="form-group">
                <label>RUC / C.I. Cliente</label>
                <input
                  type="text"
                  value={clientRuc}
                  placeholder="Ej: 1792455894001"
                  onChange={(e) => setClientRuc(e.target.value)}
                />
              </div>

              {/* Client Auto-complete search */}
              <div className="form-group col-span-2" style={{ position: 'relative' }}>
                <label>Buscar Cliente (C.I / RUC / Nombre)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn warning" style={{ padding: '0 12px' }} onClick={() => setShowClientSuggestions(true)}>🔍</button>
                  <input
                    type="text"
                    placeholder="Buscar cliente por nombre o RUC..."
                    style={{ flex: 1 }}
                    value={clientSearchQuery}
                    onChange={(e) => {
                      setClientSearchQuery(e.target.value);
                      setShowClientSuggestions(true);
                      setClientName(e.target.value);
                    }}
                    onFocus={() => setShowClientSuggestions(true)}
                  />
                </div>

                {showClientSuggestions && filteredClients.length > 0 && (
                  <div className="autocomplete-dropdown" style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'var(--bg-card, #ffffff)',
                    border: '1px solid var(--border, #cbd5e1)',
                    borderRadius: '8px',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
                    zIndex: 9999,
                    maxHeight: '150px',
                    overflowY: 'auto',
                    marginTop: '4px'
                  }}>
                    {filteredClients.map(c => (
                      <div
                        key={c.ruc}
                        onClick={() => {
                          setClientName(c.name);
                          setClientRuc(c.ruc);
                          setClientEmail(c.email);
                          setClientSearchQuery(`${c.name} (${c.ruc})`);
                          setShowClientSuggestions(false);
                        }}
                        style={{
                          padding: '10px 14px',
                          cursor: 'pointer',
                          borderBottom: '1px solid var(--border, #f1f5f9)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '12.5px',
                          color: '#000'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <span><strong>{c.name}</strong></span>
                        <span style={{ color: 'var(--text-muted)' }}>{c.ruc}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Sucursal</label>
                <select defaultValue="suc_1">
                  <option value="suc_1">{sriIsBranch ? `Sucursal (${sriEstablishmentCode})` : 'Matriz (001)'}</option>
                </select>
              </div>

              <div className="form-group">
                <label>Tarifa</label>
                <select defaultValue="p1">
                  <option value="p1">Precio de Venta</option>
                </select>
              </div>

              {/* Email Cliente Input (replaced the static Código Interno) */}
              <div className="form-group">
                <label>Email Cliente</label>
                <input
                  type="email"
                  value={clientEmail}
                  placeholder="Ej: cliente@correo.com"
                  onChange={(e) => setClientEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Totals Panel */}
            <div className="totals-panel">
              <div className="total-display">
                <span>Total a Pagar</span>
                <div className="amount">
                  ${totals.totalToPay.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              
              <div className="totals-grid">
                <div>
                  <div className="totals-row"><span>Sub Total No Obj.</span> <span>0,00</span></div>
                  <div className="totals-row"><span>Sub Total Exento</span> <span>0,00</span></div>
                  <div className="totals-row"><span>Total ICE</span> <span>0,00</span></div>
                  <div className="totals-row"><span>Total IVA</span> <span>{totals.totalIva.toFixed(2)}</span></div>
                  <div className="totals-row"><span>Total IVA 5%</span> <span>0,00</span></div>
                  <div className="totals-row"><span>Propina</span> <span>0,00</span></div>
                </div>
                <div>
                  <div className="totals-row"><span>Sub Total</span> <span>{totals.subtotalBase.toFixed(2)}</span></div>
                  <div className="totals-row"><span>Descuento %</span> <span>0,00</span></div>
                  <div className="totals-row"><span>Descuento $</span> <span>{totals.totalDiscount.toFixed(2)}</span></div>
                  <div className="totals-row"><span>Sub Total Neto</span> <span>{totals.subtotalNeto.toFixed(2)}</span></div>
                  <div className="totals-row highlight"><span>Sub Total Con IVA</span> <span>{totals.subtotalConIva.toFixed(2)}</span></div>
                  <div className="totals-row"><span>Sub Total IVA 5%</span> <span>0,00</span></div>
                  <div className="totals-row"><span>Sub Total IVA 0%</span> <span>{totals.subtotalZeroIva.toFixed(2)}</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions Bar */}
          <div className="actions-bar">
            <button className="btn orange">ℹ️ Información</button>
            <button className="btn orange">📦 Existencias</button>
            <button className="btn danger" onClick={handleRemoveRow}>🗑️ Quitar</button>
            <button className="btn teal">📑 Series</button>
            <button className="btn teal">🏷️ Lotes</button>
            <button className="btn" style={{ marginLeft: 'auto' }}>💰 Abrir Caja</button>
            <button className="btn">💸 Egreso Caja</button>
          </div>

          {/* Data Grid */}
          <div className="grid-container" style={{ position: 'relative', overflow: 'visible' }}>
            <table className="billing-table">
              <thead>
                <tr>
                  <th style={{ width: '150px' }}>Código (SKU)</th>
                  <th>Descripción</th>
                  <th style={{ width: '80px' }}>Medida</th>
                  <th style={{ width: '100px' }}>Cantidad</th>
                  <th style={{ width: '120px' }}>Precio Base ($)</th>
                  <th style={{ width: '90px' }}>Desc. %</th>
                  <th style={{ width: '110px', textAlign: 'center' }}>Graba IVA</th>
                  <th style={{ width: '120px', textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody style={{ overflow: 'visible' }}>
                {invoices.map((inv, idx) => (
                  <tr key={inv.id} style={{ position: 'relative', overflow: 'visible' }}>
                    <td style={{ position: 'relative', overflow: 'visible' }}>
                      <input
                        type="text"
                        className="td-input"
                        placeholder="Buscar SKU..."
                        value={inv.sku}
                        onChange={(e) => {
                          handleRowChange(idx, 'sku', e.target.value);
                          setProductSearchQuery(e.target.value);
                          setActiveRowIndex(idx);
                        }}
                        onFocus={() => {
                          setProductSearchQuery(inv.sku);
                          setActiveRowIndex(idx);
                        }}
                      />
                      
                      {activeRowIndex === idx && filteredProducts.length > 0 && (
                        <div className="autocomplete-dropdown" style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          background: 'var(--bg-card, #ffffff)',
                          border: '1px solid var(--border, #cbd5e1)',
                          borderRadius: '8px',
                          boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
                          zIndex: 99999,
                          width: '380px',
                          maxHeight: '200px',
                          overflowY: 'auto',
                          marginTop: '4px'
                        }}>
                          {filteredProducts.map(p => (
                            <div
                              key={p.id}
                              onClick={() => selectProduct(idx, p)}
                              style={{
                                padding: '10px 14px',
                                cursor: 'pointer',
                                borderBottom: '1px solid var(--border, #f1f5f9)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '12.5px',
                                color: '#000'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                              <span><strong>{p.sku}</strong> - {p.name}</span>
                              <span style={{ color: 'var(--indigo)', fontWeight: 'bold' }}>${p.price.toFixed(2)} ({p.stock} uds)</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td>
                      <input
                        type="text"
                        className="td-input"
                        value={inv.name}
                        placeholder="Seleccione un producto"
                        onChange={(e) => handleRowChange(idx, 'name', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="td-input"
                        style={{ textAlign: 'center' }}
                        value={inv.measure}
                        onChange={(e) => handleRowChange(idx, 'measure', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min={1}
                        className="td-input number"
                        value={inv.quantity}
                        onChange={(e) => handleRowChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        className="td-input number"
                        value={inv.price}
                        onChange={(e) => handleRowChange(idx, 'price', parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        className="td-input number"
                        value={inv.discount}
                        onChange={(e) => handleRowChange(idx, 'discount', parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <input
                          type="checkbox"
                          checked={inv.hasIva}
                          onChange={(e) => handleRowChange(idx, 'hasIva', e.target.checked)}
                          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          ${inv.iva.toFixed(2)}
                        </span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold', paddingRight: '12px' }}>
                      ${inv.total.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              onClick={handleAddRow}
              style={{
                margin: '10px',
                background: 'transparent',
                border: '1px dashed rgb(255, 255, 255)',
                color: 'var(--text-muted)',
                padding: '6px 12px',
                cursor: 'pointer',
                borderRadius: '6px',
                fontWeight: '600'
              }}
            >
              + Agregar Fila
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="footer">
          <span><strong>Auditoría:</strong> {user?.email || 'Sistema'}</span>
          <span><strong>Fecha Emisión:</strong> {issueDate}</span>
          <span><strong>Modificación:</strong> -</span>
        </div>
      </div>
    </div>
  );
}
