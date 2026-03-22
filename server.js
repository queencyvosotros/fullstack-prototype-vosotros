const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const PORT = 3000;
const SECRET_KEY = 'your-very-secure-secret'; 

app.use(cors({
    origin: ['http://127.0.0.1:5500', 'http://localhost:5500'] 
}));
app.use(express.json());

let users = [
    { id: 1, firstName: 'Admin', lastName: 'User', email: 'admin@example.com', password: '', role: 'admin', verified: true }, 
    { id: 2, firstName: 'Alice', lastName: 'Smith', email: 'alice@example.com', password: '', role: 'user', verified: true }
];

users[0].password = bcrypt.hashSync('admin123', 10);
users[1].password = bcrypt.hashSync('user123', 10);

const departments = [
    { id: 1, name: 'Engineering', description: 'Software and Hardware' },
    { id: 2, name: 'HR', description: 'Human Resources' }
];

const employees = [
    { id: 'E001', userEmail: 'admin@example.com', position: 'Senior Admin' }
];

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 
    if (!token) return res.status(401).json({ error: 'Access token required' });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired token' });
        req.user = user;
        next();
    });
}

app.post('/api/register', async (req, res) => {
    const { firstName, lastName, email, password, role = 'user' } = req.body;

    if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const existing = users.find(u => u.email === email);
    if (existing) {
        return res.status(409).json({ error: 'User already exists' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
            id: users.length + 1,
            firstName,
            lastName,
            email,
            password: hashedPassword,
            role,
            verified: true
        };

        users.push(newUser);
        console.log(`✅ New user added: ${email}`);
        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body; 
    const user = users.find(u => u.email === email);

    if (!user || !await bcrypt.compare(password, user.password)) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        SECRET_KEY,
        { expiresIn: '1h' }
    );

    res.json({ token, user: { firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role } });
});
-
app.get('/api/accounts', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admins only' });
    res.json(users);
});

app.get('/api/departments', authenticateToken, (req, res) => {
    res.json(departments);
});

app.get('/api/employees', authenticateToken, (req, res) => {
    res.json(employees);
});

app.get('/api/profile', authenticateToken, (req, res) => {
    res.json({ user: req.user });
});

app.listen(PORT, () => {
    console.log(`\n🚀 Backend running on http://localhost:${PORT}`);
    console.log(`👉 Ready for Login & Registration!\n`);
});