const express = require('express');
const initSqlJs = require('sql.js');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const http = require('http');
const fs = require('fs');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

const PORT = process.env.PORT || 3005;
const DB_PATH = path.join(__dirname, 'database.sqlite');
const STAFF_PIN = '1234';

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '.')));

let db;

async function initDB() {
    const SQL = await initSqlJs();

    try {
        const fileBuffer = fs.readFileSync(DB_PATH);
        db = new SQL.Database(fileBuffer);
    } catch (e) {
        db = new SQL.Database();
    }

    db.run(`CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_number TEXT,
        items TEXT,
        total REAL,
        status TEXT DEFAULT 'new',
        customer_name TEXT,
        phone TEXT,
        order_type TEXT,
        special_instructions TEXT,
        date DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Migration: add missing columns if they don't exist
    try { db.run(`ALTER TABLE orders ADD COLUMN phone TEXT`); } catch (e) {}
    try { db.run(`ALTER TABLE orders ADD COLUMN order_type TEXT`); } catch (e) {}
    try { db.run(`ALTER TABLE orders ADD COLUMN status TEXT DEFAULT 'new'`); } catch (e) {}
    try { db.run(`ALTER TABLE orders ADD COLUMN special_instructions TEXT`); } catch (e) {}

    db.run(`CREATE TABLE IF NOT EXISTS menu_config (
        id INTEGER PRIMARY KEY,
        category TEXT,
        data TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS promo_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE,
        discount INTEGER
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        password TEXT,
        name TEXT,
        phone TEXT,
        address TEXT,
        proper_points INTEGER DEFAULT 0
    )`);

    // Auto-seed menu if empty
    const menuResult = db.exec(`SELECT COUNT(*) as cnt FROM menu_config`);
    const count = menuResult.length > 0 ? menuResult[0].values[0][0] : 0;
    if (count === 0) {
        const defaultMenu = {
            'Meal Deals': [
                { name: 'Option 1', desc: '1 x Premium Sandwich, 1 x Canned Drink, 1 x Chocolate, 1 x Crisps', price: 9.95 },
                { name: 'Option 2', desc: '1 x Deluxe Sandwich, 1 x Canned Drink, 2 x Choc/Crisps/Sweets', price: 13.95 },
                { name: 'Option 3', desc: '2 x Premium Sandwiches, 2 x Canned Drinks, 4 x Choc/Crisps/Sweets', price: 19.95 },
                { name: 'Option 4 (MEGA)', desc: '4 x Premium Sandwiches, 4 x Canned Drinks, 8 x Choc/Crisps/Sweets, 4 x Bottles Of Beer', price: 39.95 }
            ],
            'Originals': [
                { name: 'Traditional Sandwich', desc: 'Classic sandwich setup', price: 4.95 },
                { name: 'Tuckinn Proper Original', desc: 'Our specialty signature builds', price: 9.95 }
            ],
            'Smoothies': [
                { name: 'Berry Bliss', desc: 'Antioxidant-rich blend of blueberries, raspberries, strawberries, and banana.', price: 4.95 },
                { name: 'Tropical Escape', desc: 'A refreshing mix of mango, pineapple, coconut water, and lime.', price: 4.95 },
                { name: 'Green Goddess', desc: 'Healthy option combining spinach, kale, green apple, and avocado.', price: 4.95 },
                { name: 'Strawberry Banana', desc: 'Classic, creamy smoothie, universally loved.', price: 4.95 },
                { name: 'Citrus Mango Smoothie', desc: 'Bright blend with orange juice and mango for a refreshing taste.', price: 4.95 }
            ],
            'Milkshakes': [
                { name: 'Chocolate Milkshake', desc: 'Thick & creamy chocolate', price: 4.45 },
                { name: 'Vanilla Milkshake', desc: 'Classic creamy vanilla', price: 4.45 },
                { name: 'Strawberry Milkshake', desc: 'Sweet & fruity strawberry', price: 4.45 },
                { name: 'Banana Milkshake', desc: 'Rich banana flavor', price: 4.45 },
                { name: 'Cookies n\' Cream', desc: 'Crushed Oreo blend', price: 4.45 }
            ],
            'Drinks & Coffees': [
                { name: 'Canned Soft Drink', desc: 'Coke, Coke Zero, Fanta Orange, Fanta Lemon, Sprite, Aquarius', price: 1.60 },
                { name: 'Fruit Juice', desc: 'Orange Juice, Apple Juice, Pineapple Juice', price: 2.50 },
                { name: 'Water', desc: 'Still or Sparkling', price: 1.25 },
                { name: 'Tea', desc: 'Classic brew', price: 1.50 },
                { name: 'English Tea', desc: 'Traditional English breakfast', price: 1.45 },
                { name: 'Herbal Tea', desc: 'Calming infusions', price: 1.75 },
                { name: 'Café Con Leche', desc: 'Classic Spanish milk coffee', price: 1.50 },
                { name: 'Cortado', desc: 'Espresso with a dash of milk', price: 1.50 },
                { name: 'Americano', desc: 'Black coffee', price: 1.50 },
                { name: 'Cappuccino', desc: 'Frothy and rich', price: 3.25 },
                { name: 'Bombón', desc: 'Espresso with sweet condensed milk', price: 2.50 },
                { name: 'Belmonte', desc: 'Bombón with a dash of brandy', price: 2.95 },
                { name: 'Brandy Coffee', desc: 'Warming and strong', price: 2.95 },
                { name: 'Hot Chocolate', desc: 'Thick Spanish style', price: 2.50 }
            ],
            'Snacks & Sweets': [
                { name: 'Crisps', desc: 'Assorted flavours available', price: 1.50 },
                { name: 'Chocolate Bars', desc: 'Popular chocolate selections', price: 1.50 },
                { name: 'Packs of Sweets', desc: 'Gummy and sweet treats', price: 1.50 }
            ]
        };
        Object.entries(defaultMenu).forEach(([category, data]) => {
            db.run(`INSERT INTO menu_config (category, data) VALUES (?, ?)`, [category, JSON.stringify(data)]);
        });
    }

    saveDB();
    return db;
}

function saveDB() {
    if (db) {
        const data = db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(DB_PATH, buffer);
    }
}

function queryAll(sql, params = []) {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare(sql);
        if (params.length) stmt.bind(params);
        const rows = [];
        while (stmt.step()) rows.push(stmt.getAsObject());
        stmt.free();
        resolve(rows);
    });
}

function runSql(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params);
        saveDB();
        resolve();
    });
}

// --- API Routes ---

// Staff PIN login
app.post('/api/staff/login', (req, res) => {
    const { pin } = req.body;
    if (pin === STAFF_PIN) {
        res.json({ success: true, token: 'staff_' + Date.now() });
    } else {
        res.status(401).json({ error: 'Invalid PIN' });
    }
});

// Customer register
app.post('/api/register', (req, res) => {
    const { email, password, name, phone, address } = req.body;
    try {
        db.run(`INSERT INTO customers (email, password, name, phone, address) VALUES (?, ?, ?, ?, ?)`,
            [email, password, name, phone, address]);
        saveDB();
        res.json({ success: true, user: { id: 1, name, email, proper_points: 0 } });
    } catch (err) {
        if (err.message.includes('UNIQUE')) return res.status(400).json({ error: 'Email already registered.' });
        res.status(500).json({ error: err.message });
    }
});

// Customer login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    try {
        const result = db.exec(`SELECT id, name, email, phone, address, proper_points FROM customers WHERE email = '${email}' AND password = '${password}'`);
        if (result.length === 0 || result[0].values.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }
        const row = result[0].values[0];
        const columns = result[0].columns;
        const user = {};
        columns.forEach((col, i) => user[col] = row[i]);
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Promos
app.get('/api/promos', (req, res) => {
    try {
        const result = db.exec(`SELECT * FROM promo_codes`);
        const rows = result.length > 0 ? result[0].values.map(row => {
            const cols = result[0].columns;
            const obj = {};
            cols.forEach((c, i) => obj[c] = row[i]);
            return obj;
        }) : [];
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/promos', (req, res) => {
    const { code, discount } = req.body;
    try {
        db.run(`INSERT INTO promo_codes (code, discount) VALUES (?, ?) ON CONFLICT(code) DO UPDATE SET discount=excluded.discount`, [code, discount]);
        saveDB();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/promos/:code', (req, res) => {
    try {
        db.run(`DELETE FROM promo_codes WHERE code = ?`, [req.params.code]);
        saveDB();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Menu
app.get('/api/menu', (req, res) => {
    try {
        const result = db.exec(`SELECT * FROM menu_config`);
        const menu = {};
        if (result.length > 0) {
            result[0].values.forEach(row => {
                const cols = result[0].columns;
                const obj = {};
                cols.forEach((c, i) => obj[c] = row[i]);
                if (obj.category && obj.data) {
                    menu[obj.category] = JSON.parse(obj.data);
                }
            });
        }
        res.json(menu);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/menu', (req, res) => {
    const { category, data } = req.body;
    try {
        db.run(`INSERT INTO menu_config (category, data) VALUES (?, ?)`, [category, JSON.stringify(data)]);
        saveDB();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Seed default menu
app.post('/api/seed-menu', (req, res) => {
    const menu = {
        'Meal Deals': [
            { name: 'Option 1', desc: '1 x Premium Sandwich, 1 x Canned Drink, 1 x Chocolate, 1 x Crisps', price: 9.95 },
            { name: 'Option 2', desc: '1 x Deluxe Sandwich, 1 x Canned Drink, 2 x Choc/Crisps/Sweets', price: 13.95 },
            { name: 'Option 3', desc: '2 x Premium Sandwiches, 2 x Canned Drinks, 4 x Choc/Crisps/Sweets', price: 19.95 },
            { name: 'Option 4 (MEGA)', desc: '4 x Premium Sandwiches, 4 x Canned Drinks, 8 x Choc/Crisps/Sweets, 4 x Bottles Of Beer', price: 39.95 }
        ],
        'Originals': [
            { name: 'Traditional Sandwich', desc: 'Classic sandwich setup', price: 4.95 },
            { name: 'Tuckinn Proper Original', desc: 'Our specialty signature builds', price: 9.95 }
        ],
        'Smoothies': [
            { name: 'Berry Bliss', desc: 'Antioxidant-rich blend of blueberries, raspberries, strawberries, and banana.', price: 4.95 },
            { name: 'Tropical Escape', desc: 'A refreshing mix of mango, pineapple, coconut water, and lime.', price: 4.95 },
            { name: 'Green Goddess', desc: 'Healthy option combining spinach, kale, green apple, and avocado.', price: 4.95 },
            { name: 'Strawberry Banana', desc: 'Classic, creamy smoothie, universally loved.', price: 4.95 },
            { name: 'Citrus Mango Smoothie', desc: 'Bright blend with orange juice and mango for a refreshing taste.', price: 4.95 }
        ],
        'Milkshakes': [
            { name: 'Chocolate Milkshake', desc: 'Thick & creamy chocolate', price: 4.45 },
            { name: 'Vanilla Milkshake', desc: 'Classic creamy vanilla', price: 4.45 },
            { name: 'Strawberry Milkshake', desc: 'Sweet & fruity strawberry', price: 4.45 },
            { name: 'Banana Milkshake', desc: 'Rich banana flavor', price: 4.45 },
            { name: 'Cookies n\' Cream', desc: 'Crushed Oreo blend', price: 4.45 }
        ],
        'Drinks & Coffees': [
            { name: 'Canned Soft Drink', desc: 'Coke, Coke Zero, Fanta Orange, Fanta Lemon, Sprite, Aquarius', price: 1.60 },
            { name: 'Fruit Juice', desc: 'Orange Juice, Apple Juice, Pineapple Juice', price: 2.50 },
            { name: 'Water', desc: 'Still or Sparkling', price: 1.25 },
            { name: 'Tea', desc: 'Classic brew', price: 1.50 },
            { name: 'English Tea', desc: 'Traditional English breakfast', price: 1.45 },
            { name: 'Herbal Tea', desc: 'Calming infusions', price: 1.75 },
            { name: 'Café Con Leche', desc: 'Classic Spanish milk coffee', price: 1.50 },
            { name: 'Cortado', desc: 'Espresso with a dash of milk', price: 1.50 },
            { name: 'Americano', desc: 'Black coffee', price: 1.50 },
            { name: 'Cappuccino', desc: 'Frothy and rich', price: 3.25 },
            { name: 'Bombón', desc: 'Espresso with sweet condensed milk', price: 2.50 },
            { name: 'Belmonte', desc: 'Bombón with a dash of brandy', price: 2.95 },
            { name: 'Brandy Coffee', desc: 'Warming and strong', price: 2.95 },
            { name: 'Hot Chocolate', desc: 'Thick Spanish style', price: 2.50 }
        ],
        'Snacks & Sweets': [
            { name: 'Crisps', desc: 'Assorted flavours available', price: 1.50 },
            { name: 'Chocolate Bars', desc: 'Popular chocolate selections', price: 1.50 },
            { name: 'Packs of Sweets', desc: 'Gummy and sweet treats', price: 1.50 }
        ]
    };
    try {
        Object.entries(menu).forEach(([category, data]) => {
            db.run(`INSERT INTO menu_config (category, data) VALUES (?, ?) ON CONFLICT(category) DO UPDATE SET data=excluded.data`, [category, JSON.stringify(data)]);
        });
        saveDB();
        res.json({ success: true, message: 'Menu seeded' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Orders - Place new order
app.post('/api/orders', (req, res) => {
    const { order_number, items, total, customer_name, phone, order_type, special_instructions } = req.body;
    try {
        const itemsJson = JSON.stringify(items);
        const status = 'new';
        const name = (customer_name || 'Guest').replace(/'/g, "''");
        const tel = (phone || '').replace(/'/g, "''");
        const type = (order_type || 'collect').replace(/'/g, "''");
        const notes = (special_instructions || '').replace(/'/g, "''");

        // Use local time for date (not UTC from SQLite DEFAULT)
        const now = new Date();
        const pad = n => String(n).padStart(2, '0');
        const localDate = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

        db.run(`INSERT INTO orders (order_number, items, total, status, customer_name, phone, order_type, special_instructions, date) VALUES ('${order_number}', '${itemsJson}', ${total}, '${status}', '${name}', '${tel}', '${type}', '${notes}', '${localDate}')`);
        saveDB();

        // Fetch the inserted order
        const result = db.exec(`SELECT * FROM orders WHERE order_number = '${order_number}' ORDER BY id DESC LIMIT 1`);
        let order = null;
        if (result.length > 0 && result[0].values.length > 0) {
            const cols = result[0].columns;
            order = {};
            cols.forEach((c, i) => { order[c] = result[0].values[0][i]; });
            if (order.items) order.items = JSON.parse(order.items);
        }

        // Emit to all staff
        io.emit('new_order', order);

        res.json({ id: 1, order_number });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get orders - optionally filter by status
app.get('/api/orders', (req, res) => {
    try {
        let sql = `SELECT * FROM orders`;
        const conditions = [];
        if (req.query.status === 'active') {
            conditions.push(`status != 'served'`);
        } else if (req.query.status) {
            conditions.push(`status = '${req.query.status}'`);
        }
        if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
        sql += ' ORDER BY date DESC';

        const result = db.exec(sql);
        const rows = result.length > 0 ? result[0].values.map(row => {
            const cols = result[0].columns;
            const obj = {};
            cols.forEach((c, i) => obj[c] = row[i]);
            if (obj.items) obj.items = JSON.parse(obj.items);
            return obj;
        }) : [];
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update order status
app.patch('/api/orders/:id/status', (req, res) => {
    const { status } = req.body;
    const valid = ['new', 'preparing', 'ready', 'served'];
    if (!valid.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }
    try {
        db.run(`UPDATE orders SET status = ? WHERE id = ?`, [status, req.params.id]);
        saveDB();

        // Fetch updated order
        const result = db.exec(`SELECT * FROM orders WHERE id = ${req.params.id}`);
        let order = null;
        if (result.length > 0 && result[0].values.length > 0) {
            const cols = result[0].columns;
            order = {};
            cols.forEach((c, i) => { order[c] = result[0].values[0][i]; });
            if (order.items) order.items = JSON.parse(order.items);
        }

        // Broadcast to all staff
        io.emit('order_status_update', { orderId: parseInt(req.params.id), status, order });

        res.json({ success: true, status });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Socket.io ---
io.on('connection', (socket) => {
    // Staff join room
    socket.on('staff_join', () => {
        socket.join('staff_room');
        console.log('Staff joined');
    });

    // Chat (existing)
    socket.on('join_chat', () => socket.join('staff_room'));
    socket.on('send_message', (data) => {
        io.to('staff_room').emit('receive_message', {
            sender: data.sender,
            text: data.text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
    });
});

initDB().then(() => {
    server.listen(PORT, () => {
        console.log(`🚀 Tuckinn Enterprise Server running on port ${PORT}`);
    });
}).catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
});
