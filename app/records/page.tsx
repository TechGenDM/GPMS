'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Download, RefreshCw, AlertCircle, Calendar, Receipt, FileText, Ban
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
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-slate-500 hover:text-slate-900 transition-colors hidden sm:block">
              &larr; Dashboard
            </Link>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Records</h1>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button onClick={handleExportCSV} variant="outline" size="sm" className="flex" disabled={loading || filteredData.length === 0}>
                <Download className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">Export</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {isAdmin && (
          <div className="flex bg-white rounded-lg p-1 shadow-sm border border-slate-200 w-full max-w-sm">
            <button
              onClick={() => setActiveTab('donations')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'donations' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Donations
            </button>
            <button
              onClick={() => setActiveTab('expenses')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'expenses' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Expenses
            </button>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="sm:col-span-2 relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder={activeTab === 'donations' ? "Search Receipt ID, Name, Phone..." : "Search Expense ID, Vendor, Desc..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 py-2 pr-3 text-sm border border-slate-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
              />
              <Button type="button" onClick={fetchData} variant="default" className="flex-shrink-0" title="Refresh data">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                  <th className="px-6 py-4 font-medium">{activeTab === 'donations' ? 'Receipt ID' : 'Expense ID'}</th>
                  <th className="px-6 py-4 font-medium">{activeTab === 'donations' ? 'Donor' : 'Vendor'}</th>
                  <th className="px-6 py-4 font-medium text-right">Amount</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {loading && allData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-400" />
                      Loading records...
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      No records found matching your filters.
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
                        className={`hover:bg-slate-50 cursor-pointer transition-colors ${isCancelled ? 'bg-red-50/50' : ''}`}
                      >
                        <td className="px-6 py-4 font-mono font-medium text-slate-900 whitespace-nowrap">{id}</td>
                        <td className="px-6 py-4 font-medium text-slate-700 whitespace-nowrap">{name}</td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <CurrencyDisplay amount={row.amount} size="sm" className={isCancelled ? 'text-slate-500' : 'text-slate-900'} />
                        </td>
                        <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                          {parseGPMSDate(row.date).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            isCancelled ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
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
