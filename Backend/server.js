const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const app = express();
const port = 3202;

// PostgreSQL database configuration
const pool = new Pool({
    user: 'postgres', // Replace with your PostgreSQL username
    host: 'postgres',
    database: 'leave_management',
    password: 'admin123', // Replace with your PostgreSQL password
    port: 5432,
});

// Middleware
app.use(cors());
app.use(express.json());

// Get all leave requests
app.get('/api/leave-requests', async (req, res) => {
    try {
        const { status } = req.query;
        let query = 'SELECT * FROM leave_requests';
        let values = [];
        
        if (status && status !== 'all') {
            query += ' WHERE status = $1';
            values = [status];
        }
        
        const result = await pool.query(query, values);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching leave requests:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Search leave requests
app.get('/api/leave-requests/search', async (req, res) => {
    try {
        const { search, status } = req.query;
        let query = `
            SELECT * FROM leave_requests
            WHERE (employee_name ILIKE $1
                OR employee_id ILIKE $1
                OR leave_type ILIKE $1
                OR reason ILIKE $1
                OR start_date::text ILIKE $1
                OR end_date::text ILIKE $1
                OR request_date::text ILIKE $1)
        `;
        let values = [`%${search}%`];
        
        if (status && status !== 'all') {
            query += ' AND status = $2';
            values.push(status);
        }
        
        const result = await pool.query(query, values);
        res.json(result.rows);
    } catch (error) {
        console.error('Error searching leave requests:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create a new leave request
app.post('/api/leave-requests', async (req, res) => {
    const { employeeName, employeeId, leaveType, startDate, endDate, reason } = req.body;
    
    try {
        // Check for duplicate or overlapping requests
        const duplicateCheck = await pool.query(
            `SELECT * FROM leave_requests
             WHERE employee_id = $1
             AND (
                 ($2 BETWEEN start_date AND end_date)
                 OR ($3 BETWEEN start_date AND end_date)
                 OR (start_date BETWEEN $2 AND $3)
                 OR (end_date BETWEEN $2 AND $3)
                 OR (request_date::date = $4::date)
             )`,
            [employeeId, startDate, endDate, new Date().toISOString().split('T')[0]]
        );
        
        if (duplicateCheck.rows.length > 0) {
            return res.status(400).json({ error: 'A leave request with overlapping dates or on the same day already exists.' });
        }
        
        const result = await pool.query(
            `INSERT INTO leave_requests (employee_name, employee_id, leave_type, start_date, end_date, reason, status, request_date)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [employeeName, employeeId, leaveType, startDate, endDate, reason, 'pending', new Date()]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating leave request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update leave request status
app.put('/api/leave-requests/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    try {
        const result = await pool.query(
            'UPDATE leave_requests SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Leave request not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating leave request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete all leave requests
app.delete('/api/leave-requests', async (req, res) => {
    try {
        await pool.query('DELETE FROM leave_requests');
        res.json({ message: 'All leave requests deleted successfully' });
    } catch (error) {
        console.error('Error deleting leave requests:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://3.85.61.23:${port}`);
});