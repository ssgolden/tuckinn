window.tuckinn = function() {
    return {
        view: 'home',
        isLoading: true,
        isDrawerOpen: false,
        activeCategory: 'Meal Deals',
        builderType: '',
        builderStep: 1,
        selectedTier: null,
        cart: JSON.parse(localStorage.getItem('tuckinn_cart')) || [],
        orderType: 'collect',
        checkoutForm: {
            address: '',
            phone: ''
        },
        specialInstructions: '',
        orderSuccess: null,
        toasts: [],
        currentBuild: { id: null, type: '', selections: {}, price: 0, tier: null },
        
        sandwichTiers: {
            premium: { price: 6.45, limits: { 'Choose Bread': 1, 'The Protein': 1, 'Add Cheese': 1, 'Fresh Veg': 2, 'Signature Sauces': 1 } },
            deluxe: { price: 8.95, limits: { 'Choose Bread': 1, 'The Protein': 2, 'Add Cheese': 2, 'Fresh Veg': 3, 'Signature Sauces': 1 } }
        },

        fullMenu: {},

        sandwichSteps: [
            { id: 'Choose Bread', options: ['White Bread', 'Brown Bread', 'White Roll', 'Brown Roll', 'Baguette', 'Wrap', 'Pitta Bread', 'Bagel', 'Bakers Bread Of The Day'] },
            { id: 'The Protein', options: ['Chicken', 'Roast Beef', 'Corn Beef', 'Tuna', 'Smoked Salmon', 'Egg', 'Bacon', 'Sausage', 'Honey Roast Ham', 'Ham', 'Palma Ham', 'Chorizo', 'Salami', 'Pork', 'Pulled Pork', 'Prawns'] },
            { id: 'Add Cheese', options: ['Cheddar', 'Feta', 'Cream Cheese', 'Gouda', 'Mozzarella'] },
            { id: 'Fresh Veg', options: ['Lettuce', 'Tomato', 'Red Onion', 'Cucumber', 'Sweetcorn', 'Spinach', 'Rocket', 'Grated Carrot', 'Peppers', 'Beetroot', 'Mushrooms', 'Garlic', 'Olives', 'Celery', 'Avocado', 'Jalapenos'], multi: true },
            { id: 'Signature Sauces', options: ['Mayonnaise', 'Alioli', 'English Mustard', 'Dijon Mustard', 'Horseradish', 'Mint Sauce', 'Cranberry Sauce', 'Tomato Ketchup', 'Brown Sauce', 'Bbq Sauce', 'Salad Dressing', 'Salad Cream', 'Pesto', 'Ranch Sauce', 'Sweet Chilli', 'Hot Sauce', 'Branston Pickle'], multi: true }
        ],

        init() {
            this.$watch('cart', val => localStorage.setItem('tuckinn_cart', JSON.stringify(val)));
            this.$watch('currentBuild.selections', () => this.updateSandwichPreview());
            this.$watch('builderStep', () => this.$nextTick(() => this.updateSandwichPreview()));
            this.loadMenu();
        },

        async loadMenu() {
            this.isLoading = true;
            try {
                const res = await fetch('/api/menu');
                const menu = await res.json();
                if (menu && Object.keys(menu).length > 0) {
                    this.fullMenu = menu;
                } else {
                    // Seed if empty
                    await fetch('/api/seed-menu', { method: 'POST' });
                    const res2 = await fetch('/api/menu');
                    this.fullMenu = await res2.json();
                }
                // Add justAdded prop to each item
                Object.values(this.fullMenu).forEach(items => {
                    items.forEach(item => item.justAdded = false);
                });
            } catch (e) {
                console.error('Menu load error', e);
            }
            this.isLoading = false;
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
            this.currentBuild = { id: Date.now(), type: 'sandwich', tier: tier, selections: {}, price: this.sandwichTiers[tier].price };
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
                    if (selections.length >= limit) return alert(`Maximum allowed: ${limit}`);
                    selections.push(option);
                }
            } else {
                this.currentBuild.selections[stepId] = option;
            }
        },

        nextStep() {
            if (this.builderStep < this.totalSteps) this.builderStep++;
            else this.addToCart();
            this.$nextTick(() => this.updateSandwichPreview());
        },

        prevStep() {
            if (this.builderStep > 1) this.builderStep--;
            else this.view = 'tier-select';
            this.$nextTick(() => this.updateSandwichPreview());
        },

        addToCart(item = null) {
            if (item) this.cart.push({ id: Date.now(), ...item });
            else {
                const name = this.currentBuild.tier === 'premium' ? 'Premium Sandwich' : 'Deluxe Sandwich';
                this.cart.push({ ...this.currentBuild, name: name });
            }
            this.showToast('Added to basket!', 'success');
            this.view = 'cart';
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
            // Bottom bread
            html += `<div class="sandwich-layer layer-bread-bottom"></div>`;
            // Veggies
            (Array.isArray(veggies) ? veggies : [veggies]).forEach(v => {
                if (!v) return;
                const cls = this.getVegClass(v);
                html += `<div class="sandwich-layer layer-veg ${cls}"></div>`;
            });
            // Sauces
            (Array.isArray(sauces) ? sauces : [sauces]).forEach(s => {
                if (!s) return;
                const cls = this.getSauceClass(s);
                html += `<div class="sandwich-layer layer-sauce ${cls}"></div>`;
            });
            // Cheeses
            cheeses.forEach(c => {
                if (!c) return;
                const cls = this.getCheeseClass(c);
                html += `<div class="sandwich-layer layer-cheese ${cls}"></div>`;
            });
            // Proteins
            proteins.forEach(p => {
                if (!p) return;
                const cls = this.getProteinClass(p);
                html += `<div class="sandwich-layer layer-protein ${cls}"></div>`;
            });
            // Top bread
            html += `<div class="sandwich-layer layer-bread-top"></div>`;

            visual.innerHTML = html;

            // Tags
            let tagsHtml = '';
            if (bread) {
                tagsHtml += `<div class="tag-category">Bread</div><span class="sandwich-ingredient-tag">${bread}</span>`;
            }
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
            const map = {
                'Lettuce': 'veg-lettuce', 'Tomato': 'veg-tomato', 'Red Onion': 'veg-red-onion',
                'Cucumber': 'veg-cucumber', 'Spinach': 'veg-spinach', 'Rocket': 'veg-rocket',
                'Avocado': 'veg-avocado', 'Peppers': 'veg-peppers', 'Jalapenos': 'veg-jalapenos'
            };
            return map[v] || 'veg-default';
        },

        getProteinClass(p) {
            const map = {
                'Chicken': 'protein-chicken', 'Roast Beef': 'protein-beef', 'Corn Beef': 'protein-beef',
                'Tuna': 'protein-tuna', 'Smoked Salmon': 'protein-salmon', 'Bacon': 'protein-bacon',
                'Ham': 'protein-ham', 'Honey Roast Ham': 'protein-ham'
            };
            return map[p] || 'protein-default';
        },

        getCheeseClass(c) {
            const map = {
                'Cheddar': 'cheese-cheddar', 'Feta': 'cheese-feta', 'Cream Cheese': 'cheese-cream-cheese',
                'Gouda': 'cheese-gouda', 'Mozzarella': 'cheese-mozzarella'
            };
            return map[c] || 'cheese-cheddar';
        },

        getSauceClass(s) {
            const map = {
                'Mayonnaise': 'sauce-mayonnaise', 'Alioli': 'sauce-alioli',
                'English Mustard': 'sauce-mustard', 'Dijon Mustard': 'sauce-mustard',
                'Pesto': 'sauce-pesto', 'Bbq Sauce': 'sauce-bbq', 'Tomato Ketchup': 'sauce-ketchup',
                'Sweet Chilli': 'sauce-sweet-chilli', 'Hot Sauce': 'sauce-hot-sauce'
            };
            return map[s] || 'sauce-default';
        },

        removeFromCart(index) {
            this.cart.splice(index, 1);
        },

        qtyIncrease(index) {
            this.cart[index].quantity = (this.cart[index].quantity || 1) + 1;
        },

        qtyDecrease(index) {
            if (this.cart[index].quantity > 1) {
                this.cart[index].quantity--;
            } else {
                this.cart.splice(index, 1);
            }
        },

        get cartTotal() {
            return this.cart.reduce((sum, i) => sum + (parseFloat(i.price) * (i.quantity || 1)), 0).toFixed(2);
        },

        async processOrder() {
            if (!this.checkoutForm.address) {
                alert('Please enter your name');
                return;
            }
            if (this.orderType === 'collect' && !this.checkoutForm.phone) {
                alert('Please enter your phone number');
                return;
            }
            try {
                const orderNum = 'TK' + Date.now().toString().slice(-6);
                const res = await fetch('/api/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        order_number: orderNum,
                        customer_name: this.checkoutForm.address,
                        items: this.cart,
                        total: parseFloat(this.cartTotal),
                        phone: this.orderType === 'collect' ? this.checkoutForm.phone : '',
                        order_type: this.orderType,
                        special_instructions: this.specialInstructions
                    })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Order failed');
                this.orderSuccess = {
                    order_number: data.order_number,
                    items: this.cart,
                    total: this.cartTotal,
                    customer_name: this.checkoutForm.address,
                    order_type: this.orderType
                };
                this.cart = [];
                this.specialInstructions = '';
                this.checkoutForm = { address: '', phone: '' };
                this.view = 'success';
            } catch (err) {
                alert('Order failed: ' + err.message);
            }
        }
    };
};