CREATE TABLE IF NOT EXISTS leave_requests (
    id SERIAL PRIMARY KEY,
    employee_name VARCHAR(60) NOT NULL,
    employee_id VARCHAR(7) NOT NULL,
    leave_type VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    request_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_employee_id CHECK (employee_id ~ '^ATS0(?!000)\d{3}$'),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected')),
    CONSTRAINT valid_dates CHECK (end_date >= start_date),
    CONSTRAINT valid_leave_type CHECK (leave_type IN ('annual', 'sick', 'personal', 'casual', 'maternity'))
);


CREATE INDEX idx_employee_id ON leave_requests (employee_id);
CREATE INDEX idx_status ON leave_requests (status);
CREATE INDEX idx_request_date ON leave_requests (request_date);
