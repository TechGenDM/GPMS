'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Download, RefreshCw, AlertCircle, ChevronDown, ChevronRight, Activity, Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface AuditLog {
  logId: string;
  userId: string;
  userName: string;
  action: string;
  module: string;
  recordId: string;
  oldValue: string;
  newValue: string;
  timestamp: string;
}

export function AuditLogTable() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState('All');
  
  // Expanded rows
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError('');
      
      const res = await fetch('/api/audit?limit=500');
      if (!res.ok) {
        throw new Error('Failed to fetch audit logs');
      }
      
      const result = await res.json();
      if (result.success) {
        setLogs(result.data || []);
      } else {
        throw new Error(result.message || 'Error fetching logs');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const toggleRow = (logId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedRows(newExpanded);
  };

  const handleExportCSV = async () => {
    if (filteredLogs.length === 0) return;

    try {
      // 1. Log the export action to backend
      await fetch('/api/audit/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module: moduleFilter, format: 'CSV' })
      });

      // 2. Generate CSV on client
      const headers = ['Log ID', 'Timestamp', 'User Name', 'Action', 'Module', 'Record ID', 'Old Value', 'New Value'];
      const csvContent = [
        headers.join(','),
        ...filteredLogs.map(log => [
          log.logId,
          `"${new Date(log.timestamp).toLocaleString()}"`,
          `"${log.userName}"`,
          `"${log.action}"`,
          `"${log.module}"`,
          `"${log.recordId || ''}"`,
          `"${(log.oldValue || '').replace(/"/g, '""')}"`,
          `"${(log.newValue || '').replace(/"/g, '""')}"`
        ].join(','))
      ].join('\n');

      // 3. Trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `GPMS_AuditLogs_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to export CSV', err);
      alert('Failed to export CSV. Please try again.');
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = 
        log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.recordId.toLowerCase().includes(searchQuery.toLowerCase());
        
      const matchesModule = moduleFilter === 'All' || log.module === moduleFilter;
      
      return matchesSearch && matchesModule;
    });
  }, [logs, searchQuery, moduleFilter]);

  const uniqueModules = ['All', ...Array.from(new Set(logs.map(l => l.module).filter(Boolean)))];

  const getModuleColor = (moduleName: string) => {
    switch (moduleName) {
      case 'Users': return 'bg-ink-glow/10 text-[#32234A] border-[#32234A]/20';
      case 'Auth': return 'bg-gold-soft/10 text-[#B4823A] border-[#B4823A]/20';
      case 'Donations': return 'bg-sage/10 text-sage border-sage/20';
      case 'Expenses': return 'bg-maroon/10 text-maroon border-maroon/20';
      case 'Settings': return 'bg-ink/10 text-ink border-ink/20';
      default: return 'bg-muted-ink/10 text-muted-ink border-muted-ink/20';
    }
  };

  if (loading && logs.length === 0) {
    return (
      <div className="p-8 text-center">
        <Activity className="w-8 h-8 text-maroon animate-pulse mx-auto mb-4" />
        <p className="text-[14px] font-semibold text-muted-ink">Loading audit logs...</p>
      </div>
    );
  }

  if (error && logs.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="bg-[#F4E9EB] text-maroon p-4 rounded-[12px] inline-flex items-center gap-2 mb-4 border border-maroon/20 font-bold">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
        <div>
          <Button onClick={fetchLogs} className="h-[40px] px-4 font-bold rounded-[12px] border-hair text-ink hover:bg-hair/30 bg-transparent border">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Controls Bar */}
      <div className="p-4 border-b border-hair bg-white flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="relative">
            <Search className="w-4 h-4 text-muted-ink absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search user, action..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-hair rounded-[12px] text-[14px] font-semibold focus:outline-none focus:ring-1 focus:ring-ink focus:border-ink w-full sm:w-64 placeholder:text-muted-ink"
            />
          </div>
          
          <select
            value={moduleFilter}
            onChange={e => setModuleFilter(e.target.value)}
            className="px-3 py-2 border border-hair rounded-[12px] text-[14px] font-semibold focus:outline-none focus:ring-1 focus:ring-ink focus:border-ink bg-white w-full sm:w-40"
          >
            {uniqueModules.map(m => (
              <option key={m} value={m}>{m === 'All' ? 'All Modules' : m}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button 
            className="h-[40px] px-4 font-bold rounded-[12px] border-hair text-ink hover:bg-hair/30 bg-transparent border"
            onClick={fetchLogs}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            className="h-[40px] px-4 font-bold rounded-[12px] bg-ink hover:bg-ink/90 text-cream border-transparent disabled:opacity-50"
            onClick={handleExportCSV}
            disabled={filteredLogs.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Table Area */}
      <div className="overflow-x-auto bg-white min-h-[500px]">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-[14px] font-semibold text-muted-ink">
            No audit logs found matching your filters.
          </div>
        ) : (
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-cream-2 border-b border-hair text-muted-ink">
              <tr>
                <th className="px-4 py-3 font-bold uppercase tracking-wider text-[12px] w-10"></th>
                <th className="px-4 py-3 font-bold uppercase tracking-wider text-[12px]">Timestamp</th>
                <th className="px-4 py-3 font-bold uppercase tracking-wider text-[12px]">User</th>
                <th className="px-4 py-3 font-bold uppercase tracking-wider text-[12px]">Module</th>
                <th className="px-4 py-3 font-bold uppercase tracking-wider text-[12px]">Action</th>
                <th className="px-4 py-3 font-bold uppercase tracking-wider text-[12px] text-right">Record ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hair">
              {filteredLogs.map(log => {
                const isExpanded = expandedRows.has(log.logId);
                const hasDetails = log.oldValue || log.newValue;
                
                return (
                  <React.Fragment key={log.logId}>
                    <tr 
                      className={`hover:bg-cream-2 transition-colors ${isExpanded ? 'bg-cream-2' : ''} ${hasDetails ? 'cursor-pointer' : ''}`}
                      onClick={() => hasDetails && toggleRow(log.logId)}
                    >
                      <td className="px-4 py-3 text-muted-ink">
                        {hasDetails && (
                          isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center text-[14px] font-semibold text-ink">
                          <Calendar className="w-3.5 h-3.5 mr-1.5 text-muted-ink" />
                          {new Date(log.timestamp).toLocaleString(undefined, { 
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[14px] font-bold text-ink">
                        {log.userName}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-[6px] text-[12px] font-bold border ${getModuleColor(log.module)}`}>
                          {log.module || 'System'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[14px] font-semibold text-ink capitalize">
                        {log.action.replace(/([A-Z])/g, ' $1').trim()}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-ink font-mono text-[12px]">
                        {log.recordId || '-'}
                      </td>
                    </tr>
                    
                    {/* Expanded Details Row */}
                    {isExpanded && hasDetails && (
                      <tr className="bg-cream-2 border-t-0 border-b border-hair">
                        <td colSpan={6} className="px-4 py-4 pl-12 border-b border-hair">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {log.oldValue && (
                              <div className="bg-[#F4E9EB] border border-maroon/20 rounded-[12px] p-3">
                                <h4 className="text-[12px] font-bold text-maroon uppercase tracking-wider mb-2">Previous Value</h4>
                                <pre className="text-[12px] text-ink whitespace-pre-wrap font-mono overflow-x-auto">
                                  {log.oldValue}
                                </pre>
                              </div>
                            )}
                            {log.newValue && (
                              <div className="bg-sage/10 border border-sage/20 rounded-[12px] p-3">
                                <h4 className="text-[12px] font-bold text-sage uppercase tracking-wider mb-2">New Value</h4>
                                <pre className="text-[12px] text-ink whitespace-pre-wrap font-mono overflow-x-auto">
                                  {log.newValue}
                                </pre>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      <div className="bg-cream px-4 py-3 border-t border-hair text-[13px] font-semibold text-muted-ink flex justify-between">
        <span>Showing latest {filteredLogs.length} records</span>
      </div>
    </div>
  );
}
