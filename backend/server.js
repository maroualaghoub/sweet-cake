const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 5000;

// ============================================================
// MIDDLEWARE
// ============================================================
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ============================================================
// DONNÉES EN MÉMOIRE
// ============================================================
let products = [
  {
    id: 1,
    name: 'Chocolate Cake',
    description: 'Un fondant au chocolat noir 70%, ganache onctueuse et éclats de fèves de cacao.',
    price: 500,
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&h=300&fit=crop&crop=center',
    badge: '⭐ Populaire'
  },
  {
    id: 2,
    name: 'Strawberry Cake',
    description: 'Génoise légère, crème diplomate à la fraise et fruits frais de saison.',
    price: 550,
    image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=300&fit=crop&crop=center',
    badge: '🍓 Saison'
  },
  {
    id: 3,
    name: 'Vanilla Cake',
    description: 'Un classique revisité avec de la vanille de Madagascar, crème pâtissière et chantilly.',
    price: 420,
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop&crop=center',
    badge: '🌿 Classique'
  },
  {
    id: 4,
    name: 'Framboisier',
    description: 'Gâteau moelleux à la framboise, crème légère et fruits frais.',
    price: 620,
    image: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=400&h=300&fit=crop&crop=center',
    badge: '🌟 Nouveauté'
  }
];

let orders = [];
let messages = [];
let nextOrderId = 1;
let nextMessageId = 1;

// ============================================================
// ADMIN - Authentification
// ============================================================
const ADMIN_PASSWORD = 'admin123';

// Générer un token simple
function generateToken() {
    return Buffer.from(JSON.stringify({
        admin: true,
        exp: Date.now() + 3600000
    })).toString('base64');
}

// Vérifier le token
function verifyToken(token) {
    try {
        const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
        return decoded.admin === true && decoded.exp > Date.now();
    } catch {
        return false;
    }
}

// Middleware d'authentification admin
function authAdmin(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authentification requise' });
    }
    
    const token = authHeader.split(' ')[1];
    if (!verifyToken(token)) {
        return res.status(401).json({ message: 'Token invalide ou expiré' });
    }
    
    next();
}

// ============================================================
// ROUTES API
// ============================================================

// -------- PRODUITS --------
app.get('/api/products', (req, res) => {
    try {
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

app.get('/api/products/:id', (req, res) => {
    try {
        const product = products.find(p => p.id === parseInt(req.params.id));
        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ message: 'Produit non trouvé' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// -------- COMMANDES --------
app.post('/api/orders', (req, res) => {
    try {
        const { productId, quantity, customerName, customerEmail, address } = req.body;
        
        console.log('📝 Commande reçue:', req.body);
        
        if (!productId || !quantity || !customerName || !customerEmail) {
            return res.status(400).json({ 
                message: 'Tous les champs sont requis : productId, quantity, customerName, customerEmail' 
            });
        }

        const product = products.find(p => p.id === parseInt(productId));
        if (!product) {
            return res.status(404).json({ message: 'Produit non trouvé' });
        }

        const order = {
            id: nextOrderId++,
            productId: parseInt(productId),
            productName: product.name,
            quantity: parseInt(quantity),
            total: parseFloat((product.price * quantity).toFixed(2)),
            customerName,
            customerEmail,
            address: address || 'Non spécifiée',
            status: 'En attente',
            createdAt: new Date().toISOString()
        };

        orders.push(order);
        console.log('✅ Commande enregistrée:', order);
        
        res.status(201).json({ 
            message: '✅ Commande enregistrée avec succès !',
            order 
        });
    } catch (error) {
        console.error('❌ Erreur commande:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

app.get('/api/orders', (req, res) => {
    try {
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// -------- CONTACT --------
app.post('/api/contact', (req, res) => {
    try {
        const { name, email, message } = req.body;
        
        console.log('📝 Message reçu:', req.body);
        
        if (!name || !email || !message) {
            return res.status(400).json({ 
                message: 'Nom, email et message sont requis' 
            });
        }

        const newMessage = {
            id: nextMessageId++,
            name,
            email,
            message,
            createdAt: new Date().toISOString()
        };

        messages.push(newMessage);
        console.log('✅ Message enregistré:', newMessage);
        
        res.status(201).json({ 
            message: '✅ Votre message a bien été envoyé ! Nous vous répondrons dans les 24h.',
            messageData: newMessage
        });
    } catch (error) {
        console.error('❌ Erreur contact:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

app.get('/api/messages', (req, res) => {
    try {
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// ============================================================
// ROUTES ADMIN
// ============================================================

// -------- LOGIN ADMIN --------
app.post('/api/admin/login', (req, res) => {
    try {
        const { password } = req.body;
        
        if (!password) {
            return res.status(400).json({ message: 'Mot de passe requis' });
        }
        
        if (password === ADMIN_PASSWORD) {
            const token = generateToken();
            res.json({
                message: 'Connexion réussie',
                token: token
            });
        } else {
            res.status(401).json({ message: 'Mot de passe incorrect' });
        }
    } catch (error) {
        console.error('❌ Erreur login:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// -------- ADMIN - COMMANDES --------
app.get('/api/admin/orders', authAdmin, (req, res) => {
    try {
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

app.put('/api/admin/orders/:id/status', authAdmin, (req, res) => {
    try {
        const orderId = parseInt(req.params.id);
        const { status } = req.body;
        
        const order = orders.find(o => o.id === orderId);
        if (!order) {
            return res.status(404).json({ message: 'Commande non trouvée' });
        }
        
        const validStatuses = ['En attente', 'Confirmée', 'Livrée', 'Annulée'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Statut invalide' });
        }
        
        order.status = status;
        console.log(`📝 Commande #${orderId} : statut mis à jour -> ${status}`);
        
        res.json({
            message: 'Statut mis à jour avec succès',
            order: order
        });
    } catch (error) {
        console.error('❌ Erreur mise à jour statut:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// -------- ADMIN - MESSAGES --------
app.get('/api/admin/messages', authAdmin, (req, res) => {
    try {
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// -------- STATUT --------
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        products: products.length,
        orders: orders.length,
        messages: messages.length
    });
});

// ============================================================
// GESTION DES ERREURS 404
// ============================================================
app.use((req, res) => {
    res.status(404).json({ message: 'Route non trouvée' });
});

// ============================================================
// DÉMARRAGE
// ============================================================
app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
    console.log(`📦 ${products.length} produits disponibles`);
    console.log(`📋 Routes disponibles :`);
    console.log(`   GET  /api/products`);
    console.log(`   GET  /api/products/:id`);
    console.log(`   POST /api/orders`);
    console.log(`   GET  /api/orders`);
    console.log(`   POST /api/contact`);
    console.log(`   GET  /api/messages`);
    console.log(`   POST /api/admin/login`);
    console.log(`   GET  /api/admin/orders`);
    console.log(`   PUT  /api/admin/orders/:id/status`);
    console.log(`   GET  /api/admin/messages`);
    console.log(`   GET  /api/health`);
});