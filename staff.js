const STAFF_PIN = '1234';

document.addEventListener('alpine:init', () => {
    Alpine.data('staffBoard', () => ({
        authenticated: false,
        pin: '',
        pinError: '',
        activeOrders: [],
        historyOrders: [],
        connected: false,
        socket: null,
        pollInterval: null,
        activeTab: 'active',

        async init() {
            if (localStorage.getItem('staff_token')) {
                this.authenticated = true;
                this.connectSocket();
                this.loadActiveOrders();
            }
        },

        async login() {
            if (this.pin === STAFF_PIN) {
                this.authenticated = true;
                this.pin = '';
                this.pinError = '';
                localStorage.setItem('staff_token', 'staff_' + Date.now());
                this.connectSocket();
                this.loadActiveOrders();
                this.pollInterval = setInterval(() => this.loadActiveOrders(), 5000);
            } else {
                this.pinError = 'Invalid PIN';
                this.pin = '';
            }
        },

        logout() {
            this.authenticated = false;
            this.pin = '';
            localStorage.removeItem('staff_token');
            if (this.socket) {
                this.socket.disconnect();
                this.socket = null;
            }
            if (this.pollInterval) {
                clearInterval(this.pollInterval);
                this.pollInterval = null;
            }
        },

        connectSocket() {
            const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
            const host = window.location.hostname;
            const port = window.location.port || (protocol === 'https:' ? 443 : 3005);

            this.socket = io(`${protocol}//${host}:${port}`, {
                transports: ['websocket', 'polling']
            });

            this.socket.on('connect', () => {
                this.connected = true;
                this.socket.emit('staff_join');
            });

            this.socket.on('disconnect', () => {
                this.connected = false;
            });

            this.socket.on('new_order', (order) => {
                this.activeOrders.unshift(order);
                this.playAlert();
            });

            this.socket.on('order_status_update', (data) => {
                if (data.status === 'served') {
                    const idx = this.activeOrders.findIndex(o => o.id === data.orderId);
                    if (idx !== -1) {
                        const served = this.activeOrders.splice(idx, 1)[0];
                        served.status = 'served';
                        this.historyOrders.unshift(served);
                    }
                } else {
                    const idx = this.activeOrders.findIndex(o => o.id === data.orderId);
                    if (idx !== -1) {
                        this.activeOrders[idx].status = data.status;
                    }
                }
            });
        },

        async loadActiveOrders() {
            try {
                const res = await fetch('/api/orders?status=active');
                const data = await res.json();
                if (Array.isArray(data)) {
                    this.activeOrders = data;
                }
            } catch (e) {
                console.error('Failed to load orders:', e);
            }
        },

        async loadHistory() {
            try {
                const res = await fetch('/api/orders?status=served');
                const data = await res.json();
                if (Array.isArray(data)) {
                    this.historyOrders = data;
                }
            } catch (e) {
                console.error('Failed to load history:', e);
            }
        },

        async updateStatus(orderId, status) {
            try {
                await fetch(`/api/orders/${orderId}/status`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status })
                });
                // Optimistic update
                if (status === 'served') {
                    const idx = this.activeOrders.findIndex(o => o.id === orderId);
                    if (idx !== -1) {
                        const served = this.activeOrders.splice(idx, 1)[0];
                        served.status = 'served';
                        this.historyOrders.unshift(served);
                    }
                } else {
                    const idx = this.activeOrders.findIndex(o => o.id === orderId);
                    if (idx !== -1) this.activeOrders[idx].status = status;
                }
            } catch (e) {
                console.error('Failed to update status:', e);
            }
        },

        playAlert() {
            const sound = document.getElementById('alertSound');
            if (sound) {
                sound.currentTime = 0;
                sound.play().catch(() => {});
            }
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
        },

        parseDateLocal(dateStr) {
            if (!dateStr) return null;
            // Parse "YYYY-MM-DD HH:MM:SS" as local time (not UTC)
            const [datePart, timePart] = dateStr.split(' ');
            const [y, m, d] = datePart.split('-').map(Number);
            const [hh, mm, ss] = (timePart || '00:00:00').split(':').map(Number);
            return new Date(y, m - 1, d, hh, mm, ss);
        },

        timeAgo(dateStr) {
            if (!dateStr) return '';
            const now = new Date();
            const date = this.parseDateLocal(dateStr);
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);
            if (diffMins < 1) return 'Just now';
            if (diffMins < 60) return diffMins + 'm ago';
            const diffHours = Math.floor(diffMins / 60);
            if (diffHours < 24) return diffHours + 'h ago';
            return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
        },

        minsAgo(dateStr) {
            if (!dateStr) return 0;
            const now = new Date();
            const date = this.parseDateLocal(dateStr);
            return Math.floor((now - date) / 60000);
        },

        get todayStats() {
            const today = new Date();
            const todayStr = today.toDateString();
            const todayOrders = this.historyOrders.filter(o => {
                const d = this.parseDateLocal(o.date);
                return d && d.toDateString() === todayStr;
            });
            const orders = todayOrders.length;
            const revenue = todayOrders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0).toFixed(2);
            return { orders, revenue };
        },

        get avgPrepTime() {
            return '~8m';
        }
    }));
});
