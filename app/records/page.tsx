'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, Download, RefreshCw, AlertCircle, Calendar, Receipt, FileText, Ban, ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RecordDetailModal } from '@/components/records/RecordDetailModal';
import { useFeedback } from '@/components/ui/Feedback';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import { parseGPMSDate } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

type Tab = 'donations' | 'expenses';

export default function RecordsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const feedback = useFeedback();

  const [activeTab, setActiveTab] = useState<Tab>('donations');
  const [loading, setLoading] = useState(false);
  const [allData, setAllData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

  const isAdmin = session?.user?.role === 'Admin' || session?.user?.role === 'SuperAdmin';
  
  // Enforce Volunteer restrictions
  useEffect(() => {
    if (!isAdmin && activeTab === 'expenses') {
      setActiveTab('donations');
    }
  }, [isAdmin, activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const endpoint = activeTab === 'donations' ? '/api/records/donations' : '/api/records/expenses';
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      const json = await res.json();
      if (json.success) {
        setAllData(json.data || []);
      } else {
        feedback.showError(json.error || json.message || 'Failed to fetch records');
      }
    } catch (err: any) {
      feedback.showError(err.message || 'An error occurred while fetching records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const filteredData = useMemo(() => {
    return allData.filter(row => {
      let match = true;
      
      if (statusFilter && row.status !== statusFilter) match = false;
      
      if (startDate) {
        const sDate = new Date(startDate);
        sDate.setHours(0, 0, 0, 0);
        const dDate = new Date(row.createdAt || row.date);
        if (dDate < sDate) match = false;
      }
      
      if (endDate) {
        const eDate = new Date(endDate);
        eDate.setHours(23, 59, 59, 999);
        const dDate = new Date(row.createdAt || row.date);
        if (dDate > eDate) match = false;
      }
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        let searchString = '';
        if (activeTab === 'donations') {
           searchString = `${row.receiptId} ${row.donorName} ${row.phone || ''}`.toLowerCase();
        } else {
           searchString = `${row.id} ${row.vendor || ''} ${row.description || ''}`.toLowerCase();
        }
        if (!searchString.includes(query)) match = false;
      }
      
      return match;
    });
  }, [allData, searchQuery, startDate, endDate, statusFilter, activeTab]);

  const handleExportCSV = async () => {
    if (filteredData.length === 0) {
      feedback.showError('No records to export');
      return;
    }

    try {
      const headers = activeTab === 'donations' 
        ? ['Receipt ID', 'Donor Name', 'Phone', 'Amount', 'Payment Mode', 'Purpose', 'Date', 'Status', 'Collector']
        : ['Expense ID', 'Category', 'Vendor', 'Description', 'Amount', 'Paid By', 'Date', 'Status'];

      const csvRows = [headers.join(',')];

      for (const row of filteredData) {
        const rawDate = row.createdAt || row.date || '';
        const formattedDate = rawDate ? parseGPMSDate(rawDate).toLocaleDateString('en-IN') : '';

        const values = activeTab === 'donations'
          ? [
              row.receiptId,
              `"${row.donorName}"`,
              row.phone || '',
              row.amount,
              row.paymentMode,
              row.purpose,
              formattedDate,
              row.status,
              `"${row.collectorName || row.createdBy || ''}"`
            ]
          : [
              row.id,
              row.category,
              `"${row.vendor || ''}"`,
              `"${row.description || ''}"`,
              row.amount,
              `"${row.paidByName || row.paidBy || ''}"`,
              formattedDate,
              row.status
            ];
        csvRows.push(values.join(','));
      }

      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `GPMS_${activeTab}_export_${new Date().getTime()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Log the export
      await fetch('/api/audit/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: activeTab,
          count: filteredData.length,
          filters: { searchQuery, startDate, endDate, statusFilter }
        })
      });

      feedback.showSuccess('Export successful');
    } catch (e) {
      feedback.showError('Export failed');
    }
  };

  return (
    <div className="min-h-screen bg-cream pb-20 font-sans">
      <header className="bg-cream border-b border-hair sticky top-0 z-10 p-[18px_20px]">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-[9px]">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-[6px] -ml-2 text-muted-ink hover:text-ink hover:bg-hair/50 transition-colors rounded-lg flex items-center justify-center"
              aria-label="Back to Dashboard"
            >
              <ArrowLeft className="w-[20px] h-[20px]" />
            </button>
            <h1 className="font-playfair font-bold text-[20px] text-ink tracking-[0.02em]">Records</h1>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button onClick={handleExportCSV} variant="outline" size="sm" className="flex items-center gap-1.5 h-9" disabled={loading || filteredData.length === 0}>
                <Download className="w-[16px] h-[16px]" />
                <span className="hidden sm:inline text-[13px] font-bold">Export CSV</span>
                <span className="sm:hidden text-[13px] font-bold">Export</span>
              </Button>
            )}
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {isAdmin && (
          <div className="flex bg-white rounded-[14px] p-1 shadow-sm border border-hair w-full max-w-sm">
            <button
              onClick={() => setActiveTab('donations')}
              className={`flex-1 py-[10px] px-4 text-[14px] font-bold rounded-[10px] transition-colors ${
                activeTab === 'donations' ? 'bg-ink text-cream shadow-sm' : 'text-muted-ink hover:text-ink hover:bg-hair/30'
              }`}
            >
              Donations
            </button>
            <button
              onClick={() => setActiveTab('expenses')}
              className={`flex-1 py-[10px] px-4 text-[14px] font-bold rounded-[10px] transition-colors ${
                activeTab === 'expenses' ? 'bg-ink text-cream shadow-sm' : 'text-muted-ink hover:text-ink hover:bg-hair/30'
              }`}
            >
              Expenses
            </button>
          </div>
        )}

        <div className="bg-white rounded-[16px] shadow-sm border border-hair p-[16px]">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="sm:col-span-2 relative">
              <Search className="w-4 h-4 absolute left-3 top-[10px] text-muted-ink" />
              <input
                type="text"
                placeholder={activeTab === 'donations' ? "Search Receipt ID, Name, Phone..." : "Search Expense ID, Vendor, Desc..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-[36px] py-[8px] pr-3 text-[14px] text-ink border border-hair rounded-[12px] shadow-sm focus:ring-1 focus:ring-ink focus:border-ink focus:outline-none placeholder:text-muted-ink"
              />
            </div>
            <div>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-[8px] text-[14px] text-ink border border-hair rounded-[12px] shadow-sm focus:ring-1 focus:ring-ink focus:border-ink focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-[8px] text-[14px] text-ink border border-hair rounded-[12px] shadow-sm focus:ring-1 focus:ring-ink focus:border-ink focus:outline-none"
              />
              <Button type="button" onClick={fetchData} variant="primary" className="flex-shrink-0 h-[42px] px-3" title="Refresh data">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[16px] shadow-sm border border-hair overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-cream-2 text-muted-ink text-[12px] font-bold uppercase tracking-wider border-b border-hair">
                  <th className="px-6 py-[16px]">{activeTab === 'donations' ? 'Receipt ID' : 'Expense ID'}</th>
                  <th className="px-6 py-[16px]">{activeTab === 'donations' ? 'Donor' : 'Vendor'}</th>
                  <th className="px-6 py-[16px] text-right">Amount</th>
                  <th className="px-6 py-[16px]">Date</th>
                  <th className="px-6 py-[16px]">Status</th>
                </tr>
              </thead>
              <tbody className="text-[14px]">
                {loading && allData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-[48px] text-center text-muted-ink">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-muted-ink/50" />
                      <span className="font-semibold">Loading records...</span>
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-[48px] text-center text-muted-ink">
                      <AlertCircle className="w-8 h-8 text-muted-ink/30 mx-auto mb-2" />
                      <span className="font-semibold">No records found matching your filters.</span>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((row, idx) => {
                    const id = activeTab === 'donations' ? row.receiptId : row.id;
                    const name = activeTab === 'donations' ? row.donorName : row.vendor || row.category;
                    const isCancelled = row.status === 'Cancelled';

                    return (
                      <tr 
                        key={`${id}-${idx}`} 
                        onClick={() => setSelectedRecord(row)}
                        className={`hover:bg-hair/20 cursor-pointer transition-colors border-b border-hair last:border-0 ${isCancelled ? 'bg-maroon/5 hover:bg-maroon/10' : ''}`}
                      >
                        <td className="px-6 py-[16px] font-mono font-bold text-ink whitespace-nowrap">{id}</td>
                        <td className="px-6 py-[16px] font-bold text-ink whitespace-nowrap">{name}</td>
                        <td className="px-6 py-[16px] text-right whitespace-nowrap">
                          <CurrencyDisplay amount={row.amount} size="sm" className={`font-bold ${isCancelled ? 'text-muted-ink line-through' : 'text-ink'}`} />
                        </td>
                        <td className="px-6 py-[16px] font-medium text-muted-ink whitespace-nowrap">
                          {parseGPMSDate(row.date).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                        </td>
                        <td className="px-6 py-[16px] whitespace-nowrap">
                          <span className={`inline-flex items-center px-[8px] py-[4px] rounded-[6px] text-[12px] font-bold tracking-wide ${
                            isCancelled ? 'bg-[#F4E9EB] text-maroon' : 'bg-[#EAF3EA] text-sage'
                          }`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <RecordDetailModal
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        record={selectedRecord}
        type={activeTab === 'donations' ? 'donation' : 'expense'}
        canCancel={isAdmin}
        onCancelSuccess={() => {
          setSelectedRecord(null);
          fetchData();
        }}
        feedback={feedback}
      />
    </div>
  );
}
