import api from "./api";

export function getAdminProducts(params = {}) {
    return api.get("/admin/products", { params });
}

export function getAdminProduct(uuid) {
    return api.get(`/admin/products/${uuid}`);
}
