import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';


function App() {
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState({ totalRevenue: 0, totalOrders: 0, pendingAmount: 0, totalProfit: 0 });
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sendingEmailId, setSendingEmailId] = useState(null);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    productName: '',
    quantity: '',
    pricePerUnit: '',
    capital: '',
    paymentMode: '',
    paymentStatus: ''
  });

  const fetchData = async () => {
    try {
      const invRes = await fetch('http://localhost:5000/api/invoices');
      const invData = await invRes.json();
      setInvoices(invData);

      const statRes = await fetch('http://localhost:5000/api/stats');
      const statData = await statRes.json();
      setStats(statData);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = editingInvoice 
        ? `http://localhost:5000/api/invoices/${editingInvoice.invoiceId}` 
        : 'http://localhost:5000/api/invoices';
      
      const method = editingInvoice ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        alert(editingInvoice ? 'Invoice updated successfully!' : 'Invoice generated and emailed successfully!');
        setShowForm(false);
        setEditingInvoice(null);
        fetchData();
      } else {
        alert('Error processing invoice');
      }
    } catch (err) {
      alert('Failed to connect to backend');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (inv) => {
    setEditingInvoice(inv);
    setFormData({
      customerName: inv.Customer?.name || '',
      customerEmail: inv.customerEmail,
      customerPhone: inv.Customer?.phone || '',
      productName: inv.productName,
      quantity: inv.quantity,
      pricePerUnit: inv.pricePerUnit,
      capital: inv.capital || 0,
      paymentMode: inv.paymentMode,
      paymentStatus: inv.paymentStatus
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        const res = await fetch(`http://localhost:5000/api/invoices/${id}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          alert('Invoice deleted successfully!');
          fetchData();
        } else {
          alert('Error deleting invoice');
        }
      } catch (err) {
        alert('Failed to connect to backend');
      }
    }
  };

  const handleSendEmail = async (id) => {
    setSendingEmailId(id);
    try {
      const res = await fetch(`http://localhost:5000/api/invoices/${id}/email`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        alert('📨 Email successfully sent to the registered customer!');
      } else {
        alert('Warning: ' + (data.error || 'Check .env configuration.'));
      }
    } catch (err) {
      alert('Failed to connect to backend email server');
    }
    setSendingEmailId(null);
  };

  const handleCreateNew = () => {
    setEditingInvoice(null);
    setFormData({
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      productName: '',
      quantity: '',
      pricePerUnit: '',
      capital: '',
      paymentMode: '',
      paymentStatus: ''
    });
    setShowForm(true);
  };

  const exportToExcel = () => {
    if (invoices.length === 0) {
      alert("No data to export!");
      return;
    }

    const formattedData = invoices.map(inv => ({
      'Invoice ID': inv.invoiceId,
      'Customer Name': inv.Customer?.name || '',
      'Customer Email': inv.customerEmail,
      'Phone': inv.Customer?.phone || '',
      'Product': inv.productName,
      'Quantity': inv.quantity,
      'Price (₹)': inv.pricePerUnit,
      'Capital (₹)': inv.capital || 0,
      'Total Amount (₹)': inv.totalAmount,
      'Profit (₹)': inv.profit || 0,
      'Payment Status': inv.paymentStatus,
      'Payment Mode': inv.paymentMode,
      'Date': new Date(inv.createdAt).toLocaleDateString()
    }));

    // Create a new workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoices Data');

    // Generate and download the file automatically
    XLSX.writeFile(workbook, `Invoices_Database_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`);
  };

  return (
    <div className="dashboard-container">
      <header>
        <div>
          <h1 style={{ fontWeight: '800', fontSize: '2.25rem', margin: 0, color: '#f0f3f8ff' }}>Invoice Manager</h1>
          <p style={{ color: '#64748b', margin: '0.25rem 0 0 0' }}>Enterprise Billing & Analytics</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={exportToExcel}
            className="btn-primary"
            style={{ background: '#fff', color: '#1e293b', border: '1px solid #e2e8f0' }}
          >
            📊 Excel
          </button>
          <button
            onClick={handleCreateNew}
            className="btn-primary"
          >
            + Create Invoice
          </button>
        </div>
      </header>

      <div className="main-content">
        <div className="stats-grid">
          <div className="glass-card stat-item">
            <h3>Total Revenue</h3>
            <div className="value">₹{Number(stats.totalRevenue).toLocaleString()}</div>
            <p style={{ fontSize: '0.8rem', color: '#10b981', margin: '0.5rem 0 0 0' }}>Overall Sales</p>
          </div>
          <div className="glass-card stat-item">
            <h3>Total Profit</h3>
            <div className="value" style={{ color: '#000109ff' }}>₹{Number(stats.totalProfit || 0).toLocaleString()}</div>
            <p style={{ fontSize: '0.8rem', color: '#10b981', margin: '0.5rem 0 0 0' }}>Overall Margins</p>
          </div>
          <div className="glass-card stat-item">
            <h3>Pending Payments</h3>
            <div className="value" style={{ color: '#0b0801ff' }}>₹{Number(stats.pendingAmount).toLocaleString()}</div>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0.5rem 0 0 0' }}>Action required</p>
          </div>
          <div className="glass-card stat-item">
            <h3>Total Orders</h3>
            <div className="value">{stats.totalOrders}</div>
            <p style={{ fontSize: '0.8rem', color: '#6366f1', margin: '0.5rem 0 0 0' }}>Processed successfully</p>
          </div>
        </div>

        {showForm && (
          <div className="modal-overlay">
            <div className="glass-card modal-content">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, fontWeight: '800' }}>{editingInvoice ? 'Update Invoice' : 'New Invoice'}</h2>
                <button onClick={() => { setShowForm(false); setEditingInvoice(null); }} className="btn-close">×</button>
              </div>
              <form onSubmit={handleSubmit} className="invoice-form">
                <div className="form-grid">
                  <input required placeholder="Customer Name" value={formData.customerName} onChange={e => setFormData({ ...formData, customerName: e.target.value })} />
                  <input required type="email" placeholder="Customer Email" value={formData.customerEmail} onChange={e => setFormData({ ...formData, customerEmail: e.target.value })} />
                  <input required placeholder="Phone Number" value={formData.customerPhone} onChange={e => setFormData({ ...formData, customerPhone: e.target.value })} />
                  <input required list="product-suggestions" placeholder="Search Product (e.g., Rice, Dal)..." value={formData.productName} onChange={e => setFormData({ ...formData, productName: e.target.value })} autoComplete="off" />
                  <datalist id="product-suggestions">
                      <option value="Sona Mansoori">🌾 Rice</option>
                      <option value="Kolam">🌾 Rice</option>
                      <option value="Jeera Kolam">🌾 Rice</option>
                      <option value="HMT Kolam">🌾 Rice</option>
                      <option value="Wada Kolam">🌾 Rice</option>
                      <option value="Surti Kolam">🌾 Rice</option>
                      <option value="Basmati Dubar">🌾 Rice</option>
                      <option value="Basmati Tibbar">🌾 Rice</option>
                      <option value="Basmati Sortex">🌾 Rice</option>
                      
                      <option value="Toor Dal Tukdi Gold">🌱 Pulses</option>
                      <option value="Toor Dal Tukdi">🌱 Pulses</option>
                      <option value="Damdaar Toor">🌱 Pulses</option>
                      <option value="Rajwadi Toor">🌱 Pulses</option>
                      <option value="Premium Toor">🌱 Pulses</option>
                      <option value="Chana Dal">🌱 Pulses</option>
                      <option value="Moong Dal">🌱 Pulses</option>
                      <option value="Masoor Dal">🌱 Pulses</option>
                      <option value="Rajma">🌱 Pulses</option>
                      <option value="Kabuli Chana">🌱 Pulses</option>
                      <option value="Chana">🌱 Pulses</option>

                      <option value="Wheat Flour">🌾 Grains</option>
                      <option value="Besan">🌾 Grains</option>
                      <option value="Rava">🌾 Grains</option>
                      <option value="Maida">🌾 Grains</option>
                      <option value="Rice Flour">🌾 Grains</option>
                      <option value="Corn Flour">🌾 Grains</option>
                      <option value="Poha">🌾 Grains</option>

                      <option value="Jeera">🌿 Spices</option>
                      <option value="Dhaniya">🌿 Spices</option>
                      <option value="Kali Mirch">🌿 Spices</option>
                      <option value="Saunf">🌿 Spices</option>
                      <option value="Laung">🌿 Spices</option>
                      <option value="Dalchini">🌿 Spices</option>
                      <option value="Tejpatta">🌿 Spices</option>
                      <option value="Star Phool">🌿 Spices</option>
                      <option value="Elaichi">🌿 Spices</option>
                      <option value="Badi Elaichi">🌿 Spices</option>
                      <option value="Javitri">🌿 Spices</option>
                      <option value="Chavila">🌿 Spices</option>
                      <option value="Shah Jeera">🌿 Spices</option>
                      <option value="Rai">🌿 Spices</option>
                      <option value="Barik Rai">🌿 Spices</option>
                      <option value="Haldi (Whole)">🌿 Spices</option>
                      <option value="Peeli Sarso">🌿 Spices</option>

                      <option value="Haldi Powder">🌶️ Powder Masala</option>
                      <option value="Dhaniya Powder">🌶️ Powder Masala</option>
                      <option value="Lal Mirch Powder">🌶️ Powder Masala</option>
                      <option value="Kashmiri Mirch Powder">🌶️ Powder Masala</option>
                      <option value="Chaat Masala">🌶️ Powder Masala</option>
                      <option value="Paneer Masala">🌶️ Powder Masala</option>
                      <option value="Chicken Masala">🌶️ Powder Masala</option>
                      <option value="Shahi Biryani Masala">🌶️ Powder Masala</option>
                      <option value="Mutton Masala">🌶️ Powder Masala</option>
                      <option value="Rajwadi Garam Masala">🌶️ Powder Masala</option>
                      <option value="Garam Masala Gold">🌶️ Powder Masala</option>
                      <option value="Garam Masala Lite">🌶️ Powder Masala</option>
                      <option value="Kitchen King Masala">🌶️ Powder Masala</option>
                      <option value="Kanda Lehsun Masala">🌶️ Powder Masala</option>
                      <option value="Egg Curry Masala">🌶️ Powder Masala</option>
                      <option value="Chole Masala">🌶️ Powder Masala</option>
                      <option value="Malvani Masala">🌶️ Powder Masala</option>
                      <option value="Sambhar Masala">🌶️ Powder Masala</option>
                      <option value="Pav Bhaji Masala">🌶️ Powder Masala</option>

                      <option value="Sunflower Oil">🛢️ Oils</option>
                      <option value="Mustard Oil">🛢️ Oils</option>
                      <option value="Groundnut Oil">🛢️ Oils</option>
                      <option value="Cottonseed Oil">🛢️ Oils</option>
                      <option value="Soyabean Oil">🛢️ Oils</option>

                      <option value="Badam (Almonds)">🥜 Dry Fruits</option>
                      <option value="Kaju (Cashew)">🥜 Dry Fruits</option>
                      <option value="Pista (Pistachio)">🥜 Dry Fruits</option>
                      <option value="Kishmish (Raisins)">🥜 Dry Fruits</option>
                      <option value="Akhrot (Walnut)">🥜 Dry Fruits</option>
                      <option value="Anjeer (Dry Fig)">🥜 Dry Fruits</option>
                      <option value="Munakka">🥜 Dry Fruits</option>
                      <option value="Chironji">🥜 Dry Fruits</option>
                      <option value="Dry Dates (Khajoor)">🥜 Dry Fruits</option>
                  </datalist>
                  <input required type="number" placeholder="Quantity" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} />
                  <input required type="number" placeholder="Price per Unit" value={formData.pricePerUnit} onChange={e => setFormData({ ...formData, pricePerUnit: e.target.value })} />
                  <input required type="number" placeholder="Capital (Buying Price)" value={formData.capital} onChange={e => setFormData({ ...formData, capital: e.target.value })} />
                  <select value={formData.paymentStatus} onChange={e => setFormData({ ...formData, paymentStatus: e.target.value })}>
                    <option value="">Select Status</option>
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                  </select>
                  <select value={formData.paymentMode} onChange={e => setFormData({ ...formData, paymentMode: e.target.value })}>
                    <option value="">Select Mode</option>
                    <option value="Online">Online</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>

                <div style={{ marginTop: '2rem', padding: '1.25rem', background: '#f8fafc', borderRadius: '0.75rem', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '600', color: '#64748b' }}>Estimated Profit:</span>
                    <span style={{ fontSize: '1rem', fontWeight: '800', color: '#6366f1' }}>
                      ₹{(formData.quantity * (formData.pricePerUnit - formData.capital)).toFixed(2)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem' }}>
                    <span style={{ fontWeight: '600', color: '#1e293b' }}>Grand Total:</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: '800', color: '#1e293b' }}>
                      ₹{(formData.quantity * formData.pricePerUnit).toFixed(2)}
                    </span>
                  </div>
                </div>

                <button disabled={loading} type="submit" className="btn-submit">
                  {loading ? 'Processing...' : (editingInvoice ? 'Update & Save Changes' : 'Generate & Email Invoice')}
                </button>
              </form>
            </div>
          </div>
        )}

        <div className="glass-card">
          <h2 style={{ marginTop: 0, marginBottom: '2rem', fontSize: '1.25rem', fontWeight: '800' }}>Transaction History</h2>
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Invoice ID</th>
                  <th>Customer Name</th>
                  <th>Contact</th>
                  <th>Date</th>
                  <th>Product</th>
                  <th>Amount</th>
                  <th>Profit</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td style={{ fontFamily: 'monospace', color: '#6366f1', fontWeight: '700' }}>{inv.invoiceId}</td>
                    <td style={{ fontWeight: '700' }}>{inv.Customer?.name}</td>
                    <td style={{ color: '#64748b', fontSize: '13px' }}>{inv.Customer?.phone}</td>
                    <td style={{ color: '#64748b', fontSize: '14px' }}>{new Date(inv.createdAt).toLocaleDateString()}</td>
                    <td>{inv.productName}</td>
                    <td style={{ fontWeight: '800', color: '#1e293b' }}>₹{Number(inv.totalAmount).toFixed(2)}</td>
                    <td style={{ fontWeight: '700', color: '#6366f1' }}>₹{Number(inv.profit || 0).toFixed(2)}</td>
                    <td>
                      <span className={`badge badge-${inv.paymentStatus.toLowerCase()}`}>
                        {inv.paymentStatus}
                      </span>
                    </td>
                    <td style={{ display: 'flex', gap: '0.5rem' }}>
                       <button 
                        onClick={() => handleSendEmail(inv.invoiceId)}
                        style={{ background: 'none', border: 'none', cursor: sendingEmailId === inv.invoiceId ? 'wait' : 'pointer', color: '#f59e0b', fontSize: '1.2rem', opacity: sendingEmailId === inv.invoiceId ? 0.5 : 1 }}
                        title="Send Mail to Customer"
                        disabled={sendingEmailId === inv.invoiceId}
                       >
                        {sendingEmailId === inv.invoiceId ? '⏳' : '📩'}
                       </button>
                       <button 
                        onClick={() => handleEdit(inv)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6366f1', fontSize: '1.2rem' }}
                        title="Edit Invoice"
                       >
                        ✏️
                       </button>
                       <button 
                        onClick={() => handleDelete(inv.invoiceId)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '1.2rem' }}
                        title="Delete Invoice"
                       >
                        🗑️
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
