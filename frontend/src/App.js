import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css'; // ПІДКЛЮЧАЄМО НАШ НОВИЙ ФАЙЛ ЗІ СТИЛЯМИ

const FLOORS = ['A', 'B'];
const ROWS = [1, 2, 3, 4, 5];
const SECTIONS = Array.from({ length: 16 }, (_, i) => i + 1);
const LEVELS = [1, 2, 3, 4, 5];

function App() {
  const [user, setUser] = useState(null);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  const [parts, setParts] = useState([]);
  
  const initialFormState = { 
    article: '', name: '', category: '', price: '', quantity: '', min_quantity: '0', 
    locType: 'RB01', locFloor: 'A', locRow: '1', locSection: '1', locLevel: '1' 
  };
  const [formData, setFormData] = useState(initialFormState);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  const [movingPart, setMovingPart] = useState(null);
  const [moveLoc, setMoveLoc] = useState({ floor: 'A', row: '1', section: '1', level: '1' });
  const [activeTab, setActiveTab] = useState('ALL');

  const [scanStep, setScanStep] = useState(1);
  const [scannedPart, setScannedPart] = useState(null);
  const [scanArticle, setScanArticle] = useState('');
  const [scanLocation, setScanLocation] = useState('');
  const [scanError, setScanError] = useState('');
  
  const articleInputRef = useRef(null);
  const locationInputRef = useRef(null);

  useEffect(() => {
    if (user) fetchParts();
  }, [user]);

  useEffect(() => {
    if (activeTab === 'SCANNER') {
      if (scanStep === 1 && articleInputRef.current) articleInputRef.current.focus();
      if (scanStep === 2 && locationInputRef.current) locationInputRef.current.focus();
    }
  }, [scanStep, activeTab]);

  const fetchParts = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/parts/');
      setParts(response.data);
    } catch (error) {
      console.error("Помилка завантаження", error);
    }
  };

  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (loginData.username === 'admin' && loginData.password === 'admin123') {
      setUser({ name: 'Керівник складу', role: 'ADMIN' });
      setActiveTab('ALL');
      setLoginError('');
    } else if (loginData.username === 'sklad' && loginData.password === 'sklad123') {
      setUser({ name: 'Комірник', role: 'WORKER' });
      setActiveTab('SCANNER');
      setLoginError('');
    } else {
      setLoginError('Невірний логін або пароль');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setLoginData({ username: '', password: '' });
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalLocation = formData.locType === 'RB01' 
      ? 'RB01' 
      : `${formData.locFloor}-${formData.locRow}-${formData.locSection}-${formData.locLevel}`;

    const payload = {
      article: formData.article,
      name: formData.name,
      category: formData.category,
      price: formData.price || 0,
      quantity: formData.quantity,
      min_quantity: formData.min_quantity,
      location: finalLocation
    };

    try {
      if (isEditing) {
        await axios.put(`http://127.0.0.1:8000/api/parts/${editId}/`, payload);
        setIsEditing(false);
        setEditId(null);
      } else {
        await axios.post('http://127.0.0.1:8000/api/parts/', payload);
      }
      setFormData(initialFormState);
      fetchParts();
    } catch (error) {
      alert("Помилка! Перевірте правильність даних.");
    }
  };

  const processScanArticle = () => {
    if (!scanArticle.trim()) return;
    const found = parts.find(p => p.article === scanArticle.trim());
    if (found) {
      setScannedPart(found);
      setScanError('');
      setScanStep(2);
    } else {
      setScanError(`❌ Товар з кодом ${scanArticle} не знайдено!`);
      setScanArticle('');
      if (articleInputRef.current) articleInputRef.current.focus();
    }
  };

  const handleScanArticleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      processScanArticle();
    }
  };

  const processScanLocation = async () => {
    if (!scanLocation.trim() || !scannedPart) return;
    try {
      const updatedPart = { ...scannedPart, location: scanLocation.trim().toUpperCase() };
      await axios.put(`http://127.0.0.1:8000/api/parts/${scannedPart.id}/`, updatedPart);
      
      alert(`📦 Успішно! "${scannedPart.name}" розміщено в ${scanLocation.toUpperCase()}.`);
      fetchParts();
      
      setScanStep(1);
      setScanArticle('');
      setScanLocation('');
      setScannedPart(null);
    } catch (error) {
      setScanError(`❌ Помилка сервера. Спробуйте ще раз.`);
    }
  };

  const handleScanLocationKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      processScanLocation();
    }
  };

  const resetScanner = () => {
    setScanStep(1);
    setScanArticle('');
    setScanLocation('');
    setScannedPart(null);
    setScanError('');
  };

  const handleEditClick = (part) => {
    let locType = 'RB01', locFloor = 'A', locRow = '1', locSection = '1', locLevel = '1';
    if (part.location && part.location !== 'RB01') {
      const p = part.location.split('-');
      if (p.length === 4) {
        locType = 'STANDARD';
        locFloor = p[0]; locRow = p[1]; locSection = p[2]; locLevel = p[3];
      }
    }
    setFormData({ ...part, locType, locFloor, locRow, locSection, locLevel });
    setIsEditing(true);
    setEditId(part.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditId(null);
    setFormData(initialFormState);
  };

  const openMoveModal = (part) => {
    let locFloor = 'A', locRow = '1', locSection = '1', locLevel = '1';
    if (part.location && part.location !== 'RB01') {
      const p = part.location.split('-');
      if (p.length === 4) {
        locFloor = p[0]; locRow = p[1]; locSection = p[2]; locLevel = p[3];
      }
    }
    setMoveLoc({ floor: locFloor, row: locRow, section: locSection, level: locLevel });
    setMovingPart(part);
  };

  const submitMove = async () => {
    const newLocation = `${moveLoc.floor}-${moveLoc.row}-${moveLoc.section}-${moveLoc.level}`;
    try {
      const updatedPart = { ...movingPart, location: newLocation };
      await axios.put(`http://127.0.0.1:8000/api/parts/${movingPart.id}/`, updatedPart);
      setMovingPart(null);
      fetchParts();
    } catch (error) {
      alert("Помилка при переміщенні.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Ви впевнені, що хочете списати запис з бази?")) {
      try {
        await axios.delete(`http://127.0.0.1:8000/api/parts/${id}/`);
        fetchParts();
      } catch (error) {
        alert("Помилка видалення.");
      }
    }
  };

  const filteredParts = parts.filter(part => {
    if (activeTab === 'RB01') return part.location === 'RB01';
    if (activeTab === 'PLACED') return part.location !== 'RB01';
    return true; 
  });

  // ЕКРАН ВХОДУ
  if (!user) {
    return (
      <div className="login-wrapper">
        <form onSubmit={handleLoginSubmit} className="login-card">
          <h2 style={{ textAlign: 'center', color: '#1e293b', marginTop: 0, marginBottom: '30px' }}>Авторизація</h2>
          {loginError && <div className="login-error">{loginError}</div>}
          
          <div className="form-group" style={{ marginBottom: '15px' }}>
            <label className="form-label">Ідентифікатор (Логін)</label>
            <input name="username" value={loginData.username} onChange={handleLoginChange} required className="form-control" />
          </div>
          <div className="form-group" style={{ marginBottom: '25px' }}>
            <label className="form-label">Ключ доступу (Пароль)</label>
            <input type="password" name="password" value={loginData.password} onChange={handleLoginChange} required className="form-control" />
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Увійти в систему</button>
        </form>
      </div>
    );
  }

  // ОСНОВНИЙ ІНТЕРФЕЙС
  return (
    <div className="app-container">
      <div className="header-panel">
        <h1 style={{ fontSize: '1.4rem', fontWeight: '500', margin: 0 }}> Термінал: Оперативний облік залишків</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ fontSize: '14px' }}>
            <span style={{ color: '#94a3b8' }}>Користувач:</span> <strong>{user.name}</strong> 
            <span className={user.role === 'ADMIN' ? "badge badge-red" : "badge badge-green"} style={{ marginLeft: '8px' }}>{user.role}</span>
          </div>
          <button onClick={handleLogout} className="btn btn-secondary btn-sm" style={{color: 'white'}}>Вийти</button>
        </div>
      </div>

      {user.role === 'ADMIN' && (
        <form onSubmit={handleSubmit} className="card">
          <h3 style={{ marginTop: 0, color: isEditing ? '#ea580c' : '#0f172a' }}>
            {isEditing ? '✏️ Редагування запису' : '➕ Реєстрація товарної одиниці'}
          </h3>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Артикул</label><input name="article" value={formData.article} onChange={handleInputChange} required className="form-control" disabled={isEditing}/></div>
            <div className="form-group"><label className="form-label">Назва деталі</label><input name="name" value={formData.name} onChange={handleInputChange} required className="form-control" /></div>
            <div className="form-group"><label className="form-label">Категорія</label><input name="category" value={formData.category} onChange={handleInputChange} required className="form-control" /></div>
            <div className="form-group"><label className="form-label">Кількість (шт)</label><input name="quantity" type="number" value={formData.quantity} onChange={handleInputChange} required className="form-control" /></div>
            
            <div className="form-group" style={{ flex: '1 1 100%', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
              <label className="form-label">Місцезнаходження на складі:</label>
              <select name="locType" value={formData.locType} onChange={handleInputChange} className="form-control" style={{width: '300px', marginBottom: '15px'}}>
                <option value="RB01">Зона надходження (Тимчасово - RB01)</option>
                <option value="STANDARD">Адресне місце зберігання (Полиця)</option>
              </select>
              {formData.locType === 'STANDARD' && (
                <div className="form-row">
                  <div><label className="form-label">Поверх:</label><select name="locFloor" value={formData.locFloor} onChange={handleInputChange} className="form-control">{FLOORS.map(f => <option key={f}>{f}</option>)}</select></div>
                  <div><label className="form-label">Ряд:</label><select name="locRow" value={formData.locRow} onChange={handleInputChange} className="form-control">{ROWS.map(r => <option key={r}>{r}</option>)}</select></div>
                  <div><label className="form-label">Секція:</label><select name="locSection" value={formData.locSection} onChange={handleInputChange} className="form-control">{SECTIONS.map(s => <option key={s}>{s}</option>)}</select></div>
                  <div><label className="form-label">Рівень:</label><select name="locLevel" value={formData.locLevel} onChange={handleInputChange} className="form-control">{LEVELS.map(l => <option key={l}>{l}</option>)}</select></div>
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '12px', flex: '1 1 100%', marginTop: '8px' }}>
              <button type="submit" className={isEditing ? "btn btn-warning" : "btn btn-primary"}>{isEditing ? 'Зберегти зміни' : 'Внести до реєстру'}</button>
              {isEditing && <button type="button" onClick={handleCancelEdit} className="btn btn-secondary">Скасувати</button>}
            </div>
          </div>
        </form>
      )}

      <div className="tabs-nav">
        <button onClick={() => setActiveTab('SCANNER')} className={`tab ${activeTab === 'SCANNER' ? 'active' : ''}`}> ТЗД (Сканер)</button>
        {user.role === 'ADMIN' && (
          <button onClick={() => setActiveTab('ALL')} className={`tab ${activeTab === 'ALL' ? 'active' : ''}`}>📋 Всі товари</button>
        )}
        <button onClick={() => setActiveTab('RB01')} className={`tab ${activeTab === 'RB01' ? 'active' : ''}`}>🔴 Очікують (RB01)</button>
        <button onClick={() => setActiveTab('PLACED')} className={`tab ${activeTab === 'PLACED' ? 'active' : ''}`}>🟢 Розміщені</button>
      </div>

      {activeTab === 'SCANNER' && (
        <div className="card scanner-box">
          {scanError && <div className="login-error">{scanError}</div>}

          {scanStep === 1 && (
            <div style={{ width: '100%', maxWidth: '300px' }}>
              <h2 style={{ margin: '0 0 20px 0' }}>Крок 1/2</h2>
              <input 
                ref={articleInputRef} type="text" inputMode="numeric"
                value={scanArticle} onChange={(e) => setScanArticle(e.target.value)} onKeyDown={handleScanArticleKeyDown}
                placeholder="Штрих-код товару" className="scanner-input blue"
              />
              <button onClick={processScanArticle} className="btn btn-primary" style={{ width: '100%' }}>Далі ➔</button>
            </div>
          )}

          {scanStep === 2 && scannedPart && (
            <div style={{ width: '100%', maxWidth: '300px' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '4px', border: '1px solid #cbd5e1', marginBottom: '20px', textAlign: 'left' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Деталь:</span>
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{scannedPart.name}</div>
              </div>
              <h2 style={{ margin: '0 0 20px 0' }}>Крок 2/2</h2>
              <input 
                ref={locationInputRef} type="text"
                value={scanLocation} onChange={(e) => setScanLocation(e.target.value)} onKeyDown={handleScanLocationKeyDown}
                placeholder="Комірка (A-1-1-1)" className="scanner-input orange"
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={resetScanner} className="btn btn-secondary" style={{ flex: 1 }}>↩ Назад</button>
                <button onClick={processScanLocation} className="btn btn-warning" style={{ flex: 2 }}>Розмістити</button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab !== 'SCANNER' && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Артикул</th>
                <th>Найменування</th>
                <th>К-сть</th>
                <th>Локація</th>
                <th>Дії</th>
              </tr>
            </thead>
            <tbody>
              {filteredParts.map(part => (
                <tr key={part.id}>
                  <td><strong>{part.article}</strong></td>
                  <td>
                    <div style={{ fontWeight: '500' }}>{part.name}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>{part.category}</div>
                  </td>
                  <td><strong style={{ color: '#2563eb' }}>{part.quantity} шт.</strong></td>
                  <td>
                    {part.location === 'RB01' ? <span className="badge badge-red">🔴 RB01</span> : <span className="badge badge-green">🟢 {part.location}</span>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button onClick={() => openMoveModal(part)} className="btn btn-sm btn-sm-primary">Вручну</button>
                      {user.role === 'ADMIN' && (
                        <>
                          <button onClick={() => handleEditClick(part)} className="btn btn-sm btn-sm-secondary">Ред.</button>
                          <button onClick={() => handleDelete(part.id)} className="btn btn-sm btn-sm-danger">Списати</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredParts.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Порожньо.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {movingPart && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ marginTop: 0, borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>Ручне переміщення</h3>
            <p>Артикул: <strong>{movingPart.article}</strong></p>
            <div className="form-group" style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '4px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
              <div className="form-row">
                  <div><label className="form-label">Поверх:</label><select value={moveLoc.floor} onChange={(e) => setMoveLoc({...moveLoc, floor: e.target.value})} className="form-control">{FLOORS.map(f => <option key={f}>{f}</option>)}</select></div>
                  <div><label className="form-label">Ряд:</label><select value={moveLoc.row} onChange={(e) => setMoveLoc({...moveLoc, row: e.target.value})} className="form-control">{ROWS.map(r => <option key={r}>{r}</option>)}</select></div>
                  <div><label className="form-label">Секція:</label><select value={moveLoc.section} onChange={(e) => setMoveLoc({...moveLoc, section: e.target.value})} className="form-control">{SECTIONS.map(s => <option key={s}>{s}</option>)}</select></div>
                  <div><label className="form-label">Рівень:</label><select value={moveLoc.level} onChange={(e) => setMoveLoc({...moveLoc, level: e.target.value})} className="form-control">{LEVELS.map(l => <option key={l}>{l}</option>)}</select></div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setMovingPart(null)} className="btn btn-secondary">Скасувати</button>
              <button onClick={submitMove} className="btn btn-primary">Підтвердити</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;