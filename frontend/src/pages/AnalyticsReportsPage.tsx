import React, { useEffect, useState } from 'react';
import {
  BarChart3, Sparkles, TrendingUp, AlertTriangle, ShieldCheck,
  Building2, Calendar, MapPin, Download, RefreshCw, Info, Layers
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  Legend, LineChart, Line, AreaChart, Area
} from 'recharts';
import { PredictiveAnalytics, ChartsData } from '../types';
import api from '../services/api';

export const AnalyticsReportsPage: React.FC = () => {
  const [forecasting, setForecasting] = useState<PredictiveAnalytics | null>(null);
  const [charts, setCharts] = useState<ChartsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [fData, cData] = await Promise.all([
        api.analytics.getForecasting(),
        api.analytics.getCharts(),
      ]);
      setForecasting(fData);
      setCharts(cData);
    } catch (err) {
      //
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-8 pb-16">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 text-xs font-semibold mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Statistical Forecasting Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Predictive Civic Analytics & Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Historical incident aggregation contrasted with predictive hotspot forecasting and preventive maintenance triggers.
          </p>
        </div>

        <a
          href={api.analytics.exportCsvUrl()}
          target="_blank"
          rel="noreferrer"
          className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:bg-slate-100 flex items-center gap-1.5 shrink-0"
        >
          <Download className="w-3.5 h-3.5" /> Export Report (CSV)
        </a>
      </div>

      {/* SECTION 1: HISTORICAL FACTS */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Section 1: Ground-Truth Historical Facts
          </h2>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
            Verified Database Records
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Complaints by Locality / Ward */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Complaints Density by Municipal Ward</h3>
            <p className="text-xs text-slate-400">Total incidents recorded per jurisdiction</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts?.by_ward || []}>
                  <XAxis dataKey="ward" stroke="#888888" fontSize={10} interval={0} angle={-15} textAnchor="end" height={50} />
                  <YAxis stroke="#888888" fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Citizen CSAT Rating Distribution */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Citizen CSAT Rating Distribution</h3>
            <p className="text-xs text-slate-400">Reviews and feedback ratings logged by verified citizens</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts?.csat_breakdown || []}>
                  <XAxis dataKey="rating" stroke="#888888" fontSize={11} />
                  <YAxis stroke="#888888" fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#eab308" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: AI PREDICTIONS & PROJECTIONS */}
      <div className="space-y-6 pt-6 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-pulse"></span>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Section 2: AI Predictive Projections & Preventive Alerts
          </h2>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
            Statistical Machine Learning Model
          </span>
        </div>

        {/* Recurring Chronic Hotspots Table */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-purple-600" />
              Recurring Chronic Infrastructure Hotspots
            </h3>
            <p className="text-xs text-slate-400">
              Spatial clustering highlights areas with disproportionate infrastructure breakdown rates
            </p>
          </div>

          <div className="space-y-2.5">
            {forecasting?.ai_predictions.recurring_hotspots.map((spot, i) => (
              <div
                key={i}
                className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">{spot.ward_name}</span>
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      spot.ai_risk_level === 'High Risk' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {spot.ai_risk_level}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">
                    Recommended Action: <em>{spot.recommended_action}</em>
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-bold text-purple-700 dark:text-purple-300 block">{spot.city_share_percentage}% of City Issues</span>
                  <span className="text-[11px] text-slate-400">{spot.historical_complaint_count} incidents logged</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Preventive Maintenance Alerts */}
        <div className="grid md:grid-cols-3 gap-6">
          {forecasting?.ai_predictions.preventive_maintenance_alerts.map((alert, i) => (
            <div
              key={i}
              className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/60 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  {alert.action_type}
                </span>
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">{alert.zone}</h4>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Focus: {alert.focus_area}
              </p>
              <p className="text-[11px] text-slate-500">
                <strong>Historical Trigger:</strong> {alert.historical_evidence}
              </p>
              <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/40 text-[11px] text-amber-900 dark:text-amber-200 leading-snug">
                <strong>AI Projection:</strong> {alert.ai_predictive_projection}
              </div>
            </div>
          ))}
        </div>

        {/* Seasonal Trends Forecasts */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              Seasonal Civic Demand Projections
            </h3>
            <p className="text-xs text-slate-400">Anticipate weather-driven surges in drainage, water supply, and lighting</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {forecasting?.ai_predictions.seasonal_trends.map((season, i) => (
              <div key={i} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">{season.season}</span>
                  <span className="text-[10px] text-emerald-600 font-bold">{Math.round(season.confidence * 100)}% Conf.</span>
                </div>
                <p className="text-purple-600 dark:text-purple-400 font-semibold text-[11px]">
                  Surge: {season.projected_category_surge}
                </p>
                <p className="text-slate-500 text-[11px]">
                  <strong>Intervention:</strong> {season.preventive_measure}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-500 flex items-start gap-2.5">
          <Info className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" />
          <p>{forecasting?.ai_predictions.disclaimer}</p>
        </div>

      </div>

    </div>
  );
};
