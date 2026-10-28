import React, { useEffect, useState } from 'react';
import { MapPin, Filter, AlertTriangle, Layers, RefreshCw } from 'lucide-react';
import { CivicMapView } from '../components/CivicMapView';
import { MapMarkerItem, Category } from '../types';
import api from '../services/api';

export const CivicMapPage: React.FC = () => {
  const [markers, setMarkers] = useState<MapMarkerItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');

  const fetchMarkers = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedCategory) params.category_id = Number(selectedCategory);
      if (selectedStatus) params.status = selectedStatus;
      if (selectedPriority) params.priority = selectedPriority;

      const data = await api.map.getMarkers(params);
      setMarkers(data);
    } catch (err) {
      //
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.admin.getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    fetchMarkers();
  }, [selectedCategory, selectedStatus, selectedPriority]);

  return (
    <div className="space-y-6 pb-16">
      
      {/* Title & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-semibold mb-1.5">
            <MapPin className="w-3.5 h-3.5" />
            <span>Smart City Geographic Surveillance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Interactive Civic Issues Map
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time visual map of all municipal infrastructure complaints across city wards.
          </p>
        </div>

        {/* Live Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
          >
            <option value="">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
          >
            <option value="">All Statuses</option>
            <option value="Submitted">Submitted</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Escalated">Escalated</option>
          </select>

          <button
            onClick={() => fetchMarkers()}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            title="Refresh Map"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Map View */}
      <CivicMapView markers={markers} />

      {/* Map Information Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-2xl font-black text-slate-900 dark:text-white">{markers.length}</p>
          <p className="text-xs text-slate-500">Active Map Markers</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-2xl font-black text-red-600">
            {markers.filter(m => m.priority === 'Critical').length}
          </p>
          <p className="text-xs text-slate-500">Critical Hazards</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-2xl font-black text-orange-500">
            {markers.filter(m => m.priority === 'High').length}
          </p>
          <p className="text-xs text-slate-500">High Urgency Issues</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-2xl font-black text-emerald-600">
            {markers.filter(m => m.status === 'Resolved' || m.status === 'Closed').length}
          </p>
          <p className="text-xs text-slate-500">Resolved Locations</p>
        </div>
      </div>

    </div>
  );
};
