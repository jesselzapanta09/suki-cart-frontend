import api from "./api";

export function getAdminDashboard() {
    return api.get("/admin/dashboard");
}
