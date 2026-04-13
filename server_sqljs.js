require('dotenv').config();

const express = require('express');
const initSqlJs = require('sql.js');
const cors = require('cors');
const path = require('path');
const http = require('http');
const fs = require('fs');
const crypto = require('crypto');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const { Server } = require('socket.io');
const QRCode = require('qrcode');

const app = express();
const server = http.createServer(app);

const isProduction = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT || 3005);
const DB_PATH = path.join(__dirname, 'database.sqlite');
const STATIC_ROOT = path.join(__dirname, 'public');
const SESSION_COOKIE_NAME = 'tuckinn_staff';
const SESSION_SECRET = process.env.SESSION_SECRET || 'development-session-secret-change-me';
const STAFF_PIN = String(process.env.STAFF_PIN || '1234');
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

if (SESSION_SECRET === 'development-session-secret-change-me') {
    console.warn('SESSION_SECRET is using the development fallback. Set a real secret before deploying.');
}

if (STAFF_PIN === '1234') {
    console.warn('STAFF_PIN is using the default fallback. Set STAFF_PIN before deploying.');
}

app.disable('x-powered-by');

const io = new Server(server, {
    cors: ALLOWED_ORIGINS.length
        ? { origin: ALLOWED_ORIGINS, methods: ['GET', 'POST', 'PATCH', 'DELETE'], credentials: true }
        : undefined
});

const corsMiddleware = cors({
    origin(origin, callback) {
        if (!origin || ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Origin not allowed'));
    },
    credentials: true
});

const sessionMiddleware = session({
    name: SESSION_COOKIE_NAME,
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: isProduction,
        maxAge: 12 * 60 * 60 * 1000
    }
});

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false
});

const orderLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false
});

app.use(corsMiddleware);
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(sessionMiddleware);
app.use('/api', apiLimiter);

io.engine.use(sessionMiddleware);
io.use((socket, next) => {
    next();
});

function requireStaffSocket(socket) {
    return socket.request.session && socket.request.session.staffAuthenticated;
}

let db;

function buildDefaultMenu() {
    return {
        'Meal Deals': [
            { name: 'Option 1', desc: '1 x Premium Sandwich, 1 x Canned Drink, 1 x Chocolate, 1 x Crisps', price: 9.95 },
            { name: 'Option 2', desc: '1 x Deluxe Sandwich, 1 x Canned Drink, 2 x Choc/Crisps/Sweets', price: 13.95 },
            { name: 'Option 3', desc: '2 x Premium Sandwiches, 2 x Canned Drinks, 4 x Choc/Crisps/Sweets', price: 19.95 },
            { name: 'Option 4 (Mega)', desc: '4 x Premium Sandwiches, 4 x Canned Drinks, 8 x Choc/Crisps/Sweets, 4 x Bottles Of Beer', price: 39.95 }
        ],
        Originals: [
            { name: 'Traditional Sandwich', desc: 'Classic sandwich setup', price: 4.95 },
            { name: 'Tuckinn Proper Original', desc: 'Our specialty signature builds', price: 9.95 }
        ],
        Smoothies: [
            { name: 'Berry Bliss', desc: 'Antioxidant-rich blend of blueberries, raspberries, strawberries, and banana.', price: 4.95 },
            { name: 'Tropical Escape', desc: 'A refreshing mix of mango, pineapple, coconut water, and lime.', price: 4.95 },
            { name: 'Green Goddess', desc: 'Healthy option combining spinach, kale, green apple, and avocado.', price: 4.95 },
            { name: 'Strawberry Banana', desc: 'Classic, creamy smoothie, universally loved.', price: 4.95 },
            { name: 'Citrus Mango Smoothie', desc: 'Bright blend with orange juice and mango for a refreshing taste.', price: 4.95 }
        ],
        Milkshakes: [
            { name: 'Chocolate Milkshake', desc: 'Thick and creamy chocolate', price: 4.45 },
            { name: 'Vanilla Milkshake', desc: 'Classic creamy vanilla', price: 4.45 },
            { name: 'Strawberry Milkshake', desc: 'Sweet and fruity strawberry', price: 4.45 },
            { name: 'Banana Milkshake', desc: 'Rich banana flavor', price: 4.45 },
            { name: 'Cookies and Cream', desc: 'Crushed cookie blend', price: 4.45 }
        ],
        'Drinks & Coffees': [
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
        'Snacks & Sweets': [
            { name: 'Crisps', desc: 'Assorted flavours available', price: 1.50 },
            { name: 'Chocolate Bars', desc: 'Popular chocolate selections', price: 1.50 },
            { name: 'Packs of Sweets', desc: 'Gummy and sweet treats', price: 1.50 }
        ]
    };
}

function saveDB() {
    if (!db) {
        return;
    }

    const data = db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function queryRows(sql, params = []) {
    const stmt = db.prepare(sql);
    if (params.length) {
        stmt.bind(params);
    }

    const rows = [];
    while (stmt.step()) {
        rows.push(stmt.getAsObject());
    }

    stmt.free();
    return rows;
}

function queryOne(sql, params = []) {
    return queryRows(sql, params)[0] || null;
}

function runSql(sql, params = []) {
    db.run(sql, params);
    saveDB();
}

function repairText(value) {
    if (typeof value !== 'string') {
        return value;
    }

    if (/[Ãâðï]/.test(value)) {
        try {
            return Buffer.from(value, 'latin1').toString('utf8');
        } catch (error) {
            return value;
        }
    }

    return value;
}

function sanitizeText(value, { max = 255, allowEmpty = true } = {}) {
    const normalized = repairText(String(value == null ? '' : value))
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, max);

    if (!allowEmpty && !normalized) {
        return '';
    }

    return normalized;
}

function sanitizeEmail(value) {
    return sanitizeText(value, { max: 255, allowEmpty: false }).toLowerCase();
}

function sanitizePhone(value) {
    return sanitizeText(value, { max: 40 }).replace(/[^0-9+()\-\s]/g, '');
}

function parseMoney(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
        return null;
    }
    return Math.round(parsed * 100) / 100;
}

function parseInteger(value, { min = 1, max = Number.MAX_SAFE_INTEGER, allowNull = false } = {}) {
    if (value == null || value === '') {
        return allowNull ? null : NaN;
    }

    const parsed = Number.parseInt(value, 10);
    if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
        return NaN;
    }

    return parsed;
}

function normalizeSelections(selections) {
    if (!selections || typeof selections !== 'object' || Array.isArray(selections)) {
        return undefined;
    }

    const normalized = {};
    for (const [rawKey, rawValue] of Object.entries(selections)) {
        const key = sanitizeText(rawKey, { max: 60, allowEmpty: false });
        if (!key) {
            continue;
        }

        if (Array.isArray(rawValue)) {
            const values = rawValue
                .map(value => sanitizeText(value, { max: 60, allowEmpty: false }))
                .filter(Boolean)
                .slice(0, 10);

            if (values.length) {
                normalized[key] = values;
            }
            continue;
        }

        const value = sanitizeText(rawValue, { max: 60, allowEmpty: false });
        if (value) {
            normalized[key] = value;
        }
    }

    return Object.keys(normalized).length ? normalized : undefined;
}

function normalizeOrderItems(items) {
    if (!Array.isArray(items) || items.length === 0) {
        return null;
    }

    const normalized = [];
    for (const item of items.slice(0, 25)) {
        const name = sanitizeText(item && item.name, { max: 120, allowEmpty: false });
        const price = parseMoney(item && item.price);
        const quantity = parseInteger(item && item.quantity, { min: 1, max: 20, allowNull: true });
        const desc = sanitizeText(item && item.desc, { max: 280 });
        const tier = sanitizeText(item && item.tier, { max: 40 });
        const type = sanitizeText(item && item.type, { max: 40 });
        const selections = normalizeSelections(item && item.selections);

        if (!name || price == null) {
            return null;
        }

        normalized.push({
            name,
            price,
            quantity: Number.isNaN(quantity) ? 1 : quantity || 1,
            desc,
            tier,
            type,
            selections
        });
    }

    return normalized.length ? normalized : null;
}

function normalizeMenuPayload(data) {
    if (!Array.isArray(data)) {
        return null;
    }

    const normalized = data
        .map(item => {
            const name = sanitizeText(item && item.name, { max: 120, allowEmpty: false });
            const desc = sanitizeText(item && item.desc, { max: 280 });
            const price = parseMoney(item && item.price);

            if (!name || price == null) {
                return null;
            }

            return { name, desc, price };
        })
        .filter(Boolean);

    return normalized.length ? normalized : null;
}

function normalizeMenuRow(row) {
    return {
        name: sanitizeText(row.name, { max: 120, allowEmpty: false }),
        desc: sanitizeText(row.desc, { max: 280 }),
        price: parseMoney(row.price)
    };
}

function buildMenuResponse() {
    const rows = queryRows('SELECT category, data FROM menu_config ORDER BY category ASC');
    const menu = {};

    for (const row of rows) {
        try {
            const items = JSON.parse(row.data);
            const normalized = Array.isArray(items) ? items.map(normalizeMenuRow).filter(item => item.name && item.price != null) : [];
            if (normalized.length) {
                menu[sanitizeText(row.category, { max: 80, allowEmpty: false })] = normalized;
            }
        } catch (error) {
            console.error('Failed to parse menu row:', error.message);
        }
    }

    return menu;
}

function parseOrderRow(row) {
    let parsedItems;
    try {
        parsedItems = JSON.parse(row.items || '[]');
    } catch (error) {
        console.error('Failed to parse order items:', error.message);
        parsedItems = [];
    }

    return {
        id: Number(row.id),
        order_number: sanitizeText(row.order_number, { max: 40 }),
        items: parsedItems.map(item => ({
            ...item,
            name: sanitizeText(item.name, { max: 120 }),
            desc: sanitizeText(item.desc, { max: 280 }),
            tier: sanitizeText(item.tier, { max: 40 }),
            type: sanitizeText(item.type, { max: 40 }),
            selections: normalizeSelections(item.selections) || undefined,
            price: parseMoney(item.price) || 0,
            quantity: parseInteger(item.quantity, { min: 1, max: 20, allowNull: true }) || 1
        })),
        total: parseMoney(row.total) || 0,
        status: sanitizeText(row.status, { max: 20 }),
        customer_name: sanitizeText(row.customer_name, { max: 80 }),
        phone: sanitizePhone(row.phone),
        order_type: sanitizeText(row.order_type, { max: 20 }),
        special_instructions: sanitizeText(row.special_instructions, { max: 280 }),
        table_number: parseInteger(row.table_number, { min: 1, max: 99, allowNull: true }),
        num_people: parseInteger(row.num_people, { min: 1, max: 20, allowNull: true }) || 1,
        date: row.date
    };
}

function calculateOrderTotal(items) {
    return Math.round(
        items.reduce((sum, item) => sum + (parseMoney(item.price) || 0) * (item.quantity || 1), 0) * 100
    ) / 100;
}

function generateOrderNumber() {
    let candidate = '';
    let attempts = 0;
    const MAX_ATTEMPTS = 10;

    do {
        const suffix = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
        candidate = `TK${suffix}`;
        attempts++;
        if (attempts >= MAX_ATTEMPTS) {
            throw new Error('Failed to generate a unique order number after ' + MAX_ATTEMPTS + ' attempts.');
        }
    } while (queryOne('SELECT id FROM orders WHERE order_number = ?', [candidate]));

    return candidate;
}

function getLocalDateTimeString() {
    const now = new Date();
    const pad = value => String(value).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

function validateOrderPayload(body) {
    const customerName = sanitizeText(body.customer_name, { max: 80, allowEmpty: false });
    const phone = sanitizePhone(body.phone);
    const orderType = body.order_type === 'instore' ? 'instore' : 'collect';
    const tableNumber = parseInteger(body.table_number, { min: 1, max: 99, allowNull: true });
    const numPeople = parseInteger(body.num_people, { min: 1, max: 20, allowNull: true });
    const specialInstructions = sanitizeText(body.special_instructions, { max: 280 });
    const items = normalizeOrderItems(body.items);

    const errors = [];
    if (!customerName || customerName.length < 2) {
        errors.push('Customer name is required.');
    }
    if (!items) {
        errors.push('Order must contain at least one valid item.');
    }
    if (orderType === 'collect' && phone.length < 7) {
        errors.push('A valid phone number is required for collection orders.');
    }
    if (body.table_number != null && Number.isNaN(tableNumber)) {
        errors.push('Table number must be between 1 and 99.');
    }
    if (body.num_people != null && Number.isNaN(numPeople)) {
        errors.push('Number of people must be between 1 and 20.');
    }

    if (errors.length) {
        return { errors };
    }

    const total = calculateOrderTotal(items);
    return {
        value: {
            customerName,
            phone: orderType === 'collect' ? phone : '',
            orderType,
            specialInstructions,
            tableNumber: Number.isNaN(tableNumber) ? null : tableNumber,
            numPeople: Number.isNaN(numPeople) ? 1 : (numPeople || 1),
            items,
            total
        }
    };
}

function requireStaff(req, res, next) {
    if (!req.session || !req.session.staffAuthenticated) {
        return res.status(401).json({ error: 'Staff authentication required.' });
    }

    return next();
}

async function initDB() {
    const SQL = await initSqlJs();

    try {
        const fileBuffer = fs.readFileSync(DB_PATH);
        db = new SQL.Database(fileBuffer);
    } catch (error) {
        db = new SQL.Database();
    }

    db.run(`CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_number TEXT,
        items TEXT NOT NULL,
        total REAL NOT NULL,
        status TEXT DEFAULT 'new',
        customer_name TEXT,
        phone TEXT,
        order_type TEXT,
        special_instructions TEXT,
        table_number INTEGER,
        num_people INTEGER DEFAULT 1,
        date DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS menu_config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT NOT NULL,
        data TEXT NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS promo_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE,
        discount INTEGER,
        active INTEGER DEFAULT 1,
        expires_at DATETIME,
        max_uses INTEGER,
        used_count INTEGER DEFAULT 0
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        password TEXT,
        password_hash TEXT,
        name TEXT,
        phone TEXT,
        address TEXT,
        proper_points INTEGER DEFAULT 0
    )`);

    db.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_menu_config_category ON menu_config(category)');
    db.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number)');

    try { db.run('ALTER TABLE customers ADD COLUMN password_hash TEXT'); } catch (error) {}
    try { db.run('ALTER TABLE orders ADD COLUMN table_number INTEGER'); } catch (error) {}
    try { db.run('ALTER TABLE orders ADD COLUMN num_people INTEGER DEFAULT 1'); } catch (error) {}
    try { db.run('ALTER TABLE promo_codes ADD COLUMN active INTEGER DEFAULT 1'); } catch (error) {}
    try { db.run('ALTER TABLE promo_codes ADD COLUMN expires_at DATETIME'); } catch (error) {}
    try { db.run('ALTER TABLE promo_codes ADD COLUMN max_uses INTEGER'); } catch (error) {}
    try { db.run('ALTER TABLE promo_codes ADD COLUMN used_count INTEGER DEFAULT 0'); } catch (error) {}

    const menuCount = queryOne('SELECT COUNT(*) AS count FROM menu_config');
    if (!menuCount || Number(menuCount.count) === 0) {
        const defaultMenu = buildDefaultMenu();
        for (const [category, data] of Object.entries(defaultMenu)) {
            db.run('INSERT INTO menu_config (category, data) VALUES (?, ?)', [category, JSON.stringify(data)]);
        }
    }

    saveDB();
}

app.post('/api/staff/login', authLimiter, (req, res) => {
    const pin = sanitizeText(req.body.pin, { max: 16, allowEmpty: false });

    if (pin !== STAFF_PIN) {
        return res.status(401).json({ error: 'Invalid PIN.' });
    }

    req.session.staffAuthenticated = true;
    req.session.staffLoginAt = new Date().toISOString();

    return req.session.save(error => {
        if (error) {
            return res.status(500).json({ error: 'Failed to start staff session.' });
        }

        return res.json({ success: true });
    });
});

app.get('/api/staff/session', (req, res) => {
    res.json({
        authenticated: Boolean(req.session && req.session.staffAuthenticated)
    });
});

app.post('/api/staff/logout', requireStaff, (req, res) => {
    req.session.destroy(error => {
        if (error) {
            return res.status(500).json({ error: 'Failed to end staff session.' });
        }

        res.clearCookie(SESSION_COOKIE_NAME);
        return res.json({ success: true });
    });
});

app.post('/api/register', authLimiter, (req, res) => {
    const email = sanitizeEmail(req.body.email);
    const password = String(req.body.password || '');
    const name = sanitizeText(req.body.name, { max: 80, allowEmpty: false });
    const phone = sanitizePhone(req.body.phone);
    const address = sanitizeText(req.body.address, { max: 180 });

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'A valid email address is required.' });
    }

    if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    if (!name) {
        return res.status(400).json({ error: 'Name is required.' });
    }

    if (queryOne('SELECT id FROM customers WHERE email = ?', [email])) {
        return res.status(400).json({ error: 'Email already registered.' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    runSql(
        'INSERT INTO customers (email, password_hash, name, phone, address) VALUES (?, ?, ?, ?, ?)',
        [email, passwordHash, name, phone, address]
    );

    const user = queryOne(
        'SELECT id, name, email, phone, address, proper_points FROM customers WHERE email = ?',
        [email]
    );

    return res.status(201).json({ success: true, user });
});

app.post('/api/login', authLimiter, (req, res) => {
    const email = sanitizeEmail(req.body.email);
    const password = String(req.body.password || '');
    const user = queryOne('SELECT * FROM customers WHERE email = ?', [email]);

    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials.' });
    }

    let validPassword = false;

    if (user.password_hash) {
        validPassword = bcrypt.compareSync(password, user.password_hash);
    } else if (user.password) {
        validPassword = user.password === password;
        if (validPassword) {
            const upgradedHash = bcrypt.hashSync(password, 10);
            runSql('UPDATE customers SET password_hash = ?, password = NULL WHERE id = ?', [upgradedHash, user.id]);
        }
    }

    if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials.' });
    }

    return res.json({
        success: true,
        user: {
            id: Number(user.id),
            name: sanitizeText(user.name, { max: 80 }),
            email: sanitizeEmail(user.email),
            phone: sanitizePhone(user.phone),
            address: sanitizeText(user.address, { max: 180 }),
            proper_points: Number(user.proper_points || 0)
        }
    });
});

app.get('/api/promos', requireStaff, (req, res) => {
    res.json(queryRows('SELECT id, code, discount FROM promo_codes ORDER BY code ASC'));
});

app.post('/api/promos', requireStaff, (req, res) => {
    const code = sanitizeText(req.body.code, { max: 40, allowEmpty: false }).toUpperCase();
    const discount = parseInteger(req.body.discount, { min: 1, max: 100, allowNull: false });

    if (!code || Number.isNaN(discount)) {
        return res.status(400).json({ error: 'Promo code and discount are required.' });
    }

    runSql(
        'INSERT INTO promo_codes (code, discount) VALUES (?, ?) ON CONFLICT(code) DO UPDATE SET discount = excluded.discount',
        [code, discount]
    );

    return res.json({ success: true });
});

app.delete('/api/promos/:code', requireStaff, (req, res) => {
    const code = sanitizeText(req.params.code, { max: 40, allowEmpty: false }).toUpperCase();
    runSql('DELETE FROM promo_codes WHERE code = ?', [code]);
    return res.json({ success: true });
});

app.get('/api/menu', (req, res) => {
    res.json(buildMenuResponse());
});

app.post('/api/menu', requireStaff, (req, res) => {
    const category = sanitizeText(req.body.category, { max: 80, allowEmpty: false });
    const data = normalizeMenuPayload(req.body.data);

    if (!category || !data) {
        return res.status(400).json({ error: 'Category and menu items are required.' });
    }

    runSql(
        'INSERT INTO menu_config (category, data) VALUES (?, ?) ON CONFLICT(category) DO UPDATE SET data = excluded.data',
        [category, JSON.stringify(data)]
    );

    return res.json({ success: true });
});

app.post('/api/seed-menu', requireStaff, (req, res) => {
    const menu = buildDefaultMenu();

    for (const [category, data] of Object.entries(menu)) {
        runSql(
            'INSERT INTO menu_config (category, data) VALUES (?, ?) ON CONFLICT(category) DO UPDATE SET data = excluded.data',
            [category, JSON.stringify(data)]
        );
    }

    return res.json({ success: true, message: 'Menu seeded.' });
});

app.post('/api/orders', orderLimiter, (req, res) => {
    const validation = validateOrderPayload(req.body);
    if (validation.errors) {
        return res.status(400).json({ error: validation.errors.join(' ') });
    }

    const orderNumber = generateOrderNumber();
    const localDate = getLocalDateTimeString();
    const { customerName, phone, orderType, specialInstructions, tableNumber, numPeople, items, total } = validation.value;

    let finalTotal = total;
    let appliedPromo = null;

    const promoCode = sanitizeText(req.body.promoCode, { max: 40, allowEmpty: false });
    if (promoCode) {
        const promo = queryOne('SELECT * FROM promo_codes WHERE code = ? AND active = 1', [promoCode.toUpperCase()]);

        if (!promo) {
            return res.status(400).json({ error: 'Invalid or inactive promo code.' });
        }

        if (promo.expires_at) {
            const expiresAt = new Date(promo.expires_at + 'Z');
            if (expiresAt < new Date()) {
                return res.status(400).json({ error: 'Promo code has expired.' });
            }
        }

        if (promo.max_uses != null && Number(promo.used_count) >= Number(promo.max_uses)) {
            return res.status(400).json({ error: 'Promo code has reached its usage limit.' });
        }

        const discount = Math.min(Number(promo.discount), 100);
        finalTotal = Math.round(finalTotal * (1 - discount / 100) * 100) / 100;

        if (finalTotal < 0) {
            finalTotal = 0;
        }

        appliedPromo = { code: promo.code, discount };
        runSql('UPDATE promo_codes SET used_count = used_count + 1 WHERE id = ?', [promo.id]);
    }

    runSql(
        `INSERT INTO orders (
            order_number, items, total, status, customer_name, phone, order_type, special_instructions, table_number, num_people, date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            orderNumber,
            JSON.stringify(items),
            finalTotal,
            'new',
            customerName,
            phone,
            orderType,
            specialInstructions,
            tableNumber,
            numPeople,
            localDate
        ]
    );

    const orderRow = queryOne('SELECT * FROM orders WHERE order_number = ?', [orderNumber]);
    const order = parseOrderRow(orderRow);

    io.to('staff_room').emit('new_order', order);
    return res.status(201).json({ success: true, order, promo: appliedPromo });
});

app.get('/api/orders', requireStaff, (req, res) => {
    const status = sanitizeText(req.query.status, { max: 20 });
    let sql = 'SELECT * FROM orders';
    const params = [];

    if (status === 'active') {
        sql += " WHERE status != 'served'";
    } else if (status) {
        if (!['new', 'preparing', 'ready', 'served'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status filter.' });
        }
        sql += ' WHERE status = ?';
        params.push(status);
    }

    sql += ' ORDER BY date DESC, id DESC';
    const orders = queryRows(sql, params).map(parseOrderRow);
    return res.json(orders);
});

app.patch('/api/orders/:id/status', requireStaff, (req, res) => {
    const status = sanitizeText(req.body.status, { max: 20, allowEmpty: false });
    const orderId = parseInteger(req.params.id, { min: 1, max: Number.MAX_SAFE_INTEGER, allowNull: false });

    if (!['new', 'preparing', 'ready', 'served'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status.' });
    }

    if (Number.isNaN(orderId)) {
        return res.status(400).json({ error: 'Invalid order id.' });
    }

    runSql('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);
    const orderRow = queryOne('SELECT * FROM orders WHERE id = ?', [orderId]);

    if (!orderRow) {
        return res.status(404).json({ error: 'Order not found.' });
    }

    const order = parseOrderRow(orderRow);
    io.to('staff_room').emit('order_status_update', { orderId, status, order });
    return res.json({ success: true, order });
});

app.get('/api/qr/:table', requireStaff, async (req, res) => {
    const table = parseInteger(req.params.table, { min: 1, max: 99, allowNull: false });
    if (Number.isNaN(table)) {
        return res.status(400).send('Invalid table number');
    }

    const host = req.get('host');
    const protocol = req.protocol;
    const baseUrl = sanitizeText(req.query.base, { max: 200 }) || `${protocol}://${host}`;
    const url = `${baseUrl}/?table=${table}`;

    try {
        const buffer = await QRCode.toBuffer(url, { width: 300, margin: 2 });
        return res.type('png').send(buffer);
    } catch (error) {
        return res.status(500).send(error.message);
    }
});

// Block access to sensitive files
app.use((req, res, next) => {
    const sensitive = ['.env', '.git', 'database.sqlite', 'server_sqljs.js', 'package.json', 'package-lock.json'];
    if (sensitive.some(f => req.path.includes(f))) {
        return res.status(404).send('Not found');
    }
    next();
});

app.use(express.static(STATIC_ROOT));

io.on('connection', socket => {
    if (requireStaffSocket(socket)) {
        socket.join('staff_room');
    }

    socket.on('send_message', data => {
        if (!requireStaffSocket(socket)) {
            return;
        }
        io.to('staff_room').emit('receive_message', {
            sender: sanitizeText(data && data.sender, { max: 60 }) || 'Staff',
            text: sanitizeText(data && data.text, { max: 280 }) || '',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
    });
});

app.use((error, req, res, next) => {
    if (error && error.message === 'Origin not allowed') {
        return res.status(403).json({ error: 'Origin not allowed.' });
    }

    if (error) {
        console.error(error);
        return res.status(500).json({ error: 'Unexpected server error.' });
    }

    return next();
});

initDB()
    .then(() => {
        server.listen(PORT, () => {
            console.log(`Tuckinn server running on port ${PORT}`);
        });
    })
    .catch(error => {
        console.error('Failed to initialize database:', error);
        process.exit(1);
    });
