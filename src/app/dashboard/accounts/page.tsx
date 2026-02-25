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
    Search,
    CreditCard,
    TrendingUp,
    Receipt,
    Wallet,
    ArrowUpRight,
    ArrowDownRight,
    ShieldCheck
} from 'lucide-react'
import { FileUploader } from '@/components/FileUploader'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

interface Reimbursement {
    id: string
    name: string
    category?: string
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
    const [updatingId, setUpdatingId] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        category: 'Travel',
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
                setShowForm(false)
                setFormData({
                    name: '',
                    category: 'Travel',
                    amount: '',
                    date: new Date().toISOString().split('T')[0],
                    billData: ''
                })
                fetchReimbursements()
            } else {
                const errorData = await res.json()
                const msg = errorData.details ? `${errorData.error}: ${errorData.details}` : errorData.error
                alert(`Error: ${msg || 'Failed to submit'}`)
            }
        } catch (error) {
            console.error('Failed to submit reimbursement:', error)
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

        doc.setFillColor(30, 41, 59)
        doc.rect(0, 0, 210, 50, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(24)
        doc.setFont('helvetica', 'bold')
        doc.text('AEROSKY AVIATION', 20, 25)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.text('OFFICIAL PAYROLL DISBURSEMENT DOCUMENT', 20, 35)

        doc.setTextColor(30, 41, 59)
        doc.setFontSize(14)
        doc.text(`STATEMENT FOR FEBRUARY 2026`, 20, 70)

        const employeeInfo = [
            ['NAME', member.user?.fullName || member.name],
            ['ID', member.accessId || 'N/A'],
            ['ROLE', member.position || 'N/A'],
            ['PERIOD', 'Feb 01 - Feb 28, 2026']
        ]

        //@ts-ignore
        doc.autoTable({
            startY: 80,
            body: employeeInfo,
            theme: 'plain',
            styles: { fontSize: 9, cellPadding: 2 },
            columnStyles: { 0: { fontStyle: 'bold', width: 40 } }
        })

        const tableData = [
            ['Basic Component', '45,000.00'],
            ['HRA Allocation', '15,000.00'],
            ['Logistics/Conveyance', '5,000.00'],
            ['Medical Benefit', '3,000.00'],
            ['Approved Reimbursements', '2,500.00'],
            ['Taxes/Deductions', '-4,000.00'],
            ['DISBURSED TOTAL (INR)', '66,500.00']
        ]

        //@ts-ignore
        doc.autoTable({
            startY: 120,
            head: [['Technical Head', 'Amount (INR)']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [30, 41, 59], fontSize: 10, fontStyle: 'bold' },
            styles: { fontSize: 10 },
            //@ts-ignore
            didParseCell: (data) => {
                if (data.row.index === 6) {
                    data.cell.styles.fontStyle = 'bold'
                    data.cell.styles.fillColor = [241, 245, 249]
                }
            }
        })

        doc.setFontSize(8)
        doc.setTextColor(150)
        doc.text('This is a computer generated document and does not require a physical signature.', 20, 280)

        doc.save(`Payslip_${member.name}_Feb2026.pdf`)
    }

    const exportToExcel = () => {
        const dataToExport = reimbursements.map(r => ({
            'Logistics Order': r.name,
            'Valuation (INR)': r.amount,
            'Date': new Date(r.date).toLocaleDateString(),
            'Status': r.status,
            'Field Agent': r.user?.fullName || r.user?.username
        }))

        const ws = XLSX.utils.json_to_sheet(dataToExport)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Financial_Entries')
        XLSX.writeFile(wb, `AeroSky_FinLedger_${new Date().toISOString().split('T')[0]}.xlsx`)
    }

    const getStatusStyles = (status: string) => {
        switch (status.toLowerCase()) {
            case 'approved': return 'bg-emerald-50 text-emerald-600 border border-emerald-100'
            case 'completed': return 'bg-orange-50 text-orange-600 border border-orange-100'
            case 'rejected': return 'bg-red-50 text-red-600 border border-red-100'
            default: return 'bg-amber-50 text-amber-600 border border-amber-100'
        }
    }

    const handleStatusChange = async (id: string, newStatus: string) => {
        setUpdatingId(id)
        try {
            const res = await fetch('/api/reimbursements', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: newStatus })
            })
            if (res.ok) {
                setReimbursements(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r))
            } else {
                const errData = await res.json()
                alert(`Error: ${errData.error || 'Failed to update status'}`)
            }
        } catch (error) {
            console.error('Failed to update status:', error)
        } finally {
            setUpdatingId(null)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 animate-in">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-slate-100 rounded-full animate-pulse"></div>
                    <Loader2 className="w-16 h-16 animate-spin text-orange-600 absolute top-0 left-0 border-t-4 border-transparent rounded-full" />
                </div>
                <p className="mt-6 text-slate-500 font-bold uppercase tracking-widest text-xs">Synchronizing Financial Core</p>
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-1">
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Accounts & Disbursements</h2>
                    <p className="text-slate-500 font-medium">Enterprise financial tracking and payroll management</p>
                </div>
                {!showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="premium-btn-primary flex items-center gap-2 py-3 px-6"
                    >
                        <Plus className="w-5 h-5" />
                        {activeTab === 'admin' ? 'Add Expense' : 'New Submission'}
                    </button>
                )}
                {isAdmin && activeTab === 'admin' && (
                    <div className="flex gap-3">
                        <label className="premium-btn-outline cursor-pointer flex items-center gap-2 py-3 px-6">
                            <ShieldCheck className="w-5 h-5" />
                            Security Sync
                            <input type="file" className="hidden" accept=".xlsx,.csv" onChange={handleBiometricUpload} />
                        </label>
                    </div>
                )}
            </div>

            {isAdmin && (
                <div className="flex p-1.5 bg-slate-100 rounded-[1.25rem] w-fit">
                    <button
                        onClick={() => setActiveTab('my')}
                        className={`px-8 py-2.5 rounded-2xl text-sm font-bold transition-all duration-300 ${activeTab === 'my' ? 'bg-white text-slate-900 shadow-xl shadow-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Personnel Ledger
                    </button>
                    <button
                        onClick={() => setActiveTab('admin')}
                        className={`px-8 py-2.5 rounded-2xl text-sm font-bold transition-all duration-300 ${activeTab === 'admin' ? 'bg-white text-slate-900 shadow-xl shadow-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Administrative Hub
                    </button>
                </div>
            )}

            {showForm ? (
                <div className="premium-card p-10 max-w-3xl animate-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-100">
                        <div className="space-y-1">
                            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Expense Declaration</h2>
                            <p className="text-slate-400 text-sm font-medium">Provide audited details for reimbursement</p>
                        </div>
                        <button onClick={() => setShowForm(false)} className="w-12 h-12 bg-slate-50 hover:bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center transition-all">
                            <XCircle className="w-7 h-7" />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">Description *</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Avionics Maintenance Kit"
                                    className="input-premium py-4"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">Category *</label>
                                <select
                                    className="input-premium py-4 bg-white"
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    required
                                >
                                    <option value="Travel">Travel</option>
                                    <option value="Maintenance">Maintenance</option>
                                    <option value="Operational">Operational</option>
                                    <option value="Marketing">Marketing</option>
                                    <option value="Office">Office</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">Amount (INR) *</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        className="input-premium pl-12 py-4"
                                        value={formData.amount}
                                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">Logistics Date *</label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                    <input
                                        type="date"
                                        className="input-premium pl-12 py-4"
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">Evidentiary Documentation (Bill/Receipt)</label>
                            <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100">
                                <FileUploader
                                    onUpload={handleFileUpload}
                                    accept="image/*,application/pdf"
                                    multiple={false}
                                    label="Drop technical dossier or receipt here"
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 pt-6">
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="px-10 py-4 text-slate-500 font-extrabold uppercase tracking-widest text-[10px] hover:bg-slate-50 rounded-2xl transition-all"
                            >
                                Dismiss
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex-1 py-4 bg-orange-600 text-white font-extrabold uppercase tracking-widest text-[10px] rounded-2xl hover:bg-orange-700 transition-all shadow-2xl shadow-orange-600/10 flex items-center justify-center gap-3"
                            >
                                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Finalize Declaration <ChevronRight className="w-4 h-4" /></>}
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Ledger Section */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-[#1e293b] rounded-lg flex items-center justify-center text-white">
                                    <Receipt className="w-4 h-4" />
                                </div>
                                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                                    {activeTab === 'my' ? 'Submission History' : 'Enterprise Ledger'}
                                </h3>
                            </div>
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                                <input type="text" placeholder="Search entries..." className="bg-white border border-slate-200 outline-none w-48 pl-9 pr-4 py-2 text-xs font-bold rounded-xl focus:ring-2 focus:ring-slate-100" />
                            </div>
                        </div>

                        {reimbursements.length === 0 ? (
                            <div className="premium-card p-24 flex flex-col items-center justify-center text-center">
                                <FileText className="w-16 h-16 text-slate-100 mb-6" />
                                <h3 className="text-lg font-bold text-slate-900">Vault Neutral</h3>
                                <p className="text-slate-400 text-sm font-medium mt-2 max-w-xs">No financial records detected in the current scope.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {reimbursements
                                    .filter(item => {
                                        const isMine = String(item.userId) === String(session?.user?.id)
                                        return activeTab === 'admin' || isMine
                                    })
                                    .map((item) => (
                                        <div key={item.id} className="premium-card p-6 flex flex-col group hover:-translate-y-1 transition-all duration-300">
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center border border-slate-100 group-hover:bg-orange-600 group-hover:text-white transition-all duration-500">
                                                        <Wallet className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-extrabold text-slate-900 text-sm line-clamp-1">{item.name}</h4>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                                                <Calendar className="w-3 h-3 child" />
                                                                {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                            </div>
                                                            <div className="w-1 h-1 rounded-full bg-slate-200" />
                                                            <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">{item.category || 'Other'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                {isAdmin && activeTab === 'admin' ? (
                                                    <div className="relative">
                                                        {updatingId === item.id && (
                                                            <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400 absolute -left-5 top-1/2 -translate-y-1/2" />
                                                        )}
                                                        <select
                                                            value={item.status}
                                                            onChange={(e) => handleStatusChange(item.id, e.target.value)}
                                                            disabled={updatingId === item.id}
                                                            className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider appearance-none cursor-pointer pr-6 outline-none ${getStatusStyles(item.status)} disabled:opacity-50`}
                                                        >
                                                            <option value="Pending">Pending</option>
                                                            <option value="Approved">Approved</option>
                                                            <option value="Completed">Completed</option>
                                                        </select>
                                                    </div>
                                                ) : (
                                                    <div className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider ${getStatusStyles(item.status)}`}>
                                                        {item.status}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-auto pt-5 border-t border-slate-50 flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">Disbursement</span>
                                                    <span className="text-xl font-black text-slate-900 tracking-tighter">₹{item.amount.toLocaleString()}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {item.billData && (
                                                        <button
                                                            onClick={() => {
                                                                const win = window.open()
                                                                win?.document.write(`
                                                                    <body style="margin:0; background:#f8fafc; display:flex; justify-center; align-items:center; height:100vh;">
                                                                        <iframe src="${item.billData}" frameborder="0" style="width:90%; height:90%; border-radius:2rem; box-shadow:0 25px 50px -12px rgb(0 0 0 / 0.25);" allowfullscreen></iframe>
                                                                    </body>
                                                                `)
                                                            }}
                                                            className="w-10 h-10 bg-white border border-slate-100 text-slate-400 hover:text-slate-900 hover:border-slate-300 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-90"
                                                            title="Inspect Resource"
                                                        >
                                                            <ImageIcon className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                    {activeTab === 'admin' && (
                                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                                                            <User className="w-3 h-3 text-slate-400" />
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

                    {/* Financial Insights/Operations Sidebar */}
                    <div className="space-y-8">
                        <div className="premium-card p-8 bg-[#1e293b] relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                            <h3 className="text-lg font-extrabold text-white tracking-tight mb-8">Capital Audit</h3>

                            <div className="space-y-4">
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Queue Pending</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-2xl font-black text-white tracking-tighter">₹{reimbursements.filter(r => r.status === 'Pending').reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}</span>
                                        <TrendingUp className="w-4 h-4 text-amber-500" />
                                    </div>
                                </div>
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Execution Total</p>
                                    <div className="flex items-baseline gap-2 text-emerald-400">
                                        <span className="text-2xl font-black tracking-tighter">₹{reimbursements.filter(r => r.status === 'Approved').reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}</span>
                                        <CheckCircle className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={exportToExcel}
                                className="w-full mt-8 py-4 bg-white text-slate-900 text-[10px] font-extrabold uppercase tracking-widest rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-center gap-3 shadow-xl"
                            >
                                <Download className="w-4 h-4" />
                                Generate Intelligence Report
                            </button>
                        </div>

                        {activeTab === 'admin' && (
                            <div className="premium-card p-8 bg-white border border-slate-100">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center border border-orange-100">
                                        <CreditCard className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Payroll Engine</h3>
                                </div>

                                <p className="text-xs font-medium text-slate-500 leading-relaxed mb-6">Automated disbursement generation based on personnel logistics and biometric synchronization.</p>

                                <div className="space-y-4">
                                    <button
                                        onClick={() => generatePayslip({ name: 'Himanshu', position: 'Logistics Supervisor', accessId: 'AS-001' })}
                                        className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all group border border-slate-100/50"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-[#1e293b] text-white rounded-xl flex items-center justify-center font-bold text-xs">H</div>
                                            <div className="text-left">
                                                <p className="text-sm font-extrabold text-slate-900 leading-none">Himanshu</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Supervisor</p>
                                            </div>
                                        </div>
                                        <Download className="w-4 h-4 text-slate-400 group-hover:text-slate-900 group-hover:scale-110 transition-all" />
                                    </button>

                                    <button className="w-full py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-all flex items-center justify-center gap-2">
                                        Access Personnel Directory <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
