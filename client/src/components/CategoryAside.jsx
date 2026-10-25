import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { request } from '../api';

export default function CategoryAside({ categories, selectedIds, onToggle, onCategoryCreated }) {
  const { user } = useAuth();
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      setIsSubmitting(true);
      const created = await request('/categories', {
        method: 'POST',
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });
      setNewCategoryName('');
      onCategoryCreated(created);
    } catch (err) {
      alert(err.message || 'Ошибка создания категории');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <aside className="catalog-sidebar">
      <div className="sidebar-section">
        <h3 className="sidebar-title">Категории</h3>
        <div className="category-list">
          {categories.map((cat) => (
            <label key={cat.id} className="filter-checkbox-item">
              <input
                type="checkbox"
                checked={selectedIds.includes(cat.id)}
                onChange={() => onToggle(cat.id)}
              />
              <span className="checkmark"></span>
              <span className="category-text">{cat.name}</span>
            </label>
          ))}
        </div>
      </div>

      {user?.role === 'admin' && (
        <div className="sidebar-section admin-add-box">
          <h4 className="admin-subtitle">Новая категория</h4>
          <form onSubmit={handleCreate} className="admin-inline-form">
            <input
              type="text"
              placeholder="Название..."
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              disabled={isSubmitting}
            />
            <button type="submit" disabled={isSubmitting || !newCategoryName.trim()}>
              +
            </button>
          </form>
        </div>
      )}
    </aside>
  );
}