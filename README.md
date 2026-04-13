# ComplaintLTCE Management System (Full-Stack)

A professional digital complaint management system with a Node.js/Express backend and SQLite database.

## Features
- **Role-Based Access**: Admin, Staff, and Citizen roles.
- **Citizen**: Lodge complaints, view history, and rate responses.
- **Staff**: Manage assigned tasks, provide resolutions, and update status.
- **Admin**: Global analytics, user management, and record control.
- **Database**: Persistent SQLite storage for all records.

## Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/huh614/online-complaint-management.git
   cd online-complaint-management
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the server**:
   ```bash
   node server.js
   ```

4. **Access the application**:
   Open your browser and navigate to `http://localhost:5000`

## Default Credentials
- **Admin**: `admin` / `admin`
- **Staff**: `staff` / `staff`
- **Citizen**: `c1` / `pass`

## Technology Stack
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Database**: SQLite (via `better-sqlite3`)
