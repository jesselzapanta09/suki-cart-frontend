export const MOCK_PRODUCTS = [
    { id: 1, name: "Fresh Jasmine Rice (5kg)", price: 280.0, category: "Grains & Staples", image: null, stock: 120, rating: 4.8, sold: 340, created_at: "2025-01-10T08:00:00Z" },
    { id: 2, name: "Free-Range Eggs (Dozen)", price: 95.0, category: "Dairy & Eggs", image: null, stock: 85, rating: 4.9, sold: 210, created_at: "2025-01-12T09:30:00Z" },
    { id: 3, name: "Organic Tomatoes (1kg)", price: 65.0, category: "Vegetables", image: null, stock: 200, rating: 4.6, sold: 180, created_at: "2025-01-14T07:45:00Z" },
    { id: 4, name: "Pork Liempo (500g)", price: 165.0, category: "Meat & Seafood", image: null, stock: 45, rating: 4.7, sold: 95, created_at: "2025-01-15T10:00:00Z" },
    { id: 5, name: "Coconut Cooking Oil (1L)", price: 120.0, category: "Oils & Condiments", image: null, stock: 60, rating: 4.5, sold: 140, created_at: "2025-01-16T11:00:00Z" },
    { id: 6, name: "Bangus (Milkfish) 500g", price: 145.0, category: "Meat & Seafood", image: null, stock: 30, rating: 4.8, sold: 78, created_at: "2025-01-17T08:15:00Z" },
    { id: 7, name: "Sweet Potato (1kg)", price: 55.0, category: "Vegetables", image: null, stock: 150, rating: 4.4, sold: 220, created_at: "2025-01-18T09:00:00Z" },
    { id: 8, name: "Calamansi (250g)", price: 35.0, category: "Fruits", image: null, stock: 300, rating: 4.7, sold: 410, created_at: "2025-01-19T07:30:00Z" },
    { id: 9, name: "Brown Sugar (1kg)", price: 75.0, category: "Grains & Staples", image: null, stock: 90, rating: 4.3, sold: 165, created_at: "2025-01-20T08:00:00Z" },
    { id: 10, name: "Sitaw (String Beans) 250g", price: 40.0, category: "Vegetables", image: null, stock: 180, rating: 4.5, sold: 130, created_at: "2025-01-21T09:00:00Z" },
    { id: 11, name: "Fresh Ginger (200g)", price: 30.0, category: "Spices & Herbs", image: null, stock: 250, rating: 4.6, sold: 195, created_at: "2025-01-22T07:00:00Z" },
    { id: 12, name: "Tilapia (500g)", price: 110.0, category: "Meat & Seafood", image: null, stock: 40, rating: 4.7, sold: 88, created_at: "2025-01-23T08:30:00Z" },
];

export const MOCK_USERS = [
    { id: 1, username: "admin", email: "admin@sukicart.ph", role: "admin", avatar: null, email_verified_at: "2025-01-01T00:00:00Z", created_at: "2025-01-01T00:00:00Z" },
    { id: 2, username: "juan_dela_cruz", email: "juan@example.com", role: "customer", avatar: null, email_verified_at: "2025-01-05T10:00:00Z", created_at: "2025-01-05T10:00:00Z" },
    { id: 3, username: "maria_santos", email: "maria@example.com", role: "customer", avatar: null, email_verified_at: null, created_at: "2025-01-10T14:00:00Z" },
    { id: 4, username: "pedro_reyes", email: "pedro@example.com", role: "seller", avatar: null, email_verified_at: "2025-01-12T08:00:00Z", created_at: "2025-01-12T08:00:00Z" },
    { id: 5, username: "store_manager", email: "manager@sukicart.ph", role: "seller", avatar: null, email_verified_at: "2025-01-03T09:00:00Z", created_at: "2025-01-03T09:00:00Z" },
];

export const MOCK_NOTIFICATIONS = [
    { id: 1, type: "order", title: "Order Delivered", message: "Your order #1042 has been delivered.", time: "2 min ago", read: false },
    { id: 2, type: "promo", title: "Flash Sale!", message: "50% off on vegetables today only.", time: "1 hr ago", read: false },
    { id: 3, type: "system", title: "Profile Updated", message: "Your profile has been updated successfully.", time: "3 hrs ago", read: true },
    { id: 4, type: "order", title: "Order Shipped", message: "Your order #1041 is on its way.", time: "Yesterday", read: true },
    { id: 5, type: "promo", title: "New Products Available", message: "Fresh arrivals in Vegetables & Fruits.", time: "2 days ago", read: true },
];

export const MOCK_ORDERS = [
    { id: "1042", date: "2025-01-22", status: "delivered", total: 440, items: 3 },
    { id: "1041", date: "2025-01-20", status: "shipped", total: 280, items: 1 },
    { id: "1040", date: "2025-01-18", status: "processing", total: 320, items: 2 },
];

export const MOCK_ADMIN_USER = { id: 1, username: "admin", email: "admin@sukicart.ph", role: "admin", avatar: null };
export const MOCK_CUSTOMER_USER = { id: 2, username: "juan_dela_cruz", email: "juan@example.com", role: "customer", avatar: null };
export const MOCK_SELLER_USER = { id: 4, username: "pedro_reyes", email: "pedro@example.com", role: "seller", avatar: null, storeName: "Pedro's Fresh Market" };
export const MOCK_REGULAR_USER = MOCK_CUSTOMER_USER;

export const MOCK_CREDENTIALS = [
    { email: "admin@sukicart.ph", password: "password", user: MOCK_ADMIN_USER, token: "mock-admin-token" },
    { email: "juan@example.com", password: "password", user: MOCK_CUSTOMER_USER, token: "mock-customer-token" },
    { email: "pedro@example.com", password: "password", user: MOCK_SELLER_USER, token: "mock-seller-token" },
];
