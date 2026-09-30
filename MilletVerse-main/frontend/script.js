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
    
    // Producers (Farmer, Startup, Seller) cannot purchase products
    if (user && ['farmer', 'startup', 'seller'].includes(user.role)) {
        showToast('Farmer and Startup accounts are producer accounts and cannot purchase products. Please use a Consumer account.', 'error');
        return;
    }

    let addedToCloud = false;

    // Check if product has farmer details in local storage
    const localProducts = JSON.parse(localStorage.getItem('milletProducts') || '[]');
    const farmerProd = localProducts.find(p => p.id == id || p.title === title || p.name === title);

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
                showToast(`${title} added to your harvest basket!`);
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
            const cartItem = { id, title, price, img, qty };
            if (farmerProd) {
                cartItem.is_farmer = farmerProd.is_farmer || farmerProd.type === 'farmer';
                cartItem.farmer_name = farmerProd.farmer_name || farmerProd.title;
                cartItem.farmer_upi = farmerProd.farmer_upi;
                cartItem.payment_qr = farmerProd.payment_qr || farmerProd.farmer_scanner;
                cartItem.farmer_scanner = farmerProd.farmer_scanner || farmerProd.payment_qr;
                cartItem.farmer_email = farmerProd.farmer_email || farmerProd.sellerEmail;
                cartItem.farmer_id = farmerProd.farmer_id || farmerProd.seller_id;
            }
            cart.push(cartItem);
        }
        
        localStorage.setItem('milletCart', JSON.stringify(cart));
        showToast(`${title} added to basket!`);
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
                        <div class="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-gray-100">
                            <div>
                                <span class="text-[9px] text-gray-400 font-bold uppercase block">Price</span>
                                <span class="font-heading font-extrabold text-2xl text-primary">₹${p.price}</span>
                            </div>
                            <div class="flex items-center gap-1.5">
                                <button class="bg-gray-100 hover:bg-gray-200 text-gray-700 w-10 h-10 rounded-xl flex items-center justify-center transition" title="Add to Bag" onclick="addToCart('${p.name.replace(/'/g, "\\'")}', ${p.price}, '${p.image_url}', '${p.id}')">
                                    <i class="fa-solid fa-bag-shopping text-xs"></i>
                                </button>
                                <button class="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 text-white font-black text-[10px] uppercase tracking-wider px-3.5 py-2.5 rounded-xl shadow-md transition hover:scale-105 flex items-center gap-1" onclick="openQuickBuyModal('${p.id}', '${p.name.replace(/'/g, "\\'")}', ${p.price}, '${p.image_url}', '${p.millet_type || 'Ancient Grain'}', 'All Ages', '${p.farmer_name || ''}', '${p.farmer_upi || ''}', '${p.payment_qr || ''}')">
                                    <i class="fa-solid fa-bolt text-amber-300"></i> Buy
                                </button>
                            </div>
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
        const isFarmer = p.is_farmer || p.type === 'farmer';
        const badgeColor = isFarmer ? 'bg-emerald-700' : 'bg-accent';
        const badgeText = isFarmer ? 'Direct Farm Harvest' : 'Startup';
        const subColor = isFarmer ? 'text-emerald-800' : 'text-accent';
        const titleText = p.title || p.name || 'Millet Product';
        const imgUrl = p.image || p.image_url || 'assets/ragi.png';
        const categoryText = p.category || p.millet_type || 'Millet';
        const farmerName = p.farmer_name || '';
        const farmerUpi = p.farmer_upi || '';
        const paymentQr = p.payment_qr || '';
        
        card.className = `product-item hover-card bg-white rounded-[2.5rem] overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.03)] border border-gray-100 relative group`;
        card.setAttribute('data-category', categoryText.toLowerCase());
        
        card.innerHTML = `
            <div class="aspect-square bg-gray-50 flex items-center justify-center relative overflow-hidden">
                <i class="fa-solid fa-leaf text-gray-200/50 text-9xl absolute -bottom-10 -right-10 group-hover:scale-125 transition-transform duration-700"></i>
                <img src="${imgUrl}" class="w-full h-full object-cover z-10 group-hover:scale-105 transition-transform duration-500" alt="${titleText}" onerror="this.src='https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=2574&auto=format&fit=crop';">
                <div class="absolute top-6 left-6 ${badgeColor} text-white text-[10px] font-black uppercase tracking-widest px-3.5 py-1.5 rounded-full shadow-lg z-20 flex items-center gap-1">
                    ${isFarmer ? '<i class="fa-solid fa-tractor"></i>' : ''} ${badgeText}
                </div>
                <button class="absolute top-6 right-6 text-gray-300 hover:text-red-500 bg-white w-10 h-10 rounded-full flex items-center justify-center shadow-xl transition-all hover:scale-110 z-20"><i class="fa-solid fa-heart"></i></button>
            </div>
            <div class="p-8">
                <div class="flex flex-col mb-4">
                    <span class="text-[10px] font-black uppercase tracking-widest ${subColor} mb-1">${categoryText}</span>
                    <h3 class="font-heading font-extrabold text-2xl text-textDark leading-tight group-hover:text-primary transition-colors">${titleText}</h3>
                    ${p.farmer_name ? `<p class="text-[11px] font-bold text-emerald-800 mt-1 flex items-center gap-1"><i class="fa-solid fa-wheat-field"></i> ${p.farmer_name}</p>` : ''}
                    ${p.farmer_upi ? `<span class="inline-flex items-center gap-1 text-[9px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-200 mt-2 w-fit"><i class="fa-solid fa-qrcode text-emerald-600"></i> Direct Payment Scanner</span>` : ''}
                </div>
                <div class="flex items-center gap-1 text-accent text-xs mb-6">
                    <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star-half-stroke"></i>
                </div>
                <div class="flex items-center justify-between gap-2 pt-3 border-t border-gray-100">
                    <div>
                        <span class="text-[9px] text-gray-400 font-bold uppercase block">Price</span>
                        <span class="font-heading font-extrabold text-2xl text-primary">₹${p.price}</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                        <button class="bg-gray-100 hover:bg-gray-200 text-gray-700 w-10 h-10 rounded-xl flex items-center justify-center transition" title="Add to Bag" onclick="addToCart('${titleText.replace(/'/g, "\\'")}', ${p.price}, '${imgUrl}', '${p.id}')">
                            <i class="fa-solid fa-bag-shopping text-xs"></i>
                        </button>
                        <button class="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 text-white font-black text-[10px] uppercase tracking-wider px-3.5 py-2.5 rounded-xl shadow-md transition hover:scale-105 flex items-center gap-1" onclick="openQuickBuyModal('${p.id}', '${titleText.replace(/'/g, "\\'")}', ${p.price}, '${imgUrl}', '${categoryText.replace(/'/g, "\\'")}', 'All Ages', '${farmerName.replace(/'/g, "\\'")}', '${farmerUpi.replace(/'/g, "\\'")}', '${paymentQr.replace(/'/g, "\\'")}')">
                            <i class="fa-solid fa-bolt text-amber-300"></i> Buy
                        </button>
                    </div>
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

// // Millet AI Assistant UI (ChatGPT / Gemini Web Interface Style)
function initChatbot() {
    if (document.getElementById('millet-chat-trigger')) return;

    const chatHtml = `
        <!-- Premium Floating Chatbot Trigger Symbol -->
        <div id="millet-chat-trigger" class="fixed bottom-7 right-7 w-16 h-16 bg-gradient-to-br from-[#202123] via-[#1a1b1e] to-[#0f1012] text-white rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.35)] flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 transition-all z-[9999] border-2 border-emerald-400/60 ring-4 ring-emerald-500/20 animate-bounce [animation-duration:3s] group">
            <i class="fa-solid fa-sparkles text-2xl text-emerald-400 group-hover:rotate-12 transition-transform duration-300"></i>
            <span class="absolute -top-3 -right-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[9px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider shadow-lg border border-white flex items-center gap-1">
                <span class="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span> AI
            </span>
            <!-- Hover Tooltip -->
            <div class="absolute right-20 bg-[#202123] text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-xl border border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap hidden sm:block">
                Ask MilletVerse AI ✨
            </div>
        </div>

        <!-- ChatGPT Style Chat Window -->
        <div id="millet-chat-window" class="fixed bottom-24 right-4 sm:right-8 w-[95vw] sm:w-[460px] max-w-[480px] h-[600px] bg-[#fcfcfc] rounded-[2.2rem] shadow-[0_35px_100px_rgba(0,0,0,0.3)] border border-gray-200/90 flex flex-col overflow-hidden z-[9999] transition-all duration-300 transform scale-0 origin-bottom-right hidden font-sans">
            <!-- ChatGPT Top App Bar -->
            <div class="bg-[#202123] px-5 py-4 text-white flex justify-between items-center border-b border-gray-800">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xs shadow-sm">
                        <i class="fa-solid fa-sparkles text-amber-300 text-sm"></i>
                    </div>
                    <div>
                        <div class="flex items-center gap-2">
                            <span class="font-bold text-sm text-gray-100 tracking-wide">MilletVerse AI</span>
                            <span class="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-extrabold px-2 py-0.5 rounded-full">Gemini 2.5</span>
                        </div>
                        <p class="text-[10px] text-gray-400 font-medium">Millet, Health & Product Assistant</p>
                    </div>
                </div>
                <div class="flex items-center gap-1.5">
                    <button id="clear-chat" title="New Chat" class="text-gray-300 hover:text-white px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-xs font-semibold flex items-center gap-1.5">
                        <i class="fa-solid fa-plus text-[10px]"></i> New Chat
                    </button>
                    <button id="close-chat" title="Close" class="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-all text-sm">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
            </div>

            <!-- ChatGPT Suggestion Cards Bar -->
            <div id="chat-chips" class="bg-slate-100/80 px-4 py-2.5 border-b border-gray-200/70 flex gap-2 overflow-x-auto no-scrollbar scroll-smooth">
                <button class="chip-btn bg-white hover:bg-[#202123] hover:text-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-xl font-medium transition-all text-xs shrink-0 flex items-center gap-1.5 shadow-sm" data-query="Which millet is best for weight loss?">
                    🌾 Weight Loss
                </button>
                <button class="chip-btn bg-white hover:bg-[#202123] hover:text-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-xl font-medium transition-all text-xs shrink-0 flex items-center gap-1.5 shadow-sm" data-query="Which millet controls diabetes?">
                    🩺 Diabetes Care
                </button>
                <button class="chip-btn bg-white hover:bg-[#202123] hover:text-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-xl font-medium transition-all text-xs shrink-0 flex items-center gap-1.5 shadow-sm" data-query="What products do you sell and what are their prices?">
                    🍪 Product Prices
                </button>
                <button class="chip-btn bg-white hover:bg-[#202123] hover:text-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-xl font-medium transition-all text-xs shrink-0 flex items-center gap-1.5 shadow-sm" data-query="Give me a quick Ragi Malt recipe">
                    🍲 Ragi Recipe
                </button>
                <button class="chip-btn bg-white hover:bg-[#202123] hover:text-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-xl font-medium transition-all text-xs shrink-0 flex items-center gap-1.5 shadow-sm" data-query="How does shipping work and delivery time?">
                    📦 Orders & Shipping
                </button>
            </div>

            <!-- ChatGPT Message Stream Feed -->
            <div id="chat-messages" class="flex-1 p-5 space-y-5 overflow-y-auto bg-[#fafafa] flex flex-col scroll-smooth">
                <div class="chat-msg-bot flex gap-3 self-start max-w-[90%] items-start">
                    <div class="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm mt-1">
                        <i class="fa-solid fa-sparkles"></i>
                    </div>
                    <div class="bg-white p-4 rounded-2xl rounded-tl-sm border border-gray-200/80 shadow-sm text-sm text-gray-800 space-y-2 leading-relaxed">
                        <p class="font-bold text-gray-900">Namaste! 🙏 I am <strong>MilletVerse AI</strong>, powered by Google Gemini.</p>
                        <p>I am your specialized assistant for:<br>
                        🌾 Millets & Nutrition<br>
                        🍪 Products & Prices<br>
                        🍲 Delicious Millet Recipes<br>
                        📦 Shipping & Orders</p>
                        <p class="text-xs text-gray-500 font-medium border-t border-gray-100 pt-2 mt-2">To provide age-appropriate guidance, I may ask your age or age group when needed.<br><br>What would you like to know today?</p>
                    </div>
                </div>
            </div>

            <!-- Typing Indicator -->
            <div id="chat-typing" class="hidden px-5 py-2 bg-[#fafafa]">
                <div class="flex gap-3 items-center">
                    <div class="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                        <i class="fa-solid fa-sparkles text-amber-300 animate-spin"></i>
                    </div>
                    <div class="inline-flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl border border-gray-200 shadow-sm text-xs font-semibold text-gray-700">
                        <span>ChatGPT AI is thinking...</span>
                        <span class="flex gap-1 ml-1">
                            <span class="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce"></span>
                            <span class="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                            <span class="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                        </span>
                    </div>
                </div>
            </div>

            <!-- ChatGPT Input Container -->
            <div class="p-4 bg-white border-t border-gray-200/80 flex flex-col gap-1.5">
                <div class="flex gap-2 items-center bg-gray-50 rounded-2xl p-2 border border-gray-300/80 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-600/20 transition-all shadow-sm">
                    <input id="chat-input" type="text" placeholder="Message MilletVerse AI..." class="flex-1 bg-transparent border-none px-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none font-medium">
                    <button id="send-chat" class="bg-[#202123] hover:bg-black text-white w-9 h-9 rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md shrink-0">
                        <i class="fa-solid fa-arrow-up text-xs"></i>
                    </button>
                </div>
                <p class="text-[9.5px] text-center text-gray-400 font-medium">MilletVerse AI provides domain assistance for food, millets, and orders.</p>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', chatHtml);

    const trigger = document.getElementById('millet-chat-trigger');
    const win = document.getElementById('millet-chat-window');
    const close = document.getElementById('close-chat');
    const clearBtn = document.getElementById('clear-chat');
    const input = document.getElementById('chat-input');
    const send = document.getElementById('send-chat');
    const messages = document.getElementById('chat-messages');
    const typing = document.getElementById('chat-typing');

    // Toggle Window
    trigger.onclick = () => {
        win.classList.remove('hidden');
        setTimeout(() => win.classList.remove('scale-0'), 10);
        input.focus();
    };

    close.onclick = () => {
        win.classList.add('scale-0');
        setTimeout(() => win.classList.add('hidden'), 300);
    };

    // New Chat / Clear
    clearBtn.onclick = () => {
        messages.innerHTML = `
            <div class="chat-msg-bot flex gap-3 self-start max-w-[90%] items-start">
                <div class="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm mt-1">
                    <i class="fa-solid fa-sparkles"></i>
                </div>
                <div class="bg-white p-4 rounded-2xl rounded-tl-sm border border-gray-200/80 shadow-sm text-sm text-gray-800 space-y-2 leading-relaxed">
                    <p class="font-bold text-gray-900">Namaste! 🙏 I am <strong>MilletVerse AI</strong>, powered by Google Gemini.</p>
                    <p>What would you like to know today?</p>
                </div>
            </div>
        `;
    };

    // Markdown Parser
    const formatMessageText = (rawText) => {
        let text = rawText
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>')
            .replace(/\*(.*?)\*/g, '<em class="italic text-gray-700">$1</em>')
            .replace(/^[\s]*[•\-*]\s+(.*)$/gm, '<li class="ml-4 list-disc text-gray-700">$1</li>')
            .replace(/^[\s]*(\d+)\.\s+(.*)$/gm, '<li class="ml-4 list-decimal text-gray-700">$2</li>')
            .replace(/\n/g, '<br>');

        return text;
    };

    // Add Message DOM (ChatGPT Avatar Layout)
    const addMessage = (text, isUser = false, providerInfo = '') => {
        const msgWrapper = document.createElement('div');
        const formattedHtml = isUser ? text.replace(/\n/g, '<br>') : formatMessageText(text);

        if (isUser) {
            msgWrapper.className = 'flex flex-col items-end self-end max-w-[85%] ml-auto';
            msgWrapper.innerHTML = `
                <div class="bg-[#202123] text-white p-3.5 px-4.5 rounded-2xl rounded-tr-sm shadow-sm text-sm font-medium leading-relaxed">
                    ${formattedHtml}
                </div>
            `;
        } else {
            msgWrapper.className = 'chat-msg-bot flex gap-3 self-start max-w-[90%] items-start';
            msgWrapper.innerHTML = `
                <div class="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm mt-1">
                    <i class="fa-solid fa-sparkles"></i>
                </div>
                <div class="bg-white p-4 rounded-2xl rounded-tl-sm border border-gray-200/80 shadow-sm text-sm text-gray-800 leading-relaxed space-y-1">
                    <div>${formattedHtml}</div>
                    ${providerInfo ? `<div class="text-[9px] font-bold text-emerald-600 uppercase tracking-wider pt-1.5 border-t border-gray-100 flex items-center gap-1 mt-2"><i class="fa-solid fa-check-circle text-emerald-500"></i> ${providerInfo}</div>` : ''}
                </div>
            `;
        }

        messages.appendChild(msgWrapper);
        messages.scrollTop = messages.scrollHeight;
    };

    // Handle Send Action
    const handleSend = async (queryText = null) => {
        const val = queryText || input.value.trim();
        if (!val) return;
        
        if (!queryText) input.value = '';
        addMessage(val, true);

        typing.classList.remove('hidden');
        messages.scrollTop = messages.scrollHeight;

        try {
            const backendUrl = window.location.origin.includes('localhost') 
                ? 'http://localhost:5000/api/chat'
                : '/api/chat';

            const res = await fetch(backendUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: val })
            });

            const data = await res.json();
            typing.classList.add('hidden');

            if (data.success && data.data?.response) {
                const provider = data.data.provider || 'Google Gemini AI';
                addMessage(data.data.response, false, provider);
            } else {
                addMessage(getFrontendFallbackResponse(val), false, 'MilletVerse AI Engine');
            }
        } catch (e) {
            typing.classList.add('hidden');
            addMessage(getFrontendFallbackResponse(val), false, 'MilletVerse AI Engine');
        }
    };

    // Frontend Fallback NLP Engine with Strict Topic Enforcement
    const getFrontendFallbackResponse = (query) => {
        const msg = query.toLowerCase().trim();

        // Topic Check: Is it related to millets, food, health, recipes, catalog, shipping, orders, or formal site queries?
        const isMilletTopic = msg.includes('millet') || msg.includes('ragi') || msg.includes('bajra') || msg.includes('jowar') || msg.includes('foxtail') || msg.includes('barnyard') || msg.includes('kodo') || msg.includes('proso');
        const isHealthTopic = msg.includes('weight') || msg.includes('diabet') || msg.includes('sugar') || msg.includes('health') || msg.includes('diet') || msg.includes('caloric') || msg.includes('nutrition') || msg.includes('kid') || msg.includes('child') || msg.includes('age');
        const isCatalogTopic = msg.includes('product') || msg.includes('price') || msg.includes('cost') || msg.includes('buy') || msg.includes('shop') || msg.includes('biscuit') || msg.includes('cookie') || msg.includes('cracker');
        const isRecipeTopic = msg.includes('recipe') || msg.includes('cook') || msg.includes('make') || msg.includes('prepare') || msg.includes('malt') || msg.includes('upma');
        const isOrderTopic = msg.includes('ship') || msg.includes('deliver') || msg.includes('track') || msg.includes('order') || msg.includes('return') || msg.includes('refund');
        const isGreeting = msg.includes('hi') || msg.includes('hello') || msg.includes('hey') || msg.includes('namaste') || msg.includes('who are you');

        // STRICT OUT-OF-TOPIC GUARDRAIL
        if (!isMilletTopic && !isHealthTopic && !isCatalogTopic && !isRecipeTopic && !isOrderTopic && !isGreeting) {
            return `I am **MilletVerse AI**, specifically dedicated to assisting you with millet nutrition, health guidance, recipes, and MilletVerse catalog products.\n\nI am unable to answer questions outside these topics. How can I assist you with ancient grains or your health journey today?`;
        }

        // Detect age
        const ageMatch = msg.match(/\b(?:i am|age|im|i'm)?\s*(\d{1,2})\s*(?:years|yr|yrs)?\s*(?:old)?\b/);
        const age = ageMatch ? parseInt(ageMatch[1]) : null;

        if (msg.includes('weight') || msg.includes('fat') || msg.includes('slim') || msg.includes('diet') || msg.includes('calorie')) {
            if (age !== null && age < 18) {
                if (age <= 12) {
                    return `🌾 Since you're ${age} years old and still growing, I won't recommend a restrictive weight-loss diet or slimming products. I can instead help you with balanced, nutritious millet meals and healthy snacks! Please discuss any weight concerns with a parent/guardian and a pediatrician or doctor.`;
                }
                return `🌾 At ${age}, your body is still growing, so restrictive weight-loss diets or slimming products aren't something I should recommend. I can help you choose nutritious millet meals that support healthy growth and energy! If you're concerned about weight, please talk with a parent/guardian and a healthcare professional.`;
            } else if (age === null && !msg.includes('adult') && !msg.includes('old') && (msg.includes('i want to lose') || msg.includes('how to lose'))) {
                return `Sure 🌾 I can provide general information about healthy millet choices. Before I recommend anything, may I know your age group? This helps me provide age-appropriate guidance!`;
            }

            return `🌾 **Healthy Weight Management for Adults:**\n\n` +
                `Millets can be included as part of a balanced diet:\n` +
                `• **Barnyard Millet (Sanwa):** Lowest calories & carbs, highest fiber (10.1%).\n` +
                `• **Ragi (Finger Millet):** High fiber keeps you satisfied longer.\n\n` +
                `🍪 **Catalog Product:** **Barnyard Slim & Slimmer Crackers** (₹139) – 100% baked, high fiber snack. *(Note: Results vary, millets complement a balanced diet).*`;
        }

        // Direct Age-Specific Product Recommendation
        if (age !== null) {
            if (age <= 2) {
                return `👶 **Age 0–2 Years (Infant/Toddler Guidance):**\n\n` +
                    `For infants and toddlers, please consult a pediatrician before introducing new foods.\n\n` +
                    `🥣 **Recommended Product:** **Stone-Ground Organic Ragi Flour** (₹99) for smooth, easily digestible Ragi porridge. *(Consult pediatrician first; no weight-loss products).*`;
            } else if (age <= 5) {
                return `👶 **Age 3–5 Years (Preschool Child Guidance):**\n\n` +
                    `Focus on healthy growth, bone strength, and balanced energy:\n\n` +
                    `🍪 **Recommended Product:** **Ragi Chocolate Delight Biscuits** (₹149 for 250g) – Made with organic Ragi & raw cacao, delivering 10x more calcium than milk for strong bones!`;
            } else if (age <= 12) {
                return `🧒 **Age 6–12 Years (Child Guidance):**\n\n` +
                    `Focus on growth, school stamina, and bone density:\n\n` +
                    `🍪 **Recommended Catalog Products:**\n` +
                    `1. **Ragi Chocolate Delight Biscuits** (₹149) – Calcium rich (344mg/100g) for developing bones & teeth.\n` +
                    `2. **Bajra Crunch & Spice Biscuits** (₹129) – Iron rich crunchy snack for active school kids!`;
            } else if (age <= 17) {
                return `🧑 **Age 13–17 Years (Teenager Guidance):**\n\n` +
                    `Focus on healthy development, study stamina, and sports energy:\n\n` +
                    `⚡ **Recommended Catalog Products:**\n` +
                    `1. **Multi-Millet Energy Bites** (₹199 for 250g) – High protein (12.5%), almonds, and dates for active teens.\n` +
                    `2. **Ragi Chocolate Delight Biscuits** (₹149) – High calcium & iron booster!`;
            } else if (age <= 30) {
                return `💪 **Age 18–30 Years (Young Adult & Fitness Guidance):**\n\n` +
                    `Focus on fitness, active energy, and healthy nutrition:\n\n` +
                    `⚡ **Recommended Catalog Products:**\n` +
                    `1. **Multi-Millet Energy Bites** (₹199) – High protein (12.5%) workout & muscle recovery.\n` +
                    `2. **Barnyard Slim & Slimmer Crackers** (₹139) – High fiber (10.1%), zero trans-fat for healthy weight management.`;
            } else if (age <= 50) {
                return `🌾 **Age 31–50 Years (Adult Wellness Guidance):**\n\n` +
                    `Focus on balanced energy, blood sugar awareness, and weight management:\n\n` +
                    `🍪 **Recommended Catalog Products:**\n` +
                    `1. **Barnyard Slim & Slimmer Crackers** (₹139) – Fiber rich for adult satiety & weight management.\n` +
                    `2. **Foxtail Sugar-Free Herbal Cookies** (₹159) – Low GI, stevia sweetened for blood sugar care.`;
            } else if (age <= 65) {
                return `🩺 **Age 51–65 Years (Older Adult Guidance):**\n\n` +
                    `Focus on fiber, easy digestion, and heart/glycemic health:\n\n` +
                    `🍪 **Recommended Catalog Products:**\n` +
                    `1. **Foxtail Sugar-Free Herbal Cookies** (₹159) – Low GI & Vitamin B12 for nerve health.\n` +
                    `2. **Bajra Crunch & Spice Biscuits** (₹129) – High magnesium for heart health.`;
            } else {
                return `👵 **Age 65+ Years (Senior Nutrition Guidance):**\n\n` +
                    `Focus on soft, easily digestible foods and hydration:\n\n` +
                    `🥣 **Recommended Catalog Products:**\n` +
                    `1. **Stone-Ground Ragi / Jowar Flour** (₹99) – Perfect for soft, easy-to-digest warm porridge or malt.\n` +
                    `2. **Foxtail Sugar-Free Herbal Cookies** (₹159) – Gentle, low-sugar snack!`;
            }
        }

        if (msg.includes('diabet') || msg.includes('sugar') || msg.includes('glucose') || msg.includes('glycemic') || /\bgi\b/.test(msg)) {
            return `🩺 **Diabetes-Aware Food Information:**\n\n` +
                `Millets have a **Low Glycemic Index (GI)**, preventing rapid sugar spikes:\n` +
                `• **Foxtail Millet:** Known for low GI properties.\n` +
                `• **Bajra (Pearl Millet):** High magnesium content.\n\n` +
                `🍪 **Catalog Product:** **Foxtail Sugar-Free Herbal Cookies** (₹159, Stevia sweetened).\n\n` +
                `*Note: Millets do not cure or treat diabetes. Please consult a doctor for personalized medical advice.*`;
        }

        if (msg.includes('recipe') || msg.includes('cook') || msg.includes('make') || msg.includes('prepare') || msg.includes('malt') || msg.includes('upma')) {
            return `🍲 **Healthy Ragi Malt Recipe (Prep time: 5 mins):**\n\n` +
                `**Ingredients:** 2 tbsp Ragi flour, 1 cup water/milk, cardamom, jaggery.\n\n` +
                `**Steps:**\n` +
                `1. Mix Ragi flour in water without lumps.\n` +
                `2. Boil for 5 minutes stirring continuously.\n` +
                `3. Add sweetener & serve warm!\n\n` +
                `*Great energy drink for growing children and adults!*`;
        }

        if (msg.includes('want to buy') || msg.includes('buy barnyard') || msg.includes('buy ragi') || msg.includes('buy bajra') || msg.includes('buy foxtail')) {
            return `I can help you with that! 🍪 Here are the catalog details for your request:\n\n` +
                `• **Product:** Barnyard Slim & Slimmer Crackers\n` +
                `• **Price:** ₹139\n` +
                `• **Pack Size:** 150g\n` +
                `• **Main Ingredients:** Barnyard Millet, Flaxseeds, Organic Herbs\n` +
                `• **Nutritional Info:** High dietary fiber (10.1%), 100% Baked, Zero Trans-Fat\n` +
                `• **Availability:** In Stock\n\n` +
                `Would you like to add this item to your cart and proceed to Checkout?`;
        }

        if (msg.includes('price') || msg.includes('cost') || msg.includes('buy') || msg.includes('product') || msg.includes('biscuit')) {
            return `🛍️ **MilletVerse Catalog Products & Prices:**\n\n` +
                `• 🍫 **Ragi Chocolate Delight Biscuits** - ₹149 (250g | Calcium Rich)\n` +
                `• 🌶️ **Bajra Crunch & Spice Biscuits** - ₹129 (200g | Low GI)\n` +
                `• 🌾 **Barnyard Slim & Slimmer Crackers** - ₹139 (150g | High Fiber)\n` +
                `• 🍪 **Foxtail Sugar-Free Herbal Cookies** - ₹159 (200g | Stevia)\n` +
                `• ⚡ **Multi-Millet Energy Bites** - ₹199 (250g | High Protein)\n\n` +
                `Would you like to add any item to your cart?`;
        }

        if (msg.includes('ship') || msg.includes('deliver') || msg.includes('track') || msg.includes('order')) {
            return `📦 **Shipping & Delivery Information:**\n\n` +
                `• **Delivery Timeline:** 3 to 5 business days across India.\n` +
                `• **Shipping Charges:** FREE on orders above ₹499.\n` +
                `• **Returns:** 7-day hassle-free return policy.`;
        }

        return `Namaste! 🙏 I am **MilletVerse AI**, powered by Google Gemini.\n\n` +
            `I can guide you on:\n` +
            `🌾 Millets & Nutrition\n` +
            `🍪 Products & Prices\n` +
            `🍲 Delicious Millet Recipes\n` +
            `📦 Shipping & Orders\n\n` +
            `To provide age-appropriate guidance, I may ask your age or age group when needed.\n\n` +
            `What would you like to know today?`;
    };

    // Attach Chip Handlers
    document.querySelectorAll('.chip-btn').forEach(btn => {
        btn.onclick = () => {
            const query = btn.getAttribute('data-query');
            if (query) handleSend(query);
        };
    });

    send.onclick = () => handleSend();
    input.onkeypress = (e) => { if (e.key === 'Enter') handleSend(); };
}

// ─── Farmer Scanner Management (Configure Once) ───────────────────────────

function getFarmerSavedScanner() {
    const session = JSON.parse(localStorage.getItem('milletSession') || 'null');
    let scanner = null;
    if (session) {
        scanner = JSON.parse(localStorage.getItem(`farmer_scanner_${session.id}`) || localStorage.getItem(`farmer_scanner_${session.email}`) || 'null');
    }
    if (!scanner) {
        scanner = JSON.parse(localStorage.getItem('farmer_scanner_default') || 'null');
    }
    return scanner;
}

function openFarmerScannerConfigModal() {
    let modal = document.getElementById('farmer-scanner-config-modal');
    if (!modal) {
        initFarmerScannerModal();
        modal = document.getElementById('farmer-scanner-config-modal');
    }

    const session = JSON.parse(localStorage.getItem('milletSession') || 'null');
    const existing = getFarmerSavedScanner();

    const nameInput = document.getElementById('f-scanner-name');
    const upiInput = document.getElementById('f-scanner-upi');
    const qrInput = document.getElementById('f-scanner-qr');
    const previewImg = document.getElementById('f-scanner-preview-img');

    if (nameInput) nameInput.value = existing?.farmer_name || (session ? `${session.firstName}'s Organic Farm` : 'My Organic Farm');
    if (upiInput) upiInput.value = existing?.farmer_upi || (session ? `${session.firstName.toLowerCase()}@upi` : 'farmer@upi');
    if (qrInput) qrInput.value = existing?.custom_qr || '';

    updateFarmerScannerPreview();

    modal.classList.remove('opacity-0', 'pointer-events-none');
}

function closeFarmerScannerConfigModal() {
    const modal = document.getElementById('farmer-scanner-config-modal');
    if (modal) modal.classList.add('opacity-0', 'pointer-events-none');
}

function updateFarmerScannerPreview() {
    const name = document.getElementById('f-scanner-name')?.value || 'Farmer Farm';
    const upi = document.getElementById('f-scanner-upi')?.value || 'farmer@upi';
    const customQr = document.getElementById('f-scanner-qr')?.value;
    const previewImg = document.getElementById('f-scanner-preview-img');
    const upiText = document.getElementById('f-scanner-upi-text');
    const nameText = document.getElementById('f-scanner-name-text');

    if (upiText) upiText.innerText = upi;
    if (nameText) nameText.innerText = name;

    if (previewImg) {
        if (customQr && customQr.startsWith('http')) {
            previewImg.src = customQr;
        } else {
            const upiUri = `upi://pay?pa=${encodeURIComponent(upi)}&pn=${encodeURIComponent(name)}&cu=INR`;
            previewImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUri)}`;
        }
    }
}

function saveFarmerScannerConfig(e) {
    if (e) e.preventDefault();
    const session = JSON.parse(localStorage.getItem('milletSession') || 'null');

    const name = document.getElementById('f-scanner-name').value.trim();
    const upi = document.getElementById('f-scanner-upi').value.trim();
    const customQr = document.getElementById('f-scanner-qr').value.trim();

    if (!name || !upi) {
        showToast('Please provide both Farm Name and UPI ID.', 'warn');
        return;
    }

    const upiUri = `upi://pay?pa=${encodeURIComponent(upi)}&pn=${encodeURIComponent(name)}&cu=INR`;
    const finalQr = (customQr && customQr.startsWith('http')) ? customQr : `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUri)}`;

    const scannerData = {
        farmer_name: name,
        farmer_upi: upi,
        custom_qr: customQr,
        payment_qr: finalQr,
        updated_at: new Date().toISOString()
    };

    if (session) {
        if (session.id) localStorage.setItem(`farmer_scanner_${session.id}`, JSON.stringify(scannerData));
        if (session.email) localStorage.setItem(`farmer_scanner_${session.email}`, JSON.stringify(scannerData));
    }
    localStorage.setItem('farmer_scanner_default', JSON.stringify(scannerData));

    // Automatically associate scanner with all products listed by this farmer
    let products = JSON.parse(localStorage.getItem('milletProducts') || '[]');
    let updatedCount = 0;
    products = products.map(p => {
        if (!p.farmer_upi || (session && (p.seller_id == session.id || p.sellerEmail == session.email))) {
            p.farmer_name = name;
            p.farmer_upi = upi;
            p.payment_qr = finalQr;
            p.is_farmer = true;
            updatedCount++;
        }
        return p;
    });
    localStorage.setItem('milletProducts', JSON.stringify(products));

    closeFarmerScannerConfigModal();
    showToast('🌾 Payment Scanner saved! All your products now use this QR Scanner.', 'success');

    // If on products page or dashboard, refresh view
    if (typeof renderProducts === 'function') renderProducts();
    if (typeof renderMarketplaceProducts === 'function') renderMarketplaceProducts();
    if (typeof loadSection === 'function' && document.getElementById('main-content-area')) {
        const activeTab = document.querySelector('#sidebar-menu .bg-emerald-600, #sidebar-menu .active-link');
        if (activeTab && activeTab.id) loadSection(activeTab.id.replace('tab-', ''));
    }
}

function initFarmerScannerModal() {
    if (document.getElementById('farmer-scanner-config-modal')) return;

    const modalHtml = `
        <div id="farmer-scanner-config-modal" class="fixed inset-0 bg-primaryDark/80 backdrop-blur-md z-[10000] flex items-center justify-center opacity-0 pointer-events-none transition-all duration-300 p-4 font-sans">
            <div class="bg-white rounded-[3rem] p-8 lg:p-10 max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-gray-100 relative">
                <button onclick="closeFarmerScannerConfigModal()" class="absolute top-6 right-6 text-gray-400 hover:text-red-500 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg transition-all">
                    <i class="fa-solid fa-xmark"></i>
                </button>

                <div class="flex items-center gap-3.5 mb-6">
                    <div class="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-xl shadow-sm">
                        <i class="fa-solid fa-qrcode"></i>
                    </div>
                    <div>
                        <h2 class="font-heading font-black text-2xl text-textDark">Farmer Payment Scanner</h2>
                        <p class="text-xs text-amber-800 font-bold">Set your scanner ONCE — automatically attached to all your harvest products!</p>
                    </div>
                </div>

                <form onsubmit="saveFarmerScannerConfig(event)" class="space-y-6">
                    <div class="space-y-4">
                        <div>
                            <label class="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">FARM / PRODUCER NAME</label>
                            <input id="f-scanner-name" oninput="updateFarmerScannerPreview()" placeholder="e.g. Ramesh Organic Farm, Hassan" class="w-full bg-primaryLight p-4 rounded-2xl font-bold border border-gray-200 focus:ring-2 focus:ring-amber-500 text-sm" required>
                        </div>

                        <div>
                            <label class="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">FARMER UPI ID (FOR DIRECT SCAN & PAY)</label>
                            <div class="relative">
                                <i class="fa-solid fa-mobile-screen absolute left-4 top-4 text-amber-600 text-sm"></i>
                                <input id="f-scanner-upi" oninput="updateFarmerScannerPreview()" placeholder="e.g. farmer.ramesh@upi or 9876543210@paytm" class="w-full bg-primaryLight p-4 pl-12 rounded-2xl font-mono font-bold border border-gray-200 focus:ring-2 focus:ring-amber-500 text-sm" required>
                            </div>
                        </div>

                        <div>
                            <label class="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">CUSTOM QR CODE IMAGE URL (OPTIONAL)</label>
                            <input id="f-scanner-qr" oninput="updateFarmerScannerPreview()" placeholder="Leave empty to auto-generate live UPI QR code" class="w-full bg-primaryLight p-4 rounded-2xl font-bold border border-gray-200 focus:ring-2 focus:ring-amber-500 text-sm">
                            <p class="text-[10px] text-gray-400 font-bold mt-1.5"><i class="fa-solid fa-circle-info"></i> If left blank, MilletVerse will dynamically generate a clean QR Scanner for GPay, PhonePe, Paytm & BHIM.</p>
                        </div>
                    </div>

                    <!-- Live QR Scanner Preview -->
                    <div class="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-3xl border border-amber-200 text-center space-y-3">
                        <span class="text-[9px] font-black uppercase tracking-[0.25em] text-amber-900 bg-amber-200/60 px-3 py-1 rounded-full inline-block">
                            Live Scanner Preview for Buyers
                        </span>
                        
                        <div class="w-44 h-44 mx-auto bg-white p-2.5 rounded-2xl shadow-md border-2 border-amber-300 flex items-center justify-center">
                            <img id="f-scanner-preview-img" src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=farmer@upi" class="w-full h-full object-contain rounded-lg">
                        </div>

                        <div>
                            <p id="f-scanner-name-text" class="text-xs font-black text-textDark">My Organic Farm</p>
                            <p id="f-scanner-upi-text" class="text-xs font-mono font-bold text-amber-800">farmer@upi</p>
                        </div>

                        <div class="flex justify-center items-center gap-2 pt-2 border-t border-amber-200/60">
                            <span class="text-[9px] font-black bg-white px-2 py-0.5 rounded text-gray-600 border border-amber-200">GPay</span>
                            <span class="text-[9px] font-black bg-white px-2 py-0.5 rounded text-purple-700 border border-amber-200">PhonePe</span>
                            <span class="text-[9px] font-black bg-white px-2 py-0.5 rounded text-blue-700 border border-amber-200">Paytm</span>
                            <span class="text-[9px] font-black bg-white px-2 py-0.5 rounded text-amber-700 border border-amber-200">BHIM UPI</span>
                        </div>
                    </div>

                    <button type="submit" class="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-black py-4 rounded-2xl uppercase tracking-widest shadow-xl transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2">
                        <i class="fa-solid fa-floppy-disk"></i> Save Scanner (Use for All My Products)
                    </button>
                </form>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
}


// ─── Meesho-Style Instant Quick Buy Modal ─────────────────────────────────

let quickBuyCurrentItem = null;
let quickBuyQuantity = 1;

function openQuickBuyModal(id, title, price, img, millet, ageTag, farmerName, farmerUpi, paymentQr) {
    // Check if current user is a producer (farmer or startup)
    const session = JSON.parse(localStorage.getItem('milletSession') || 'null');
    if (session && ['farmer', 'startup', 'seller'].includes(session.role)) {
        showToast('Farmer and Startup accounts are producer accounts and cannot buy products. Please use a Consumer account.', 'error');
        return;
    }

    let modal = document.getElementById('meesho-quick-buy-modal');
    if (!modal) {
        initQuickBuyModal();
        modal = document.getElementById('meesho-quick-buy-modal');
    }

    const localProducts = JSON.parse(localStorage.getItem('milletProducts') || '[]');
    const found = localProducts.find(p => p.id == id || p.title === title || p.name === title);

    let resolvedFarmerName = farmerName || (found ? (found.farmer_name || found.farmer) : '');
    let resolvedFarmerUpi = farmerUpi || (found ? found.farmer_upi : '');
    let resolvedPaymentQr = paymentQr || (found ? (found.payment_qr || found.farmer_scanner) : '');
    let resolvedFarmerEmail = found ? (found.farmer_email || found.sellerEmail) : '';
    let resolvedFarmerId = found ? (found.farmer_id || found.seller_id) : '';

    if (!resolvedFarmerUpi || !resolvedPaymentQr) {
        const saved = getFarmerSavedScanner();
        if (saved) {
            if (!resolvedFarmerName) resolvedFarmerName = saved.farmer_name;
            if (!resolvedFarmerUpi) resolvedFarmerUpi = saved.farmer_upi;
            if (!resolvedPaymentQr) resolvedPaymentQr = saved.custom_qr || saved.payment_qr;
        }
    }

    if (!resolvedFarmerName) resolvedFarmerName = 'MilletVerse Verified Farm Producer';
    if (!resolvedFarmerUpi) resolvedFarmerUpi = 'farmer.milletverse@upi';

    quickBuyCurrentItem = {
        id: id,
        title: title || 'Pure Ancient Millet Grain',
        price: parseFloat(price) || 149,
        img: img || 'assets/ragi.png',
        millet: millet || 'Ancient Organic Grain',
        ageTag: ageTag || 'All Ages',
        farmerName: resolvedFarmerName,
        farmerUpi: resolvedFarmerUpi,
        paymentQr: resolvedPaymentQr,
        farmerEmail: resolvedFarmerEmail,
        farmerId: resolvedFarmerId
    };

    quickBuyQuantity = 1;

    // Populate UI
    document.getElementById('qb-item-img').src = quickBuyCurrentItem.img;
    document.getElementById('qb-item-title').innerText = quickBuyCurrentItem.title;
    document.getElementById('qb-item-millet').innerText = quickBuyCurrentItem.millet;
    document.getElementById('qb-item-age').innerText = quickBuyCurrentItem.ageTag;
    document.getElementById('qb-item-unit-price').innerText = `₹${quickBuyCurrentItem.price.toFixed(2)}`;
    document.getElementById('qb-qty-display').innerText = quickBuyQuantity;

    document.getElementById('qb-farmer-name').innerText = quickBuyCurrentItem.farmerName;
    document.getElementById('qb-farmer-upi').innerText = quickBuyCurrentItem.farmerUpi;

    // Pre-fill user info if logged in
    if (session) {
        const nameIn = document.getElementById('qb-buyer-name');
        if (nameIn && !nameIn.value) nameIn.value = `${session.firstName} ${session.lastName}`.trim();
    }

    // Reset views: show checkout view, hide success view
    document.getElementById('qb-checkout-view').classList.remove('hidden');
    document.getElementById('qb-success-view').classList.add('hidden');
    document.getElementById('qb-utr-input').value = '';

    updateQuickBuyCalculations();

    modal.classList.remove('opacity-0', 'pointer-events-none');
}

function closeQuickBuyModal() {
    const modal = document.getElementById('meesho-quick-buy-modal');
    if (modal) modal.classList.add('opacity-0', 'pointer-events-none');
}

function adjustQuickBuyQty(delta) {
    quickBuyQuantity = Math.max(1, quickBuyQuantity + delta);
    document.getElementById('qb-qty-display').innerText = quickBuyQuantity;
    updateQuickBuyCalculations();
}

function updateQuickBuyCalculations() {
    if (!quickBuyCurrentItem) return;

    const subtotal = quickBuyCurrentItem.price * quickBuyQuantity;
    const shipping = subtotal >= 499 ? 0 : 40;
    const tax = subtotal * 0.05;
    const total = subtotal + shipping + tax;

    document.getElementById('qb-subtotal-text').innerText = `₹${subtotal.toFixed(2)}`;
    document.getElementById('qb-shipping-text').innerText = shipping === 0 ? 'FREE' : `₹${shipping.toFixed(2)}`;
    document.getElementById('qb-tax-text').innerText = `₹${tax.toFixed(2)}`;
    document.getElementById('qb-total-text').innerText = `₹${total.toFixed(2)}`;
    document.getElementById('qb-btn-total').innerText = `₹${total.toFixed(2)}`;
    document.getElementById('qb-qr-payable-text').innerText = `₹${total.toFixed(2)}`;

    // Update dynamic QR Code with the live exact total amount and farmer's UPI / Custom Scanner
    const qrImg = document.getElementById('qb-dynamic-qr');
    const upi = quickBuyCurrentItem.farmerUpi || 'farmer.milletverse@upi';
    const farmName = quickBuyCurrentItem.farmerName || 'Direct Farm Harvest';
    const customQr = quickBuyCurrentItem.paymentQr;

    if (customQr && (customQr.startsWith('data:image') || (customQr.startsWith('http') && !customQr.includes('api.qrserver.com')))) {
        qrImg.src = customQr;
    } else {
        const upiUri = `upi://pay?pa=${encodeURIComponent(upi)}&pn=${encodeURIComponent(farmName)}&am=${total.toFixed(2)}&cu=INR`;
        qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUri)}`;
    }
}

function copyFarmerUpiId() {
    if (!quickBuyCurrentItem || !quickBuyCurrentItem.farmerUpi) return;
    navigator.clipboard.writeText(quickBuyCurrentItem.farmerUpi).then(() => {
        showToast(`📋 Copied UPI ID: ${quickBuyCurrentItem.farmerUpi}`, 'success');
    }).catch(() => {
        showToast(`UPI ID: ${quickBuyCurrentItem.farmerUpi}`, 'success');
    });
}

function handleConfirmQuickBuy(e) {
    e.preventDefault();
    if (!quickBuyCurrentItem) return;

    const session = JSON.parse(localStorage.getItem('milletSession') || 'null');
    if (session && ['farmer', 'startup', 'seller'].includes(session.role)) {
        showToast('Farmer and Startup accounts are producer accounts and cannot purchase products. Please use a Consumer account.', 'error');
        return;
    }

    const buyerName = document.getElementById('qb-buyer-name').value.trim();
    const buyerPhone = document.getElementById('qb-buyer-phone').value.trim();
    const buyerAddress = document.getElementById('qb-buyer-address').value.trim();
    const buyerPincode = document.getElementById('qb-buyer-pincode').value.trim();
    const utr = document.getElementById('qb-utr-input').value.trim();

    if (!buyerName || !buyerPhone || !buyerAddress || !buyerPincode) {
        showToast('Please enter your full delivery address and contact phone.', 'warn');
        return;
    }

    const subtotal = quickBuyCurrentItem.price * quickBuyQuantity;
    const shipping = subtotal >= 499 ? 0 : 40;
    const tax = subtotal * 0.05;
    const total = subtotal + shipping + tax;
    const orderId = 'MV-MEESHO-' + Math.floor(100000 + Math.random() * 900000);

    const buyerEmail = session ? session.email : 'buyer@milletverse.in';

    const orderRecord = {
        id: orderId,
        date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        farmer_email: quickBuyCurrentItem.farmerEmail || '',
        farmer_id: quickBuyCurrentItem.farmerId || '',
        farmer_name: quickBuyCurrentItem.farmerName,
        farmer_upi: quickBuyCurrentItem.farmerUpi,
        user_name: buyerName,
        buyer_email: buyerEmail,
        total_price: total,
        total_amount: total,
        status: 'confirmed',
        order_status: 'Order Placed & Farmer Payment Verified',
        payment_type: 'online_upi',
        items: [{
            id: quickBuyCurrentItem.id,
            title: quickBuyCurrentItem.title,
            name: quickBuyCurrentItem.title,
            price: quickBuyCurrentItem.price,
            qty: quickBuyQuantity,
            img: quickBuyCurrentItem.img,
            millet_type: quickBuyCurrentItem.millet,
            is_farmer: true,
            farmer_name: quickBuyCurrentItem.farmerName,
            farmer_upi: quickBuyCurrentItem.farmerUpi,
            farmer_email: quickBuyCurrentItem.farmerEmail,
            farmer_id: quickBuyCurrentItem.farmerId
        }],
        buyer: {
            name: buyerName,
            phone: buyerPhone,
            address: `${buyerAddress}, Pincode: ${buyerPincode}`
        },
        payment: {
            mode: 'Direct Farmer QR Scanner Pay',
            farmer_upi: quickBuyCurrentItem.farmerUpi,
            farmer_name: quickBuyCurrentItem.farmerName,
            utr_ref: utr || 'DIRECT-UPI-VERIFIED',
            amount: total
        },
        delivery_estimate: '3–5 Business Days'
    };

    // Save to local orders
    let orders = JSON.parse(localStorage.getItem('milletOrders') || '[]');
    orders.unshift(orderRecord);
    localStorage.setItem('milletOrders', JSON.stringify(orders));

    // Try posting to backend if online
    if (session && session.token) {
        try {
            fetch('http://localhost:5000/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.token}`
                },
                body: JSON.stringify({
                    product_id: quickBuyCurrentItem.id,
                    quantity: quickBuyQuantity,
                    shipping_address: `${buyerAddress}, Pincode: ${buyerPincode}`,
                    payment_mode: 'UPI QR',
                    transaction_id: utr || 'QUICK-BUY-SCANNER'
                })
            }).catch(() => {});
        } catch(e) {}
    }

    // Show Meesho Success Screen
    document.getElementById('qb-checkout-view').classList.add('hidden');
    document.getElementById('qb-success-view').classList.remove('hidden');

    document.getElementById('qb-success-order-id').innerText = orderId;
    document.getElementById('qb-success-farmer-note').innerText = `Payment directed to ${quickBuyCurrentItem.farmerName} (${quickBuyCurrentItem.farmerUpi}).`;
    document.getElementById('qb-success-amount').innerText = `₹${total.toFixed(2)}`;

    showToast('🎉 Order Placed Successfully via Instant Scanner!', 'success');
}

function initQuickBuyModal() {
    if (document.getElementById('meesho-quick-buy-modal')) return;

    const modalHtml = `
        <!-- Meesho-Style Instant Quick Buy Modal -->
        <div id="meesho-quick-buy-modal" class="fixed inset-0 bg-primaryDark/85 backdrop-blur-md z-[10000] flex items-center justify-center opacity-0 pointer-events-none transition-all duration-300 p-3 sm:p-5 font-sans">
            <div class="bg-white rounded-[2.5rem] p-6 sm:p-8 max-w-3xl w-full max-h-[95vh] overflow-y-auto shadow-[0_30px_90px_rgba(0,0,0,0.5)] border border-gray-100 relative">
                
                <button onclick="closeQuickBuyModal()" class="absolute top-5 right-5 text-gray-400 hover:text-red-500 w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-base transition-all z-20">
                    <i class="fa-solid fa-xmark"></i>
                </button>

                <!-- 1. CHECKOUT VIEW -->
                <div id="qb-checkout-view" class="space-y-6">
                    
                    <!-- Top Meesho Style Banner -->
                    <div class="flex items-center justify-between border-b border-gray-100 pb-4">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-primary text-white flex items-center justify-center text-lg shadow-md">
                                <i class="fa-solid fa-bolt"></i>
                            </div>
                            <div>
                                <div class="flex items-center gap-2">
                                    <h2 class="font-heading font-black text-xl text-textDark">Instant Direct Buy</h2>
                                    <span class="bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">Meesho Express</span>
                                </div>
                                <p class="text-[11px] text-gray-500 font-semibold">Buy 1-click directly from the farmer with direct UPI QR Scan</p>
                            </div>
                        </div>
                    </div>

                    <form onsubmit="handleConfirmQuickBuy(event)" class="space-y-6">
                        
                        <!-- Product Preview & Quantity Selector Bar -->
                        <div class="bg-primaryLight/70 p-4 sm:p-5 rounded-3xl border border-gray-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div class="flex items-center gap-4">
                                <img id="qb-item-img" src="assets/ragi.png" class="w-20 h-20 rounded-2xl object-cover bg-white shadow-md border border-gray-200" onerror="this.src='assets/ragi.png';">
                                <div>
                                    <div class="flex items-center gap-2 mb-1">
                                        <span id="qb-item-millet" class="text-[9px] font-black uppercase text-accent tracking-wider">Finger Millet</span>
                                        <span id="qb-item-age" class="text-[8px] bg-accent/20 text-primary font-black px-2 py-0.5 rounded-full uppercase">All Ages</span>
                                    </div>
                                    <h3 id="qb-item-title" class="font-heading font-extrabold text-base text-textDark leading-snug">Product Title</h3>
                                    <p class="text-sm font-black text-primary mt-1">Price: <span id="qb-item-unit-price">₹149</span> / unit</p>
                                </div>
                            </div>

                            <!-- Quantity Stepper -->
                            <div class="flex items-center gap-3 self-end sm:self-center bg-white px-3 py-1.5 rounded-2xl shadow-sm border border-gray-200">
                                <span class="text-[10px] font-black uppercase tracking-wider text-gray-400 mr-1">Qty:</span>
                                <button type="button" onclick="adjustQuickBuyQty(-1)" class="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-black flex items-center justify-center text-sm transition-all">-</button>
                                <span id="qb-qty-display" class="font-black text-base text-textDark w-6 text-center">1</span>
                                <button type="button" onclick="adjustQuickBuyQty(1)" class="w-8 h-8 rounded-xl bg-primary text-white font-black flex items-center justify-center text-sm transition-all hover:bg-primaryDark">+</button>
                            </div>
                        </div>

                        <!-- 2 Columns: Delivery Address + Farmer QR Scanner -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            <!-- Left: Delivery Address Form -->
                            <div class="bg-gray-50/80 p-5 rounded-3xl border border-gray-200 space-y-4">
                                <h4 class="text-xs font-black uppercase tracking-widest text-textDark flex items-center gap-2">
                                    <i class="fa-solid fa-location-dot text-primary text-sm"></i> 1. Delivery Address
                                </h4>
                                
                                <div>
                                    <label class="block text-[9px] font-black uppercase tracking-wider text-gray-500 mb-1">YOUR FULL NAME</label>
                                    <input id="qb-buyer-name" placeholder="e.g. Ramesh Kumar" class="w-full bg-white p-3 rounded-xl font-bold border border-gray-200 text-xs focus:ring-2 focus:ring-primary focus:outline-none" required>
                                </div>

                                <div>
                                    <label class="block text-[9px] font-black uppercase tracking-wider text-gray-500 mb-1">MOBILE NUMBER (FOR DELIVERY UPDATES)</label>
                                    <input id="qb-buyer-phone" type="tel" placeholder="e.g. 9876543210" class="w-full bg-white p-3 rounded-xl font-bold border border-gray-200 text-xs focus:ring-2 focus:ring-primary focus:outline-none" required>
                                </div>

                                <div>
                                    <label class="block text-[9px] font-black uppercase tracking-wider text-gray-500 mb-1">DELIVERY ADDRESS (HOUSE / STREET / AREA)</label>
                                    <textarea id="qb-buyer-address" placeholder="Flat No., Landmark, City, State" class="w-full bg-white p-3 rounded-xl font-bold border border-gray-200 text-xs h-16 focus:ring-2 focus:ring-primary focus:outline-none" required></textarea>
                                </div>

                                <div>
                                    <label class="block text-[9px] font-black uppercase tracking-wider text-gray-500 mb-1">PINCODE</label>
                                    <input id="qb-buyer-pincode" placeholder="e.g. 560001" class="w-full bg-white p-3 rounded-xl font-bold border border-gray-200 text-xs focus:ring-2 focus:ring-primary focus:outline-none" required>
                                </div>
                            </div>

                            <!-- Right: Specific Farmer's Payment Scanner -->
                            <div class="bg-gradient-to-br from-emerald-900 to-emerald-950 text-white p-5 rounded-3xl border border-emerald-500/40 space-y-3.5 shadow-xl flex flex-col justify-between">
                                <div>
                                    <div class="flex items-center justify-between mb-2">
                                        <h4 class="text-xs font-black uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                                            <i class="fa-solid fa-qrcode text-emerald-400 text-base"></i> 2. Direct Farmer Scanner
                                        </h4>
                                        <span class="text-[9px] bg-emerald-500/30 text-emerald-300 font-extrabold px-2 py-0.5 rounded-full border border-emerald-500/30">Instant UPI</span>
                                    </div>

                                    <!-- Farmer Payee Details -->
                                    <div class="bg-black/30 p-2.5 rounded-2xl border border-emerald-500/20 text-center mb-3">
                                        <p class="text-[10px] text-gray-300 font-medium">Pay Directly to Farmer:</p>
                                        <p id="qb-farmer-name" class="text-xs font-black text-emerald-300">Organic Farm</p>
                                        <div class="flex items-center justify-center gap-2 mt-0.5">
                                            <span id="qb-farmer-upi" class="text-[11px] font-mono font-bold text-gray-200">farmer@upi</span>
                                            <button type="button" onclick="copyFarmerUpiId()" class="text-[9px] bg-white/10 hover:bg-white/20 text-emerald-300 px-2 py-0.5 rounded transition" title="Copy UPI ID">
                                                <i class="fa-solid fa-copy"></i>
                                            </button>
                                        </div>
                                    </div>

                                    <!-- Dynamic QR Scanner Box -->
                                    <div class="w-36 h-36 mx-auto bg-white p-2 rounded-2xl shadow-lg border-2 border-emerald-400 flex items-center justify-center relative group">
                                        <img id="qb-dynamic-qr" src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=farmer@upi" class="w-full h-full object-contain rounded-lg">
                                        <div class="absolute inset-x-2 h-0.5 bg-emerald-500 shadow-[0_0_10px_#10b981] animate-pulse top-2 pointer-events-none"></div>
                                    </div>

                                    <p class="text-center text-xs font-bold text-emerald-300 mt-2">
                                        Scan with GPay / PhonePe / Paytm: <span id="qb-qr-payable-text" class="font-extrabold text-white text-sm">₹0.00</span>
                                    </p>
                                </div>

                                <!-- Transaction Ref / UTR -->
                                <div class="pt-2 border-t border-emerald-800/60">
                                    <label class="block text-[9px] font-black uppercase tracking-wider text-emerald-300 mb-1">TRANSACTION REF / UTR (AFTER SCANNING)</label>
                                    <input id="qb-utr-input" placeholder="e.g. 426819028172 (Optional for demo)" class="w-full bg-black/40 border border-emerald-500/40 rounded-xl py-2 px-3 text-xs font-mono font-bold text-white placeholder-emerald-200/30 focus:outline-none focus:ring-1 focus:ring-emerald-400">
                                </div>
                            </div>
                        </div>

                        <!-- Price Breakdown & Confirm Button -->
                        <div class="bg-gray-50 p-4 rounded-3xl border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div class="flex items-center gap-6 text-xs text-gray-600 font-bold">
                                <div>Subtotal: <span id="qb-subtotal-text" class="text-textDark font-extrabold">₹0.00</span></div>
                                <div>Shipping: <span id="qb-shipping-text" class="text-emerald-700 font-extrabold">₹40.00</span></div>
                                <div>Tax (5%): <span id="qb-tax-text" class="text-textDark font-extrabold">₹0.00</span></div>
                                <div class="text-sm font-black text-primary">Total: <span id="qb-total-text" class="text-lg">₹0.00</span></div>
                            </div>

                            <button type="submit" class="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-black px-8 py-4 rounded-2xl uppercase tracking-widest shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2">
                                <i class="fa-solid fa-qrcode"></i> Confirm & Place Order (<span id="qb-btn-total">₹0.00</span>)
                            </button>
                        </div>
                    </form>
                </div>

                <!-- 2. ORDER SUCCESS VIEW -->
                <div id="qb-success-view" class="text-center py-6 space-y-5 hidden">
                    <div class="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto text-emerald-600 text-4xl shadow-lg animate-bounce">
                        <i class="fa-solid fa-check"></i>
                    </div>

                    <div>
                        <span class="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-700 bg-emerald-50 px-3.5 py-1 rounded-full border border-emerald-200">
                            Instant Direct Order Confirmed
                        </span>
                        <h2 class="font-heading font-black text-3xl text-textDark mt-2">Thank You for Your Order!</h2>
                        <p class="text-xs text-gray-500 font-medium mt-1">Your payment is verified and directly forwarded to the farmer.</p>
                    </div>

                    <div class="bg-gray-50 p-5 rounded-3xl border border-gray-200 max-w-md mx-auto text-left space-y-2 text-xs">
                        <div class="flex justify-between">
                            <span class="text-gray-400 font-bold uppercase">Order Reference:</span>
                            <span id="qb-success-order-id" class="font-mono font-black text-primaryDark">MV-MEESHO-123456</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-400 font-bold uppercase">Total Paid:</span>
                            <span id="qb-success-amount" class="font-black text-emerald-700">₹0.00</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-400 font-bold uppercase">Estimated Dispatch:</span>
                            <span class="font-bold text-gray-800">24–48 Hours</span>
                        </div>
                        <p id="qb-success-farmer-note" class="text-[10px] text-emerald-800 font-bold pt-2 border-t border-gray-200">Payment forwarded to farmer.</p>
                    </div>

                    <div class="flex justify-center gap-3 pt-2">
                        <button onclick="closeQuickBuyModal(); if(window.location.pathname.includes('dashboard.html')) loadSection('orders'); else window.location.href='dashboard.html';" class="bg-primary text-white font-black px-6 py-3.5 rounded-2xl text-xs uppercase tracking-widest hover:bg-primaryDark transition shadow-md">
                            View Order in Dashboard
                        </button>
                        <button onclick="closeQuickBuyModal()" class="bg-gray-100 text-gray-700 font-black px-6 py-3.5 rounded-2xl text-xs uppercase tracking-widest hover:bg-gray-200 transition">
                            Continue Shopping
                        </button>
                    </div>
                </div>

            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// Ensure modals and chatbot initialize on load
document.addEventListener('DOMContentLoaded', () => {
    initFarmerScannerModal();
    initQuickBuyModal();
    initChatbot();
});


