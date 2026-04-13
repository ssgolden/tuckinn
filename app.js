const API_BASE = window.TUCKINN_API_BASE || '/api';

window.tuckinn = function() {
    return {
        view: 'home',
        isLoading: true,
        isDrawerOpen: false,
        activeCategory: 'Meal Deals',
        builderType: '',
        builderStep: 1,
        selectedTier: null,
        cart: [],
        orderType: 'collect',
        checkoutForm: {
            name: '',
            phone: ''
        },
        specialInstructions: '',
        orderSuccess: null,
        toasts: [],
        currentBuild: { id: null, type: '', selections: {}, price: 0, tier: null },
        tableNumber: null,
        isTableLocked: false,
        pendingView: null,
        pendingCategory: null,

        sandwichTiers: {
            premium: { price: 6.45, limits: { 'Choose Bread': 1, 'The Protein': 1, 'Add Cheese': 1, 'Fresh Veg': 2, 'Signature Sauces': 1 } },
            deluxe:  { price: 8.95, limits: { 'Choose Bread': 1, 'The Protein': 2, 'Add Cheese': 2, 'Fresh Veg': 3, 'Signature Sauces': 1 } }
        },

        fullMenu: {},

        sandwichSteps: [
            { id: 'Choose Bread',     options: ['White Bread', 'Brown Bread', 'White Roll', 'Brown Roll', 'Baguette', 'Wrap', 'Pitta Bread', 'Bagel', 'Bakers Bread Of The Day'] },
            { id: 'The Protein',      options: ['Chicken', 'Roast Beef', 'Corn Beef', 'Tuna', 'Smoked Salmon', 'Egg', 'Bacon', 'Sausage', 'Honey Roast Ham', 'Ham', 'Palma Ham', 'Chorizo', 'Salami', 'Pork', 'Pulled Pork', 'Prawns'] },
            { id: 'Add Cheese',       options: ['Cheddar', 'Feta', 'Cream Cheese', 'Gouda', 'Mozzarella'] },
            { id: 'Fresh Veg',        options: ['Lettuce', 'Tomato', 'Red Onion', 'Cucumber', 'Sweetcorn', 'Spinach', 'Rocket', 'Grated Carrot', 'Peppers', 'Beetroot', 'Mushrooms', 'Garlic', 'Olives', 'Celery', 'Avocado', 'Jalapenos'], multi: true },
            { id: 'Signature Sauces', options: ['Mayonnaise', 'Alioli', 'English Mustard', 'Dijon Mustard', 'Horseradish', 'Mint Sauce', 'Cranberry Sauce', 'Tomato Ketchup', 'Brown Sauce', 'Bbq Sauce', 'Salad Dressing', 'Salad Cream', 'Pesto', 'Ranch Sauce', 'Sweet Chilli', 'Hot Sauce', 'Branston Pickle'], multi: true }
        ],

        init() {
            const urlParams    = new URLSearchParams(window.location.search);
            const tableParam   = urlParams.get('table');
            const viewParam    = urlParams.get('view');
            const categoryParam = urlParams.get('category');

            if (tableParam) {
                this.tableNumber   = parseInt(tableParam, 10);
                this.isTableLocked = true;
                this.orderType     = 'instore';
            }
            if (viewParam)    this.pendingView     = viewParam;
            if (categoryParam) this.pendingCategory = categoryParam;

            // Persist cart in localStorage
            const saved = localStorage.getItem('tuckinn_cart');
            if (saved) {
                try { this.cart = JSON.parse(saved); } catch (_) {}
            }

            this.$watch('cart', val => {
                localStorage.setItem('tuckinn_cart', JSON.stringify(val));
            });
            this.$watch('currentBuild.selections', () => this.updateSandwichPreview());
            this.$watch('builderStep', () => this.$nextTick(() => this.updateSandwichPreview()));

            this.loadMenu();
        },

        // ── Menu ────────────────────────────────────────────────────────────
        async loadMenu() {
            this.isLoading = true;
            try {
                const res  = await fetch(`${API_BASE}/menu`);
                const data = await res.json();

                if (data && typeof data === 'object' && !Array.isArray(data)) {
                    this.fullMenu = data;
                    // Attach justAdded flag to every item
                    Object.values(this.fullMenu).forEach(items => {
                        items.forEach(item => { item.justAdded = false; });
                    });
                } else {
                    throw new Error('Unexpected menu format');
                }

                this.applyPendingRoute();
            } catch (e) {
                console.error('Menu load error', e);
                this.showToast('Menu could not be loaded.', 'error');
            }
            this.isLoading = false;
        },

        // ── Builder ──────────────────────────────────────────────────────────
        startBuilder(type) {
            this.builderType  = type;
            this.builderStep  = 1;
            this.selectedTier = null;
            if (type === 'sandwich') {
                this.view = 'tier-select';
            }
        },

        selectTier(tier) {
            this.builderType  = 'sandwich';
            this.currentBuild = {
                id: Date.now(),
                type: 'sandwich',
                tier,
                selections: {},
                price: this.sandwichTiers[tier].price
            };
            this.builderStep = 1;
            this.view        = 'build';
            this.$nextTick(() => this.updateSandwichPreview());
        },

        get totalSteps()  { return this.sandwichSteps.length; },
        get currentStep() { return this.sandwichSteps[this.builderStep - 1] || null; },

        isSelected(stepId, option) {
            const sel = this.currentBuild.selections[stepId];
            return sel && (Array.isArray(sel) ? sel.includes(option) : sel === option);
        },

        selectOption(stepId, option, multi = false) {
            const isMulti = multi || (this.currentBuild.tier && this.sandwichTiers[this.currentBuild.tier].limits[stepId] > 1);

            if (isMulti) {
                if (!this.currentBuild.selections[stepId]) this.currentBuild.selections[stepId] = [];
                const selections = this.currentBuild.selections[stepId];
                const idx = selections.indexOf(option);
                if (idx > -1) {
                    selections.splice(idx, 1);
                } else {
                    const limit = this.sandwichTiers[this.currentBuild.tier]?.limits[stepId] || 99;
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
            if (this.builderStep < this.totalSteps) {
                this.builderStep++;
            } else {
                this.addBuilderToCart();
            }
            this.$nextTick(() => this.updateSandwichPreview());
        },

        prevStep() {
            if (this.builderStep > 1) this.builderStep--;
            else this.view = 'tier-select';
            this.$nextTick(() => this.updateSandwichPreview());
        },

        // ── Cart (local state) ───────────────────────────────────────────────
        addToCart(item) {
            // item = { name, price, desc }
            const existing = this.cart.find(c => c.name === item.name && !c.selections);
            if (existing) {
                existing.quantity = (existing.quantity || 1) + 1;
            } else {
                this.cart.push({ ...item, quantity: 1, justAdded: false });
            }
            this.showToast('Added to basket!', 'success');
        },

        addBuilderToCart() {
            const name = this.currentBuild.tier === 'premium' ? 'Premium Sandwich' : 'Deluxe Sandwich';
            this.cart.push({
                name,
                price:      this.currentBuild.price,
                desc:       '',
                selections: { ...this.currentBuild.selections },
                tier:       this.currentBuild.tier,
                type:       'sandwich',
                quantity:   1
            });
            this.showToast('Sandwich added to basket!', 'success');
            this.view = 'cart';
        },

        removeFromCart(index) {
            this.cart.splice(index, 1);
        },

        qtyIncrease(index) {
            if (!this.cart[index]) return;
            this.cart[index].quantity = (this.cart[index].quantity || 1) + 1;
        },

        qtyDecrease(index) {
            if (!this.cart[index]) return;
            if ((this.cart[index].quantity || 1) > 1) {
                this.cart[index].quantity--;
            } else {
                this.removeFromCart(index);
            }
        },

        get cartTotal() {
            return this.cart.reduce((sum, i) => sum + (parseFloat(i.price) || 0) * (i.quantity || 1), 0);
        },

        // ── Order ────────────────────────────────────────────────────────────
        async processOrder() {
            const customerName = (this.checkoutForm.name || '').trim();
            const phone        = (this.checkoutForm.phone || '').trim();

            if (this.cart.length === 0) {
                this.showToast('Your basket is empty.', 'error');
                return;
            }
            if (!customerName || customerName.length < 2) {
                this.showToast('Please enter your name.', 'error');
                return;
            }
            if (this.orderType === 'collect' && phone.length < 7) {
                this.showToast('Please enter a valid phone number for collection.', 'error');
                return;
            }

            // Build items payload — flatten selections into desc string for server
            const items = this.cart.map(item => ({
                name:       item.name,
                price:      parseFloat(item.price) || 0,
                quantity:   item.quantity || 1,
                desc:       this.formatSelections(item) || item.desc || '',
                tier:       item.tier || '',
                type:       item.type || '',
                selections: item.selections || undefined
            }));

            try {
                const res = await fetch(`${API_BASE}/orders`, {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        customer_name:        customerName,
                        phone,
                        order_type:           this.orderType,
                        items,
                        special_instructions: this.specialInstructions || '',
                        table_number:         this.isTableLocked ? this.tableNumber : undefined,
                        num_people:           1
                    })
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Order failed');

                this.orderSuccess = {
                    order_number:   data.order.order_number,
                    total:          data.order.total,
                    customer_name:  data.order.customer_name,
                    order_type:     data.order.order_type,
                    table_number:   data.order.table_number,
                    items:          data.order.items
                };

                this.cart                = [];
                this.specialInstructions = '';
                this.checkoutForm        = { name: '', phone: '' };
                localStorage.removeItem('tuckinn_cart');
                this.view = 'success';

            } catch (err) {
                this.showToast('Order failed: ' + err.message, 'error');
            }
        },

        // ── Helpers ──────────────────────────────────────────────────────────
        showToast(message, type = 'info') {
            const id = Date.now() + Math.random();
            this.toasts.push({ id, message, type });
            setTimeout(() => {
                this.toasts = this.toasts.filter(t => t.id !== id);
            }, 2500);
        },

        formatSelections(item) {
            if (!item.selections || !Object.keys(item.selections).length) return item.desc || '';
            return Object.values(item.selections).flat().join(', ');
        },

        formatMoney(value) {
            return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(Number(value) || 0);
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
                    return { category, name: featured.name, desc: featured.desc, price: featured.price };
                })
                .filter(Boolean);
        },

        categorySummary(category) {
            const copy = {
                'Meal Deals':      'Fast combinations for lunch rushes and group orders.',
                'Originals':       'Signature house builds made for the main event.',
                'Smoothies':       'Fresh blends with premium fruit-forward flavour.',
                'Milkshakes':      'Thick, indulgent shakes finished to order.',
                'Drinks & Coffees':'Coffee bar staples, juices, and fridge picks.',
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
            this.view           = 'full-menu';
            this.isDrawerOpen   = false;
        },

        getCategoryIcon(category) {
            const icons = {
                'Meal Deals':      'local_offer',
                'Originals':       'restaurant',
                'Smoothies':       'blender',
                'Milkshakes':      'local_cafe',
                'Drinks & Coffees':'coffee',
                'Snacks & Sweets': 'cookie'
            };
            return icons[category] || 'restaurant_menu';
        },

        getStepIcon(stepId) {
            const icons = {
                'Choose Bread':     'bakery_dining',
                'The Protein':      'set_meal',
                'Add Cheese':       'egg',
                'Fresh Veg':        'eco',
                'Signature Sauces': 'local_dining'
            };
            return icons[stepId] || 'restaurant';
        },

        isOptionDisabled(stepId, option) {
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

        // ── Sandwich visual preview ──────────────────────────────────────────
        updateSandwichPreview() {
            const visual = document.getElementById('sandwichVisual');
            const tags   = document.getElementById('sandwichTags');
            if (!visual || !tags || !this.currentBuild?.selections) return;

            const sels    = this.currentBuild.selections;
            const bread   = sels['Choose Bread'] || 'White Bread';
            const proteins = sels['The Protein']      ? (Array.isArray(sels['The Protein'])      ? sels['The Protein']      : [sels['The Protein']])      : [];
            const cheeses  = sels['Add Cheese']        ? (Array.isArray(sels['Add Cheese'])        ? sels['Add Cheese']        : [sels['Add Cheese']])        : [];
            const veggies  = sels['Fresh Veg']         ? (Array.isArray(sels['Fresh Veg'])         ? sels['Fresh Veg']         : [sels['Fresh Veg']])         : [];
            const sauces   = sels['Signature Sauces']  ? (Array.isArray(sels['Signature Sauces'])  ? sels['Signature Sauces']  : [sels['Signature Sauces']])  : [];

            let html = `<div class="sandwich-layer layer-bread-bottom"></div>`;
            veggies.forEach(v  => { if (v) html += `<div class="sandwich-layer layer-veg ${this.getVegClass(v)}"></div>`; });
            sauces.forEach(s   => { if (s) html += `<div class="sandwich-layer layer-sauce ${this.getSauceClass(s)}"></div>`; });
            cheeses.forEach(c  => { if (c) html += `<div class="sandwich-layer layer-cheese ${this.getCheeseClass(c)}"></div>`; });
            proteins.forEach(p => { if (p) html += `<div class="sandwich-layer layer-protein ${this.getProteinClass(p)}"></div>`; });
            html += `<div class="sandwich-layer layer-bread-top"></div>`;
            visual.innerHTML = html;

            let tagsHtml = '';
            if (bread)          tagsHtml += `<div class="tag-category">Bread</div><span class="sandwich-ingredient-tag">${bread}</span>`;
            if (proteins.length){ tagsHtml += `<div class="tag-category mt-2">Protein</div>`; proteins.forEach(p => { if (p) tagsHtml += `<span class="sandwich-ingredient-tag">${p}</span>`; }); }
            if (cheeses.length) { tagsHtml += `<div class="tag-category mt-2">Cheese</div>`;  cheeses.forEach(c  => { if (c) tagsHtml += `<span class="sandwich-ingredient-tag">${c}</span>`; }); }
            if (veggies.length) { tagsHtml += `<div class="tag-category mt-2">Veg</div>`;     veggies.forEach(v  => { if (v) tagsHtml += `<span class="sandwich-ingredient-tag">${v}</span>`; }); }
            if (sauces.length)  { tagsHtml += `<div class="tag-category mt-2">Sauce</div>`;   sauces.forEach(s   => { if (s) tagsHtml += `<span class="sandwich-ingredient-tag">${s}</span>`; }); }
            tags.innerHTML = tagsHtml;
        },

        getVegClass(v) {
            const map = { 'Lettuce':'veg-lettuce','Tomato':'veg-tomato','Red Onion':'veg-red-onion','Cucumber':'veg-cucumber','Spinach':'veg-spinach','Rocket':'veg-rocket','Avocado':'veg-avocado','Peppers':'veg-peppers','Jalapenos':'veg-jalapenos' };
            return map[v] || 'veg-default';
        },
        getProteinClass(p) {
            const map = { 'Chicken':'protein-chicken','Roast Beef':'protein-beef','Corn Beef':'protein-beef','Tuna':'protein-tuna','Smoked Salmon':'protein-salmon','Bacon':'protein-bacon','Ham':'protein-ham','Honey Roast Ham':'protein-ham' };
            return map[p] || 'protein-default';
        },
        getCheeseClass(c) {
            const map = { 'Cheddar':'cheese-cheddar','Feta':'cheese-feta','Cream Cheese':'cheese-cream-cheese','Gouda':'cheese-gouda','Mozzarella':'cheese-mozzarella' };
            return map[c] || 'cheese-cheddar';
        },
        getSauceClass(s) {
            const map = { 'Mayonnaise':'sauce-mayonnaise','Alioli':'sauce-alioli','English Mustard':'sauce-mustard','Dijon Mustard':'sauce-mustard','Pesto':'sauce-pesto','Bbq Sauce':'sauce-bbq','Tomato Ketchup':'sauce-ketchup','Sweet Chilli':'sauce-sweet-chilli','Hot Sauce':'sauce-hot-sauce' };
            return map[s] || 'sauce-default';
        }
    };
};