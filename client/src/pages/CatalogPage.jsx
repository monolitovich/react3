import React, { useState, useEffect } from 'react';
import { request } from '../api';
import { useCart } from '../context/CartContext';
import CategoryAside from '../components/CategoryAside';

export default function CatalogPage() {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { addToCart } = useCart();

  const loadCategories = async () => {
    try {
      const data = await request('/categories');
      setCategories(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const loadServices = async () => {
    setLoading(true);
    try {
      const query = selectedCategories.length > 0 ? `?categories=${selectedCategories.join(',')}` : '';
      const data = await request(`/services${query}`);
      setServices(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadServices();
  }, [selectedCategories]);

  const toggleCategory = (id) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleCategoryCreated = (newCat) => {
    setCategories((prev) => [...prev, newCat]);
  };

  return (
    <div className="page-container catalog-layout">
      <CategoryAside
        categories={categories}
        selectedIds={selectedCategories}
        onToggle={toggleCategory}
        onCategoryCreated={handleCategoryCreated}
      />

      <section className="catalog-content">
        <div className="content-header">
          <div>
            <h1 className="page-heading">Услуги и сервис</h1>
            <p className="page-subheading">Выберите процедуры для онлайн-записи</p>
          </div>
          {selectedCategories.length > 0 && (
            <button className="btn-clean-filter" onClick={() => setSelectedCategories([])}>
              Сбросить фильтры ({selectedCategories.length})
            </button>
          )}
        </div>

        {error && <div className="status-banner error">{error}</div>}

        {loading ? (
          <div className="loading-state">Загрузка каталога услуг...</div>
        ) : services.length === 0 ? (
          <div className="empty-state">В выбранных категориях пока нет услуг.</div>
        ) : (
          <div className="services-catalog-grid">
            {services.map((svc) => (
              <article key={svc.id} className="service-card-modern">
                <div className="card-top">
                  <span className="card-cat-badge">{svc.category_name}</span>
                  {svc.discount_percent > 0 && (
                    <span className="card-promo-badge">-{svc.discount_percent}%</span>
                  )}
                </div>

                <h3 className="card-title">{svc.name}</h3>
                <p className="card-description">{svc.description}</p>

                <div className="card-meta">
                  <span className="card-duration">{svc.duration_min} мин.</span>
                  <div className="card-pricing">
                    {svc.discount_percent > 0 ? (
                      <>
                        <span className="card-old-price">{Number(svc.price).toLocaleString()} ₽</span>
                        <span className="card-current-price highlight">
                          {Number(svc.final_price).toLocaleString()} ₽
                        </span>
                      </>
                    ) : (
                      <span className="card-current-price">{Number(svc.price).toLocaleString()} ₽</span>
                    )}
                  </div>
                </div>

                <button className="btn-add-cart" onClick={() => addToCart(svc)}>
                  В корзину
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}