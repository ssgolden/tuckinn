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
            await this.restoreSession();
        },

        async restoreSession() {
            try {
                const response = await fetch('/api/staff/session', {
                    credentials: 'same-origin'
                });
                const data = await response.json();

                if (data.authenticated) {
                    this.authenticated = true;
                    this.startBoard();
                }
            } catch (error) {
                console.error('Failed to restore staff session:', error);
            }
        },

        async login() {
            try {
                const response = await fetch('/api/staff/login', {
                    method: 'POST',
                    credentials: 'same-origin',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ pin: this.pin })
                });

                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.error || 'Login failed');
                }

                this.authenticated = true;
                this.pin = '';
                this.pinError = '';
                this.startBoard();
            } catch (error) {
                this.pinError = error.message;
                this.pin = '';
            }
        },

        async logout() {
            try {
                await fetch('/api/staff/logout', {
                    method: 'POST',
                    credentials: 'same-origin'
                });
            } catch (error) {
                console.error('Failed to log out cleanly:', error);
            } finally {
                this.stopBoard();
                this.pinError = '';
            }
        },

        startBoard() {
            this.loadActiveOrders();
            this.loadHistory();
            this.connectSocket();

            if (!this.pollInterval) {
                this.pollInterval = setInterval(() => {
                    this.loadActiveOrders();
                    this.loadHistory();
                }, 5000);
            }
        },

        stopBoard() {
            this.authenticated = false;
            this.pin = '';
            this.activeOrders = [];
            this.historyOrders = [];
            this.connected = false;

            if (this.socket) {
                this.socket.disconnect();
                this.socket = null;
            }

            if (this.pollInterval) {
                clearInterval(this.pollInterval);
                this.pollInterval = null;
            }
        },

        handleUnauthorized() {
            this.pinError = 'Session expired. Sign in again.';
            this.stopBoard();
        },

        connectSocket() {
            if (this.socket) {
                return;
            }

            this.socket = io({
                transports: ['websocket', 'polling'],
                withCredentials: true
            });

            this.socket.on('connect', () => {
                this.connected = true;
            });

            this.socket.on('disconnect', () => {
                this.connected = false;
            });

            this.socket.on('connect_error', error => {
                this.connected = false;
                if (error && /unauthorized/i.test(error.message || '')) {
                    this.handleUnauthorized();
                }
            });

            this.socket.on('new_order', order => {
                if (!order || this.activeOrders.some(existing => existing.id === order.id)) {
                    return;
                }
                this.activeOrders.unshift(order);
                this.playAlert();
            });

            this.socket.on('order_status_update', data => {
                if (!data || !data.orderId) {
                    return;
                }

                if (data.status === 'served') {
                    this.activeOrders = this.activeOrders.filter(order => order.id !== data.orderId);
                    if (data.order) {
                        this.historyOrders.unshift(data.order);
                    }
                    return;
                }

                const index = this.activeOrders.findIndex(order => order.id === data.orderId);
                if (index !== -1) {
                    this.activeOrders[index] = data.order || { ...this.activeOrders[index], status: data.status };
                }
            });
        },

        async loadActiveOrders() {
            try {
                const response = await fetch('/api/orders?status=active', {
                    credentials: 'same-origin'
                });

                if (response.status === 401) {
                    this.handleUnauthorized();
                    return;
                }

                const data = await response.json();
                if (Array.isArray(data)) {
                    this.activeOrders = data;
                }
            } catch (error) {
                console.error('Failed to load active orders:', error);
            }
        },

        async loadHistory() {
            try {
                const response = await fetch('/api/orders?status=served', {
                    credentials: 'same-origin'
                });

                if (response.status === 401) {
                    this.handleUnauthorized();
                    return;
                }

                const data = await response.json();
                if (Array.isArray(data)) {
                    this.historyOrders = data;
                }
            } catch (error) {
                console.error('Failed to load history:', error);
            }
        },

        async updateStatus(orderId, status) {
            try {
                const response = await fetch(`/api/orders/${orderId}/status`, {
                    method: 'PATCH',
                    credentials: 'same-origin',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status })
                });

                if (response.status === 401) {
                    this.handleUnauthorized();
                    return;
                }

                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.error || 'Failed to update order');
                }

                if (status === 'served') {
                    this.activeOrders = this.activeOrders.filter(order => order.id !== orderId);
                    if (data.order) {
                        this.historyOrders.unshift(data.order);
                    }
                    return;
                }

                const index = this.activeOrders.findIndex(order => order.id === orderId);
                if (index !== -1 && data.order) {
                    this.activeOrders[index] = data.order;
                }
            } catch (error) {
                console.error('Failed to update status:', error);
            }
        },

        playAlert() {
            const sound = document.getElementById('alertSound');
            if (sound) {
                sound.currentTime = 0;
                sound.play().catch(() => {});
            }

            if (navigator.vibrate) {
                navigator.vibrate([200, 100, 200]);
            }
        },

        formatMoney(value) {
            return new Intl.NumberFormat('en-IE', {
                style: 'currency',
                currency: 'EUR'
            }).format(Number(value) || 0);
        },

        parseDateLocal(dateStr) {
            if (!dateStr) return null;
            const [datePart, timePart] = dateStr.split(' ');
            const [year, month, day] = datePart.split('-').map(Number);
            const [hour, minute, second] = (timePart || '00:00:00').split(':').map(Number);
            return new Date(year, month - 1, day, hour, minute, second);
        },

        timeAgo(dateStr) {
            if (!dateStr) return '';

            const now = new Date();
            const date = this.parseDateLocal(dateStr);
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);

            if (diffMins < 1) return 'Just now';
            if (diffMins < 60) return `${diffMins}m ago`;

            const diffHours = Math.floor(diffMins / 60);
            if (diffHours < 24) return `${diffHours}h ago`;

            return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
        },

        minsAgo(dateStr) {
            if (!dateStr) return 0;
            const now = new Date();
            const date = this.parseDateLocal(dateStr);
            return Math.floor((now - date) / 60000);
        },

        get combinedTodayOrders() {
            const today = new Date().toDateString();
            const seen = new Map();

            [...this.activeOrders, ...this.historyOrders].forEach(order => {
                const date = this.parseDateLocal(order.date);
                if (date && date.toDateString() === today) {
                    seen.set(order.id, order);
                }
            });

            return Array.from(seen.values());
        },

        get todayStats() {
            const orders = this.combinedTodayOrders.length;
            const revenue = this.combinedTodayOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
            return { orders, revenue };
        },

        get readyCount() {
            return this.activeOrders.filter(order => order.status === 'ready').length;
        }
    }));
});
