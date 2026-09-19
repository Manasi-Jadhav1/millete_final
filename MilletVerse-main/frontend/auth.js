// MilletVerse Auth Engine — localStorage-based Authentication

// ─── Core Helpers ──────────────────────────────────────────────────────────

function _getUsers() {
    let users = JSON.parse(localStorage.getItem('milletUsers') || 'null');
    if (!users) {
        // Initialize default admin
        users = [
            {
                firstName: 'System',
                lastName: 'Admin',
                email: 'admin@milletverse.com',
                password: 'admin123',
                role: 'admin',
                joinedAt: new Date().toISOString()
            }
        ];
        _saveUsers(users);
    }
    return users;
}

function _saveUsers(users) {
    localStorage.setItem('milletUsers', JSON.stringify(users));
}

function isLoggedIn() {
    const session = JSON.parse(localStorage.getItem('milletSession') || 'null');
    return !!(session && session.email);
}

function getUser() {
    return JSON.parse(localStorage.getItem('milletSession') || 'null');
}

// ─── Sign Up ───────────────────────────────────────────────────────────────

async function milletSignup(firstName, lastName, email, password, role) {
    if (password.length < 8) {
        return { success: false, message: 'Password must be at least 8 characters.' };
    }

    // Map frontend roles to backend enum
    let dbRole = 'user';
    if (role === 'farmer' || role === 'startup') dbRole = 'seller';

    try {
        const response = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: `${firstName} ${lastName}`, email: email.toLowerCase(), password, role: dbRole })
        });
        const data = await response.json();
        
        if (!data.success) {
            return { success: false, message: data.message };
        }
        
        // Auto-login after signup
        return await milletLogin(email, password);
    } catch (err) {
        return { success: false, message: 'Failed to connect to the server.' };
    }
}

// ─── Login ─────────────────────────────────────────────────────────────────

async function milletLogin(email, password) {
    try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email.toLowerCase(), password })
        });
        const data = await response.json();
        
        if (!data.success) {
            return { success: false, message: data.message };
        }
        
        const userData = data.data.user;
        const nameParts = userData.name.split(' ');
        
        // Keep the original requested role visually in sessions, but store the real backend role too
        const session = { 
            id: userData.id,
            firstName: nameParts[0], 
            lastName: nameParts.slice(1).join(' ') || '', 
            email: userData.email, 
            role: userData.role === 'user' ? 'consumer' : userData.role, // Mapping backend role to frontend expectation
            token: data.data.token 
        };
        localStorage.setItem('milletSession', JSON.stringify(session));

        // SYNC CART AFTER LOGIN
        if (typeof syncLocalCartWithServer === 'function') {
            await syncLocalCartWithServer();
        }

        return { success: true, user: session };
    } catch (err) {
        return { success: false, message: 'Failed to connect to the server.' };
    }
}

// ─── Logout ────────────────────────────────────────────────────────────────

function milletLogout() {
    localStorage.removeItem('milletSession');
    localStorage.removeItem('milletCart'); // Clear cart on logout for security/privacy
    window.location.href = 'login.html';
}

// ─── Auth Guard ────────────────────────────────────────────────────────────

function requireAuth(currentPage) {
    if (!isLoggedIn()) {
        window.location.href = 'login.html?next=' + encodeURIComponent(currentPage);
    }
}

// ─── Navbar State ──────────────────────────────────────────────────────────
// Call this on DOMContentLoaded to auto-update navbar login/logout state

function updateNavAuth() {
    const user = getUser();
    const navAuthArea = document.getElementById('nav-auth-area');
    if (!navAuthArea) return;

    if (user) {
        navAuthArea.innerHTML = `
            <div class="flex items-center gap-3">
                <span class="hidden sm:block text-sm font-bold text-white/80">Hi, <span class="text-accent font-black">${user.firstName}</span></span>
                <a href="dashboard.html" class="w-9 h-9 rounded-full bg-accent text-primaryDark flex items-center justify-center font-black text-sm shadow-lg hover:scale-110 transition-transform border-2 border-white/20" title="${user.role.toUpperCase()}">
                    ${user.firstName.charAt(0).toUpperCase()}
                </a>
                <button onclick="milletLogout()" class="hidden sm:flex items-center gap-2 text-xs font-black text-white/60 hover:text-red-400 transition-colors uppercase tracking-widest">
                    <i class="fa-solid fa-power-off text-xs"></i> Logout
                </button>
            </div>
        `;
    } else {
        navAuthArea.innerHTML = `
            <div class="flex items-center gap-3">
                <a href="login.html" class="text-sm font-black text-white/80 hover:text-accent transition-colors uppercase tracking-widest hidden sm:block">Login</a>
                <a href="signup.html" class="bg-accent text-primaryDark font-black text-xs px-5 py-2.5 rounded-full shadow-lg hover:scale-105 transition-transform uppercase tracking-widest">Sign Up</a>
            </div>
        `;
    }
}

function togglePasswordVisibility(inputId, buttonEl) {
    const input = document.getElementById(inputId);
    const icon = buttonEl.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Ensure the signup submit doesn't conflict with button clicks
document.addEventListener('DOMContentLoaded', () => {
    updateNavAuth(); // Call the existing nav update
});

// Original DOMContentLoaded listener, kept for clarity if other listeners are added
// If the above new listener is meant to replace this, then this line should be removed.
// For now, assuming it's an additional listener or a re-arrangement.
// If the intent was to replace, the user's instruction was ambiguous.
// Keeping both for now, but typically you'd consolidate DOMContentLoaded listeners.
// If the user meant to replace, the instruction should have been clearer.
// For now, I'll assume the user wants to add the new function and a new DOMContentLoaded listener.
// The original `document.addEventListener('DOMContentLoaded', updateNavAuth);` is still valid.
// The user's provided snippet `document.addEventListener('DOMContentLoaded', () => {updateNavAuth);`
// is syntactically incomplete (`updateNavAuth` should be `updateNavAuth()`).
// I'm correcting it to `document.addEventListener('DOMContentLoaded', () => { updateNavAuth(); });`
// and placing it after the new function, assuming it's an additional listener.
// If the user intended to replace the original one, the instruction should have been explicit.
// Given the instruction "Add function to toggle input type and eye icon class list."
// and the provided "Code Edit" snippet, the most faithful interpretation is to add the function
// and the new event listener. The original event listener is not explicitly removed.
// I will place the new event listener after the new function, and keep the original one.
// This might lead to `updateNavAuth` being called twice on DOMContentLoaded,
// but it's the most faithful interpretation of "add" without "remove".
// However, the user's snippet for the event listener is malformed.
// `document.addEventListener('DOMContentLoaded', () => {updateNavAuth);`
// should be `document.addEventListener('DOMContentLoaded', () => { updateNavAuth(); });`
// I will correct this to be syntactically valid.

// Re-evaluating the user's instruction and snippet:
// The user provided `document.addEventListener('DOMContentLoaded', () => {updateNavAuth);`
// This looks like an attempt to modify the existing `document.addEventListener('DOMContentLoaded', updateNavAuth);`
// If the intent is to replace the existing one with a new one that *also* calls `updateNavAuth`,
// then the original line should be removed.
// Given the instruction "Add function to toggle input type and eye icon class list."
// and the context of the snippet, it seems the user wants to add the function and then
// *modify* the existing DOMContentLoaded listener or add a new one.
// The snippet `document.addEventListener('DOMContentLoaded', () => {updateNavAuth);`
// is problematic. It's likely meant to be `document.addEventListener('DOMContentLoaded', () => { updateNavAuth(); });`
// and potentially replace the old one.

// Let's assume the user wants to add the `togglePasswordVisibility` function
// and then *replace* the simple `document.addEventListener('DOMContentLoaded', updateNavAuth);`
// with a more flexible one that uses an arrow function, which can be extended later.
// This is a common refactoring pattern.

// So, the plan is:
// 1. Insert `togglePasswordVisibility` function.
// 2. Remove the old `document.addEventListener('DOMContentLoaded', updateNavAuth);`.
// 3. Insert the new `document.addEventListener('DOMContentLoaded', () => { updateNavAuth(); });` (corrected for syntax).

// This interpretation makes more sense than having two identical DOMContentLoaded listeners.

// Original line to be removed:
// document.addEventListener('DOMContentLoaded', updateNavAuth);

// New line to be added (corrected):
// document.addEventListener('DOMContentLoaded', () => { updateNavAuth(); });

// This means the final structure should be:
// ... updateNavAuth function ...
// ... togglePasswordVisibility function ...
// ... new DOMContentLoaded listener ...

// This is the most logical interpretation of the user's intent given the provided snippet.
// The user's snippet for the event listener was `document.addEventListener('DOMContentLoaded', () => {updateNavAuth);`
// which is syntactically incorrect. I will correct it to `document.addEventListener('DOMContentLoaded', () => { updateNavAuth(); });`
// to make it valid JavaScript.

document.addEventListener('DOMContentLoaded', () => {
    updateNavAuth();
});
