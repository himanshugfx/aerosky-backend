'use client'

import { Building2, Calendar, Loader2, Mail, Phone, Plus, Trash2, User } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

interface Subcontractor {
    id: string
    companyName: string
    type: string
    contactPerson: string | null
    contactEmail: string | null
    contactPhone: string | null
    agreementDate: string | null
}

export default function SubcontractorsPage() {
    const { data: session } = useSession()
    const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [formData, setFormData] = useState({
        companyName: '',
        type: 'Design',
        contactPerson: '',
        contactEmail: '',
        contactPhone: '',
        agreementDate: ''
    })
    const [submitting, setSubmitting] = useState(false)

    const fetchSubcontractors = async () => {
        try {
            const res = await fetch('/api/subcontractors')
            if (res.ok) {
                const data = await res.json()
                setSubcontractors(data)
            } else {
                console.error('Failed to fetch subcontractors')
            }
        } catch (error) {
            console.error('Failed to fetch subcontractors:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (session) fetchSubcontractors()
    }, [session])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            const res = await fetch('/api/subcontractors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            if (res.ok) {
                setShowModal(false)
                setFormData({
                    companyName: '',
                    type: 'Design',
                    contactPerson: '',
                    contactEmail: '',
                    contactPhone: '',
                    agreementDate: ''
                })
                fetchSubcontractors()
                alert('Subcontractor added successfully')
            } else {
                const err = await res.json()
                alert(`Error: ${err.error || 'Failed to create subcontractor'}${err.details ? `\n\nDetails: ${err.details}` : ''}`)
            }
        } catch (error) {
            console.error('Failed to create subcontractor:', error)
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this subcontractor?')) return
        try {
            const res = await fetch(`/api/subcontractors/${id}`, { method: 'DELETE' })
            if (res.ok) {
                fetchSubcontractors()
                alert('Subcontractor deleted')
            } else {
                const data = await res.json()
                alert(`Error: ${data.error || 'Failed to delete'}`)
            }
        } catch (error) {
            console.error('Failed to delete subcontractor:', error)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Subcontractors</h2>
                    <p className="text-gray-500">Manage your partner companies and agreements</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    <Plus className="w-4 h-4" />
                    Add Subcontractor
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subcontractors.map((sub) => (
                    <div key={sub.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-50 rounded-lg">
                                    <Building2 className="w-6 h-6 text-orange-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 leading-tight">{sub.companyName}</h3>
                                    <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] uppercase font-bold mt-1">
                                        {sub.type}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDelete(sub.id)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-5 space-y-4">
                            <div className="space-y-2">
                                <div className="flex items-center gap-3 text-sm">
                                    <User className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-700 font-medium">{sub.contactPerson || 'No contact person'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-600">{sub.contactEmail || 'No email provided'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-600">{sub.contactPhone || 'No phone provided'}</span>
                                </div>
                            </div>

                            <div className="pt-3 border-t border-gray-50 flex items-center gap-2 text-xs text-gray-500">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>Agreement Date: {sub.agreementDate || 'Not specified'}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {subcontractors.length === 0 && (
                <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-100">
                    <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-200" />
                    <h3 className="text-lg font-medium text-gray-900">No Subcontractors</h3>
                    <p className="text-gray-500 max-w-sm mx-auto">Start by adding your first partner company to manage agreements and contacts.</p>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-xl font-bold text-gray-900">Add Subcontractor</h3>
                            <p className="text-sm text-gray-500 mt-1">Register a new partner company in your organization.</p>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Company Name *</label>
                                    <input
                                        type="text"
                                        value={formData.companyName}
                                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                        required
                                        placeholder="e.g. AeroParts Manufacturing"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Type *</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900"
                                        required
                                    >
                                        <option value="Design">Design</option>
                                        <option value="Manufacturing">Manufacturing</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Agreement Date</label>
                                    <input
                                        type="date"
                                        value={formData.agreementDate}
                                        onChange={(e) => setFormData({ ...formData, agreementDate: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Contact Person</label>
                                    <input
                                        type="text"
                                        value={formData.contactPerson}
                                        onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Full Name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={formData.contactEmail}
                                        onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="contact@company.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
                                    <input
                                        type="tel"
                                        value={formData.contactPhone}
                                        onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="+91 ..."
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm"
                                >
                                    {submitting ? 'Adding...' : 'Add Subcontractor'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
