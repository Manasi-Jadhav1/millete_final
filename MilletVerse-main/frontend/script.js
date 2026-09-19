// MilletVerse Global Script - Botanica Update
// Handles Cart State, Auth State, and UI Animations

// Initialize global state if not exists
if (!localStorage.getItem('milletCart')) {
    localStorage.setItem('milletCart', JSON.stringify([]));
}
if (!localStorage.getItem('milletUser')) {
    localStorage.setItem('milletUser', JSON.stringify({ loggedIn: false, role: 'user' }));
}
if (!localStorage.getItem('milletProducts')) {
    localStorage.setItem('milletProducts', JSON.stringify([]));
}

// Global UI Updater
async function updateCartCount() {
    const user = JSON.parse(localStorage.getItem('milletSession'));
    let count = 0;
    
    if (user && user.token) {
        try {
            const response = await fetch('http://localhost:5000/api/cart/count', {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            const data = await response.json();
            if (data.success) count = data.data.count;
        } catch (e) {
            console.error('Failed to fetch cart count from server', e);
            const cart = JSON.parse(localStorage.getItem('milletCart') || '[]');
            count = cart.reduce((acc, item) => acc + item.qty, 0);
        }
    } else {
        const cart = JSON.parse(localStorage.getItem('milletCart') || '[]');
        count = cart.reduce((acc, item) => acc + item.qty, 0);
    }

    const badge = document.getElementById('cart-count');
    if (badge) {
        badge.innerText = count;
    }
}

// Add to Cart
async function addToCart(title, price, img, id, qty = 1) {
    const user = JSON.parse(localStorage.getItem('milletSession'));
    let addedToCloud = false;

    if (user && user.token && id) {
        try {
            const response = await fetch('http://localhost:5000/api/cart/add', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({ product_id: id, quantity: qty })
            });
            const data = await response.json();
            if (data.success) {
                showToast(`${title} added to your cloud harvest!`);
                addedToCloud = true;
            } else {
                console.warn('API cart add returned success:false', data.message);
            }
        } catch (e) {
            console.error('API cart add failed', e);
        }
    }

    if (!addedToCloud) {
        // Local Fallback
        let cart = JSON.parse(localStorage.getItem('milletCart') || '[]');
        const existing = cart.find(item => item.id == id || item.title === title);
        if (existing) {
            existing.qty += qty;
        } else {
            cart.push({ id, title, price, img, qty });
        }
        
        localStorage.setItem('milletCart', JSON.stringify(cart));
        showToast(`${title} added to local basket!`);
    }

    updateCartCount();
}

// Sync Local Cart with Server
async function syncLocalCartWithServer() {
    const user = JSON.parse(localStorage.getItem('milletSession'));
    if (!user || !user.token) return;

    const localCart = JSON.parse(localStorage.getItem('milletCart') || '[]');
    if (localCart.length === 0) return;

    // Filter items that have an ID (database products)
    const itemsToSync = localCart.filter(item => item.id).map(item => ({
        product_id: item.id,
        quantity: item.qty
    }));

    if (itemsToSync.length === 0) return;

    try {
        const response = await fetch('http://localhost:5000/api/cart/sync', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify({ items: itemsToSync })
        });
        const data = await response.json();
        if (data.success) {
            console.log('Cart synced with server');
            localStorage.setItem('milletCart', JSON.stringify([])); // Clear local after sync
            updateCartCount();
        }
    } catch (e) {
        console.error('Failed to sync cart', e);
    }
}

// Global Toast Notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    const icon = type === 'warn'
        ? '<i class="fa-solid fa-triangle-exclamation text-yellow-400 mr-2"></i>'
        : '<i class="fa-solid fa-check-circle text-accent mr-2"></i>';
    toast.className = 'fixed bottom-10 right-10 bg-textDark text-white px-6 py-3 rounded-xl shadow-2xl z-50 transform translate-y-20 opacity-0 transition-all duration-300 font-medium flex items-center gap-2';
    toast.innerHTML = `${icon} ${message}`;
    document.body.appendChild(toast);
    
    setTimeout(() => { toast.classList.remove('translate-y-20', 'opacity-0'); }, 100);
    setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Document Ready
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();

    // Fade-in animation observer
    const fadeElements = document.querySelectorAll('.fade-in-section');
    if(fadeElements.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                }
            });
        }, { threshold: 0.1 });

        fadeElements.forEach(el => observer.observe(el));
    }

    // Attempt to render custom products if on products page
    if (document.getElementById('products-container')) {
        renderMarketplaceProducts();
    }

    // Custom filtering tabs Logic (For Products page)
    const filterBtns = document.querySelectorAll('.filter-btn');
    if (filterBtns.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.target.getAttribute('data-filter');
                filterBtns.forEach(b => {
                    b.classList.remove('bg-primary', 'text-white');
                    b.classList.add('bg-gray-100', 'text-gray-600');
                });
                e.target.classList.remove('bg-gray-100', 'text-gray-600');
                e.target.classList.add('bg-primary', 'text-white');
                
                // Hide/Show logic 
                const items = document.querySelectorAll('.product-item');
                items.forEach(item => {
                    if (category === 'all' || item.getAttribute('data-category').includes(category)) {
                        item.style.display = 'block';
                    } else {
                        item.style.display = 'none';
                    }
                });
            });
        });
    }

    // Grid vs List View toggle (For Products page)
    const viewBtns = document.querySelectorAll('.view-toggle');
    if (viewBtns.length > 0) {
        viewBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const isList = e.currentTarget.getAttribute('data-view') === 'list';
                const container = document.getElementById('products-container');
                
                viewBtns.forEach(b => b.classList.remove('text-primary'));
                e.currentTarget.classList.add('text-primary');

                if (isList) {
                    // Change to list classes
                    container.classList.remove('grid-cols-1', 'md:grid-cols-3', 'gap-8');
                    container.classList.add('grid-cols-1', 'gap-4');
                    document.querySelectorAll('.product-item').forEach(item => {
                        item.classList.add('flex', 'flex-row', 'items-center', 'text-left');
                        item.querySelector('div:first-child').classList.replace('h-64', 'h-32');
                        item.querySelector('div:first-child').classList.remove('w-full');
                        item.querySelector('div:first-child').classList.add('w-1/3');
                        item.querySelector('.mt-4').classList.add('flex-1', 'px-6', 'py-0', 'mt-0');
                    });
                } else {
                    // Revert to grid classes
                    container.classList.remove('grid-cols-1', 'gap-4');
                    container.classList.add('grid-cols-1', 'md:grid-cols-3', 'gap-8');
                    document.querySelectorAll('.product-item').forEach(item => {
                        if(item.classList.contains('flex')) {
                            item.classList.remove('flex', 'flex-row', 'items-center', 'text-left');
                            item.querySelector('div:first-child').classList.replace('h-32', 'h-64');
                            item.querySelector('div:first-child').classList.remove('w-1/3');
                            item.querySelector('div:first-child').classList.add('w-full');
                            item.querySelector('.flex-1').classList.remove('flex-1', 'px-6', 'py-0', 'mt-0');
                            item.querySelector('.mb-2').parentElement.classList.add('mt-4'); // restore margin
                        }
                    });
                }
            });
        });
    }

});

// Dashboard Management Logic
function handleStartupAddProduct(e) {
    e.preventDefault();
    const session = JSON.parse(localStorage.getItem('milletSession'));
    if (!session || session.role !== 'startup') return;

    const title = document.getElementById('sp-name').value;
    const price = document.getElementById('sp-price').value;
    const category = document.getElementById('sp-category').value;
    const image = document.getElementById('sp-image').value;
    
    const submitBtn = document.getElementById('startup-submit-btn');
    const editId = submitBtn.getAttribute('data-edit-id');

    if (editId) {
        updateCustomProduct(editId, title, price, category, image);
        submitBtn.setAttribute('data-edit-id', '');
        submitBtn.innerText = 'Add to Catalog';
    } else {
        saveCustomProduct(title, price, category, image, session.email, 'startup');
    }

    e.target.reset();
    renderDashboardCatalogs(session);
}

function handleFarmerAddCrop(e) {
    e.preventDefault();
    const session = JSON.parse(localStorage.getItem('milletSession'));
    if (!session || session.role !== 'farmer') return;

    const title = document.getElementById('fm-name').value;
    const price = document.getElementById('fm-price').value;
    const category = document.getElementById('fm-category').value;
    const image = document.getElementById('fm-image').value;

    saveCustomProduct(title, price, category, image, session.email, 'farmer');
    e.target.reset();
    renderDashboardCatalogs(session);
}

function saveCustomProduct(title, price, category, image, email, type) {
    let products = JSON.parse(localStorage.getItem('milletProducts')) || [];
    products.push({
        id: Date.now().toString(),
        title,
        price: parseInt(price),
        category,
        image,
        sellerEmail: email,
        type: type // 'startup' or 'farmer'
    });
    localStorage.setItem('milletProducts', JSON.stringify(products));
    showToast(`${title} added to your catalog successfully!`);
}

function updateCustomProduct(id, title, price, category, image) {
    let products = JSON.parse(localStorage.getItem('milletProducts')) || [];
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
        products[index] = { ...products[index], title, price: parseInt(price), category, image };
        localStorage.setItem('milletProducts', JSON.stringify(products));
        showToast(`Product updated successfully!`);
    }
}

function loadStartupProductForEdit(id) {
    const products = JSON.parse(localStorage.getItem('milletProducts')) || [];
    const prod = products.find(p => p.id === id);
    if (!prod) return;
    
    document.getElementById('sp-name').value = prod.title;
    document.getElementById('sp-price').value = prod.price;
    document.getElementById('sp-category').value = prod.category;
    document.getElementById('sp-image').value = prod.image;
    
    const submitBtn = document.getElementById('startup-submit-btn');
    submitBtn.setAttribute('data-edit-id', id);
    submitBtn.innerText = 'Update Catalog';
    
    submitBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function renderDashboardCatalogs(session = null) {
    if (!session) {
        session = JSON.parse(localStorage.getItem('milletSession'));
        if (!session) return;
    }

    const products = JSON.parse(localStorage.getItem('milletProducts')) || [];
    const userProducts = products.filter(p => p.sellerEmail === session.email);

    let catalogDiv = null;
    let fallbackText = '';
    
    if (session.role === 'startup') {
        catalogDiv = document.getElementById('startup-catalog');
        fallbackText = 'You have no processed products listed yet.';
        
        // Update stats purely for Startup
        const varietyEl = document.getElementById('startup-variety');
        if (varietyEl) varietyEl.innerText = userProducts.length;
        
        renderMockStartupOrders();
    } else if (session.role === 'farmer') {
        catalogDiv = document.getElementById('farmer-catalog');
        fallbackText = 'You have no active crop fields listed yet.';
    }

    if (!catalogDiv) return;

    if (userProducts.length === 0) {
        catalogDiv.innerHTML = `<div class="col-span-1 md:col-span-2 text-center text-gray-400 py-10 font-black uppercase tracking-widest text-xs">${fallbackText}</div>`;
        return;
    }

    catalogDiv.innerHTML = userProducts.map(p => `
        <div class="flex items-center gap-4 p-4 border border-gray-100 rounded-2xl relative group hover:shadow-xl transition-all">
            <img src="${p.image}" class="w-16 h-16 rounded-xl object-cover">
            <div class="flex-1">
                <h4 class="font-heading font-black text-textDark text-lg">${p.title}</h4>
                <p class="font-black text-accent text-xs">₹${p.price} <span class="text-gray-400 ml-2 uppercase tracking-widest text-[8px]">(${p.category})</span></p>
            </div>
            <div class="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 right-4 absolute md:relative">
                ${session.role === 'startup' ? `<button onclick="loadStartupProductForEdit('${p.id}')" class="text-primary hover:text-primaryDark w-8 h-8 rounded-full bg-primaryLight flex items-center justify-center transition-all shadow-sm"><i class="fa-solid fa-pen text-xs"></i></button>` : ''}
                <button onclick="removeProduct('${p.id}')" class="text-red-400 hover:text-red-500 w-8 h-8 rounded-full bg-red-50 flex items-center justify-center transition-all shadow-sm"><i class="fa-solid fa-trash text-xs"></i></button>
            </div>
        </div>
    `).join('');
}

function removeProduct(id) {
    let products = JSON.parse(localStorage.getItem('milletProducts')) || [];
    products = products.filter(p => p.id !== id);
    localStorage.setItem('milletProducts', JSON.stringify(products));
    renderDashboardCatalogs();
    showToast('Item removed from catalog.', 'warn');
}

function renderMockStartupOrders() {
    const ordersContainer = document.getElementById('startup-orders');
    if (!ordersContainer) return;

    const mockOrders = [
        { id: 'ORD-8924', product: 'Stone-Ground Ragi Mix', user: 'Arjun K.', status: 'Pending', statusColor: 'text-yellow-500' },
        { id: 'ORD-8910', product: 'Pearl Millet Cookies', user: 'Priya S.', status: 'Shipped', statusColor: 'text-blue-500' },
        { id: 'ORD-8850', product: 'Sprouted Ragi Flour', user: 'Rahul V.', status: 'Delivered', statusColor: 'text-green-500' }
    ];

    ordersContainer.innerHTML = mockOrders.map(o => `
        <tr class="hover:bg-gray-50 transition-colors">
            <td class="py-4 px-4"><span class="bg-primaryLight text-primary px-3 py-1 rounded-lg text-xs tracking-widest">${o.id}</span></td>
            <td class="py-4 px-4 text-textDark">${o.product}</td>
            <td class="py-4 px-4">${o.user}</td>
            <td class="py-4 px-4">
                <span class="${o.statusColor} flex items-center gap-2">
                    <i class="fa-solid fa-circle text-[8px]"></i> ${o.status}
                </span>
            </td>
            <td class="py-4 px-4 text-right">
                ${o.status === 'Pending' ? `<button class="text-[10px] bg-accent text-white px-4 py-2 rounded-xl hover:bg-yellow-600 transition tracking-widest font-black" onclick="showToast('Order marked as shipped!')">Ship</button>` : `<span class="text-[10px] text-gray-300 tracking-widest">Done</span>`}
            </td>
        </tr>
    `).join('');
}

// Ensure catalog is rendered if on dashboard
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('startup-catalog') || document.getElementById('farmer-catalog')) {
        renderDashboardCatalogs();
    }
});

async function renderMarketplaceProducts() {
    const container = document.getElementById('products-container');
    if (!container) return;

    // Fetch from backend
    try {
        const res = await fetch('http://localhost:5000/api/products?limit=8');
        const data = await res.json();
        if (data.success && data.data.length) {
            data.data.forEach(p => {
                const card = document.createElement('div');
                card.className = `product-item hover-card bg-white rounded-[2.5rem] overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.03)] border border-gray-100 relative group`;
                card.setAttribute('data-category', p.millet_type);
                
                card.innerHTML = `
                    <div class="aspect-square bg-gray-50 flex items-center justify-center relative overflow-hidden">
                        <i class="fa-solid fa-leaf text-gray-200/50 text-9xl absolute -bottom-10 -right-10 group-hover:scale-125 transition-transform duration-700"></i>
                        <img src="${p.image_url}" class="w-full h-full object-cover z-10 group-hover:scale-105 transition-transform duration-500" alt="${p.name}" onerror="this.src='https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=2574&auto=format&fit=crop';">
                        <div class="absolute top-6 left-6 bg-primary text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg z-20">Direct Harvest</div>
                        <button class="absolute top-6 right-6 text-gray-300 hover:text-red-500 bg-white w-10 h-10 rounded-full flex items-center justify-center shadow-xl transition-all hover:scale-110 z-20"><i class="fa-solid fa-heart"></i></button>
                    </div>
                    <div class="p-8">
                        <div class="flex flex-col mb-4">
                            <span class="text-[10px] font-black uppercase tracking-widest text-accent mb-1">${p.millet_type}</span>
                            <h3 class="font-heading font-extrabold text-2xl text-textDark leading-tight group-hover:text-primary transition-colors">${p.name}</h3>
                        </div>
                        <div class="flex justify-between items-center">
                            <div class="flex flex-col">
                                <span class="font-heading font-extrabold text-3xl text-primary">₹${p.price}</span>
                            </div>
                            <button class="bg-primary hover:bg-primaryDark text-white w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110" onclick="addToCart('${p.name.replace(/'/g, "\\'")}', ${p.price}, '${p.image_url}', '${p.id}')">
                                <i class="fa-solid fa-plus text-xl"></i>
                            </button>
                        </div>
                    </div>
                `;
                container.prepend(card);
            });
        }
    } catch (e) {
        console.error('Failed to fetch marketplace products', e);
    }

    const products = JSON.parse(localStorage.getItem('milletProducts')) || [];
    
    // Reverse so newest are appended at the top (or bottom)
    products.forEach(p => {
        const card = document.createElement('div');
        const badgeColor = p.type === 'farmer' ? 'bg-primaryDark' : 'bg-accent';
        const badgeText = p.type === 'farmer' ? 'Direct Farm' : 'Startup';
        const subColor = p.type === 'farmer' ? 'text-primaryDark' : 'text-accent';
        
        card.className = `product-item hover-card bg-white rounded-[2.5rem] overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.03)] border border-gray-100 relative group`;
        card.setAttribute('data-category', p.category);
        
        card.innerHTML = `
            <div class="aspect-square bg-gray-50 flex items-center justify-center relative overflow-hidden">
                <i class="fa-solid fa-leaf text-gray-200/50 text-9xl absolute -bottom-10 -right-10 group-hover:scale-125 transition-transform duration-700"></i>
                <img src="${p.image}" class="w-full h-full object-cover z-10 group-hover:scale-105 transition-transform duration-500" alt="${p.title}" onerror="this.src='https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=2574&auto=format&fit=crop';">
                <div class="absolute top-6 left-6 ${badgeColor} text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg z-20">${badgeText}</div>
                <button class="absolute top-6 right-6 text-gray-300 hover:text-red-500 bg-white w-10 h-10 rounded-full flex items-center justify-center shadow-xl transition-all hover:scale-110 z-20"><i class="fa-solid fa-heart"></i></button>
            </div>
            <div class="p-8">
                <div class="flex flex-col mb-4">
                    <span class="text-[10px] font-black uppercase tracking-widest ${subColor} mb-1">${p.category}</span>
                    <h3 class="font-heading font-extrabold text-2xl text-textDark leading-tight group-hover:text-primary transition-colors">${p.title}</h3>
                </div>
                <div class="flex items-center gap-1 text-accent text-xs mb-6">
                    <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star-half-stroke"></i>
                </div>
                <div class="flex justify-between items-center">
                    <div class="flex flex-col">
                        <span class="font-heading font-extrabold text-3xl text-primary">₹${p.price}</span>
                    </div>
                    <button class="bg-primary hover:bg-primaryDark text-white w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110" onclick="addToCart('${p.title.replace(/'/g, "\\'")}', ${p.price}, '${p.image}', '${p.id}')">
                        <i class="fa-solid fa-plus text-xl"></i>
                    </button>
                </div>
            </div>
        `;
        // Prepend so user-added elements appear at the top of the grid
        container.prepend(card);
    });
}

function setActiveLink(clickedEl) {
    const allLinks = document.querySelectorAll('.sidebar-link');
    
    // Reset all to unselected
    allLinks.forEach(el => {
        el.classList.remove('bg-primaryDark', 'text-white', 'shadow-2xl', 'scale-105', 'active-link');
        el.classList.add('text-gray-400');
    });

    // Set active
    clickedEl.classList.remove('text-gray-400');
    clickedEl.classList.add('bg-primaryDark', 'text-white', 'shadow-2xl', 'scale-105', 'active-link');
}

// Millet AI Assistant UI
function initChatbot() {
    const chatHtml = `
        <div id="millet-chat-trigger" class="fixed bottom-10 right-10 w-16 h-16 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center cursor-pointer hover:scale-110 transition-all z-[1000] border-4 border-white">
            <i class="fa-solid fa-robot text-2xl"></i>
        </div>
        <div id="millet-chat-window" class="fixed bottom-32 right-10 w-96 bg-white rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.2)] border border-gray-100 flex flex-col overflow-hidden z-[1000] transition-all transform scale-0 origin-bottom-right hidden">
            <div class="bg-primary p-6 text-white flex justify-between items-center">
                <div class="flex items-center gap-4">
                    <div class="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><i class="fa-solid fa-seedling"></i></div>
                    <div>
                        <h4 class="font-black text-sm uppercase tracking-widest">Millet Assistant</h4>
                        <p class="text-[8px] font-bold text-accent uppercase tracking-widest">Ancient Wisdom AI</p>
                    </div>
                </div>
                <button id="close-chat" class="text-white/50 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div id="chat-messages" class="flex-1 p-6 space-y-4 overflow-y-auto h-[400px] bg-primaryLight/30 flex flex-col">
                <div class="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm text-sm font-medium text-textDark border border-gray-50 self-start max-w-[80%]">
                    Namaste! I am your guide to ancient grains. Ask me about weight loss, diabetes, or child nutrition!
                </div>
            </div>
            <div class="p-6 bg-white border-t border-gray-100">
                <div class="flex gap-4">
                    <input id="chat-input" type="text" placeholder="Type your health goal..." class="flex-1 bg-gray-50 border-none rounded-xl px-5 py-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none font-bold">
                    <button id="send-chat" class="bg-primary text-white w-12 h-12 rounded-xl flex items-center justify-center hover:bg-primaryDark transition-all shadow-lg">
                        <i class="fa-solid fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', chatHtml);

    const trigger = document.getElementById('millet-chat-trigger');
    const win = document.getElementById('millet-chat-window');
    const close = document.getElementById('close-chat');
    const input = document.getElementById('chat-input');
    const send = document.getElementById('send-chat');
    const messages = document.getElementById('chat-messages');

    trigger.onclick = () => {
        win.classList.toggle('hidden');
        setTimeout(() => win.classList.toggle('scale-0'), 10);
    };
    close.onclick = () => {
        win.classList.add('scale-0');
        setTimeout(() => win.classList.add('hidden'), 300);
    };

    const addMessage = (text, isUser = false) => {
        const msg = document.createElement('div');
        msg.className = isUser 
            ? 'bg-primary text-white p-4 rounded-2xl rounded-tr-none shadow-md text-sm font-bold self-end max-w-[80%] ml-auto'
            : 'bg-white p-4 rounded-2xl rounded-tl-none shadow-sm text-sm font-medium text-textDark border border-gray-50 self-start max-w-[80%]';
        msg.innerHTML = text.replace(/\*\*(.*?)\*\*/g, '<b class="text-accent">$1</b>');
        messages.appendChild(msg);
        messages.scrollTop = messages.scrollHeight;
    };

    const handleSend = async () => {
        const val = input.value.trim();
        if (!val) return;
        input.value = '';
        addMessage(val, true);

        try {
            const res = await fetch('http://localhost:5000/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: val })
            });
            const data = await res.json();
            if (data.success) {
                setTimeout(() => addMessage(data.data.response), 500);
            }
        } catch (e) {
            addMessage("I'm having trouble connecting to the earth right now. Please try again later.");
        }
    };

    send.onclick = handleSend;
    input.onkeypress = (e) => { if (e.key === 'Enter') handleSend(); };
}

// Update initialization to include chatbot
const originalOnLoad = window.onload;
window.onload = (event) => {
    if (originalOnLoad) originalOnLoad(event);
    initChatbot();
};
