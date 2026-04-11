// ===== DATABASE SIMULATION (LocalStorage + EER Models) ===== //

const initDB = () => {
    if (!localStorage.getItem('nexus_users')) {
        const defaultUsers = [
            { id: 'u1', name: 'System Admin', address: 'Nexus Core', phone: '000-000', role: 'Admin', password: 'admin' },
            { id: 's1', name: 'Support Staff Alpha', address: 'Desk A', phone: '111-111', role: 'Staff', password: 'staff' },
            { id: 'c1', name: 'John Doe', address: 'Sector 7G', phone: '555-0199', role: 'Citizen', password: 'password' }
        ];
        localStorage.setItem('nexus_users', JSON.stringify(defaultUsers));
        localStorage.setItem('nexus_staff', JSON.stringify([{ id: 's1', name: 'Support Staff Alpha', cont_no: '111-111' }]));
        localStorage.setItem('nexus_complaints', JSON.stringify([
            { id: 'CMP-1001', date: new Date().toISOString(), type: 'SERVICE', subtype_data: { service_type: 'Network Outage' }, status: 'Pending', userId: 'c1', description: 'Cannot connect to core servers.' }
        ]));
        localStorage.setItem('nexus_responses', JSON.stringify([]));
        localStorage.setItem('nexus_feedback', JSON.stringify([]));
    }
};

const getDB = (table) => JSON.parse(localStorage.getItem(`nexus_${table}`)) || [];
const saveDB = (table, data) => localStorage.setItem(`nexus_${table}`, JSON.stringify(data));

// ===== GLOBAL STATE ===== //
let currentUser = JSON.parse(sessionStorage.getItem('nexus_session')) || null;

// ===== INITIALIZATION ===== //
document.addEventListener("DOMContentLoaded", () => {
    initDB();
    updateClock();
    setInterval(updateClock, 1000);

    if (currentUser) {
        showApp();
    } else {
        document.getElementById('auth-section').classList.add('active');
    }

    // Forms
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegister);
});

function updateClock() {
    const now = new Date();
    document.getElementById('datetime-pill').innerText = now.toLocaleString();
}

// ===== UI UTILITIES ===== //
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.style.setProperty('--dur', '4s');
    toast.innerHTML = `<i class="uil ${type === 'success' ? 'uil-check-circle' : 'uil-exclamation-triangle'}"></i> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function switchAuth(type) {
    if(type === 'register') {
        document.getElementById('login-form').classList.add('hidden');
        document.getElementById('register-form').classList.remove('hidden');
    } else {
        document.getElementById('register-form').classList.add('hidden');
        document.getElementById('login-form').classList.remove('hidden');
    }
}

// ===== AUTHENTICATION ===== //
function handleLogin(e) {
    e.preventDefault();
    const id = document.getElementById('login-id').value;
    const pass = document.getElementById('login-password').value;
    
    const users = getDB('users');
    let user = null;
    
    // Check ID first
    user = users.find(u => u.id === id && u.password === pass);
    
    // Fallback: allow login using rolename for demo
    if (!user) user = users.find(u => u.role.toLowerCase() === id.toLowerCase() && u.password === pass);

    if (user) {
        currentUser = user;
        sessionStorage.setItem('nexus_session', JSON.stringify(user));
        showToast('Authentication Successful');
        showApp();
    } else {
        showToast('Invalid Access Credentials', 'error');
    }
}

function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const address = document.getElementById('reg-address').value;
    const phone = document.getElementById('reg-phone').value;
    const pass = document.getElementById('reg-password').value;

    const users = getDB('users');
    const newId = 'c' + (users.filter(u => u.role === 'Citizen').length + 1);
    
    const newUser = { id: newId, name, address, phone, role: 'Citizen', password: pass };
    users.push(newUser);
    saveDB('users', users);

    showToast(`Registered successfully. Your User ID is ${newId}`);
    switchAuth('login');
    document.getElementById('login-id').value = newId;
    document.getElementById('login-password').value = pass;
}

function logout() {
    currentUser = null;
    sessionStorage.removeItem('nexus_session');
    switchScreen('auth-section');
    showToast('Session Terminated');
}

// ===== APP RENDERING ===== //
function showApp() {
    switchScreen('app-section');
    document.getElementById('current-user-name').innerText = currentUser.name;
    document.getElementById('current-user-role').innerText = currentUser.role;
    
    renderSidebar();
    
    // Default load
    if (currentUser.role === 'Citizen') loadCitizenDashboard();
    if (currentUser.role === 'Staff') loadStaffDashboard();
    if (currentUser.role === 'Admin') loadAdminDashboard();
}

function renderSidebar() {
    const nav = document.getElementById('nav-menu');
    nav.innerHTML = '';
    
    const links = {
        Citizen: [
            { id: 'cit-new', icon: 'uil-plus-circle', text: 'Lodge Complaint', action: loadCitizenNew },
            { id: 'cit-history', icon: 'uil-history', text: 'My Complaints', action: loadCitizenDashboard }
        ],
        Staff: [
            { id: 'stf-tasks', icon: 'uil-clipboard-notes', text: 'Assigned Tasks', action: loadStaffDashboard }
        ],
        Admin: [
            { id: 'adm-all', icon: 'uil-globe', text: 'All Complaints', action: loadAdminDashboard },
            { id: 'adm-users', icon: 'uil-users-alt', text: 'System Users', action: loadAdminUsers }
        ]
    };

    links[currentUser.role].forEach((link, idx) => {
        const a = document.createElement('a');
        a.className = `nav-item ${idx === 0 ? 'active' : ''}`;
        a.innerHTML = `<i class="uil ${link.icon}"></i> <span>${link.text}</span>`;
        a.onclick = (e) => {
            document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
            a.classList.add('active');
            link.action();
        };
        nav.appendChild(a);
    });
}

function setPageTitle(title) {
    document.getElementById('page-title').innerText = title;
}

function renderContent(htmlString) {
    document.getElementById('main-content').innerHTML = htmlString;
}

// ===== CITIZEN FUNCTIONS ===== //
function loadCitizenNew() {
    setPageTitle("Lodge Complaint");
    const tpl = document.getElementById('tpl-citizen-new').innerHTML;
    renderContent(tpl);
}

function updateSubtypeFields() {
    const type = document.getElementById('comp-type').value;
    const container = document.getElementById('subtype-container');
    container.innerHTML = '';
    container.classList.remove('hidden');

    if (type === 'SERVICE') {
        container.innerHTML = `
            <div class="input-group">
                <label>Service Type</label>
                <input type="text" id="subtype-val" placeholder="e.g. Electrical, Network, Cleaning" required>
            </div>
        `;
    } else if (type === 'PRODUCT') {
        container.innerHTML = `
            <div class="input-group">
                <label>Defective Product Name</label>
                <input type="text" id="subtype-val" placeholder="e.g. Chair, Monitor" required>
            </div>
        `;
    } else if (type === 'INFRA') {
        container.innerHTML = `
            <div class="input-group">
                <label>Infrastructure Location</label>
                <input type="text" id="subtype-val" placeholder="e.g. Room 404, Building C" required>
            </div>
        `;
    } else {
        container.classList.add('hidden');
    }
}

function submitComplaint(e) {
    e.preventDefault();
    const type = document.getElementById('comp-type').value;
    const subtypeVal = document.getElementById('subtype-val').value;
    const desc = document.getElementById('comp-desc').value;

    let subtype_data = {};
    if(type === 'SERVICE') subtype_data.service_type = subtypeVal;
    if(type === 'PRODUCT') subtype_data.product_name = subtypeVal;
    if(type === 'INFRA') subtype_data.location = subtypeVal;

    const complaints = getDB('complaints');
    const newId = `CMP-${1000 + complaints.length + 1}`;
    
    complaints.push({
        id: newId,
        userId: currentUser.id,
        date: new Date().toISOString(),
        type,
        subtype_data,
        status: 'Pending',
        description: desc
    });
    
    saveDB('complaints', complaints);
    showToast('Complaint Submitted the Nexus Network.');
    loadCitizenDashboard();
    
    // Reset nav
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-item')[1].classList.add('active'); // select history
}

function loadCitizenDashboard() {
    setPageTitle("My Complaints");
    renderContent(document.getElementById('tpl-data-table').innerHTML);
    
    const complaints = getDB('complaints').filter(c => c.userId === currentUser.id);
    const responses = getDB('responses');
    const feedbacks = getDB('feedback');

    const dtHead = document.getElementById('dt-head');
    const dtBody = document.getElementById('dt-body');
    
    dtHead.innerHTML = `
        <tr>
            <th>ID</th>
            <th>Type</th>
            <th>Specifics</th>
            <th>Date</th>
            <th>Status</th>
            <th>Action / Feedback</th>
        </tr>
    `;

    if (complaints.length === 0) {
        document.getElementById('dt-empty').classList.remove('hidden');
        return;
    }

    complaints.forEach(c => {
        let specs = Object.values(c.subtype_data)[0];
        let dateObj = new Date(c.date);
        
        let actionHtml = '';
        // Check if there is a response
        let resp = responses.find(r => r.complaintId === c.id);
        if (resp) {
            // Check if feedback already given
            let fb = feedbacks.find(f => f.responseId === resp.id);
            if(fb) {
                actionHtml = `<span class="feedback-stars">${'★'.repeat(fb.rating)}${'☆'.repeat(5-fb.rating)}</span>`;
            } else {
                actionHtml = `<button class="btn btn-outline btn-small" onclick="showFeedbackDialog('${resp.id}', '${c.id}')">Rate Response</button>`;
            }
        } else {
            actionHtml = `<span style="color:var(--text-muted);font-size:0.8rem;">Awaiting</span>`;
        }

        dtBody.innerHTML += `
            <tr>
                <td><strong>${c.id}</strong></td>
                <td><span class="badge" style="background:rgba(255,255,255,0.1);color:#fff;">${c.type}</span></td>
                <td>${specs}</td>
                <td>${dateObj.toLocaleDateString()}</td>
                <td><span class="status-badge status-${c.status.replace(' ', '')}">${c.status}</span></td>
                <td>${actionHtml}</td>
            </tr>
        `;
    });
}

function showFeedbackDialog(respId, cmpId) {
    const rating = prompt(`Score the response for ${cmpId} (1-5):`, "5");
    if(!rating || isNaN(rating) || rating < 1 || rating > 5) {
        showToast('Valid rating required betwen 1-5', 'error');
        return;
    }
    const comments = prompt("Any additional comments?");
    
    const feed = getDB('feedback');
    feed.push({
        id: `FB-${Math.floor(Math.random()*1000)}`,
        responseId: respId,
        rating: parseInt(rating),
        comments: comments || ''
    });
    saveDB('feedback', feed);
    showToast('Feedback stored successfully.');
    loadCitizenDashboard();
}

// ===== STAFF FUNCTIONS ===== //
function loadStaffDashboard() {
    setPageTitle("Assigned Task Queue");
    renderContent(document.getElementById('tpl-data-table').innerHTML);
    
    // For demo, standard staff sees all pending or progress complaints
    const complaints = getDB('complaints').filter(c => c.status !== 'Dismissed');
    const responses = getDB('responses');

    const dtHead = document.getElementById('dt-head');
    const dtBody = document.getElementById('dt-body');
    
    dtHead.innerHTML = `
        <tr>
            <th>Ticket</th>
            <th>Type</th>
            <th>Details</th>
            <th>Status</th>
            <th>Actions</th>
        </tr>
    `;

    if (complaints.length === 0) {
        document.getElementById('dt-empty').classList.remove('hidden');
        return;
    }

    complaints.forEach(c => {
        let specs = Object.values(c.subtype_data)[0];
        let hasResp = responses.find(r => r.complaintId === c.id);
        
        let actions = `
            ${c.status === 'Pending' ? `<button class="btn btn-outline btn-small" onclick="updateStatus('${c.id}', 'In Progress')">Start</button>` : ''}
            ${c.status === 'In Progress' && !hasResp ? `<button class="btn btn-primary btn-small glow-btn" onclick="provideResponse('${c.id}')">Respond & Resolve</button>` : ''}
            ${hasResp ? `<span style="color:var(--status-resolved);">Responded</span>` : ''}
        `;

        dtBody.innerHTML += `
            <tr>
                <td><strong>${c.id}</strong></td>
                <td><span class="badge" style="background:rgba(255,255,255,0.1);color:#fff;">${c.type}</span></td>
                <td>${specs}<div style="font-size:0.8rem;color:gray;margin-top:4px;">${c.description}</div></td>
                <td><span class="status-badge status-${c.status.replace(' ', '')}">${c.status}</span></td>
                <td>${actions}</td>
            </tr>
        `;
    });
}

function updateStatus(cmpId, status) {
    const complaints = getDB('complaints');
    let c = complaints.find(x => x.id === cmpId);
    if(c){
        c.status = status;
        saveDB('complaints', complaints);
        showToast(`Status updated to ${status}`);
        loadStaffDashboard();
    }
}

function provideResponse(cmpId) {
    const text = prompt(`Enter resolution response for ${cmpId}:`);
    if(!text) return;

    const resps = getDB('responses');
    resps.push({
        id: `RSP-${Math.floor(Math.random()*1000)}`,
        complaintId: cmpId,
        staffId: currentUser.id,
        date: new Date().toISOString(),
        text: text
    });
    saveDB('responses', resps);

    // Auto resolve
    updateStatus(cmpId, 'Resolved'); 
}

// ===== ADMIN FUNCTIONS ===== //
function loadAdminDashboard() {
    setPageTitle("Global Complaint Overview");
    renderContent(document.getElementById('tpl-data-table').innerHTML);
    
    const complaints = getDB('complaints');
    const dtHead = document.getElementById('dt-head');
    const dtBody = document.getElementById('dt-body');
    
    dtHead.innerHTML = `
        <tr>
            <th>Ticket</th>
            <th>User ID</th>
            <th>Category</th>
            <th>Date</th>
            <th>Status</th>
            <th>Act</th>
        </tr>
    `;

    if (complaints.length === 0) {
        document.getElementById('dt-empty').classList.remove('hidden');
        return;
    }

    // Sort newest first
    complaints.sort((a,b) => new Date(b.date) - new Date(a.date)).forEach(c => {
        let dateObj = new Date(c.date);
        dtBody.innerHTML += `
            <tr>
                <td><strong>${c.id}</strong></td>
                <td>${c.userId}</td>
                <td><span class="badge" style="background:rgba(255,255,255,0.1);color:#fff;">${c.type}</span></td>
                <td>${dateObj.toLocaleDateString()}</td>
                <td><span class="status-badge status-${c.status.replace(' ', '')}">${c.status}</span></td>
                <td>
                    <button class="btn btn-outline btn-small" onclick="adminDelete('${c.id}')"><i class="uil uil-trash-alt"></i></button>
                </td>
            </tr>
        `;
    });
}

function adminDelete(id) {
    if(confirm('Eradicate this record from the Nexus database?')) {
        let complaints = getDB('complaints');
        complaints = complaints.filter(c => c.id !== id);
        saveDB('complaints', complaints);
        showToast('Record Purged');
        loadAdminDashboard();
    }
}

function loadAdminUsers() {
    setPageTitle("System Users");
    renderContent(document.getElementById('tpl-data-table').innerHTML);
    
    const users = getDB('users');
    const dtHead = document.getElementById('dt-head');
    const dtBody = document.getElementById('dt-body');
    
    dtHead.innerHTML = `
        <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Role</th>
            <th>Contact</th>
        </tr>
    `;

    users.forEach(u => {
        dtBody.innerHTML += `
            <tr>
                <td><strong>${u.id}</strong></td>
                <td>${u.name}</td>
                <td><span class="badge">${u.role}</span></td>
                <td>${u.phone}</td>
            </tr>
        `;
    });
}
