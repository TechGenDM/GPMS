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
      case 'Users': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Auth': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'Donations': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Expenses': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Settings': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  if (loading && logs.length === 0) {
    return (
      <div className="p-8 text-center">
        <Activity className="w-8 h-8 text-indigo-600 animate-pulse mx-auto mb-4" />
        <p className="text-slate-500">Loading audit logs...</p>
      </div>
    );
  }

  if (error && logs.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg inline-flex items-center gap-2 mb-4">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
        <div>
          <Button onClick={fetchLogs} variant="outline">
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
      <div className="p-4 border-b border-slate-200 bg-white flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search user, action..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-64"
            />
          </div>
          
          <select
            value={moduleFilter}
            onChange={e => setModuleFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white w-full sm:w-40"
          >
            {uniqueModules.map(m => (
              <option key={m} value={m}>{m === 'All' ? 'All Modules' : m}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchLogs}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            variant="default" 
            size="sm" 
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
          <div className="p-12 text-center text-slate-500">
            No audit logs found matching your filters.
          </div>
        ) : (
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium w-10"></th>
                <th className="px-4 py-3 font-medium">Timestamp</th>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Module</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium text-right">Record ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map(log => {
                const isExpanded = expandedRows.has(log.logId);
                const hasDetails = log.oldValue || log.newValue;
                
                return (
                  <React.Fragment key={log.logId}>
                    <tr 
                      className={`hover:bg-slate-50 transition-colors ${isExpanded ? 'bg-slate-50' : ''} ${hasDetails ? 'cursor-pointer' : ''}`}
                      onClick={() => hasDetails && toggleRow(log.logId)}
                    >
                      <td className="px-4 py-3 text-slate-400">
                        {hasDetails && (
                          isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center text-slate-600">
                          <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                          {new Date(log.timestamp).toLocaleString(undefined, { 
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {log.userName}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getModuleColor(log.module)}`}>
                          {log.module || 'System'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700 capitalize">
                        {log.action.replace(/([A-Z])/g, ' $1').trim()}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500 font-mono text-xs">
                        {log.recordId || '-'}
                      </td>
                    </tr>
                    
                    {/* Expanded Details Row */}
                    {isExpanded && hasDetails && (
                      <tr className="bg-slate-50 border-t-0">
                        <td colSpan={6} className="px-4 py-4 pl-12 border-b border-slate-100">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {log.oldValue && (
                              <div className="bg-red-50/50 border border-red-100 rounded-md p-3">
                                <h4 className="text-xs font-semibold text-red-800 uppercase tracking-wider mb-2">Previous Value</h4>
                                <pre className="text-xs text-slate-700 whitespace-pre-wrap font-mono overflow-x-auto">
                                  {log.oldValue}
                                </pre>
                              </div>
                            )}
                            {log.newValue && (
                              <div className="bg-emerald-50/50 border border-emerald-100 rounded-md p-3">
                                <h4 className="text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-2">New Value</h4>
                                <pre className="text-xs text-slate-700 whitespace-pre-wrap font-mono overflow-x-auto">
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
      <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 text-sm text-slate-500 flex justify-between">
        <span>Showing latest {filteredLogs.length} records</span>
      </div>
    </div>
  );
}
