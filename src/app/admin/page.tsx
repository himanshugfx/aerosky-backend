"use client";

import { useState, useEffect } from "react";
import { Plus, Plane } from "lucide-react";
import { useComplianceStore } from "@/lib/complianceStore";
import { DroneCard } from "@/components/DroneCard";
import { RegisterDroneModal } from "@/components/RegisterDroneModal";

export default function AdminDashboard() {
    const { drones, fetchDrones } = useComplianceStore();
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDrones().finally(() => setLoading(false));
    }, [fetchDrones]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl lg:text-5xl font-black text-white tracking-tightest">Drone <span className="text-slate-400 font-medium">Registry</span></h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">
                        {drones.length} ACTIVE ASSETS
                    </p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="w-full md:w-auto btn-premium-primary !py-3.5 lg:!py-4 shadow-2xl shadow-orange-500/10 group flex items-center justify-center gap-3"
                >
                    <Plus className="w-5 h-5 group-hover:scale-110 transition-transform duration-500" />
                    Register New Drone
                </button>
            </div>

            {/* Drone Grid */}
            {drones.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {drones.map((drone) => (
                        <DroneCard key={drone.id} drone={drone} />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
                        <Plane className="w-12 h-12 text-gray-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-400 mb-2">No Drones Registered</h3>
                    <p className="text-gray-600 max-w-sm mb-6">
                        Start by registering your first drone to manage its DGCA compliance checklist.
                    </p>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium px-6 py-3 rounded-xl transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        Register Your First Drone
                    </button>
                </div>
            )}

            {/* Register Modal */}
            <RegisterDroneModal isOpen={showModal} onClose={() => setShowModal(false)} />
        </div>
    );
}
