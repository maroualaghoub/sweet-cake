/**
 * Sweet Cake - Main JavaScript avec Backend
 */
(function() {
  'use strict';

  const API_URL = 'http://localhost:5000/api';

  // ============================================================
  // 1. MENU BURGER (Mobile)
  // ============================================================
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');

  if (burger && nav) {
    const toggleMenu = () => {
      const isOpen = nav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    };

    burger.addEventListener('click', toggleMenu);

    nav.querySelectorAll('.nav__link').forEach(link => {
      link.addEventListener('click', () => {
        if (nav.classList.contains('is-open')) toggleMenu();
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) toggleMenu();
    });
  }

  // ============================================================
  // 2. CHARGEMENT DES PRODUITS DEPUIS LE BACKEND
  // ============================================================
  async function loadProducts() {
    const productsGrid = document.getElementById('productsGrid');
    
    if (!productsGrid) {
      console.warn('❌ Element #productsGrid non trouvé dans le HTML');
      return;
    }
    
    try {
      // Afficher un loader
      productsGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
          <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #D9778E;"></i>
          <p style="margin-top: 10px; color: #8B7A78;">Chargement des gâteaux...</p>
        </div>
      `;
      
      const response = await fetch(`${API_URL}/products`);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const products = await response.json();
      
      // Vider le conteneur
      productsGrid.innerHTML = '';
      
      // Vérifier si on a des produits
      if (!products || products.length === 0) {
        productsGrid.innerHTML = `
          <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
            <p style="color: #8B7A78;">Aucun produit disponible pour le moment.</p>
          </div>
        `;
        return;
      }
      
      // Créer les cartes produits
      products.forEach(product => {
        const card = createProductCard(product);
        productsGrid.appendChild(card);
      });
      
      console.log(`✅ ${products.length} produits chargés depuis le backend`);
      
    } catch (error) {
      console.error('Erreur de chargement des produits:', error);
      productsGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #e74c3c;">
          <i class="fas fa-exclamation-circle" style="font-size: 2rem;"></i>
          <p style="margin-top: 10px;">Erreur de chargement des produits.</p>
          <p style="font-size: 0.9rem; color: #8B7A78; margin-top: 5px;">
            Vérifiez que le backend est lancé sur http://localhost:5000
          </p>
          <button onclick="location.reload()" style="margin-top: 15px; padding: 10px 20px; background: #D9778E; color: white; border: none; border-radius: 8px; cursor: pointer;">
            <i class="fas fa-redo"></i> Réessayer
          </button>
        </div>
      `;
    }
  }

  function createProductCard(product) {
    const article = document.createElement('article');
    article.className = 'product-card';
    article.dataset.productId = product.id;
    
    // Image par défaut si aucune n'est fournie
    const imageUrl = product.image || 'https://via.placeholder.com/400x300?text=G%C3%A2teau+Maison';
    
    article.innerHTML = `
      <div class="product-card__image">
        <img src="${imageUrl}" 
             alt="${product.name}" 
             loading="lazy"
             onerror="this.src='https://via.placeholder.com/400x300?text=Image+non+disponible'" />
        ${product.badge ? `<span class="product-card__badge">${product.badge}</span>` : ''}
      </div>
      <div class="product-card__body">
        <h3 class="product-card__title">${escapeHtml(product.name)}</h3>
        <p class="product-card__description">${escapeHtml(product.description || 'Un délicieux gâteau fait maison avec des ingrédients frais.')}</p>
        <div class="product-card__footer">
          <span class="product-card__price">${product.price.toFixed(2)} DA</span>
          <button class="btn btn--primary btn--small order-btn" data-product-id="${product.id}">
            <i class="fas fa-shopping-bag"></i> Commander
          </button>
        </div>
      </div>
    `;
    
    return article;
  }

  // Fonction utilitaire pour éviter les injections XSS
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ============================================================
  // 3. BOUTONS "COMMANDER" (Délégation d'événements)
  // ============================================================
  document.addEventListener('click', function(e) {
    const button = e.target.closest('.order-btn');
    if (!button) return;
    
    e.stopPropagation();
    
    // Récupérer l'ID du produit depuis l'attribut data
    const productId = parseInt(button.dataset.productId);
    
    if (!productId) {
      alert('❌ Erreur: ID du produit non trouvé');
      return;
    }
    
    // Récupérer les infos du produit depuis la carte
    const card = button.closest('.product-card');
    const title = card.querySelector('.product-card__title').textContent;
    const priceText = card.querySelector('.product-card__price').textContent;
    const price = parseFloat(priceText.replace('DA', '').replace(',', '.').trim());
    
    // Demander les infos client
    const customerName = prompt('Votre nom :', 'Client');
    if (!customerName || customerName.trim() === '') return;
    
    const customerEmail = prompt('Votre email :', 'client@exemple.fr');
    if (!customerEmail || customerEmail.trim() === '') return;
    
    const quantityInput = prompt('Quantité :', '1');
    if (quantityInput === null) return;
    const quantity = parseInt(quantityInput) || 1;
    
    // Désactiver le bouton pendant l'envoi
    button.disabled = true;
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi...';
    
    // Envoyer la commande au backend
    fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({
        productId: productId,
        quantity: quantity,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        address: 'À définir'
      })
    })
    .then(async (res) => {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Erreur serveur');
      }
      return data;
    })
    .then((data) => {
      if (data.order) {
        alert(`✅ Commande enregistrée !\n\nProduit : ${data.order.productName}\nQuantité : ${data.order.quantity}\nTotal : ${data.order.total} DA\n\nMerci ${data.order.customerName} !\n\n📧 Un email de confirmation vous a été envoyé.`);
      } else {
        alert('❌ ' + (data.message || 'Erreur inconnue'));
      }
    })
    .catch((err) => {
      alert(`❌ Erreur: ${err.message || 'Connexion au serveur impossible. Vérifiez que le backend est lancé sur http://localhost:5000'}`);
      console.error('Erreur détaillée:', err);
    })
    .finally(() => {
      // Réactiver le bouton
      button.disabled = false;
      button.innerHTML = originalText;
    });
  });

  // ============================================================
  // 4. FORMULAIRE DE CONTACT avec BACKEND
  // ============================================================
  const contactForm = document.getElementById('contactForm');

  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();

      const name = document.getElementById('name');
      const email = document.getElementById('email');
      const message = document.getElementById('message');

      // Validation
      let errors = [];
      if (!name.value.trim()) errors.push('Veuillez entrer votre nom.');
      if (!email.value.trim() || !isValidEmail(email.value)) errors.push('Veuillez entrer un email valide.');
      if (!message.value.trim()) errors.push('Veuillez entrer un message.');

      if (errors.length > 0) {
        alert('❌ ' + errors.join('\n'));
        return;
      }

      const submitBtn = this.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;

      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi...';
      submitBtn.disabled = true;

      // Envoi au backend
      fetch(`${API_URL}/contact`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          name: name.value.trim(),
          email: email.value.trim(),
          message: message.value.trim()
        })
      })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Erreur serveur');
        }
        return data;
      })
      .then((data) => {
        alert('✅ ' + data.message);
        contactForm.reset();
      })
      .catch((err) => {
        alert('❌ Erreur: ' + err.message);
        console.error('Erreur détaillée:', err);
      })
      .finally(() => {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      });
    });
  }

  // ============================================================
  // 5. NAVIGATION ACTIVE (scroll spy) - CORRIGÉ
  // ============================================================
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav__link');

  if (sections.length && navLinks.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const currentId = entry.target.id;
          navLinks.forEach(link => {
            link.classList.remove('active');
            // ✅ CORRECTION : ajout des backticks ` pour le template string
            if (link.getAttribute('href') === `#${currentId}`) {
              link.classList.add('active');
            }
          });
        }
      });
    }, {
      rootMargin: '-72px 0px -50% 0px',
      threshold: 0
    });

    sections.forEach(section => observer.observe(section));
  }

  // ============================================================
  // 6. SMOOTH SCROLL
  // ============================================================
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ============================================================
  // 7. VÉRIFICATION DU BACKEND ET CHARGEMENT DES PRODUITS
  // ============================================================
  
  // Vérifier le backend
  fetch(`${API_URL}/health`)
    .then(async (res) => {
      if (!res.ok) throw new Error('Backend non disponible');
      return res.json();
    })
    .then((data) => {
      console.log('✅ Backend connecté :', data);
    })
    .catch((err) => {
      console.warn('⚠️ Backend non disponible:', err.message);
      console.warn('💡 Vérifiez que le serveur est lancé avec "npm run dev" dans le dossier backend');
    });

  // Charger les produits au démarrage
  document.addEventListener('DOMContentLoaded', function() {
    loadProducts();
  });

  // ============================================================
  // UTILITAIRE
  // ============================================================
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

})();