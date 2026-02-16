'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
    Plus,
    Download,
    Upload,
    FileText,
    Image as ImageIcon,
    Loader2,
    CheckCircle,
    XCircle,
    Clock,
    DollarSign,
    Calendar,
    User,
    ChevronRight,
    Search
} from 'lucide-react'
import { FileUploader } from '@/components/FileUploader'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

interface Reimbursement {
    id: string
    name: string
    amount: number
    date: string
    billData: string
    status: string
    userId: string
    createdAt: string
    user: {
        fullName: string
        username: string
        role: string
    }
}

export default function AccountsPage() {
    const { data: session } = useSession()
    const [activeTab, setActiveTab] = useState<'my' | 'admin'>('my')
    const [reimbursements, setReimbursements] = useState<Reimbursement[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        billData: ''
    })

    const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN'

    const fetchReimbursements = async () => {
        try {
            const res = await fetch('/api/reimbursements')
            if (res.ok) {
                const data = await res.json()
                setReimbursements(data)
            }
        } catch (error) {
            console.error('Failed to fetch reimbursements:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (session) fetchReimbursements()
    }, [session])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.billData) {
            alert('Please attach a bill')
            return
        }
        if (isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
            alert('Please enter a valid amount')
            return
        }

        setSubmitting(true)
        try {
            const res = await fetch('/api/reimbursements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (res.ok) {
                alert('Reimbursement submitted successfully!')
                setShowForm(false)
                setFormData({
                    name: '',
                    amount: '',
                    date: new Date().toISOString().split('T')[0],
                    billData: ''
                })
                fetchReimbursements()
            } else {
                const errorData = await res.json()
                alert(`Error: ${errorData.error || 'Failed to submit'}`)
            }
        } catch (error) {
            console.error('Failed to submit reimbursement:', error)
            alert('A network error occurred. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    const handleFileUpload = (files: string[]) => {
        if (files.length > 0) {
            setFormData(prev => ({ ...prev, billData: files[0] }))
        }
    }

    const handleBiometricUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = async (evt) => {
            const bstr = evt.target?.result
            const wb = XLSX.read(bstr, { type: 'binary' })
            const wsname = wb.SheetNames[0]
            const ws = wb.Sheets[wsname]
            const data = XLSX.utils.sheet_to_json(ws)

            // Assuming columns: EmployeeID, Date, CheckIn, CheckOut
            const records = data.map((row: any) => ({
                employeeId: String(row.EmployeeID || row.ID || row.Employee_ID),
                date: row.Date,
                checkIn: row.CheckIn || row.Check_In || row.TimeIn,
                checkOut: row.CheckOut || row.Check_Out || row.TimeOut,
                status: 'Present'
            }))

            try {
                const res = await fetch('/api/attendance', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ records })
                })
                if (res.ok) {
                    alert(`Successfully imported ${records.length} records`)
                }
            } catch (error) {
                console.error('Failed to upload biometric data:', error)
            }
        }
        reader.readAsBinaryString(file)
    }

    const generatePayslip = (member: any) => {
        const doc = new jsPDF()

        // Header
        doc.setFontSize(22)
        doc.setTextColor(41, 128, 185)
        doc.text('AeroSky Aviation India', 105, 20, { align: 'center' })

        doc.setFontSize(14)
        doc.setTextColor(100)
        doc.text('Payslip for February 2026', 105, 30, { align: 'center' })

        // Employee Info
        doc.setFontSize(12)
        doc.setTextColor(0)
        doc.text(`Employee Name: ${member.user?.fullName || member.name}`, 20, 50)
        doc.text(`Employee ID: ${member.accessId || 'N/A'}`, 20, 60)
        doc.text(`Position: ${member.position || 'N/A'}`, 20, 70)

        // Salary Table (Dummy values for now)
        const tableData = [
            ['Basic Salary', '45,000.00'],
            ['HRA', '15,000.00'],
            ['Conveyance', '5,000.00'],
            ['Medical Allowance', '3,000.00'],
            ['Reimbursements', '2,500.00'],
            ['Gross Salary', '70,500.00'],
            ['PF Deduction', '1,800.00'],
            ['Income Tax', '2,200.00'],
            ['Net Salary', '66,500.00']
        ]

        //@ts-ignore
        doc.autoTable({
            startY: 85,
            head: [['Description', 'Amount (INR)']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [41, 128, 185] }
        })

        doc.save(`Payslip_${member.name}_Feb2026.pdf`)
    }

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'approved': return 'bg-green-100 text-green-700'
            case 'rejected': return 'bg-red-100 text-red-700'
            default: return 'bg-amber-100 text-amber-700'
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Accounts</h1>
                    <p className="text-gray-500">Manage reimbursements and payslips</p>
                </div>
                {!showForm && activeTab === 'my' && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        New Reimbursement
                    </button>
                )}
                {isAdmin && activeTab === 'admin' && (
                    <div className="flex gap-3">
                        <label className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-all cursor-pointer">
                            <Upload className="w-5 h-5" />
                            Biometric Sync
                            <input type="file" className="hidden" accept=".xlsx,.csv" onChange={handleBiometricUpload} />
                        </label>
                    </div>
                )}
            </div>

            {isAdmin && (
                <div className="flex p-1 bg-gray-100 rounded-xl w-fit">
                    <button
                        onClick={() => setActiveTab('my')}
                        className={`px-6 py-2 rounded-lg font-medium transition-all ${activeTab === 'my' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        My Submissions
                    </button>
                    <button
                        onClick={() => setActiveTab('admin')}
                        className={`px-6 py-2 rounded-lg font-medium transition-all ${activeTab === 'admin' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Admin Overview
                    </button>
                </div>
            )}

            {showForm ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 max-w-2xl">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold">Submit Reimbursement</h2>
                        <button onClick={() => setShowForm(false)} className="p-2 text-gray-400 hover:text-gray-600">
                            <XCircle className="w-6 h-6" />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Expense Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Travel to Site A"
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Amount (INR)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.amount}
                                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Date of Expense</label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="date"
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Attach Bill (Image or PDF)</label>
                            <FileUploader
                                onUpload={handleFileUpload}
                                accept="image/*,application/pdf"
                                multiple={false}
                                label="Drop your receipt here"
                            />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="flex-1 px-6 py-3 border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Form'}
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* List Section */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold">
                                {activeTab === 'my' ? 'My Reimbursements' : 'All Requests'}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
                                <Search className="w-4 h-4" />
                                <input type="text" placeholder="Search..." className="bg-transparent outline-none w-24" />
                            </div>
                        </div>

                        {loading ? (
                            <div className="bg-white rounded-2xl border border-gray-200 p-12 flex flex-col items-center justify-center text-center">
                                <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
                                <p className="text-gray-500">Loading records...</p>
                            </div>
                        ) : reimbursements.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-gray-200 p-12 flex flex-col items-center justify-center text-center">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                    <FileText className="w-8 h-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-bold mb-1">No Records Found</h3>
                                <p className="text-gray-500 max-w-xs">There are no reimbursement records to display at this time.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {reimbursements.map((item) => (
                                    <div key={item.id} className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                                                    <DollarSign className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-900 line-clamp-1">{item.name}</h4>
                                                    <p className="text-xs text-gray-500">{new Date(item.date).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${getStatusColor(item.status)}`}>
                                                {item.status}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                            <div className="text-lg font-bold text-gray-900">
                                                ₹ {item.amount.toLocaleString()}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {item.billData && (
                                                    <button
                                                        onClick={() => {
                                                            const win = window.open()
                                                            win?.document.write(`<iframe src="${item.billData}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`)
                                                        }}
                                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="View Attachment"
                                                    >
                                                        <ImageIcon className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {activeTab === 'admin' && (
                                                    <div className="flex items-center gap-1 text-[10px] text-gray-400">
                                                        <User className="w-3 h-3" />
                                                        {item.user?.fullName?.split(' ')[0]}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Stats/Sidebar Section */}
                    <div className="space-y-6">
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl shadow-blue-500/20">
                            <h3 className="text-lg font-bold mb-4">Account Summary</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                                    <div className="text-sm font-medium opacity-80">Pending</div>
                                    <div className="text-xl font-bold">₹ {reimbursements.filter(r => r.status === 'Pending').reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}</div>
                                </div>
                                <div className="flex justify-between items-center bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                                    <div className="text-sm font-medium opacity-80">Approved</div>
                                    <div className="text-xl font-bold">₹ {reimbursements.filter(r => r.status === 'Approved').reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}</div>
                                </div>
                            </div>
                            <button className="w-full mt-6 py-3 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-all flex items-center justify-center gap-2">
                                <Download className="w-4 h-4" />
                                Download Report
                            </button>
                        </div>

                        {activeTab === 'admin' && (
                            <div className="bg-white rounded-2xl border border-gray-200 p-6">
                                <h3 className="text-lg font-bold mb-4">Quick Payslip</h3>
                                <div className="space-y-3">
                                    <p className="text-sm text-gray-500">Generate and download payslips based on attendance data.</p>
                                    <div className="flex flex-col gap-2">
                                        <button
                                            onClick={() => generatePayslip({ name: 'Himanshu', position: 'Developer', accessId: 'EMP001' })}
                                            className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all"
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 font-bold">H</div>
                                                <span className="text-sm font-semibold">Himanshu</span>
                                            </div>
                                            <Download className="w-4 h-4 text-gray-400" />
                                        </button>
                                        <button className="w-full py-2 text-sm text-blue-600 font-semibold hover:underline">
                                            View All Team Members
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
