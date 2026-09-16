// ==============================================================================
// MASCO INDUSTRIES LIMITED - AUTHENTICATION & ACCESS GUARD
// Multi-Tier Role-Based Security: Worker, Supervisor, Admin, Master Admin
// ==============================================================================

const Auth = {
  STORAGE_KEY: 'masco_auth_user',

  // Pre-seeded Demo Users for Offline / Fallback Authentication
  DEFAULT_USERS: [
    {
      id: '44444444-4444-4444-4444-444444444444',
      name: 'Fayzar IT Master Admin',
      mobile: '01611000004',
      pin: '9999',
      role: 'master_admin',
      department: 'Systems & Architecture'
    },
    {
      id: '33333333-3333-3333-3333-333333333333',
      name: 'Masco Commercial Admin',
      mobile: '01911000003',
      pin: '3456',
      role: 'admin',
      department: 'Commercial Management'
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      name: 'Kamrul Hasan - Floor Supervisor',
      mobile: '01811000002',
      pin: '2345',
      role: 'supervisor',
      department: 'Export Operations'
    },
    {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Md. Rafiqul Islam - Operator',
      mobile: '01711000001',
      pin: '1234',
      role: 'worker',
      supervisor_id: '22222222-2222-2222-2222-222222222222',
      department: 'Data Entry & Packing'
    },
    {
      id: '11111111-1111-1111-1111-222222222222',
      name: 'Anisur Rahman - Entry Operator',
      mobile: '01711000002',
      pin: '1234',
      role: 'worker',
      supervisor_id: '22222222-2222-2222-2222-222222222222',
      department: 'Data Entry & Packing'
    }
  ],

  // 1. Get Logged In User
  getUser: function() {
    try {
      const u = sessionStorage.getItem(this.STORAGE_KEY) || localStorage.getItem(this.STORAGE_KEY);
      return u ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  },

  // 2. Set User Session
  setUser: function(user, remember = true) {
    const data = JSON.stringify(user);
    sessionStorage.setItem(this.STORAGE_KEY, data);
    if (remember) {
      localStorage.setItem(this.STORAGE_KEY, data);
    }
  },

  // 3. Logout
  logout: function() {
    sessionStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.STORAGE_KEY);
    window.location.href = 'login.html';
  },

  // 4. Role Helpers
  isWorker: function() {
    const u = this.getUser();
    return u && u.role === 'worker';
  },

  isSupervisor: function() {
    const u = this.getUser();
    return u && u.role === 'supervisor';
  },

  isAdmin: function() {
    const u = this.getUser();
    return u && (u.role === 'admin' || u.role === 'master_admin');
  },

  isMasterAdmin: function() {
    const u = this.getUser();
    return u && u.role === 'master_admin';
  },

  // 5. Login Function
  login: async function(mobile, pin) {
    const cleanMobile = mobile.trim().replace(/[\s\-]/g, '');
    const cleanPin = pin.trim();

    // A. Try API / Supabase query
    try {
      if (window.API && window.API.loginUser) {
        const res = await window.API.loginUser(cleanMobile, cleanPin);
        if (res.success && res.data) {
          this.setUser(res.data);
          return { success: true, user: res.data };
        }
      }
    } catch (e) {
      console.warn('API login attempt failed:', e);
    }

    // B. Check Local / Default users fallback
    const storedUsers = JSON.parse(localStorage.getItem('masco_users') || 'null') || this.DEFAULT_USERS;
    const match = storedUsers.find(u => u.mobile === cleanMobile && u.pin === cleanPin);

    if (match) {
      if (match.is_active === false) {
        return { success: false, error: 'আপনার অ্যাকাউন্টটি ডিঅ্যাক্টিভেট করা হয়েছে। এডমিনের সাথে যোগাযোগ করুন।' };
      }
      this.setUser(match);
      return { success: true, user: match };
    }

    return { success: false, error: 'ভুল মোবাইল নম্বর অথবা গোপন পিন। অনুগ্রহ করে আবার চেষ্টা করুন।' };
  },

  // 6. Access Guard: Check Page Access
  guard: function() {
    const path = window.location.pathname.toLowerCase();
    const isLoginPage = path.includes('login.html');
    const user = this.getUser();

    if (!user && !isLoginPage) {
      // Not logged in -> Redirect immediately to login.html
      const redirectUrl = window.location.href;
      sessionStorage.setItem('masco_redirect_after_login', redirectUrl);
      window.location.href = 'login.html';
      return false;
    }

    if (user && isLoginPage) {
      // Already logged in -> Redirect to dashboard
      window.location.href = 'index.html';
      return false;
    }

    if (user) {
      // Role based page restrictions
      if (this.isWorker()) {
        // Workers cannot access client or user management
        if (path.includes('clients.html') || path.includes('users.html')) {
          alert('অননুমোদিত এক্সেস! এই পেজে প্রবেশের অনুমতি শুধুমাত্র এডমিনের রয়েছে।');
          window.location.href = 'index.html';
          return false;
        }
      } else if (this.isSupervisor()) {
        // Supervisors cannot access user management
        if (path.includes('users.html')) {
          alert('অননুমোদিত এক্সেস! এই পেজে প্রবেশের অনুমতি শুধুমাত্র এডমিনের রয়েছে।');
          window.location.href = 'index.html';
          return false;
        }
      }
    }

    return true;
  },

  // 7. Inject Navigation User Profile & Role Badges
  renderNavUser: function() {
    const user = this.getUser();
    if (!user) return;

    const navLinks = document.querySelector('.nav-links');
    if (!navLinks) return;

    // Create or find user menu pill
    let userPill = document.getElementById('navUserPill');
    if (!userPill) {
      userPill = document.createElement('div');
      userPill.id = 'navUserPill';
      userPill.style.display = 'flex';
      userPill.style.alignItems = 'center';
      userPill.style.gap = '8px';
      userPill.style.background = 'rgba(255, 255, 255, 0.12)';
      userPill.style.padding = '4px 10px';
      userPill.style.borderRadius = '20px';
      userPill.style.fontSize = '12px';
      userPill.style.color = '#ffffff';
      userPill.style.border = '1px solid rgba(255, 255, 255, 0.2)';

      // Role Badge Color
      let roleLabel = 'কর্মী (Worker)';
      let badgeBg = '#3b82f6';
      if (user.role === 'supervisor') {
        roleLabel = 'সুপারভাইজার (Supervisor)';
        badgeBg = '#0f766e';
      } else if (user.role === 'admin') {
        roleLabel = 'কোম্পানি এডমিন (Admin)';
        badgeBg = '#d97706';
      } else if (user.role === 'master_admin') {
        roleLabel = 'মাস্টার এডমিন (Master)';
        badgeBg = '#7c3aed';
      }

      userPill.innerHTML = `
        <span style="background: ${badgeBg}; padding: 2px 7px; border-radius: 12px; font-weight: 700; font-size: 10px; text-transform: uppercase;">
          ${roleLabel}
        </span>
        <strong style="color: #fff;">${user.name.split(' ')[0]}</strong>
        <button id="btnNavLogout" title="Logout" style="background: rgba(239, 68, 68, 0.85); color: #fff; border: none; padding: 3px 8px; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: bold; margin-left: 4px;">
          🚪 লগআউট
        </button>
      `;

      navLinks.appendChild(userPill);

      document.getElementById('btnNavLogout').addEventListener('click', () => {
        if (confirm('আপনি কি নিশ্চিতভাবে লগআউট করতে চান?')) {
          Auth.logout();
        }
      });
    }

    // Role-based Nav link visibility
    if (this.isWorker()) {
      // Hide Buyers / Clients for workers
      document.querySelectorAll('a[href="clients.html"], a[href="users.html"]').forEach(el => el.style.display = 'none');
    } else if (this.isSupervisor()) {
      // Hide Users management
      document.querySelectorAll('a[href="users.html"]').forEach(el => el.style.display = 'none');
    } else if (this.isAdmin()) {
      // Add Users Management link if not exists
      let usersLink = document.querySelector('a[href="users.html"]');
      if (!usersLink) {
        usersLink = document.createElement('a');
        usersLink.href = 'users.html';
        usersLink.className = 'nav-link';
        usersLink.textContent = 'ইউজার ম্যানেজমেন্ট';
        // Insert before navUserPill
        navLinks.insertBefore(usersLink, userPill);
      }
    }
  }
};

// Auto run Guard on script load
document.addEventListener('DOMContentLoaded', () => {
  if (Auth.guard()) {
    Auth.renderNavUser();
  }
});

window.Auth = Auth;
