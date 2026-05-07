import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { API_BASE } from './config';

const EMPTY_ITEM = { productName: '', quantity: '', unit: 'Kg', pricePerUnit: '', capital: '' };


const PRODUCTS = [
  'Sona Mansoori','Kolam','Jeera Kolam','HMT Kolam','Wada Kolam','Surti Kolam',
  'Basmati Dubar','Basmati Tibbar','Basmati Sortex',
  'Toor Dal Tukdi Gold','Toor Dal Tukdi','Damdaar Toor','Rajwadi Toor','Premium Toor',
  'Chana Dal','Moong Dal','Masoor Dal','Rajma','Kabuli Chana','Chana',
  'Wheat Flour','Besan','Rava','Maida','Rice Flour','Corn Flour','Poha',
  'Jeera','Dhaniya','Kali Mirch','Saunf','Laung','Dalchini','Tejpatta',
  'Star Phool','Elaichi','Badi Elaichi','Javitri','Chavila','Shah Jeera',
  'Rai','Barik Rai','Haldi (Whole)','Peeli Sarso',
  'Haldi Powder','Dhaniya Powder','Lal Mirch Powder','Kashmiri Mirch Powder',
  'Chaat Masala','Paneer Masala','Chicken Masala','Shahi Biryani Masala',
  'Mutton Masala','Rajwadi Garam Masala','Garam Masala Gold','Garam Masala Lite',
  'Kitchen King Masala','Kanda Lehsun Masala','Egg Curry Masala','Chole Masala',
  'Malvani Masala','Sambhar Masala','Pav Bhaji Masala',
  'Sunflower Oil','Mustard Oil','Groundnut Oil','Cottonseed Oil','Soyabean Oil',
  'Badam (Almonds)','Kaju (Cashew)','Pista (Pistachio)','Kishmish (Raisins)',
  'Akhrot (Walnut)','Anjeer (Dry Fig)','Munakka','Chironji','Dry Dates (Khajoor)'
];

function App({ onLogout }) {
  const [invoices, setInvoices]       = useState([]);
  const [stats, setStats]             = useState({ totalRevenue: 0, totalOrders: 0, pendingAmount: 0, totalProfit: 0 });
  const [products, setProducts]       = useState([]);
  const [showForm, setShowForm]       = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [sendingEmailId, setSendingEmailId] = useState(null);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [showExpenseList, setShowExpenseList] = useState(false);
  const [expenses, setExpenses] = useState([]);

  const [newExpense, setNewExpense] = useState({ description: '', amount: '', category: '', ownerName: '' });
  const [newProduct, setNewProduct] = useState({ name: '', pricePerUnit: '', capital: '' });



  const [formData, setFormData] = useState({
    customerName:  '',
    customerEmail: '',
    customerPhone: '',
    items: [{ ...EMPTY_ITEM }],
    paymentMode:   '',
    paymentStatus: ''
  });

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchData = async () => {
    try {
      const [invRes, statRes, prodRes, expRes] = await Promise.all([
        fetch(`${API_BASE}/api/invoices`),
        fetch(`${API_BASE}/api/stats`),
        fetch(`${API_BASE}/api/products`),
        fetch(`${API_BASE}/api/expenses`)
      ]);
      setInvoices(await invRes.json());
      setStats(await statRes.json());
      setProducts(await prodRes.json());
      setExpenses(await expRes.json());
    } catch (err) { console.error('Fetch error:', err); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.pricePerUnit) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
      });
      if (res.ok) {
        setNewProduct({ name: '', pricePerUnit: '', capital: '' });
        fetchData();
      }
    } catch (err) { alert('Failed to add product'); }
    setLoading(false);
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (err) { alert('Failed to delete product'); }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!newExpense.description || !newExpense.amount) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newExpense)
      });
      if (res.ok) {
        setNewExpense({ description: '', amount: '', category: '', ownerName: '' });
        fetchData();
      }

    } catch (err) { alert('Failed to add expense'); }
    setLoading(false);
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/expenses/${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (err) { alert('Failed to delete expense'); }
  };


  // ── Item helpers ───────────────────────────────────────────────────────────
  const addItem = () =>
    setFormData(p => ({ ...p, items: [...p.items, { ...EMPTY_ITEM }] }));

  const removeItem = (idx) =>
    setFormData(p => ({ ...p, items: p.items.filter((_, i) => i !== idx) }));

  const updateItem = (idx, field, value) =>
    setFormData(p => {
      const items = [...p.items];
      items[idx] = { ...items[idx], [field]: value };

      // Auto-fill if product name matches a manual product
      if (field === 'productName') {
        const found = products.find(prod => prod.name === value);
        if (found) {
          items[idx].pricePerUnit = String(found.pricePerUnit);
          items[idx].capital = String(found.capital);
        }
      }

      return { ...p, items };
    });

  // computed totals
  const grandTotal  = formData.items.reduce((s, i) => s + (Number(i.quantity) * Number(i.pricePerUnit) || 0), 0);
  const grandMarkup = formData.items.reduce((s, i) => s + (Number(i.quantity) * (Number(i.pricePerUnit) - Number(i.capital)) || 0), 0);
  const grandProfit = grandMarkup * 0.12;


  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    for (let i = 0; i < formData.items.length; i++) {
      const it = formData.items[i];
      if (!it.productName || !it.quantity || !it.pricePerUnit || !it.capital) {
        alert(`Please fill all fields for Item ${i + 1}`);
        return;
      }
    }
    setLoading(true);
    try {
      const url    = editingInvoice ? `${API_BASE}/api/invoices/${editingInvoice.invoiceId}` : `${API_BASE}/api/invoices`;
      const method = editingInvoice ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      if (res.ok) {
        alert(editingInvoice ? 'Invoice updated!' : 'Invoice generated & emailed!');
        closeForm();
        fetchData();
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert('Error processing invoice: ' + (errorData.details || errorData.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Failed to connect to backend: ' + err.message);
    }
    finally { setLoading(false); }
  };

  // ── Edit ───────────────────────────────────────────────────────────────────
  const handleEdit = (inv) => {
    setEditingInvoice(inv);
    let items;
    try {
      items = inv.items
        ? (typeof inv.items === 'string' ? JSON.parse(inv.items) : inv.items)
        : [{ productName: inv.productName || '', quantity: String(inv.quantity || ''), pricePerUnit: String(inv.pricePerUnit || ''), capital: String(inv.capital || 0) }];
    } catch { items = [{ ...EMPTY_ITEM }]; }
    setFormData({ customerName: inv.Customer?.name || '', customerEmail: inv.customerEmail, customerPhone: inv.Customer?.phone || '', items, paymentMode: inv.paymentMode, paymentStatus: inv.paymentStatus });
    setShowForm(true);
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this invoice?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/invoices/${id}`, { method: 'DELETE' });
      if (res.ok) { alert('Deleted!'); fetchData(); }
      else alert('Error deleting');
    } catch { alert('Backend error'); }
  };

  // ── Email ──────────────────────────────────────────────────────────────────
  const handleSendEmail = async (id) => {
    setSendingEmailId(id);
    try {
      const res  = await fetch(`${API_BASE}/api/invoices/${id}/email`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        alert('📨 Email sent successfully!');
      } else {
        alert('⚠️ Email failed: ' + (data.error || 'Check email settings in backend .env'));
      }
    } catch {
      alert('⚠️ Cannot reach the backend server.\n\nThis feature requires the backend to be running and connected to the database.\n\nIf using Vercel, make sure the backend service is deployed and environment variables are set.');
    }
    setSendingEmailId(null);
  };

  // ── New / Close ────────────────────────────────────────────────────────────
  const handleCreateNew = () => {
    setEditingInvoice(null);
    setFormData({ customerName: '', customerEmail: '', customerPhone: '', items: [{ ...EMPTY_ITEM }], paymentMode: '', paymentStatus: '' });
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditingInvoice(null); };

  // ── Excel ──────────────────────────────────────────────────────────────────
  const exportToExcel = () => {
    if (!invoices.length) { alert('No data!'); return; }
    const rows = invoices.map(inv => ({
      'Invoice ID': inv.invoiceId, 'Customer': inv.Customer?.name || '',
      'Email': inv.customerEmail, 'Phone': inv.Customer?.phone || '',
      'Product(s)': inv.productName, 'Total Amount (₹)': inv.totalAmount,
      'Profit (₹)': inv.profit || 0, 'Status': inv.paymentStatus,
      'Mode': inv.paymentMode, 'Date': new Date(inv.createdAt).toLocaleDateString()
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Invoices');
    XLSX.writeFile(wb, `Invoices_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`);
  };

  // ── Product display in table ───────────────────────────────────────────────
  const productDisplay = (inv) => {
    try {
      const it = inv.items ? JSON.parse(inv.items) : null;
      if (it && it.length > 1) return `${it[0].productName} +${it.length - 1} more`;
    } catch {}
    return inv.productName;
  };

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="dashboard-container">

      {/* HEADER */}
      <header>
        <div className="header-top">
          <div className="header-brand">
            <h1>Invoice Manager</h1>
            <p>Enterprise Billing &amp; Analytics</p>
          </div>
          <span className="header-user">👤 {sessionStorage.getItem('auth_user') || 'Admin'}</span>
        </div>
        <div className="header-actions">
          <button onClick={exportToExcel} className="btn-primary btn-excel">
            📊<span className="btn-label"> Excel</span>
          </button>
          <button onClick={() => setShowProductModal(true)} className="btn-primary">
            📦<span className="btn-label"> Products</span>
          </button>
          <button onClick={() => setShowExpenseList(!showExpenseList)} className={`btn-primary ${showExpenseList ? 'btn-active' : ''}`}>
            💸<span className="btn-label"> Daily Expense</span>
          </button>
          <button onClick={handleCreateNew} className="btn-primary">
            +<span className="btn-label"> Invoice</span>
          </button>


          <button onClick={onLogout} className="btn-primary btn-logout" title="Sign Out">
            🔓<span className="btn-label"> Logout</span>
          </button>
        </div>
      </header>

      <div className="main-content">

        {/* STATS */}
        <div className="stats-grid">
          {[
            { label: 'Total Revenue',   value: `₹${Number(stats.totalRevenue).toLocaleString()}`,     note: 'Overall Sales',        color: '#10b981' },
            { label: 'Gross Profit',    value: `₹${Number(stats.trueProfit||0).toLocaleString()}`,    note: 'Sales - Purchase',     color: '#6366f1' },
            { label: 'Shared Profit',   value: `₹${Number(stats.sharedProfit||0).toLocaleString()}`,  note: '12% Management',       color: '#f59e0b' },
            { label: 'Total Profit',    value: `₹${Number(stats.totalProfitOverall||0).toLocaleString()}`, note: 'Final Net Income', color: '#10b981' },
            { label: 'Daily Expense',   value: `₹${Number(stats.totalExpenses||0).toLocaleString()}`, note: 'Operating Costs',     color: '#ef4444' },
            { label: 'Total Orders',    value: stats.totalOrders,                                      note: 'Processed',            color: '#6366f1' },
          ].map(s => (
            <div key={s.label} className="glass-card stat-item">
              <h3>{s.label}</h3>
              <div className="value" style={{ color: s.color }}>{s.value}</div>
              <p style={{ fontSize: '0.75rem', color: s.color, margin: '0.4rem 0 0' }}>{s.note}</p>
              
              {s.label === 'Daily Expense' && (
                <div style={{ marginTop: '0.8rem', borderTop: '1px solid rgba(239, 68, 68, 0.1)', paddingTop: '0.5rem' }}>
                  {stats.expensesByOwner && stats.expensesByOwner.length > 0 && (
                    <div className="owner-breakdown" style={{ marginBottom: '0.8rem' }}>
                      <div style={{ fontSize: '0.65rem', fontWeight: '800', color: '#ef4444', marginBottom: '4px', textTransform: 'uppercase' }}>By Owner</div>
                      {stats.expensesByOwner.map(own => (
                        <div key={own.ownerName} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b', marginBottom: '2px' }}>
                          <span>{own.ownerName || 'Unknown'}:</span>
                          <span style={{ fontWeight: '600' }}>₹{Number(own.totalAmount).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {stats.expensesByCategory && stats.expensesByCategory.length > 0 && (
                    <div className="category-breakdown">
                      <div style={{ fontSize: '0.65rem', fontWeight: '800', color: '#ef4444', marginBottom: '4px', textTransform: 'uppercase' }}>By Category</div>
                      {stats.expensesByCategory.map(cat => (
                        <div key={cat.category} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b', marginBottom: '2px' }}>
                          <span>{cat.category || 'Other'}:</span>
                          <span style={{ fontWeight: '600' }}>₹{Number(cat.totalAmount).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* COLLAPSIBLE EXPENSE TABLE */}
        {showExpenseList && (
          <div className="glass-card expense-dropdown-section" style={{ marginBottom: '2rem', animation: 'slideDown 0.4s ease-out' }}>
            <div className="modal-header" style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>💸 Daily Expense Ledger</h2>
              <button onClick={() => setShowExpenseList(false)} className="btn-close">×</button>
            </div>

            <div className="expense-container-grid">
              {/* Form Side */}
              <div className="expense-form-side">
                <form onSubmit={handleAddExpense} className="invoice-form">
                  <div className="form-section-label">Add New Entry</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <input required placeholder="Description (e.g. Tea, Rent)" value={newExpense.description} onChange={e => setNewExpense({ ...newExpense, description: e.target.value })} />
                    <select required value={newExpense.ownerName} onChange={e => setNewExpense({ ...newExpense, ownerName: e.target.value })}>
                      <option value="">Select Owner</option>
                      <option value="Aditya">Aditya</option>
                      <option value="Dhruv">Dhruv</option>
                      <option value="Ayush">Ayush</option>
                    </select>
                    <div className="form-grid-2">
                      <input required type="number" step="0.01" placeholder="Amount (₹)" value={newExpense.amount} onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })} />
                      <select value={newExpense.category} onChange={e => setNewExpense({ ...newExpense, category: e.target.value })}>
                        <option value="">Category</option>
                        <option value="Utilities">Utilities</option>
                        <option value="Rent">Rent</option>
                        <option value="Salaries">Salaries</option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <button type="submit" className="btn-submit" style={{ marginTop: '0.5rem' }}>Save Expense</button>
                  </div>
                </form>
              </div>

              {/* Table Side */}
              <div className="expense-table-side">
                <div className="form-section-label">Previous Records</div>
                <div className="table-wrapper" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Owner</th>
                        <th>Desc</th>
                        <th>Amount</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.map(ex => (
                        <tr key={ex.id}>
                          <td style={{ fontSize: '0.8rem' }}>{new Date(ex.createdAt).toLocaleDateString()}</td>
                          <td><strong>{ex.ownerName}</strong></td>
                          <td>{ex.description}</td>
                          <td style={{ fontWeight: 'bold' }}>₹{ex.amount}</td>
                          <td>
                            <button onClick={() => handleDeleteExpense(ex.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>🗑️</button>
                          </td>
                        </tr>
                      ))}
                      {expenses.length === 0 && (
                        <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No expenses found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL */}

        {showForm && (
          <div className="modal-overlay">
            <div className="glass-card modal-content">

              {/* Modal Header */}
              <div className="modal-header">
                <h2>{editingInvoice ? '✏️ Update Invoice' : '🧾 New Invoice'}</h2>
                <button onClick={closeForm} className="btn-close">×</button>
              </div>

              <form onSubmit={handleSubmit} className="invoice-form">

                {/* Customer Section */}
                <div className="form-section-label">Customer Details</div>
                <div className="form-grid-3">
                  <input required placeholder="Customer Name"  value={formData.customerName}  onChange={e => setFormData({ ...formData, customerName: e.target.value })} />
                  <input required type="email" placeholder="Email Address" value={formData.customerEmail} onChange={e => setFormData({ ...formData, customerEmail: e.target.value })} />
                  <input required placeholder="Phone Number"   value={formData.customerPhone} onChange={e => setFormData({ ...formData, customerPhone: e.target.value })} />
                </div>

                {/* Items Section */}
                <div className="form-section-label" style={{ marginTop: '1.25rem' }}>
                  <span>Line Items <span className="item-count-badge">{formData.items.length}</span></span>
                  <button type="button" className="btn-add-item-inline" onClick={addItem}>+ Add Item</button>
                </div>

                {/* datalist (shared) */}
                <datalist id="product-list">
                  {products.map(p => <option key={p.id} value={p.name} />)}
                  {PRODUCTS.map(p => <option key={`static-${p}`} value={p} />)}
                </datalist>

                <div className="items-list">
                  {formData.items.map((item, idx) => {
                    const subtotal = (Number(item.quantity) * Number(item.pricePerUnit) || 0);
                    const profit   = subtotal * 0.12;

                    return (
                      <div key={idx} className="item-row">
                        <div className="item-row-header">
                          <span className="item-label">Item {idx + 1}</span>
                          {formData.items.length > 1 && (
                            <button type="button" className="btn-remove-item" onClick={() => removeItem(idx)} title="Remove item">✕ Remove</button>
                          )}
                        </div>
                        <div className="item-grid">
                          <input
                            required list="product-list" placeholder="Search product..."
                            value={item.productName} onChange={e => updateItem(idx, 'productName', e.target.value)}
                            className="item-input-product"
                          />
                          <input required type="number" placeholder="Qty"
                            value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} />
                          <select required value={item.unit} onChange={e => updateItem(idx, 'unit', e.target.value)}>
                            <option value="Kg">Kg</option>
                            <option value="Litre">Litre</option>
                            <option value="30 kg bag">30 kg bag</option>
                            <option value="50 kg bag">50 kg bag</option>
                          </select>
                          <input required type="number" placeholder="Selling Price (₹)"
                            value={item.pricePerUnit} onChange={e => updateItem(idx, 'pricePerUnit', e.target.value)} />
                          <input required type="number" placeholder="Buying Price (₹)"
                            value={item.capital} onChange={e => updateItem(idx, 'capital', e.target.value)} />
                        </div>

                        <div className="item-calcs">
                          <span>Subtotal: <strong className="calc-val">₹{subtotal.toFixed(2)}</strong></span>
                          <span>Gross Profit: <strong className="calc-val" style={{color: '#6366f1'}}>₹{(Number(item.quantity) * (Number(item.pricePerUnit) - Number(item.capital))).toFixed(2)}</strong></span>
                          <span>Net Profit (after 12%): <strong className="calc-profit">₹{((Number(item.quantity) * (Number(item.pricePerUnit) - Number(item.capital))) * 0.88).toFixed(2)}</strong></span>
                        </div>

                      </div>
                    );
                  })}
                </div>

                <button type="button" className="btn-add-item-full" onClick={addItem}>
                  + Add Another Item
                </button>

                {/* Payment Section */}
                <div className="form-section-label" style={{ marginTop: '1.25rem' }}>Payment Details</div>
                <div className="form-grid-2">
                  <select required value={formData.paymentStatus} onChange={e => setFormData({ ...formData, paymentStatus: e.target.value })}>
                    <option value="">Select Status</option>
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                  </select>
                  <select required value={formData.paymentMode} onChange={e => setFormData({ ...formData, paymentMode: e.target.value })}>
                    <option value="">Select Mode</option>
                    <option value="Online">Online</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>

                {/* Grand Total Summary */}
                <div className="summary-box">
                  <div className="summary-row">
                    <span>Total Items</span>
                    <strong>{formData.items.length}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Est. Net Profit (after 12%)</span>
                    <strong className={grandMarkup >= 0 ? 'calc-profit' : 'calc-loss'}>₹{(grandMarkup * 0.88).toFixed(2)}</strong>
                  </div>
                  <div className="summary-row grand-total-row">
                    <span>Grand Total</span>
                    <strong>₹{grandTotal.toFixed(2)}</strong>
                  </div>
                </div>

                <button disabled={loading} type="submit" className="btn-submit">
                  {loading ? '⏳ Processing...' : (editingInvoice ? '💾 Update Invoice' : '📧 Generate & Email Invoice')}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TRANSACTION TABLE */}
        <div className="glass-card">
          <h2 style={{ marginTop: 0, marginBottom: '1.25rem', fontSize: 'clamp(1rem, 3vw, 1.2rem)', fontWeight: '800' }}>
            Transaction History
          </h2>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Invoice ID</th>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Date</th>
                  <th>Product(s)</th>
                  <th>Amount</th>
                  <th>Gross Profit</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td data-label="Invoice ID" style={{ fontFamily: 'monospace', color: '#6366f1', fontWeight: '700' }}>{inv.invoiceId}</td>
                    <td data-label="Customer"   style={{ fontWeight: '700' }}>{inv.Customer?.name}</td>
                    <td data-label="Contact"    style={{ color: '#64748b' }}>{inv.Customer?.phone}</td>
                    <td data-label="Date"       style={{ color: '#64748b' }}>{new Date(inv.createdAt).toLocaleDateString()}</td>
                    <td data-label="Product(s)">
                      <span title={inv.productName} className="product-cell">{productDisplay(inv)}</span>
                    </td>
                    <td data-label="Amount" style={{ fontWeight: '800' }}>₹{Number(inv.totalAmount).toFixed(2)}</td>
                    <td data-label="Gross Profit" style={{ fontWeight: '700', color: '#6366f1' }}>₹{Number(inv.profit || 0).toFixed(2)}</td>
                    <td data-label="Status">
                      <span className={`badge badge-${inv.paymentStatus.toLowerCase()}`}>{inv.paymentStatus}</span>
                    </td>
                    <td data-label="Actions">
                      <div className="action-btns">
                        <button onClick={() => handleSendEmail(inv.invoiceId)} disabled={sendingEmailId === inv.invoiceId}
                          title="Send Email" style={{ background:'none', border:'none', cursor: sendingEmailId===inv.invoiceId?'wait':'pointer', fontSize:'1.15rem', opacity: sendingEmailId===inv.invoiceId?0.5:1 }}>
                          {sendingEmailId === inv.invoiceId ? '⏳' : '📩'}
                        </button>
                        <button onClick={() => handleEdit(inv)} title="Edit"
                          style={{ background:'none', border:'none', cursor:'pointer', fontSize:'1.15rem' }}>✏️</button>
                        <button onClick={() => handleDelete(inv.invoiceId)} title="Delete"
                          style={{ background:'none', border:'none', cursor:'pointer', fontSize:'1.15rem' }}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {invoices.length === 0 && (
                  <tr><td colSpan="9" style={{ textAlign:'center', color:'#94a3b8', padding:'3rem', fontStyle:'italic' }}>No invoices yet. Create your first one!</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* PRODUCT MANAGEMENT MODAL */}
        {showProductModal && (
          <div className="modal-overlay">
            <div className="glass-card modal-content" style={{ maxWidth: '500px' }}>
              <div className="modal-header">
                <h2>📦 Product Management</h2>
                <button onClick={() => setShowProductModal(false)} className="btn-close">×</button>
              </div>

              <form onSubmit={handleAddProduct} className="invoice-form" style={{ marginBottom: '1.5rem' }}>
                <div className="form-section-label">Add New Product</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <input required placeholder="Product Name" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} />
                  <div className="form-grid-2">
                    <input required type="number" step="0.01" placeholder="Selling Price" value={newProduct.pricePerUnit} onChange={e => setNewProduct({ ...newProduct, pricePerUnit: e.target.value })} />
                    <input required type="number" step="0.01" placeholder="Buying Price" value={newProduct.capital} onChange={e => setNewProduct({ ...newProduct, capital: e.target.value })} />
                  </div>

                  <button type="submit" className="btn-submit" style={{ marginTop: '0.5rem' }}>Add Product</button>
                </div>
              </form>

              <div className="form-section-label">Existing Products</div>
              <div className="table-wrapper" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <table style={{ minWidth: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '0.5rem' }}>Name</th>
                      <th style={{ padding: '0.5rem' }}>Price</th>
                      <th style={{ padding: '0.5rem' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p.id}>
                        <td style={{ padding: '0.5rem' }}>{p.name}</td>
                        <td style={{ padding: '0.5rem' }}>₹{p.pricePerUnit}</td>
                        <td style={{ padding: '0.5rem' }}>
                          <button onClick={() => handleDeleteProduct(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}>🗑️</button>
                        </td>
                      </tr>
                    ))}
                    {products.length === 0 && (
                      <tr><td colSpan="3" style={{ textAlign: 'center', padding: '1rem', color: '#94a3b8' }}>No manual products added.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

