// --- CONFIGURACIÓN ---
const DB_KEY = 'TecnoArenaDB_Final';
const DEFAULT_ADMIN = {
    id: 'admin-01', name: 'Tecno Admin', user: 'Tecno', pass: 'Arena', 
    email: 'admin@tecno.com', phone: '0000', sex: 'O', role: 'admin', 
    club: null, leagues: [], requests: [] 
};

let currentRankingGame = 'tekken';
let currentRankingDiv = 'diamante';

document.addEventListener('DOMContentLoaded', () => {
    initDB();
    checkSession();
    navTo('welcome');
});

function initDB() {
    if (!localStorage.getItem(DB_KEY)) {
        const initialData = {
            users: [DEFAULT_ADMIN],
            rankings: { tekken: [], smash: [] },
            requests: [] 
        };
        saveDB(initialData);
    } else {
        // Check admin integrity
        let db = getDB();
        if(!db || !db.users) {
             // Reset corrupt DB
             localStorage.removeItem(DB_KEY);
             initDB();
             return;
        }
        if(!db.users.find(u => u.user === 'Tecno')) {
            db.users.push(DEFAULT_ADMIN);
            saveDB(db);
        }
    }
}

function getDB() { return JSON.parse(localStorage.getItem(DB_KEY)); }
function saveDB(data) { localStorage.setItem(DB_KEY, JSON.stringify(data)); }

// --- NAVEGACIÓN ---
function navTo(sectionId) {
    // Ocultar todas las secciones
    document.querySelectorAll('.main-section').forEach(el => el.classList.remove('active'));
    
    // Mostrar target
    const target = document.getElementById(sectionId);
    if (target) {
        target.classList.add('active');
        window.scrollTo(0,0);
        
        if (sectionId === 'ranking') renderRanking();
        if (sectionId === 'profile') renderProfile();
        if (sectionId === 'config') renderConfig();
        if (sectionId === 'admin-panel') renderAdminPanel(); // Importante
    }
}

// --- AUTH ---
function login() {
    const u = document.getElementById('login-user').value;
    const p = document.getElementById('login-pass').value;
    
    if(!u || !p) return alert("Ingrese datos");

    const db = getDB();
    const user = db.users.find(usr => (usr.user === u || usr.email === u) && usr.pass === p);
    
    if (user) {
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        checkSession();
        document.getElementById('login-user').value = '';
        document.getElementById('login-pass').value = '';
        navTo('welcome');
    } else {
        alert("Credenciales incorrectas");
    }
}

function logout() {
    sessionStorage.removeItem('currentUser');
    checkSession();
    navTo('welcome');
}

function checkSession() {
    const session = JSON.parse(sessionStorage.getItem('currentUser'));
    const authBtns = document.getElementById('auth-buttons');
    const userPanel = document.getElementById('user-panel');
    const btnAdmin = document.getElementById('btn-admin-panel');
    
    // Botones de solicitud
    const clubGuest = document.getElementById('club-req-guest');
    const clubAuth = document.getElementById('club-req-auth');
    const leagueGuest = document.getElementById('league-req-guest');
    const leagueAuth = document.getElementById('league-req-auth');

    if (session) {
        authBtns.style.display = 'none';
        userPanel.style.display = 'flex'; // FIX: Usar flex para alinear items
        
        // Avatar inicial
        document.getElementById('header-avatar').textContent = session.name.charAt(0).toUpperCase();

        // Botón Admin
        if (session.role === 'admin') {
            btnAdmin.classList.remove('hidden');
        } else {
            btnAdmin.classList.add('hidden');
        }

        if(clubAuth) clubAuth.classList.remove('hidden');
        if(clubGuest) clubGuest.classList.add('hidden');
        if(leagueAuth) leagueAuth.classList.remove('hidden');
        if(leagueGuest) leagueGuest.classList.add('hidden');

    } else {
        authBtns.style.display = 'flex';
        userPanel.style.display = 'none';

        if(clubAuth) clubAuth.classList.add('hidden');
        if(clubGuest) clubGuest.classList.remove('hidden');
        if(leagueAuth) leagueAuth.classList.add('hidden');
        if(leagueGuest) leagueGuest.classList.remove('hidden');
    }
}

function register() {
    const name = document.getElementById('reg-name').value;
    const user = document.getElementById('reg-user').value;
    const email = document.getElementById('reg-email').value;
    const phone = document.getElementById('reg-phone').value;
    const sex = document.getElementById('reg-sex').value;
    const pass = document.getElementById('reg-pass').value;

    if (!name || !user || !pass) return alert("Datos incompletos");

    const db = getDB();
    if (db.users.find(u => u.user === user)) return alert("Usuario existe");

    const newUser = {
        id: Date.now().toString(),
        name, user, email, phone, sex, pass,
        role: 'user', club: null, leagues: [], requests: []
    };

    db.users.push(newUser);
    saveDB(db);
    alert("Registro exitoso.");
    navTo('welcome');
}

// --- PERFIL ---
function renderProfile() {
    const session = JSON.parse(sessionStorage.getItem('currentUser'));
    if(!session) return;
    const db = getDB();
    const u = db.users.find(user => user.id === session.id);
    
    document.getElementById('p-avatar-lg').textContent = u.name.charAt(0).toUpperCase();
    document.getElementById('p-name').innerText = u.name;
    document.getElementById('p-nick').innerText = u.user;
    document.getElementById('p-email').innerText = u.email;
    document.getElementById('p-phone').innerText = u.phone;
    document.getElementById('p-club').innerText = u.club ? u.club : 'Ninguna';

    const container = document.getElementById('p-leagues');
    container.innerHTML = '';
    
    let found = false;
    ['tekken', 'smash'].forEach(game => {
        const rank = db.rankings[game].find(r => r.user === u.user);
        if(rank) {
            found = true;
            container.innerHTML += `<p>${game.toUpperCase()}: ${rank.division} - ${rank.score} pts</p>`;
        }
    });
    if(!found) container.innerHTML = '<p>No participas en ligas.</p>';
}

function renderConfig() {
    const session = JSON.parse(sessionStorage.getItem('currentUser'));
    if(!session) return;
    const db = getDB();
    const u = db.users.find(user => user.id === session.id);
    
    document.getElementById('conf-name').value = u.name;
    document.getElementById('conf-phone').value = u.phone;
    
    const container = document.getElementById('config-requests-status');
    container.innerHTML = '';
    const reqs = db.requests.filter(r => r.userId === u.id);
    
    if(reqs.length === 0) container.innerHTML = '<p>Sin solicitudes.</p>';
    else {
        reqs.forEach(r => {
            container.innerHTML += `<p>${r.type.toUpperCase()} (${r.detail}): <strong>${r.status}</strong></p>`;
        });
    }
}

function updateUser() {
    const session = JSON.parse(sessionStorage.getItem('currentUser'));
    const name = document.getElementById('conf-name').value;
    const phone = document.getElementById('conf-phone').value;
    const pass = document.getElementById('conf-pass').value;
    
    const db = getDB();
    const idx = db.users.findIndex(u => u.id === session.id);
    
    if(idx !== -1) {
        db.users[idx].name = name;
        db.users[idx].phone = phone;
        if(pass) db.users[idx].pass = pass;
        saveDB(db);
        sessionStorage.setItem('currentUser', JSON.stringify(db.users[idx]));
        alert("Actualizado.");
        renderProfile();
        renderConfig();
    }
}

function deleteUser() {
    if(confirm("¿Borrar cuenta?")) {
        const session = JSON.parse(sessionStorage.getItem('currentUser'));
        let db = getDB();
        db.users = db.users.filter(u => u.id !== session.id);
        // Limpiar datos relacionados...
        saveDB(db);
        logout();
    }
}

// --- SOLICITUDES ---
function submitRequest(type) {
    const session = JSON.parse(sessionStorage.getItem('currentUser'));
    if(!session) return alert("Inicia sesión.");
    const db = getDB();
    
    if(db.requests.find(r => r.userId === session.id && r.type === type && r.status === 'Pendiente')) {
        return alert("Ya tienes una solicitud pendiente.");
    }
    
    let detail = (type === 'club') ? document.getElementById('req-club-select').value : document.getElementById('req-liga-game').value;
    let msg = (type === 'club') ? document.getElementById('req-club-msg').value : document.getElementById('req-liga-msg').value;
    
    db.requests.push({
        id: Date.now(), userId: session.id, userName: session.user,
        type, detail, message: msg, status: 'Pendiente'
    });
    saveDB(db);
    alert("Solicitud Enviada");
    navTo('config');
}

// --- RANKING ---
function setRankingGame(game) {
    currentRankingGame = game;
    document.querySelectorAll('.btn-game').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    renderRanking();
}
function setRankingDiv(div) {
    currentRankingDiv = div;
    document.querySelectorAll('.btn-div').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    renderRanking();
}
function renderRanking() {
    const db = getDB();
    const tbody = document.getElementById('ranking-body');
    tbody.innerHTML = '';
    let list = (db.rankings[currentRankingGame] || []).filter(r => r.division === currentRankingDiv);
    list.sort((a,b) => b.score - a.score);
    list.forEach((item, i) => {
        tbody.innerHTML += `<tr><td>${i+1}</td><td>${item.user}</td><td>${item.score}</td></tr>`;
    });
}
function filterRanking() {
    const t = document.getElementById('ranking-search').value.toLowerCase();
    const db = getDB();
    const list = (db.rankings[currentRankingGame] || []).filter(r => r.user.toLowerCase().includes(t));
    const tbody = document.getElementById('ranking-body');
    tbody.innerHTML = '';
    list.forEach((item, i) => {
        tbody.innerHTML += `<tr><td>${i+1}</td><td>${item.user} (${item.division})</td><td>${item.score}</td></tr>`;
    });
}


// --- ADMIN PANEL (REHECHO) ---
function renderAdminPanel() {
    const db = getDB();
    
    // 1. Llenar Selectors (Users)
    const users = db.users.filter(u => u.role !== 'admin');
    const selects = ['adm-div-user', 'adm-club-user', 'adm-perm-user'];
    
    selects.forEach(id => {
        const el = document.getElementById(id);
        if(el) {
            el.innerHTML = '<option value="">Seleccionar Usuario</option>';
            users.forEach(u => {
                el.innerHTML += `<option value="${u.user}">${u.user}</option>`;
            });
        }
    });

    // 2. Llenar Requests
    const list = document.getElementById('admin-requests-list');
    if(list) {
        list.innerHTML = '';
        const pending = (db.requests || []).filter(r => r.status === 'Pendiente');
        if(pending.length === 0) list.innerHTML = '<li>No hay solicitudes pendientes</li>';
        
        pending.forEach(req => {
            list.innerHTML += `
                <li class="req-item">
                    <div>
                        <strong>${req.userName}</strong>: ${req.type} (${req.detail})
                        <br><small>${req.message || ''}</small>
                    </div>
                    <div>
                        <button class="btn-neon-sm" style="color:lime; border-color:lime" onclick="adminHandleReq(${req.id}, true)">✔</button>
                        <button class="btn-neon-sm" style="color:red; border-color:red" onclick="adminHandleReq(${req.id}, false)">✖</button>
                    </div>
                </li>
            `;
        });
    }
}

function adminAssignLeague() {
    const user = document.getElementById('adm-div-user').value || document.getElementById('adm-div-manual').value;
    const game = document.getElementById('adm-div-game').value;
    const div = document.getElementById('adm-div-rank').value;
    const score = parseInt(document.getElementById('adm-div-score').value);
    
    if(!user || isNaN(score)) return alert("Datos incompletos");
    
    const db = getDB();
    if(!db.rankings[game]) db.rankings[game] = [];
    
    const idx = db.rankings[game].findIndex(r => r.user === user);
    const entry = { user, division: div, score };
    
    if(idx !== -1) db.rankings[game][idx] = entry;
    else db.rankings[game].push(entry);
    
    saveDB(db);
    alert("Ranking actualizado");
}

function adminAssignClub() {
    const user = document.getElementById('adm-club-user').value || document.getElementById('adm-club-manual').value;
    const club = document.getElementById('adm-club-type').value;
    if(!user) return alert("Seleccione usuario");
    
    const db = getDB();
    const idx = db.users.findIndex(u => u.user === user);
    if(idx !== -1) {
        db.users[idx].club = club;
        saveDB(db);
        alert("Club asignado");
    } else alert("Usuario no encontrado");
}

function adminMakeAdmin() {
    const user = document.getElementById('adm-perm-user').value;
    if(!user) return;
    const db = getDB();
    const idx = db.users.findIndex(u => u.user === user);
    if(idx !== -1) {
        db.users[idx].role = 'admin';
        saveDB(db);
        alert("Permisos asignados");
    }
}

function adminResetDB() {
    if(confirm("¿Resetear todo?")) {
        localStorage.removeItem(DB_KEY);
        initDB();
        location.reload();
    }
}

function adminHandleReq(id, approve) {
    const db = getDB();
    const idx = db.requests.findIndex(r => r.id === id);
    if(idx === -1) return;
    
    const req = db.requests[idx];
    req.status = approve ? 'Aprobada' : 'Rechazada';
    
    if(approve) {
        const uIdx = db.users.findIndex(u => u.id === req.userId);
        if(uIdx !== -1) {
            if(req.type === 'club') db.users[uIdx].club = req.detail;
            else {
                const game = req.detail;
                if(!db.rankings[game].find(r => r.user === req.userName)) {
                    db.rankings[game].push({ user: req.userName, division: 'bronce', score: 0 });
                }
            }
        }
    }
    saveDB(db);
    renderAdminPanel();
}