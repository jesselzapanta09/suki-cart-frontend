import api from "./api";

export function getCustomerDashboard() {
    return api.get("/customer/dashboard");
}
