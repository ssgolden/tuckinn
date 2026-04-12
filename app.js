const API_BASE = window.TUCKINN_API_BASE || 'http://localhost:3200/api';

window.tuckinn = function() {
    const storedCartId = (() => {
        try { return localStorage.getItem('tuckinn_cart_id'); }
        catch (error) { return null; }
    })();

    return {
        view: 'home',
        isLoading: true,
        isDrawerOpen: false,
        activeCategory: 'Meal Deals',
        builderType: '',
        builderStep: 1,
        selectedTier: null,
        cart: [],
        cartId: storedCartId,
        orderType: 'collect',
        checkoutForm: {
            address: '',
            phone: ''
        },
        specialInstructions: '',
        orderSuccess: null,
        toasts: [],
        currentBuild: { id: null, type: '', selections: {}, price: 0, tier: null, selectedOptionIds: [] },
        tableNumber: null,
        isTableLocked: false,
        pendingView: null,
        pendingCategory: null,

        sandwichTiers: {
            premium: { price: 6.45, limits: { 'Choose Bread': 1, 'The Protein': 1, 'Add Cheese': 1, 'Fresh Veg': 2, 'Signature Sauces': 1 } },
            deluxe: { price: 8.95, limits: { 'Choose Bread': 1, 'The Protein': 2, 'Add Cheese': 2, 'Fresh Veg': 3, 'Signature Sauces': 1 } }
        },

        fullMenu: {},
        rawCatalog: null,

        sandwichSteps: [
            { id: 'Choose Bread', options: ['White Bread', 'Brown Bread', 'White Roll', 'Brown Roll', 'Baguette', 'Wrap', 'Pitta Bread', 'Bagel', 'Bakers Bread Of The Day'] },
            { id: 'The Protein', options: ['Chicken', 'Roast Beef', 'Corn Beef', 'Tuna', 'Smoked Salmon', 'Egg', 'Bacon', 'Sausage', 'Honey Roast Ham', 'Ham', 'Palma Ham', 'Chorizo', 'Salami', 'Pork', 'Pulled Pork', 'Prawns'] },
            { id: 'Add Cheese', options: ['Cheddar', 'Feta', 'Cream Cheese', 'Gouda', 'Mozzarella'] },
            { id: 'Fresh Veg', options: ['Lettuce', 'Tomato', 'Red Onion', 'Cucumber', 'Sweetcorn', 'Spinach', 'Rocket', 'Grated Carrot', 'Peppers', 'Beetroot', 'Mushrooms', 'Garlic', 'Olives', 'Celery', 'Avocado', 'Jalapenos'], multi: true },
            { id: 'Signature Sauces', options: ['Mayonnaise', 'Alioli', 'English Mustard', 'Dijon Mustard', 'Horseradish', 'Mint Sauce', 'Cranberry Sauce', 'Tomato Ketchup', 'Brown Sauce', 'Bbq Sauce', 'Salad Dressing', 'Salad Cream', 'Pesto', 'Ranch Sauce', 'Sweet Chilli', 'Hot Sauce', 'Branston Pickle'], multi: true }
        ],

        init() {
            const urlParams = new URLSearchParams(window.location.search);
            const tableParam = urlParams.get('table');
            const viewParam = urlParams.get('view');
            const categoryParam = urlParams.get('category');
            if (tableParam) {
                this.tableNumber = parseInt(tableParam);
                this.isTableLocked = true;
                this.orderType = 'instore';
            }
            if (viewParam) this.pendingView = viewParam;
            if (categoryParam) this.pendingCategory = categoryParam;

            this.$watch('cart', val => {
                localStorage.setItem('tuckinn_cart', JSON.stringify(val));
                localStorage.setItem('tuckinn_cart_id', this.cartId || '');
            });
            this.$watch('currentBuild.selections', () => this.updateSandwichPreview());
            this.$watch('builderStep', () => this.$nextTick(() => this.updateSandwichPreview()));
            this.loadMenu();
        },

        async loadMenu() {
            this.isLoading = true;
            try {
                const res = await fetch(`${API_BASE}/catalog/public?locationCode=main`);
                const data = await res.json();
                if (data && data.categories) {
                    this.rawCatalog = data;
                    const transformed = {};
                    for (const cat of data.categories) {
                        transformed[cat.name] = cat.products.map(p => ({
                            name: p.name,
                            desc: p.shortDescription || '',
                            price: (p.variants.find(v => v.isDefault) || p.variants[0] || {}).priceAmount || 0,
                            _slug: p.slug,
                            _id: p.id,
                            _modifierGroups: p.modifierGroups || [],
                            _variantId: (p.variants.find(v => v.isDefault) || p.variants[0] || {}).id || null
                        }));
                    }
                    this.fullMenu = transformed;
                }
                Object.values(this.fullMenu).forEach(items => {
                    items.forEach(item => item.justAdded = false);
                });
                this.applyPendingRoute();
            } catch (e) {
                console.error('Menu load error', e);
                this.showToast('Menu could not be loaded.', 'error');
            }
            this.isLoading = false;
        },

        async ensureCart() {
            if (this.cartId) return this.cartId;
            try {
                const body = { locationCode: 'main' };
                if (this.tableNumber) {
                    body.diningTableQrSlug = 'table-' + this.tableNumber;
                }
                const res = await fetch(`${API_BASE}/carts`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
                const data = await res.json();
                this.cartId = data.id;
                return data.id;
            } catch (e) {
                console.error('Cart creation error', e);
                this.showToast('Could not create basket.', 'error');
                return null;
            }
        },

        syncCartFromServer(cartData) {
            if (!cartData || !cartData.items) return;
            this.cart = cartData.items.map(item => ({
                id: item.id,
                name: item.itemName,
                price: item.quantity > 0 ? item.lineTotalAmount / item.quantity : item.unitPriceAmount,
                quantity: item.quantity,
                desc: (item.modifiers || []).map(m => m.modifierOptionName).join(', '),
                _itemName: item.itemName
            }));
        },

        startBuilder(type) {
            this.builderType = type;
            this.builderStep = 1;
            this.selectedTier = null;
            if (type === 'sandwich') {
                this.view = 'tier-select';
            }
        },

        selectTier(tier) {
            this.builderType = 'sandwich';
            this.currentBuild = { id: Date.now(), type: 'sandwich', tier: tier, selections: {}, price: this.sandwichTiers[tier].price, selectedOptionIds: [] };
            this.builderStep = 1;
            this.view = 'build';
            this.$nextTick(() => this.updateSandwichPreview());
        },

        get totalSteps() { return (this.builderType && this[this.builderType + 'Steps']) ? this[this.builderType + 'Steps'].length : 0; },
        get currentStep() { return (this.builderType && this[this.builderType + 'Steps']) ? this[this.builderType + 'Steps'][this.builderStep - 1] : null; },

        isSelected(stepId, option) {
            if (!stepId || !this.currentBuild.selections) return false;
            const sel = this.currentBuild.selections[stepId];
            return sel && (Array.isArray(sel) ? sel.includes(option) : sel === option);
        },

        selectOption(stepId, option, multi = false) {
            if (!this.currentBuild.selections) return;
            const isMulti = multi || (this.currentBuild.tier && this.sandwichTiers[this.currentBuild.tier].limits[stepId] > 1);

            if (isMulti) {
                if (!this.currentBuild.selections[stepId]) this.currentBuild.selections[stepId] = [];
                const selections = this.currentBuild.selections[stepId];
                const idx = selections.indexOf(option);
                if (idx > -1) selections.splice(idx, 1);
                else {
                    const limit = (this.currentBuild.tier) ? this.sandwichTiers[this.currentBuild.tier].limits[stepId] : 99;
                    if (selections.length >= limit) {
                        this.showToast(`Maximum allowed: ${limit}`, 'error');
                        return;
                    }
                    selections.push(option);
                }
            } else {
                this.currentBuild.selections[stepId] = option;
            }
        },

        nextStep() {
            if (!this.isCurrentStepComplete()) {
                this.showToast('Select at least one option before continuing.', 'error');
                return;
            }
            if (this.builderStep < this.totalSteps) this.builderStep++;
            else this.addToCart();
            this.$nextTick(() => this.updateSandwichPreview());
        },

        prevStep() {
            if (this.builderStep > 1) this.builderStep--;
            else this.view = 'tier-select';
            this.$nextTick(() => this.updateSandwichPreview());
        },

        async addToCart(item = null) {
            if (item) {
                await this.addPlatformItem(item);
            } else {
                const name = this.currentBuild.tier === 'premium' ? 'Premium Sandwich' : 'Deluxe Sandwich';
                const buildItem = {
                    id: Date.now(),
                    ...this.currentBuild,
                    name: name,
                    _slug: this.currentBuild.tier === 'premium' ? 'premium-sandwich' : 'deluxe-sandwich',
                    _modifierGroups: [],
                    _variantId: null
                };
                await this.addPlatformItem(buildItem);
            }
        },

        async addPlatformItem(item) {
            try {
                const cartId = await this.ensureCart();
                if (!cartId) return;

                const body = {
                    productSlug: item._slug,
                    quantity: item.quantity || 1,
                };

                if (item._variantId) {
                    body.variantId = item._variantId;
                }

                if (item._modifierGroups && item._modifierGroups.length > 0) {
                    const selectedIds = [];
                    for (const group of item._modifierGroups) {
                        for (const option of group.options) {
                            if (option.isDefault) {
                                selectedIds.push(option.id);
                            }
                        }
                    }
                    if (selectedIds.length > 0) {
                        body.selectedOptionIds = selectedIds;
                    }
                }

                const res = await fetch(`${API_BASE}/carts/${cartId}/items`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || data.error || 'Failed to add item');
                this.syncCartFromServer(data);
                this.showToast('Added to basket!', 'success');
                this.view = 'cart';
            } catch (e) {
                console.error('Add to cart error', e);
                this.showToast('Failed to add item: ' + e.message, 'error');
            }
        },

        async removeFromCart(index) {
            if (!this.cartId || !this.cart[index]) return;
            try {
                const itemId = this.cart[index].id;
                const res = await fetch(`${API_BASE}/carts/${this.cartId}/items/${itemId}`, {
                    method: 'DELETE'
                });
                const data = await res.json();
                if (res.ok) {
                    this.syncCartFromServer(data);
                } else {
                    this.cart.splice(index, 1);
                }
            } catch (e) {
                this.cart.splice(index, 1);
            }
        },

        async qtyIncrease(index) {
            if (!this.cartId || !this.cart[index]) return;
            try {
                const itemId = this.cart[index].id;
                const newQty = (this.cart[index].quantity || 1) + 1;
                const res = await fetch(`${API_BASE}/carts/${this.cartId}/items/${itemId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ quantity: newQty })
                });
                const data = await res.json();
                if (res.ok) this.syncCartFromServer(data);
                else this.cart[index].quantity = newQty;
            } catch (e) {
                this.cart[index].quantity = (this.cart[index].quantity || 1) + 1;
            }
        },

        async qtyDecrease(index) {
            if (!this.cartId || !this.cart[index]) return;
            if (this.cart[index].quantity > 1) {
                try {
                    const itemId = this.cart[index].id;
                    const newQty = this.cart[index].quantity - 1;
                    const res = await fetch(`${API_BASE}/carts/${this.cartId}/items/${itemId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ quantity: newQty })
                    });
                    const data = await res.json();
                    if (res.ok) this.syncCartFromServer(data);
                    else this.cart[index].quantity = newQty;
                } catch (e) {
                    this.cart[index].quantity--;
                }
            } else {
                await this.removeFromCart(index);
            }
        },

        showToast(message, type = 'info') {
            const id = Date.now();
            this.toasts.push({ id, message, type });
            setTimeout(() => {
                this.toasts = this.toasts.filter(t => t.id !== id);
            }, 2500);
        },

        formatSelections(item) {
            if (!item.selections) return item.desc || '';
            return Object.values(item.selections).flat().join(', ');
        },

        formatMoney(value) {
            return new Intl.NumberFormat('en-IE', {
                style: 'currency',
                currency: 'EUR'
            }).format(Number(value) || 0);
        },

        homeCategories() {
            return Object.keys(this.fullMenu || {}).slice(0, 4);
        },

        homeHighlights() {
            return Object.entries(this.fullMenu || {})
                .slice(0, 3)
                .map(([category, items]) => {
                    const featured = Array.isArray(items) ? items[0] : null;
                    if (!featured) return null;
                    return {
                        category,
                        name: featured.name,
                        desc: featured.desc,
                        price: featured.price
                    };
                })
                .filter(Boolean);
        },

        categorySummary(category) {
            const copy = {
                'Meal Deals': 'Fast combinations for lunch rushes and group orders.',
                'Originals': 'Signature house builds made for the main event.',
                'Smoothies': 'Fresh blends with premium fruit-forward flavour.',
                'Milkshakes': 'Thick, indulgent shakes finished to order.',
                'Drinks & Coffees': 'Coffee bar staples, juices, and fridge picks.',
                'Snacks & Sweets': 'Add-ons for impulse buys and bundle upgrades.'
            };
            return copy[category] || 'Explore the full range and order in seconds.';
        },

        applyPendingRoute() {
            if (this.pendingCategory && this.fullMenu[this.pendingCategory]) {
                this.activeCategory = this.pendingCategory;
            }
            if (!this.pendingView) return;
            const allowedViews = new Set(['home', 'full-menu', 'cart', 'account']);
            if (!allowedViews.has(this.pendingView)) return;
            if (this.pendingView === 'full-menu' && this.activeCategory) {
                this.view = 'full-menu';
                return;
            }
            this.view = this.pendingView;
        },

        openCategory(cat) {
            this.activeCategory = cat;
            this.view = 'full-menu';
            this.isDrawerOpen = false;
        },

        getCategoryIcon(category) {
            const icons = {
                'Meal Deals': 'local_offer',
                'Originals': 'restaurant',
                'Smoothies': 'blender',
                'Milkshakes': 'local_cafe',
                'Drinks & Coffees': 'coffee',
                'Snacks & Sweets': 'cookie'
            };
            return icons[category] || 'restaurant_menu';
        },

        getStepIcon(stepId) {
            const icons = {
                'Choose Bread': 'bakery_dining',
                'The Protein': 'set_meal',
                'Add Cheese': 'egg',
                'Fresh Veg': 'eco',
                'Signature Sauces': 'local_dining'
            };
            return icons[stepId] || 'restaurant';
        },

        isOptionDisabled(stepId, option) {
            if (!this.currentBuild || !this.currentBuild.selections) return false;
            const sel = this.currentBuild.selections[stepId];
            if (!sel || !Array.isArray(sel)) return false;
            const limit = this.sandwichTiers[this.currentBuild.tier]?.limits[stepId] || 99;
            return sel.length >= limit && !sel.includes(option);
        },

        isCurrentStepComplete() {
            const step = this.currentStep;
            if (!step) return true;
            const selection = this.currentBuild.selections[step.id];
            if (Array.isArray(selection)) return selection.length > 0;
            return Boolean(selection);
        },

        updateSandwichPreview() {
            const visual = document.getElementById('sandwichVisual');
            const tags = document.getElementById('sandwichTags');
            if (!visual || !tags || !this.currentBuild || !this.currentBuild.selections) return;

            const sels = this.currentBuild.selections;
            const bread = sels['Choose Bread'] || 'White Bread';
            const proteins = sels['The Protein'] ? (Array.isArray(sels['The Protein']) ? sels['The Protein'] : [sels['The Protein']]) : [];
            const cheeses = sels['Add Cheese'] ? (Array.isArray(sels['Add Cheese']) ? sels['Add Cheese'] : [sels['Add Cheese']]) : [];
            const veggies = sels['Fresh Veg'] || [];
            const sauces = sels['Signature Sauces'] || [];

            let html = '';
            html += `<div class="sandwich-layer layer-bread-bottom"></div>`;
            (Array.isArray(veggies) ? veggies : [veggies]).forEach(v => {
                if (!v) return;
                const cls = this.getVegClass(v);
                html += `<div class="sandwich-layer layer-veg ${cls}"></div>`;
            });
            (Array.isArray(sauces) ? sauces : [sauces]).forEach(s => {
                if (!s) return;
                const cls = this.getSauceClass(s);
                html += `<div class="sandwich-layer layer-sauce ${cls}"></div>`;
            });
            cheeses.forEach(c => {
                if (!c) return;
                const cls = this.getCheeseClass(c);
                html += `<div class="sandwich-layer layer-cheese ${cls}"></div>`;
            });
            proteins.forEach(p => {
                if (!p) return;
                const cls = this.getProteinClass(p);
                html += `<div class="sandwich-layer layer-protein ${cls}"></div>`;
            });
            html += `<div class="sandwich-layer layer-bread-top"></div>`;
            visual.innerHTML = html;

            let tagsHtml = '';
            if (bread) tagsHtml += `<div class="tag-category">Bread</div><span class="sandwich-ingredient-tag">${bread}</span>`;
            if (proteins.length) {
                tagsHtml += `<div class="tag-category mt-2">Protein</div>`;
                proteins.forEach(p => { if (p) tagsHtml += `<span class="sandwich-ingredient-tag">${p}</span>`; });
            }
            if (cheeses.length) {
                tagsHtml += `<div class="tag-category mt-2">Cheese</div>`;
                cheeses.forEach(c => { if (c) tagsHtml += `<span class="sandwich-ingredient-tag">${c}</span>`; });
            }
            if (veggies.length) {
                tagsHtml += `<div class="tag-category mt-2">Veg</div>`;
                (Array.isArray(veggies) ? veggies : [veggies]).forEach(v => { if (v) tagsHtml += `<span class="sandwich-ingredient-tag">${v}</span>`; });
            }
            if (sauces.length) {
                tagsHtml += `<div class="tag-category mt-2">Sauce</div>`;
                (Array.isArray(sauces) ? sauces : [sauces]).forEach(s => { if (s) tagsHtml += `<span class="sandwich-ingredient-tag">${s}</span>`; });
            }
            tags.innerHTML = tagsHtml;
        },

        getVegClass(v) {
            const map = { 'Lettuce': 'veg-lettuce', 'Tomato': 'veg-tomato', 'Red Onion': 'veg-red-onion', 'Cucumber': 'veg-cucumber', 'Spinach': 'veg-spinach', 'Rocket': 'veg-rocket', 'Avocado': 'veg-avocado', 'Peppers': 'veg-peppers', 'Jalapenos': 'veg-jalapenos' };
            return map[v] || 'veg-default';
        },
        getProteinClass(p) {
            const map = { 'Chicken': 'protein-chicken', 'Roast Beef': 'protein-beef', 'Corn Beef': 'protein-beef', 'Tuna': 'protein-tuna', 'Smoked Salmon': 'protein-salmon', 'Bacon': 'protein-bacon', 'Ham': 'protein-ham', 'Honey Roast Ham': 'protein-ham' };
            return map[p] || 'protein-default';
        },
        getCheeseClass(c) {
            const map = { 'Cheddar': 'cheese-cheddar', 'Feta': 'cheese-feta', 'Cream Cheese': 'cheese-cream-cheese', 'Gouda': 'cheese-gouda', 'Mozzarella': 'cheese-mozzarella' };
            return map[c] || 'cheese-cheddar';
        },
        getSauceClass(s) {
            const map = { 'Mayonnaise': 'sauce-mayonnaise', 'Alioli': 'sauce-alioli', 'English Mustard': 'sauce-mustard', 'Dijon Mustard': 'sauce-mustard', 'Pesto': 'sauce-pesto', 'Bbq Sauce': 'sauce-bbq', 'Tomato Ketchup': 'sauce-ketchup', 'Sweet Chilli': 'sauce-sweet-chilli', 'Hot Sauce': 'sauce-hot-sauce' };
            return map[s] || 'sauce-default';
        },

        get cartTotal() {
            if (this.cartId && this.cart.length > 0) {
                return this.cart.reduce((sum, i) => sum + (parseFloat(i.price) * (i.quantity || 1)), 0).toFixed(2);
            }
            return '0.00';
        },

        async processOrder() {
            const customerName = (this.checkoutForm.address || '').trim();
            const phone = (this.checkoutForm.phone || '').trim();

            if (this.cart.length === 0) {
                this.showToast('Your basket is empty.', 'error');
                return;
            }
            if (!customerName) {
                this.showToast('Please enter your name.', 'error');
                return;
            }
            if (this.orderType === 'collect' && phone.length < 7) {
                this.showToast('Please enter a valid phone number.', 'error');
                return;
            }

            try {
                const cartId = await this.ensureCart();
                if (!cartId) {
                    this.showToast('Basket error. Please try again.', 'error');
                    return;
                }

                const res = await fetch(`${API_BASE}/checkout/start`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        cartId: cartId,
                        idempotencyKey: crypto.randomUUID ? crypto.randomUUID() : 'tk-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                        orderKind: this.orderType,
                        customerName: customerName,
                        customerPhone: this.orderType === 'collect' ? phone : '',
                        specialInstructions: this.specialInstructions || undefined
                    })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || data.error || 'Order failed');

                this.orderSuccess = {
                    order_number: data.order?.orderNumber || '',
                    total: data.order?.totalAmount || 0,
                    customer_name: data.order?.customerName || customerName,
                    order_type: data.order?.orderKind || this.orderType,
                    items: this.cart.slice()
                };
                this.cart = [];
                this.cartId = null;
                this.specialInstructions = '';
                this.checkoutForm = { address: '', phone: '' };
                localStorage.removeItem('tuckinn_cart_id');
                this.view = 'success';
            } catch (err) {
                this.showToast('Order failed: ' + err.message, 'error');
            }
        }
    };
};