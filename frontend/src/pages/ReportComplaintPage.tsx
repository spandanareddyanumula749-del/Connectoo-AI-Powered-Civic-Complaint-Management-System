import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert, Camera, MapPin, Sparkles, BrainCircuit, AlertTriangle,
  CheckCircle2, ArrowRight, Upload, Info, RefreshCw, X
} from 'lucide-react';
import { MapPicker } from '../components/MapPicker';
import { useAuth } from '../contexts/AuthContext';
import { Category, Ward, AIClassifyResult, AISeverityResult, DuplicateMatchItem } from '../types';
import api from '../services/api';

export const ReportComplaintPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<number>(1);
  const [wardId, setWardId] = useState<number>(1);
  const [address, setAddress] = useState('Road No. 10, Banjara Hills');
  const [landmark, setLandmark] = useState('');
  const [latitude, setLatitude] = useState(17.4156);
  const [longitude, setLongitude] = useState(78.4350);
  const [language, setLanguage] = useState<'en' | 'hi' | 'te'>('en');

  // Photo & Vision State
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [visionAnalysis, setVisionAnalysis] = useState<any | null>(null);
  const [visionLoading, setVisionLoading] = useState(false);

  // Live AI Assist State
  const [aiSuggestions, setAiSuggestions] = useState<AIClassifyResult | null>(null);
  const [aiSeverity, setAiSeverity] = useState<AISeverityResult | null>(null);
  const [potentialDuplicates, setPotentialDuplicates] = useState<DuplicateMatchItem[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch categories and wards
    api.admin.getCategories()
      .then(cats => {
        setCategories(cats);
        if (cats.length > 0) setCategoryId(cats[0].id);
      })
      .catch(() => {});
  }, []);

  // Live AI debounce trigger when user pauses typing description
  useEffect(() => {
    if (description.trim().length < 15) {
      setAiSuggestions(null);
      setAiSeverity(null);
      return;
    }

    const timer = setTimeout(async () => {
      setAiLoading(true);
      try {
        // Run classification
        const classRes = await api.ai.classify(description);
        setAiSuggestions(classRes);
        if (classRes.suggested_category_id) {
          setCategoryId(classRes.suggested_category_id);
        }

        // Run severity
        const sevRes = await api.ai.predictSeverity(title || description, description, classRes.suggested_category_id);
        setAiSeverity(sevRes);

        // Run duplicate check
        if (latitude && longitude) {
          const dupRes = await api.ai.checkDuplicates({
            title: title || description.slice(0, 40),
            description,
            category_id: classRes.suggested_category_id || categoryId,
            latitude,
            longitude,
          });
          setPotentialDuplicates(dupRes.potential_duplicates);
        }
      } catch (err) {
        // Fail gracefully
      } finally {
        setAiLoading(false);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [description, latitude, longitude]);

  // Handle Photo Upload & Computer Vision analysis
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setVisionLoading(true);
    setVisionAnalysis(null);

    try {
      const result = await api.ai.analyzeVision(file);
      setVisionAnalysis(result);
    } catch (err) {
      setVisionAnalysis({
        status: 'UNAVAILABLE',
        message: 'Could not process image features with computer vision.',
      });
    } finally {
      setVisionLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      // 1. Create Complaint
      const newComplaint = await api.complaints.create({
        title,
        description,
        category_id: categoryId,
        ward_id: wardId,
        latitude,
        longitude,
        address,
        landmark,
      });

      // 2. Upload photo attachment if selected
      if (photoFile && newComplaint.id) {
        await api.complaints.uploadAttachment(newComplaint.id, photoFile, 'evidence');
      }

      // 3. Navigate to the created complaint detail page
      navigate(`/complaints/${newComplaint.id}`);
    } catch (err: any) {
      setSubmitError(err.response?.data?.detail || 'Failed to submit complaint. Please check fields.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-semibold mb-2">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Municipal Citizen Service</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
          Report a Public Infrastructure Issue
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
          Provide issue details and location. Our automated AI engine analyzes severity, flags potential duplicates, and dispatches the task to the right field department.
        </p>
      </div>

      {submitError && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Step 1: Issue Summary & Multilingual Input */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-bold">1</span>
              Complaint Details
            </h2>

            {/* Language Selector */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">Input Language:</span>
              <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`px-2.5 py-1 rounded-md font-semibold text-xs transition-colors ${
                    language === 'en' ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('hi')}
                  className={`px-2.5 py-1 rounded-md font-semibold text-xs transition-colors ${
                    language === 'hi' ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  हिंदी (Hindi)
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('te')}
                  className={`px-2.5 py-1 rounded-md font-semibold text-xs transition-colors ${
                    language === 'te' ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  తెలుగు (Telugu)
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Complaint Title *
            </label>
            <input
              type="text"
              required
              minLength={5}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Deep dangerous pothole causing accidents near school crossing"
              className="w-full px-4 py-3 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Detailed Description *
              </label>
              {aiLoading && (
                <span className="text-[11px] text-purple-600 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin" /> AI analyzing text...
                </span>
              )}
            </div>
            <textarea
              required
              rows={4}
              minLength={10}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                language === 'hi'
                  ? 'समस्या का पूरा विवरण लिखें (जैसे: सड़क पर बड़ा गड्ढा है, पानी भर गया है)...'
                  : language === 'te'
                  ? 'సమస్య వివరాలను ఇక్కడ రాయండి (ఉదా: రోడ్డుపై పెద్ద గుంత ఏర్పడింది)...'
                  : 'Describe the issue clearly, mentioning any specific hazards (flooding, electrocution, traffic gridlock) and how long it has persisted...'
              }
              className="w-full px-4 py-3 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Live AI Insights Panel */}
          {(aiSuggestions || aiSeverity) && (
            <div className="p-4 rounded-2xl bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-900 dark:text-purple-300">
                <Sparkles className="w-4 h-4 text-purple-600" />
                Live AI Triage Recommendations
              </div>

              <div className="grid sm:grid-cols-2 gap-3 text-xs">
                {aiSuggestions && (
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-purple-100 dark:border-purple-900/40">
                    <p className="text-[11px] text-slate-500">Auto-Suggested Category</p>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{aiSuggestions.suggested_category_name}</p>
                    <p className="text-[10px] text-emerald-600 mt-1">Confidence: {Math.round(aiSuggestions.confidence * 100)}%</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Assigned to: {aiSuggestions.suggested_department_name}</p>
                  </div>
                )}

                {aiSeverity && (
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-purple-100 dark:border-purple-900/40">
                    <p className="text-[11px] text-slate-500">Predicted Urgency</p>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{aiSeverity.severity}</span>
                      <span className="text-[10px] text-purple-600">({Math.round(aiSeverity.confidence * 100)}% match)</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{aiSeverity.reasoning}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Potential Duplicates Warning Drawer */}
          {potentialDuplicates.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Nearby Similar Complaints Detected
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-200">
                Other citizens have reported related issues within 250 meters. You can still submit if your report is distinct:
              </p>
              <div className="space-y-1.5 mt-2">
                {potentialDuplicates.map(dup => (
                  <div key={dup.id} className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-900 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300 mr-2">{dup.complaint_id}</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{dup.title}</span>
                      <span className="text-[11px] text-slate-400 block">{dup.distance_meters}m away • Status: {dup.status}</span>
                    </div>
                    <span className="font-bold text-amber-600 shrink-0 text-xs">{Math.round(dup.similarity_score * 100)}% Match</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Category Dropdown */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(Number(e.target.value))}
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.sla_hours}h SLA)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Municipal Ward
              </label>
              <select
                value={wardId}
                onChange={(e) => setWardId(Number(e.target.value))}
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
              >
                <option value={1}>Ward 1 - Banjara Hills (Central)</option>
                <option value={2}>Ward 2 - Jubilee Hills (Central)</option>
                <option value={3}>Ward 3 - Madhapur IT Hub (West)</option>
                <option value={4}>Ward 4 - Charminar Old City (South)</option>
                <option value={5}>Ward 5 - Secunderabad Station (North)</option>
                <option value={6}>Ward 6 - Kukatpally (North-West)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Step 2: Photo Evidence with Computer Vision */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-bold">2</span>
            Photograph & AI Vision Verification
          </h2>

          <div className="grid sm:grid-cols-2 gap-4 items-start">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Upload Problem Photo (JPEG, PNG, WebP)
              </label>
              <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-800/30">
                <Camera className="w-8 h-8 text-slate-400 mb-2" />
                <span className="text-xs font-bold text-emerald-600">Click to snap or upload photograph</span>
                <span className="text-[11px] text-slate-400 mt-1">Up to 15MB file size</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Photo Preview & CV Result */}
            <div>
              {photoPreview ? (
                <div className="space-y-3">
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-48">
                    <img src={photoPreview} alt="Preview" className="w-full h-48 object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoFile(null);
                        setPhotoPreview(null);
                        setVisionAnalysis(null);
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {visionLoading && (
                    <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 text-xs flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Analyzing visual features with Computer Vision...</span>
                    </div>
                  )}

                  {visionAnalysis && (
                    <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white">Computer Vision Analysis</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          visionAnalysis.status === 'ACTIVE_VISION_MODEL'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-slate-200 text-slate-700'
                        }`}>
                          {visionAnalysis.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300">
                        {visionAnalysis.message}
                      </p>
                      {visionAnalysis.tags && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {visionAnalysis.tags.map((tag: string, i: number) => (
                            <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-medium">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-44 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center text-xs text-slate-400 text-center p-4">
                  Visual recognition results will appear here once photo is uploaded.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Step 3: Location Selection & Map Picker */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-bold">3</span>
            Location & Map Pin
          </h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Physical Address / Street *
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Crossroad 36, Near Peddamma Temple"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Nearby Landmark
              </label>
              <input
                type="text"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="e.g. Opposite Metro Pillar 1042"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Click on Map to Drop Exact Coordinates
            </label>
            <MapPicker
              latitude={latitude}
              longitude={longitude}
              onChange={(lat, lng) => {
                setLatitude(lat);
                setLongitude(lng);
              }}
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-xl shadow-emerald-600/30 transition-all flex items-center gap-2 disabled:opacity-50 hover:scale-102"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Registering & Triage in Progress...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Submit Civic Complaint
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};
