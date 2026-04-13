const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = 5000;
const db = new Database('complaints.db');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, './')));

// Initialize Database
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT,
        address TEXT,
        phone TEXT,
        role TEXT,
        password TEXT
    );

    CREATE TABLE IF NOT EXISTS complaints (
        id TEXT PRIMARY KEY,
        userId TEXT,
        date TEXT,
        type TEXT,
        subtype_data TEXT,
        status TEXT,
        description TEXT,
        FOREIGN KEY (userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS responses (
        id TEXT PRIMARY KEY,
        complaintId TEXT,
        staffId TEXT,
        date TEXT,
        text TEXT,
        FOREIGN KEY (complaintId) REFERENCES complaints(id),
        FOREIGN KEY (staffId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS feedback (
        id TEXT PRIMARY KEY,
        responseId TEXT,
        rating INTEGER,
        comments TEXT,
        FOREIGN KEY (responseId) REFERENCES responses(id)
    );
`);

// Seed Data
const seedData = () => {
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    if (userCount === 0) {
        const insertUser = db.prepare('INSERT INTO users (id, name, address, phone, role, password) VALUES (?, ?, ?, ?, ?, ?)');
        const defaultUsers = [
            ['u1', 'System Admin', 'LTCE Core', '000-000', 'Admin', 'admin'],
            ['s1', 'Ramesh (Plumber)', 'Desk A', '111-111', 'Staff', 'staff'],
            ['s2', 'Suresh (IT Dept)', 'Desk B', '222-222', 'Staff', 'staff2'],
            ['c1', 'Vedant Pawar', 'Computer Eng Dept', '999-888', 'Citizen', 'pass'],
            ['c2', 'Anjali Sharma', 'Library Sec', '555-444', 'Citizen', 'pass']
        ];
        defaultUsers.forEach(user => insertUser.run(...user));

        const insertComplaint = db.prepare('INSERT INTO complaints (id, userId, date, type, subtype_data, status, description) VALUES (?, ?, ?, ?, ?, ?, ?)');
        const defaultComplaints = [
            ['CMP-1001', 'c1', new Date(Date.now() - 86400000 * 2).toISOString(), 'SERVICE', JSON.stringify({ service_type: 'Wi-Fi Outage' }), 'Resolved', 'Lab 4 Wi-Fi completely dropping.'],
            ['CMP-1002', 'c2', new Date(Date.now() - 86400000).toISOString(), 'INFRA', JSON.stringify({ location: 'B-Wing 2nd Floor' }), 'In Progress', 'Water cooler is leaking heavily.'],
            ['CMP-1003', 'c1', new Date().toISOString(), 'PRODUCT', JSON.stringify({ product_name: 'Projector' }), 'Pending', 'Projector bulb burned out in Room 302.']
        ];
        defaultComplaints.forEach(comp => insertComplaint.run(...comp));

        const insertResponse = db.prepare('INSERT INTO responses (id, complaintId, staffId, date, text) VALUES (?, ?, ?, ?, ?)');
        insertResponse.run('RSP-882', 'CMP-1001', 's2', new Date(Date.now() - 86400000).toISOString(), 'Router restarted and firmware updated. Signal stable.');

        const insertFeedback = db.prepare('INSERT INTO feedback (id, responseId, rating, comments) VALUES (?, ?, ?, ?)');
        insertFeedback.run('FB-104', 'RSP-882', 5, 'Extremely fast resolution. Thank you!');
    }
};

seedData();

// API Endpoints

// Auth
app.post('/api/login', (req, res) => {
    const { id, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE (id = ? OR LOWER(role) = ?) AND password = ?').get(id, id.toLowerCase(), password);
    if (user) {
        res.json({ success: true, user });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

app.post('/api/register', (req, res) => {
    const { name, address, phone, password } = req.body;
    const citizenCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'Citizen'").get().count;
    const newId = 'c' + (citizenCount + 1);
    db.prepare('INSERT INTO users (id, name, address, phone, role, password) VALUES (?, ?, ?, ?, "Citizen", ?)').run(newId, name, address, phone, password);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(newId);
    res.json({ success: true, user });
});

// Complaints
app.get('/api/complaints', (req, res) => {
    const { userId, role } = req.query;
    let complaints;
    if (role === 'Citizen') {
        complaints = db.prepare('SELECT * FROM complaints WHERE userId = ?').all(userId);
    } else {
        // Staff and Admin see all
        complaints = db.prepare('SELECT * FROM complaints').all();
    }
    // Parse subtype_data
    complaints = complaints.map(c => ({ ...c, subtype_data: JSON.parse(c.subtype_data) }));
    res.json(complaints);
});

app.post('/api/complaints', (req, res) => {
    const { userId, type, subtype_data, description } = req.body;
    const count = db.prepare('SELECT COUNT(*) as count FROM complaints').get().count;
    const newId = `CMP-${1000 + count + 1}`;
    db.prepare('INSERT INTO complaints (id, userId, date, type, subtype_data, status, description) VALUES (?, ?, ?, ?, ?, "Pending", ?)')
      .run(newId, userId, new Date().toISOString(), type, JSON.stringify(subtype_data), description);
    res.json({ success: true, id: newId });
});

app.put('/api/complaints/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    db.prepare('UPDATE complaints SET status = ? WHERE id = ?').run(status, id);
    res.json({ success: true });
});

app.delete('/api/complaints/:id', (req, res) => {
    const { id } = req.params;
    db.prepare('DELETE FROM complaints WHERE id = ?').run(id);
    res.json({ success: true });
});

// Responses
app.get('/api/responses', (req, res) => {
    const responses = db.prepare('SELECT * FROM responses').all();
    res.json(responses);
});

app.post('/api/responses', (req, res) => {
    const { complaintId, staffId, text } = req.body;
    const id = `RSP-${Math.floor(Math.random() * 1000)}`;
    db.prepare('INSERT INTO responses (id, complaintId, staffId, date, text) VALUES (?, ?, ?, ?, ?)')
      .run(id, complaintId, staffId, new Date().toISOString(), text);
    res.json({ success: true, id });
});

// Feedback
app.get('/api/feedback', (req, res) => {
    const feedback = db.prepare('SELECT * FROM feedback').all();
    res.json(feedback);
});

app.post('/api/feedback', (req, res) => {
    const { responseId, rating, comments } = req.body;
    const id = `FB-${Math.floor(Math.random() * 1000)}`;
    db.prepare('INSERT INTO feedback (id, responseId, rating, comments) VALUES (?, ?, ?, ?)')
      .run(id, responseId, rating, comments);
    res.json({ success: true, id });
});

// Users
app.get('/api/users', (req, res) => {
    const users = db.prepare('SELECT id, name, role, phone, address FROM users').all();
    res.json(users);
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
