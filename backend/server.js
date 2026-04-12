require('dotenv').config();
const express = require('express');
const initSqlJs = require('sql.js');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 6001;
const STAFF_PIN = process.env.STAFF_PIN || '1234';
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret';
const DB_PATH = path.join(__dirname, 'database', 'tuckinn.db');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Ensure directories exist
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// ========================
// Database Setup
// ========================
let db;

function saveDB() {
    if (!db) return;
    const data = db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function queryAll(sql, params = []) {
    const stmt = db.prepare(sql);
    if (params.length) stmt.bind(params);
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    return rows;
}

function queryOne(sql, params = []) {
    const rows = queryAll(sql, params);
    return rows[0] || null;
}

function runSql(sql, params = []) {
    db.run(sql, params);
    saveDB();
}

async function initDB() {
    const SQL = await initSqlJs();

    try {
        const fileBuffer = fs.readFileSync(DB_PATH);
        db = new SQL.Database(fileBuffer);
    } catch (err) {
        db = new SQL.Database();
    }

    // Run schema
    const schema = fs.readFileSync(path.join(__dirname, 'database', 'schema.sql'), 'utf8');
    db.exec(schema);

    // Seed default data if empty
    const categoryCount = queryOne('SELECT COUNT(*) as count FROM categories');
    if (!categoryCount || categoryCount.count === 0) {
        seedDefaultMenu();
    }

    console.log('Database initialized.');
}

function seedDefaultMenu() {
    const categories = [
        { slug: 'meal-deals', name: 'Meal Deals', description: 'Fast combinations for lunch rushes and group orders.', sort_order: 1 },
        { slug: 'originals', name: 'Originals', description: 'Signature house builds made for the main event.', sort_order: 2 },
        { slug: 'smoothies', name: 'Smoothies', description: 'Fresh blends with premium fruit-forward flavour.', sort_order: 3 },
        { slug: 'milkshakes', name: 'Milkshakes', description: 'Thick, indulgent shakes finished to order.', sort_order: 4 },
        { slug: 'drinks-coffees', name: 'Drinks & Coffees', description: 'Coffee bar staples, juices, and fridge picks.', sort_order: 5 },
        { slug: 'snacks-sweets', name: 'Snacks & Sweets', description: 'Add-ons for impulse buys and bundle upgrades.', sort_order: 6 }
    ];

    const items = {
        'meal-deals': [
            { name: 'Option 1', desc: '1 x Premium Sandwich, 1 x Canned Drink, 1 x Chocolate, 1 x Crisps', price: 9.95 },
            { name: 'Option 2', desc: '1 x Deluxe Sandwich, 1 x Canned Drink, 2 x Choc/Crisps/Sweets', price: 13.95 },
            { name: 'Option 3', desc: '2 x Premium Sandwiches, 2 x Canned Drinks, 4 x Choc/Crisps/Sweets', price: 19.95 },
            { name: 'Option 4 (Mega)', desc: '4 x Premium Sandwiches, 4 x Canned Drinks, 8 x Choc/Crisps/Sweets, 4 x Bottles Of Beer', price: 39.95 }
        ],
        'originals': [
            { name: 'Traditional Sandwich', desc: 'Classic sandwich setup', price: 4.95 },
            { name: 'Tuckinn Proper Original', desc: 'Our specialty signature builds', price: 9.95 }
        ],
        'smoothies': [
            { name: 'Berry Bliss', desc: 'Antioxidant-rich blend of blueberries, raspberries, strawberries, and banana.', price: 4.95 },
            { name: 'Tropical Escape', desc: 'A refreshing mix of mango, pineapple, coconut water, and lime.', price: 4.95 },
            { name: 'Green Goddess', desc: 'Healthy option combining spinach, kale, green apple, and avocado.', price: 4.95 },
            { name: 'Strawberry Banana', desc: 'Classic, creamy smoothie, universally loved.', price: 4.95 },
            { name: 'Citrus Mango Smoothie', desc: 'Bright blend with orange juice and mango for a refreshing taste.', price: 4.95 }
        ],
        'milkshakes': [
            { name: 'Chocolate Milkshake', desc: 'Thick and creamy chocolate', price: 4.45 },
            { name: 'Vanilla Milkshake', desc: 'Classic creamy vanilla', price: 4.45 },
            { name: 'Strawberry Milkshake', desc: 'Sweet and fruity strawberry', price: 4.45 },
            { name: 'Banana Milkshake', desc: 'Rich banana flavor', price: 4.45 },
            { name: 'Cookies and Cream', desc: 'Crushed cookie blend', price: 4.45 }
        ],
        'drinks-coffees': [
            { name: 'Canned Soft Drink', desc: 'Coke, Coke Zero, Fanta Orange, Fanta Lemon, Sprite, Aquarius', price: 1.60 },
            { name: 'Fruit Juice', desc: 'Orange Juice, Apple Juice, Pineapple Juice', price: 2.50 },
            { name: 'Water', desc: 'Still or Sparkling', price: 1.25 },
            { name: 'Tea', desc: 'Classic brew', price: 1.50 },
            { name: 'English Tea', desc: 'Traditional English breakfast', price: 1.45 },
            { name: 'Herbal Tea', desc: 'Calming infusions', price: 1.75 },
            { name: 'Cafe Con Leche', desc: 'Classic Spanish milk coffee', price: 1.50 },
            { name: 'Cortado', desc: 'Espresso with a dash of milk', price: 1.50 },
            { name: 'Americano', desc: 'Black coffee', price: 1.50 },
            { name: 'Cappuccino', desc: 'Frothy and rich', price: 3.25 },
            { name: 'Bombon', desc: 'Espresso with sweet condensed milk', price: 2.50 },
            { name: 'Belmonte', desc: 'Bombon with a dash of brandy', price: 2.95 },
            { name: 'Brandy Coffee', desc: 'Warming and strong', price: 2.95 },
            { name: 'Hot Chocolate', desc: 'Thick Spanish style', price: 2.50 }
        ],
        'snacks-sweets': [
            { name: 'Crisps', desc: 'Assorted flavours available', price: 1.50 },
            { name: 'Chocolate Bars', desc: 'Popular chocolate selections', price: 1.50 },
            { name: 'Packs of Sweets', desc: 'Gummy and sweet treats', price: 1.50 }
        ]
    };

    for (const cat of categories) {
        runSql('INSERT INTO categories (slug, name, description, sort_order) VALUES (?, ?, ?, ?)', [cat.slug, cat.name, cat.description, cat.sort_order]);
        const catItems = items[cat.slug] || [];
        for (const item of catItems) {
            const itemSlug = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            runSql('INSERT INTO menu_items (category_slug, slug, name, description, price) VALUES (?, ?, ?, ?, ?)', [cat.slug, itemSlug, item.name, item.desc, item.price]);
        }
    }
    console.log('Default menu seeded.');
}

// ========================
// Middleware
// ========================
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });
app.use('/api', apiLimiter);

// Session
app.use(require('express-session')({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax', secure: false }
}));

// ========================
// File Upload (Multer)
// ========================
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_DIR),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const filename = `${uuidv4()}${ext}`;
        cb(null, filename);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) cb(null, true);
        else cb(new Error('Only image files are allowed'));
    }
});

// ========================
// Auth Middleware
// ========================
function requireStaff(req, res, next) {
    if (!req.session || !req.session.staffAuth) {
        return res.status(401).json({ error: 'Staff authentication required.' });
    }
    next();
}

// ========================
// Helpers
// ========================
function slugify(text) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function generateOrderNumber() {
    let num;
    do {
        num = 'TK' + crypto.randomInt(100000, 999999);
    } while (queryOne('SELECT id FROM orders WHERE order_number = ?', [num]));
    return num;
}

// ========================
// Public API Routes
// ========================

// GET /api/menu - backward compatible
app.get('/api/menu', (req, res) => {
    const categories = queryAll('SELECT * FROM categories WHERE is_visible = 1 ORDER BY sort_order');
    const menu = {};
    for (const cat of categories) {
        const items = queryAll('SELECT name, description, price FROM menu_items WHERE category_slug = ? AND is_visible = 1 ORDER BY sort_order', [cat.slug]);
        menu[cat.name] = items.map(item => ({
            name: item.name,
            desc: item.description || '',
            price: item.price
        }));
    }
    res.json(menu);
});

// GET /api/categories
app.get('/api/categories', (req, res) => {
    const cats = queryAll('SELECT * FROM categories ORDER BY sort_order');
    res.json(cats);
});

// GET /api/categories/:slug
app.get('/api/categories/:slug', (req, res) => {
    const cat = queryOne('SELECT * FROM categories WHERE slug = ?', [req.params.slug]);
    if (!cat) return res.status(404).json({ error: 'Category not found' });
    const items = queryAll('SELECT * FROM menu_items WHERE category_slug = ? ORDER BY sort_order', [cat.slug]);
    res.json({ ...cat, items });
});

// GET /api/menu/items
app.get('/api/menu/items', (req, res) => {
    const items = queryAll('SELECT mi.*, c.name as category_name FROM menu_items mi JOIN categories c ON mi.category_slug = c.slug ORDER BY c.sort_order, mi.sort_order');
    res.json(items.map(item => ({
        ...item,
        image_url: item.image_path ? `/uploads/${item.image_path}` : null
    })));
});

// GET /api/menu/items/:id
app.get('/api/menu/items/:id', (req, res) => {
    const item = queryOne('SELECT * FROM menu_items WHERE id = ?', [req.params.id]);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json({ ...item, image_url: item.image_path ? `/uploads/${item.image_path}` : null });
});

// POST /api/orders
app.post('/api/orders', (req, res) => {
    const { customer_name, items, phone, order_type, special_instructions, table_number, num_people } = req.body;

    if (!customer_name || !items || items.length === 0) {
        return res.status(400).json({ error: 'Customer name and items are required.' });
    }

    const total = items.reduce((sum, item) => sum + (parseFloat(item.price) * (item.quantity || 1)), 0);
    const orderNumber = generateOrderNumber();

    try {
        runSql(`INSERT INTO orders (order_number, items_json, total, status, customer_name, phone, order_type, special_instructions, table_number, num_people)
            VALUES (?, ?, ?, 'new', ?, ?, ?, ?, ?, ?)`,
            [orderNumber, JSON.stringify(items), total, customer_name, phone || '', order_type || 'collect', special_instructions || '', table_number || null, num_people || 1]
        );
        const order = queryOne('SELECT * FROM orders WHERE order_number = ?', [orderNumber]);
        res.status(201).json({
            success: true,
            order: {
                id: order.id,
                order_number: orderNumber,
                items,
                total,
                customer_name,
                order_type: order_type || 'collect'
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/qr/:table
app.get('/api/qr/:table', async (req, res) => {
    const tableNum = parseInt(req.params.table);
    if (!tableNum || tableNum < 1 || tableNum > 99) {
        return res.status(400).send('Invalid table number');
    }
    const host = req.get('host');
    const protocol = req.protocol;
    const baseUrl = req.query.base || `${protocol}://${host}`;
    const url = `${baseUrl}/?table=${tableNum}`;

    try {
        const buffer = await QRCode.toBuffer(url, { width: 300, margin: 2 });
        res.type('png').send(buffer);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Staff session check
app.get('/api/staff/session', (req, res) => {
    res.json({ authenticated: !!req.session?.staffAuth });
});

// ========================
// Staff Auth Routes
// ========================

app.post('/api/staff/login', authLimiter, (req, res) => {
    const { pin } = req.body;
    if (pin !== STAFF_PIN) {
        return res.status(401).json({ error: 'Invalid PIN.' });
    }
    req.session.staffAuth = true;
    req.session.loginAt = new Date().toISOString();
    res.json({ success: true });
});

app.post('/api/staff/logout', requireStaff, (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// ========================
// Staff-Protected Category Routes
// ========================

app.post('/api/categories', requireStaff, (req, res) => {
    const { name, description, sort_order } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required.' });

    const slug = slugify(name);
    const existing = queryOne('SELECT id FROM categories WHERE slug = ?', [slug]);
    if (existing) return res.status(400).json({ error: 'Category with this name already exists.' });

    try {
        runSql('INSERT INTO categories (slug, name, description, sort_order) VALUES (?, ?, ?, ?)', [slug, name, description || '', sort_order || 0]);
        const cat = queryOne('SELECT * FROM categories WHERE slug = ?', [slug]);
        res.status(201).json({ success: true, id: cat.id, slug });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/categories/:slug', requireStaff, (req, res) => {
    const { name, description, sort_order, is_visible } = req.body;
    const oldCat = queryOne('SELECT * FROM categories WHERE slug = ?', [req.params.slug]);
    if (!oldCat) return res.status(404).json({ error: 'Category not found.' });

    const newSlug = name ? slugify(name) : oldCat.slug;
    if (newSlug !== oldCat.slug) {
        const existing = queryOne('SELECT id FROM categories WHERE slug = ? AND slug != ?', [newSlug, oldCat.slug]);
        if (existing) return res.status(400).json({ error: 'Category with this name already exists.' });
    }

    try {
        runSql(`UPDATE categories SET slug = ?, name = ?, description = ?, sort_order = ?, is_visible = ?, updated_at = CURRENT_TIMESTAMP WHERE slug = ?`,
            [newSlug, name || oldCat.name, description ?? oldCat.description, sort_order ?? oldCat.sort_order, is_visible ?? oldCat.is_visible, oldCat.slug]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/categories/:slug', requireStaff, (req, res) => {
    const cat = queryOne('SELECT * FROM categories WHERE slug = ?', [req.params.slug]);
    if (!cat) return res.status(404).json({ error: 'Category not found.' });

    try {
        runSql('DELETE FROM categories WHERE slug = ?', [req.params.slug]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========================
// Staff-Protected Menu Item Routes
// ========================

app.post('/api/menu/items', requireStaff, (req, res) => {
    const { category_slug, name, description, price, image_path, sort_order, is_visible } = req.body;
    if (!category_slug || !name || price === undefined) {
        return res.status(400).json({ error: 'category_slug, name, and price are required.' });
    }

    const cat = queryOne('SELECT id FROM categories WHERE slug = ?', [category_slug]);
    if (!cat) return res.status(400).json({ error: 'Category not found.' });

    const slug = slugify(name);
    const existing = queryOne('SELECT id FROM menu_items WHERE category_slug = ? AND slug = ?', [category_slug, slug]);
    if (existing) return res.status(400).json({ error: 'Item already exists in this category.' });

    try {
        runSql('INSERT INTO menu_items (category_slug, slug, name, description, price, image_path, sort_order, is_visible) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [category_slug, slug, name, description || '', price, image_path || null, sort_order || 0, is_visible ?? 1]
        );
        const item = queryOne('SELECT * FROM menu_items WHERE category_slug = ? AND slug = ?', [category_slug, slug]);
        res.status(201).json({ success: true, id: item.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/menu/items/:id', requireStaff, (req, res) => {
    const { name, description, price, image_path, sort_order, is_visible, category_slug } = req.body;
    const item = queryOne('SELECT * FROM menu_items WHERE id = ?', [req.params.id]);
    if (!item) return res.status(404).json({ error: 'Item not found.' });

    let newSlug = item.slug;
    if (name && name !== item.name) {
        newSlug = slugify(name);
        const existing = queryOne('SELECT id FROM menu_items WHERE category_slug = ? AND slug = ? AND id != ?', [item.category_slug, newSlug, item.id]);
        if (existing) return res.status(400).json({ error: 'Item with this name already exists in category.' });
    }

    const targetCat = category_slug || item.category_slug;
    if (category_slug && category_slug !== item.category_slug) {
        const cat = queryOne('SELECT id FROM categories WHERE slug = ?', [category_slug]);
        if (!cat) return res.status(400).json({ error: 'Target category not found.' });
    }

    try {
        runSql(`UPDATE menu_items SET category_slug = ?, slug = ?, name = ?, description = ?, price = ?, image_path = ?, sort_order = ?, is_visible = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [targetCat, newSlug, name || item.name, description ?? item.description, price ?? item.price, image_path !== undefined ? image_path : item.image_path, sort_order ?? item.sort_order, is_visible ?? item.is_visible, item.id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/menu/items/:id', requireStaff, (req, res) => {
    const item = queryOne('SELECT * FROM menu_items WHERE id = ?', [req.params.id]);
    if (!item) return res.status(404).json({ error: 'Item not found.' });

    try {
        runSql('DELETE FROM menu_items WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========================
// Staff-Protected Order Routes
// ========================

app.get('/api/orders', requireStaff, (req, res) => {
    const { status } = req.query;
    let sql = 'SELECT * FROM orders';
    const params = [];
    if (status === 'active') {
        sql += " WHERE status != 'served'";
    } else if (status) {
        sql += ' WHERE status = ?';
        params.push(status);
    }
    sql += ' ORDER BY created_at DESC';

    const orders = queryAll(sql, params).map(order => ({
        ...order,
        items: JSON.parse(order.items_json || '[]')
    }));
    res.json(orders);
});

app.patch('/api/orders/:id/status', requireStaff, (req, res) => {
    const { status } = req.body;
    const valid = ['new', 'preparing', 'ready', 'served'];
    if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status.' });

    const order = queryOne('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    try {
        runSql('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
        res.json({ success: true, status });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========================
// Image Upload
// ========================

app.post('/api/upload', requireStaff, upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

    try {
        runSql('INSERT INTO images (filename, original_name, mime_type, size_bytes) VALUES (?, ?, ?, ?)',
            [req.file.filename, req.file.originalname, req.file.mimetype, req.file.size]
        );
        res.json({
            success: true,
            filename: req.file.filename,
            url: `/uploads/${req.file.filename}`,
            original_name: req.file.originalname
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/images', requireStaff, (req, res) => {
    const images = queryAll('SELECT * FROM images ORDER BY uploaded_at DESC');
    res.json(images.map(img => ({ ...img, url: `/uploads/${img.filename}` })));
});

// ========================
// Static Files
// ========================

app.use('/uploads', express.static(UPLOADS_DIR));
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// Serve frontend from parent directory
const FRONTEND_DIR = path.join(__dirname, '..');
app.use(express.static(FRONTEND_DIR));
app.get('/', (req, res) => {
    res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

// ========================
// Error Handler
// ========================

app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'File too large. Max 5MB.' });
        return res.status(400).json({ error: err.message });
    }
    if (err) return res.status(400).json({ error: err.message });
    next();
});

// ========================
// Start Server
// ========================

initDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Tuckinn backend running on http://localhost:${PORT}`);
        console.log(`Admin panel: http://localhost:${PORT}/admin/`);
        console.log(`Customer frontend: http://localhost:${PORT}/`);
    });
}).catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
