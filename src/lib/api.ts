import axios from 'axios';

export const api = axios.create({
    baseURL: '/api',
});

// Auth API
export const authApi = {
    login: async (email: string, password: string) => {
        return { message: "Use next-auth signIn instead" };
    },
    register: async (data: any) => {
        const response = await axios.post('/api/auth/register', data);
        return response.data;
    },
    me: async () => {
        const response = await axios.get('/api/auth/session');
        return response.data;
    },
};

// Drones API
export const dronesApi = {
    list: async (params?: any) => {
        try {
            const res = await axios.get('/api/drones', { params });
            const items = Array.isArray(res.data) ? res.data : (res.data?.items || []);
            return { data: { total: items.length, items } };
        } catch {
            return { data: { total: 0, items: [] } };
        }
    },
    listModels: async () => {
        try {
            const res = await axios.get('/api/drones');
            const items = Array.isArray(res.data) ? res.data : [];
            return {
                data: items.map((d: any) => ({
                    id: d.id,
                    model_name: d.modelName,
                    model_number: d.id,
                    category: 'Rotary Wing',
                    weight_class: 'Small',
                    max_altitude_ft: 400,
                    npnt_compliant: true,
                })),
            };
        } catch {
            return { data: [] };
        }
    },
    createModel: async (data: any) => {
        const res = await axios.post('/api/drones', data);
        return { data: res.data };
    },
    get: async (id: string) => {
        const res = await axios.get(`/api/drones/${id}`);
        return { data: res.data };
    },
    create: async (data: any) => {
        const res = await axios.post('/api/drones', data);
        return { data: res.data };
    },
    update: async (id: string, data: any) => {
        const res = await axios.put(`/api/drones/${id}`, data);
        return { data: res.data };
    },
    generateUin: async (data: any) => {
        return { data: { success: true, uin: `UIN-${Date.now()}` } };
    },
    activate: async (id: string) => {
        return { data: { status: 'Active' } };
    },
};

// Pilots API
export const pilotsApi = {
    list: async (params?: any) => {
        try {
            const res = await axios.get('/api/team', { params });
            const list = Array.isArray(res.data) ? res.data : [];
            return {
                data: list.map((m: any) => ({
                    id: m.id,
                    full_name: m.name,
                    rpto_authorization_number: m.accessId,
                    category_rating: m.position || 'Pilot',
                    status: 'Active',
                })),
            };
        } catch {
            return { data: [] };
        }
    },
    get: async (id: string) => {
        try {
            const res = await axios.get(`/api/team/${id}`);
            const m = res.data;
            return {
                data: {
                    id: m.id,
                    full_name: m.name,
                    rpto_authorization_number: m.accessId,
                    category_rating: m.position || 'Pilot',
                    status: 'Active',
                },
            };
        } catch {
            return { data: null };
        }
    },
    create: async (data: any) => {
        const res = await axios.post('/api/team', {
            name: data.full_name,
            position: data.category_rating || 'Pilot',
            phone: data.phone || data.primary_id_number,
            email: data.email,
        });
        return { data: res.data };
    },
};

// Maintenance API
export const maintenanceApi = {
    list: async (params?: any) => {
        return { data: [] };
    },
    create: async (data: any) => {
        return { data: { ...data, id: `log-${Date.now()}` } };
    },
};

// Flights API
export const flightsApi = {
    listPlans: async (params?: any) => {
        return { data: { total: 0, items: [] } };
    },
    getPlan: async (id: string) => {
        return { data: null };
    },
    createPlan: async (data: any) => {
        return { data: { ...data, id: `plan-${Date.now()}` } };
    },
    updatePlan: async (id: string, data: any) => {
        return { data: { ...data, id } };
    },
    validateNpnt: async (data: any) => {
        return { data: { is_valid: true, checks: [] } };
    },
    validateZone: async (data: any) => {
        return { data: { zone_type: 'GREEN', is_flyable: true, message: 'Clear to fly' } };
    },
    ingestLogs: async (data: any) => {
        return { data: { success: true, entries_processed: 0 } };
    },
    getSummary: async (planId: string) => {
        return { data: { total_distance_m: 0, max_altitude_m: 0 } };
    },
    startFlight: async (planId: string) => {
        return { data: { status: 'InProgress' } };
    },
    completeFlight: async (planId: string) => {
        return { data: { status: 'Completed' } };
    },
};
