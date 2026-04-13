// ===== API UTILITIES ===== //
const API_URL = window.location.origin + '/api';

async function apiFetch(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        if (!response.ok) throw new Error('API Error');
        return await response.json();
    } catch (error) {
        console.error('Fetch error:', error);
        showToast('Connection to server failed', 'error');
        return null;
    }
}

// ===== GLOBAL STATE ===== //
let currentUser = JSON.parse(sessionStorage.getItem('ltce_session')) || null;

// ===== INITIALIZATION ===== //
document.addEventListener("DOMContentLoaded", () => {
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
async function handleLogin(e) {
    e.preventDefault();
    const id = document.getElementById('login-id').value;
    const pass = document.getElementById('login-password').value;
    
    const result = await apiFetch('/login', {
        method: 'POST',
        body: JSON.stringify({ id, password: pass })
    });

    if (result && result.success) {
        currentUser = result.user;
        sessionStorage.setItem('ltce_session', JSON.stringify(result.user));
        showToast('Authentication Successful');
        showApp();
    } else {
        showToast('Invalid Access Credentials', 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const address = document.getElementById('reg-address').value;
    const phone = document.getElementById('reg-phone').value;
    const pass = document.getElementById('reg-password').value;

    const result = await apiFetch('/register', {
        method: 'POST',
        body: JSON.stringify({ name, address, phone, password: pass })
    });

    if (result && result.success) {
        const newUser = result.user;
        showToast(`Registered successfully. Your User ID is ${newUser.id}`);
        switchAuth('login');
        document.getElementById('login-id').value = newUser.id;
        document.getElementById('login-password').value = pass;
    }
}

function logout() {
    currentUser = null;
    sessionStorage.removeItem('ltce_session');
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

async function submitComplaint(e) {
    e.preventDefault();
    const type = document.getElementById('comp-type').value;
    const subtypeVal = document.getElementById('subtype-val').value;
    const desc = document.getElementById('comp-desc').value;

    let subtype_data = {};
    if(type === 'SERVICE') subtype_data.service_type = subtypeVal;
    if(type === 'PRODUCT') subtype_data.product_name = subtypeVal;
    if(type === 'INFRA') subtype_data.location = subtypeVal;

    const result = await apiFetch('/complaints', {
        method: 'POST',
        body: JSON.stringify({
            userId: currentUser.id,
            type,
            subtype_data,
            description: desc
        })
    });
    
    if (result && result.success) {
        showToast('Complaint Submitted to LTCE Records.');
        loadCitizenDashboard();
        
        // Reset nav
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        if (document.querySelectorAll('.nav-item')[1]) {
            document.querySelectorAll('.nav-item')[1].classList.add('active'); // select history
        }
    }
}

async function loadCitizenDashboard() {
    setPageTitle("My Complaints");
    renderContent(document.getElementById('tpl-data-table').innerHTML);
    
    const complaints = await apiFetch(`/complaints?userId=${currentUser.id}&role=Citizen`);
    const responses = await apiFetch('/responses');
    const feedbacks = await apiFetch('/feedback');

    if (!complaints) return;

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

async function showFeedbackDialog(respId, cmpId) {
    const rating = prompt(`Score the response for ${cmpId} (1-5):`, "5");
    if(!rating || isNaN(rating) || rating < 1 || rating > 5) {
        showToast('Valid rating required betwen 1-5', 'error');
        return;
    }
    const comments = prompt("Any additional comments?");
    
    const result = await apiFetch('/feedback', {
        method: 'POST',
        body: JSON.stringify({
            responseId: respId,
            rating: parseInt(rating),
            comments: comments || ''
        })
    });

    if (result && result.success) {
        showToast('Feedback stored successfully.');
        loadCitizenDashboard();
    }
}

// ===== STAFF FUNCTIONS ===== //
async function loadStaffDashboard() {
    setPageTitle("Assigned Task Queue");
    renderContent(document.getElementById('tpl-data-table').innerHTML);
    
    const complaints = await apiFetch('/complaints');
    const responses = await apiFetch('/responses');

    if (!complaints) return;

    const filtered = complaints.filter(c => c.status !== 'Dismissed');

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

async function updateStatus(cmpId, status) {
    const result = await apiFetch(`/complaints/${cmpId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
    });
    if (result && result.success) {
        showToast(`Status updated to ${status}`);
        if(currentUser.role === 'Staff') loadStaffDashboard();
        else loadAdminDashboard();
    }
}

async function provideResponse(cmpId) {
    const text = prompt(`Enter resolution response for ${cmpId}:`);
    if(!text) return;

    const result = await apiFetch('/responses', {
        method: 'POST',
        body: JSON.stringify({
            complaintId: cmpId,
            staffId: currentUser.id,
            text: text
        })
    });

    if (result && result.success) {
        // Auto resolve
        await updateStatus(cmpId, 'Resolved'); 
    }
}

// ===== ADMIN FUNCTIONS ===== //
async function loadAdminDashboard() {
    setPageTitle("Global Complaint Analytics & Overview");
    
    const complaints = await apiFetch('/complaints');
    if (!complaints) return;
    
    // Analytics Metrics Feature
    const resolved = complaints.filter(c => c.status === 'Resolved').length;
    const pending = complaints.filter(c => c.status === 'Pending').length;
    const progress = complaints.filter(c => c.status === 'In Progress').length;

    let analyticsHtml = `
        <div style="display:flex;gap:1.5rem;margin-bottom:1.5rem;" class="reveal">
            <div class="glass-panel" style="flex:1;padding:1.5rem;text-align:center;">
                <h4 style="color:var(--text-muted);margin-bottom:0.5rem;">Total Complaints</h4>
                <h2 style="font-size:2rem;color:var(--accent-neon);">${complaints.length}</h2>
            </div>
            <div class="glass-panel" style="flex:1;padding:1.5rem;text-align:center;">
                <h4 style="color:var(--text-muted);margin-bottom:0.5rem;">Pending</h4>
                <h2 style="font-size:2rem;color:var(--status-pending);">${pending}</h2>
            </div>
            <div class="glass-panel" style="flex:1;padding:1.5rem;text-align:center;">
                <h4 style="color:var(--text-muted);margin-bottom:0.5rem;">Resolved</h4>
                <h2 style="font-size:2rem;color:var(--status-resolved);">${resolved}</h2>
            </div>
        </div>
        <div style="display:flex; justify-content:flex-end; margin-bottom: 1rem;" class="reveal">
            <button class="btn btn-outline" onclick="window.print()"><i class="uil uil-print"></i> Generate PDF Report</button>
        </div>
    `;

    renderContent(analyticsHtml + document.getElementById('tpl-data-table').innerHTML);
    
    const dtHead = document.getElementById('dt-head');
    const dtBody = document.getElementById('dt-body');
    
    dtHead.innerHTML = `
        <tr>
            <th>Ticket</th>
            <th>Reporter ID</th>
            <th>Category</th>
            <th>Logged Date</th>
            <th>Status</th>
            <th>Manage</th>
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

async function adminDelete(id) {
    if(confirm('Permanently eradicate this record from LTCE database?')) {
        const result = await apiFetch(`/complaints/${id}`, { method: 'DELETE' });
        if (result && result.success) {
            showToast('Record Purged');
            loadAdminDashboard();
        }
    }
}

async function loadAdminUsers() {
    setPageTitle("System Users");
    renderContent(document.getElementById('tpl-data-table').innerHTML);
    
    const users = await apiFetch('/users');
    if (!users) return;

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
