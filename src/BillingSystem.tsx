import React, { useState } from 'react';
import './BillingSystem.css';

export default function BillingSystem() {
  const [activeTab, setActiveTab] = useState<'mantenimiento' | 'forma_cobro'>('forma_cobro');
  const [invoices, setInvoices] = useState<any[]>([{ id: 1, quantity: 1, price: 0, discount: 0, iva: 0, total: 0 }]);

  const handleAddRow = () => {
    setInvoices([...invoices, { id: Date.now(), quantity: 1, price: 0, discount: 0, iva: 0, total: 0 }]);
  };

  return (
    <div className="billing-app fade-in" style={{ padding: '20px', maxWidth: '100%', margin: '0 auto' }}>
      <div className="billing-container glass-panel">
        {/* Toolbar */}
        <div className="toolbar">
          <button className="btn warning">🔍 Buscar</button>
          <button className="btn primary">💾 Guardar</button>
          <button className="btn">➕ Nuevo</button>
          <button className="btn">✏️ Modificar</button>
          <button className="btn danger">🗑️ Eliminar</button>
          <button className="btn danger">❌ Cancelar</button>
          <button className="btn">🖨️ Imprimir</button>
          <button className="btn">⚙️ Opciones</button>
          <button className="btn" style={{ marginLeft: 'auto' }}>📺 Tutoriales</button>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <div className={`tab ${activeTab === 'mantenimiento' ? 'active' : ''}`} onClick={() => setActiveTab('mantenimiento')}>Mantenimiento</div>
          <div className={`tab ${activeTab === 'forma_cobro' ? 'active' : ''}`} onClick={() => setActiveTab('forma_cobro')}>Forma de Cobro</div>
        </div>

        <div className="content">
          <div className="mode-banner">MODO DE AUTORIZACIÓN : PRUEBAS</div>

          <div className="top-section">
            {/* Form Panel */}
            <div className="form-panel">
              <div className="form-group">
                <label>Emisión</label>
                <input type="date" defaultValue="2026-07-24" />
              </div>
              <div className="form-group">
                <label>Facturador</label>
                <select><option>Cajero 1</option></select>
              </div>
              <div className="form-group checkbox-group" style={{ gridRow: 'span 2' }}>
                <label className="checkbox-label">
                  <input type="checkbox" defaultChecked /> Contabilizado
                </label>
                <label className="checkbox-label">
                  <input type="checkbox" /> Imprimir
                </label>
              </div>
              <div className="form-group">
                <label>Vence</label>
                <input type="date" defaultValue="2026-07-24" />
              </div>
              <div className="form-group">
                <label>Vendedor</label>
                <select><option>Vendedor General</option></select>
              </div>
              
              <div className="form-row-multi">
                <div className="form-group">
                  <label>Serie</label>
                  <input type="text" placeholder="001-001" />
                </div>
                <div className="form-group">
                  <label>Secuencia</label>
                  <input type="text" placeholder="000000123" />
                </div>
              </div>
              <div className="form-group">
                <label>Almacén</label>
                <select><option>Bodega Principal</option></select>
              </div>
              <div className="form-group"></div>

              <div className="form-group col-span-2">
                <label>C.I / RUC / Nombre Cliente</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn warning" style={{ padding: '0 12px' }}>🔍</button>
                  <input type="text" placeholder="Buscar cliente..." style={{ flex: 1 }} />
                </div>
              </div>
              <div className="form-group">
                <label>Sucursal</label>
                <select><option>Matriz</option></select>
              </div>

              <div className="form-group">
                <label>Tarifa</label>
                <select><option>Precio 1</option><option>Precio 2</option></select>
              </div>
              <div className="form-group">
                <label>Código Interno</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn warning" style={{ padding: '0 12px' }}>🔍</button>
                  <input type="text" placeholder="..." />
                </div>
              </div>
            </div>

            {/* Totals Panel */}
            <div className="totals-panel">
              <div className="total-display">
                <span>Total a Pagar</span>
                <div className="amount">0,00</div>
              </div>
              
              <div className="totals-grid">
                <div>
                  <div className="totals-row"><span>Sub Total No Obj.</span> <span>0,00</span></div>
                  <div className="totals-row"><span>Sub Total Exento</span> <span>0,00</span></div>
                  <div className="totals-row"><span>Total ICE</span> <span>0,00</span></div>
                  <div className="totals-row"><span>Total IVA</span> <span>0,00</span></div>
                  <div className="totals-row"><span>Total IVA 5%</span> <span>0,00</span></div>
                  <div className="totals-row"><span>Propina</span> <span>0,00</span></div>
                </div>
                <div>
                  <div className="totals-row"><span>Sub Total</span> <span>0,00</span></div>
                  <div className="totals-row"><span>Descuento %</span> <span>0,00</span></div>
                  <div className="totals-row"><span>Descuento $</span> <span>0,00</span></div>
                  <div className="totals-row"><span>Sub Total Neto</span> <span>0,00</span></div>
                  <div className="totals-row highlight"><span>Sub Total Con IVA</span> <span>0,00</span></div>
                  <div className="totals-row"><span>Sub Total IVA 5%</span> <span>0,00</span></div>
                  <div className="totals-row"><span>Sub Total IVA 0%</span> <span>0,00</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions Bar */}
          <div className="actions-bar">
            <button className="btn orange">ℹ️ Información</button>
            <button className="btn orange">📦 Existencias</button>
            <button className="btn danger" onClick={() => { if(invoices.length > 1) setInvoices(invoices.slice(0,-1)) }}>🗑️ Quitar</button>
            <button className="btn teal">📑 Series</button>
            <button className="btn teal">🏷️ Lotes</button>
            <button className="btn" style={{ marginLeft: 'auto' }}>💰 Abrir Caja</button>
            <button className="btn">💸 Egreso Caja</button>
          </div>

          {/* Data Grid */}
          <div className="grid-container">
            <table className="billing-table">
              <thead>
                <tr>
                  <th style={{ width: '120px' }}>Código</th>
                  <th>Descripción</th>
                  <th style={{ width: '80px' }}>Medida</th>
                  <th style={{ width: '80px' }}>Cantidad</th>
                  <th style={{ width: '100px' }}>Precio IVA</th>
                  <th style={{ width: '80px' }}>Desc. %</th>
                  <th style={{ width: '80px' }}>IVA</th>
                  <th style={{ width: '100px', textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv, idx) => (
                  <tr key={inv.id}>
                    <td><input type="text" className="td-input" placeholder="Ingresar..." /></td>
                    <td><input type="text" className="td-input" /></td>
                    <td><input type="text" className="td-input" style={{ textAlign: 'center' }} /></td>
                    <td><input type="text" className="td-input number" defaultValue="1.00" /></td>
                    <td><input type="text" className="td-input number" defaultValue="0.00" /></td>
                    <td><input type="text" className="td-input number" defaultValue="0.00" /></td>
                    <td><input type="text" className="td-input number" defaultValue="0.00" /></td>
                    <td><input type="text" className="td-input number" defaultValue="0.00" readOnly /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={handleAddRow} style={{ margin: '10px', background: 'transparent', border: '1px dashed rgba(255,255,255,0.2)', color: 'var(--text-muted)', padding: '5px 10px', cursor: 'pointer', borderRadius: '4px' }}>+ Agregar Fila</button>
          </div>
        </div>

        {/* Footer */}
        <div className="footer">
          <span><strong>Auditoría:</strong> Sistema</span>
          <span><strong>Creación:</strong> 24-Jul-2026</span>
          <span><strong>Modificación:</strong> -</span>
        </div>
      </div>
    </div>
  );
}
