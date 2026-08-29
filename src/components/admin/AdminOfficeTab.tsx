import React from 'react';
import { Building2, CheckCircle2, AlertCircle, Film, HardDrive, Upload, RefreshCw, FileVideo, Trash2, Check, Save, Tv, Layers, Printer, Type } from 'lucide-react';
import { OfficeSetting } from '../../types';
import { StoredVideo } from '../../lib/videoStorage';

interface PresetVideo {
  id: string;
  title: string;
  titleAmharic: string;
  url: string;
}

interface AdminOfficeTabProps {
  officeForm: Partial<OfficeSetting>;
  setOfficeForm: React.Dispatch<React.SetStateAction<Partial<OfficeSetting>>>;
  officeSetting: OfficeSetting | null;
  isOfficeFormDirty: boolean;
  setIsOfficeFormDirty: (dirty: boolean) => void;
  officeSaveSuccess: string;
  officeSaveError: string;
  isSavingOffice: boolean;
  onSaveOfficeSettings: () => void;
  adminStorageUsage: { count: number; formattedSize: string };
  isAdminUploadingVideo: boolean;
  onAdminVideoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  adminVideoStorageMsg: string;
  adminStoredVideos: StoredVideo[];
  onAdminSelectStoredVideo: (item: StoredVideo) => void;
  onAdminDeleteStoredVideo: (id: string, e: React.MouseEvent) => void;
  formatBytes: (bytes: number) => string;
  presetVideos: PresetVideo[];
  isAmharic: boolean;
}

export const AdminOfficeTab: React.FC<AdminOfficeTabProps> = ({
  officeForm,
  setOfficeForm,
  officeSetting,
  isOfficeFormDirty,
  setIsOfficeFormDirty,
  officeSaveSuccess,
  officeSaveError,
  isSavingOffice,
  onSaveOfficeSettings,
  adminStorageUsage,
  isAdminUploadingVideo,
  onAdminVideoUpload,
  adminVideoStorageMsg,
  adminStoredVideos,
  onAdminSelectStoredVideo,
  onAdminDeleteStoredVideo,
  formatBytes,
  presetVideos,
  isAmharic
}) => {
  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Feedback Alerts */}
      {officeSaveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{officeSaveSuccess}</span>
        </div>
      )}
      {officeSaveError && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold flex items-center space-x-2 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{officeSaveError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Office Identity Form */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  {isAmharic ? 'የቢሮ እና የተቋም መለያ ስም' : 'Office & Organization Identity'}
                </h2>
                <p className="text-[11px] text-slate-500">
                  {isAmharic ? 'በስክሪኖች፣ በቲኬት ማተሚያዎች እና በሰራተኞች ዴስክ ላይ የሚታይ ይፋዊ ስም' : 'Official title displayed across public TV displays, thermal tickets, and navigation'}
                </p>
              </div>
            </div>
          </div>

          {/* Office Presets Pills */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              {isAmharic ? 'ፈጣን የአማራጭ ስሞች (One-Click Presets)' : 'Quick Presets (Click to fill)'}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { am: 'የኢትዮጵያ አገልግሎት መስጫ ማዕከል', en: 'ETHIOPIA SERVICE CENTER' },
                { am: 'የኢትዮጵያ ገቢዎች ሚኒስቴር', en: 'MINISTRY OF REVENUES ETHIOPIA' },
                { am: 'የኢሚግሬሽን እና ዜግነት አገልግሎት', en: 'IMMIGRATION & CITIZENSHIP SERVICE' },
                { am: 'የቂርቆስ ክፍለ ከተማ አገልግሎት ማዕከል', en: 'KIRKOS SUB-CITY SERVICE CENTER' },
                { am: 'የቦሌ ክፍለ ከተማ ወሳኝ ኩነት ምዝገባ', en: 'BOLE SUB-CITY VITAL EVENTS' },
                { am: 'የኢትዮጵያ ንግድ ባንክ - ዋና ቅርንጫፍ', en: 'COMMERCIAL BANK OF ETHIOPIA' }
              ].map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setOfficeForm(prev => ({
                      ...prev,
                      officeNameAmharic: preset.am,
                      officeName: preset.en
                    }));
                    setIsOfficeFormDirty(true);
                  }}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700 transition cursor-pointer"
                >
                  {isAmharic ? preset.am : preset.en}
                </button>
              ))}
            </div>
          </div>

          {/* Input Fields */}
          <div className="space-y-4 pt-1">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">
                  {isAmharic ? 'የቢሮ ስም (አማርኛ) *' : 'Office Name (Amharic) *'}
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  {(officeForm.officeNameAmharic || '').length} chars
                </span>
              </div>
              <input
                id="input-office-name-amharic"
                type="text"
                placeholder="ለምሳሌ፡ የቂርቆስ ክፍለ ከተማ አገልግሎት ማዕከል"
                value={officeForm.officeNameAmharic || ''}
                onChange={(e) => {
                  setOfficeForm({ ...officeForm, officeNameAmharic: e.target.value });
                  setIsOfficeFormDirty(true);
                }}
                className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none font-medium text-slate-900 shadow-2xs"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">
                  {isAmharic ? 'የቢሮ ስም (English) *' : 'Office Name (English) *'}
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  {(officeForm.officeName || '').length} chars
                </span>
              </div>
              <input
                id="input-office-name-english"
                type="text"
                placeholder="e.g. KIRKOS SUB-CITY SERVICE CENTER"
                value={officeForm.officeName || ''}
                onChange={(e) => {
                  setOfficeForm({ ...officeForm, officeName: e.target.value });
                  setIsOfficeFormDirty(true);
                }}
                className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none font-medium text-slate-900 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isAmharic ? 'በስክሪኑ ግርጌ የሚታይ ማስታወቂያ (አማርኛ ዜና/ማሳሰቢያ)' : 'Bottom Ticker Notice (Amharic)'}
              </label>
              <textarea
                rows={2}
                value={officeForm.displayNoticeAmharic || ''}
                onChange={(e) => {
                  setOfficeForm({ ...officeForm, displayNoticeAmharic: e.target.value });
                  setIsOfficeFormDirty(true);
                }}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none font-medium text-slate-900"
                placeholder="እንኳን ወደ አገልግሎት መስጫ ማዕከላችን በደህና መጡ..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isAmharic ? 'በስክሪኑ ግርጌ የሚታይ ማስታወቂያ (English)' : 'Bottom Ticker Notice (English)'}
              </label>
              <textarea
                rows={2}
                value={officeForm.displayNoticeEnglish || ''}
                onChange={(e) => {
                  setOfficeForm({ ...officeForm, displayNoticeEnglish: e.target.value });
                  setIsOfficeFormDirty(true);
                }}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none font-medium text-slate-900"
                placeholder="Welcome to our official service center..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isAmharic ? 'ለአንድ ሰው የሚገመት የጥበቃ ደቂቃ' : 'Estimated Wait Minutes Per Customer'}
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={officeForm.estimatedWaitPerPersonMinutes || 4}
                  onChange={(e) => {
                    setOfficeForm({ ...officeForm, estimatedWaitPerPersonMinutes: Number(e.target.value) });
                    setIsOfficeFormDirty(true);
                  }}
                  className="w-28 p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold text-slate-900"
                />
                <span className="text-xs text-slate-500">
                  {isAmharic ? 'ደቂቃዎች በአንድ ደንበኛ' : 'minutes per queue ticket'}
                </span>
              </div>
            </div>

            {/* Video Player on Display Screen Configuration */}
            <div className="pt-4 border-t border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Film className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    {isAmharic ? 'የቀጥታ ስክሪን ቪዲዮ ማጫወቻ (TV Screen Video Player)' : 'TV Public Screen Video Player & Channels'}
                  </h3>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={officeForm.displayVideoEnabled !== false}
                    onChange={(e) => {
                      setOfficeForm({ ...officeForm, displayVideoEnabled: e.target.checked });
                      setIsOfficeFormDirty(true);
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  <span className="ml-2 text-xs font-bold text-slate-700">
                    {officeForm.displayVideoEnabled !== false 
                      ? (isAmharic ? 'በርቷል' : 'Enabled') 
                      : (isAmharic ? 'ጠፍቷል' : 'Disabled')}
                  </span>
                </label>
              </div>

              {/* Local Stored Videos Library in Admin */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-lg bg-indigo-600 text-white">
                      <HardDrive className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        {isAmharic ? 'በ Local Storage የተቀመጡ ቪዲዮዎች (Offline Storage)' : 'Local Storage Video Library (Browser Stored)'}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {isAmharic 
                          ? `የተቀመጡ፡ ${adminStorageUsage.count} ቪዲዮዎች (${adminStorageUsage.formattedSize})` 
                          : `Stored: ${adminStorageUsage.count} files (${adminStorageUsage.formattedSize})`}
                      </p>
                    </div>
                  </div>

                  <label className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm shrink-0">
                    {isAdminUploadingVideo ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>{isAdminUploadingVideo ? (isAmharic ? 'በመጫን ላይ...' : 'Uploading...') : (isAmharic ? 'ቪዲዮ ወደ Local Storage ጫን' : 'Upload Video File')}</span>
                    <input
                      type="file"
                      accept="video/*"
                      disabled={isAdminUploadingVideo}
                      onChange={onAdminVideoUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {adminVideoStorageMsg && (
                  <div className="p-2 rounded-xl bg-white border border-indigo-200 text-xs text-indigo-900 font-medium flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{adminVideoStorageMsg}</span>
                  </div>
                )}

                {adminStoredVideos.length > 0 && (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {adminStoredVideos.map((item) => {
                      const isSelected = officeForm.displayVideoTitle === item.title;
                      return (
                        <div
                          key={item.id}
                          onClick={() => onAdminSelectStoredVideo(item)}
                          className={`p-2 rounded-xl border transition text-xs flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold ring-1 ring-emerald-400 shadow-sm'
                              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center space-x-2 min-w-0">
                            <FileVideo className={`w-4 h-4 shrink-0 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                            <span className="truncate">{isAmharic ? (item.titleAmharic || item.title) : item.title}</span>
                            {item.sizeBytes && (
                              <span className="text-[10px] text-slate-400 font-mono">({formatBytes(item.sizeBytes)})</span>
                            )}
                          </div>

                          <div className="flex items-center space-x-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => onAdminDeleteStoredVideo(item.id, e)}
                              className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            {isSelected ? (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[10px]">
                                {isAmharic ? 'የተመረጠ' : 'Selected'}
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 hover:bg-indigo-600 hover:text-white text-[10px] transition">
                                {isAmharic ? 'ምረጥ' : 'Select'}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Preset Video Channels */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600">
                  {isAmharic ? 'የተዘጋጁ የቪዲዮ ቻናሎች (1-Click Select):' : 'Curated Video Presets (1-Click Select):'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {presetVideos.map((preset) => {
                    const isSelected = officeForm.displayVideoUrl === preset.url;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setOfficeForm({
                            ...officeForm,
                            displayVideoUrl: preset.url,
                            displayVideoTitle: preset.title,
                            displayVideoTitleAmharic: preset.titleAmharic
                          });
                          setIsOfficeFormDirty(true);
                        }}
                        className={`p-2 rounded-xl text-left border transition text-xs flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-400 text-indigo-900 font-bold ring-1 ring-indigo-400'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <span className="truncate pr-1">
                          {isAmharic ? preset.titleAmharic : preset.title}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Video URL Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  {isAmharic ? 'የቪዲዮ አድራሻ (YouTube Link ወይም ቀጥታ MP4 URL)' : 'Video Stream / YouTube URL'}
                </label>
                <input
                  type="text"
                  value={officeForm.displayVideoUrl || ''}
                  onChange={(e) => {
                    setOfficeForm({ ...officeForm, displayVideoUrl: e.target.value });
                    setIsOfficeFormDirty(true);
                  }}
                  placeholder="https://www.youtube.com/watch?v=... or https://example.com/video.mp4"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono text-slate-900"
                />
              </div>

              {/* Video Layout on Display Screen & Font Size Scale */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {isAmharic ? 'የስክሪን አቀማመጥ (Default Layout)' : 'Default Screen Layout'}
                  </label>
                  <select
                    value={officeForm.displayVideoLayout || 'SPLIT'}
                    onChange={(e) => {
                      setOfficeForm({ ...officeForm, displayVideoLayout: e.target.value as any });
                      setIsOfficeFormDirty(true);
                    }}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900"
                  >
                    <option value="SPLIT">Split Screen (50/50 Side-by-Side)</option>
                    <option value="SIDE">Side Widget Panel</option>
                    <option value="PIP">Floating Picture-in-Picture (PiP)</option>
                    <option value="FULL">Full Video with Live Queue Banner</option>
                    <option value="OFF">Video Hidden (Queue Only)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {isAmharic ? 'የስክሪን የፊደል መጠን (Font Size)' : 'Screen Font Size'}
                  </label>
                  <select
                    value={officeForm.displayFontSize || 'NORMAL'}
                    onChange={(e) => {
                      setOfficeForm({ ...officeForm, displayFontSize: e.target.value as any });
                      setIsOfficeFormDirty(true);
                    }}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900"
                  >
                    <option value="COMPACT">Compact (85%) - አነስተኛ</option>
                    <option value="NORMAL">Standard (100%) - መደበኛ</option>
                    <option value="LARGE">Large (120%) - ትልቅ</option>
                    <option value="XLARGE">Extra Large (145%) - በጣም ትልቅ</option>
                    <option value="MASSIVE">Ultra / Massive (175%) - ግዙፍ</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {isAmharic ? 'የቪዲዮ ርዕስ' : 'Video Title / Header'}
                  </label>
                  <input
                    type="text"
                    value={officeForm.displayVideoTitle || ''}
                    onChange={(e) => {
                      setOfficeForm({ ...officeForm, displayVideoTitle: e.target.value });
                      setIsOfficeFormDirty(true);
                    }}
                    placeholder="e.g. Office Welcome Guide"
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900"
                  />
                </div>
              </div>

              {/* Playback Toggles */}
              <div className="flex flex-wrap gap-4 pt-1">
                <label className="flex items-center space-x-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={officeForm.displayVideoLoop !== false}
                    onChange={(e) => {
                      setOfficeForm({ ...officeForm, displayVideoLoop: e.target.checked });
                      setIsOfficeFormDirty(true);
                    }}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>{isAmharic ? 'ተደጋጋሚ ማጫወቻ (Loop Playback)' : 'Loop Video Automatically'}</span>
                </label>

                <label className="flex items-center space-x-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={officeForm.displayVideoMuted !== false}
                    onChange={(e) => {
                      setOfficeForm({ ...officeForm, displayVideoMuted: e.target.checked });
                      setIsOfficeFormDirty(true);
                    }}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>{isAmharic ? 'በነባሪ ድምፁ ይዘጋ (Mute by default)' : 'Mute Video on Load'}</span>
                </label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3 pt-2 border-t border-slate-100">
            <button
              id="btn-save-office-settings"
              onClick={onSaveOfficeSettings}
              disabled={isSavingOffice}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center space-x-1.5 cursor-pointer"
            >
              {isSavingOffice ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{isAmharic ? 'በማስቀመጥ ላይ...' : 'Saving Office Name...'}</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isAmharic ? 'የቢሮውን ስም እና ቅንብሮች አስቀምጥ' : 'Save Office Name & Settings'}</span>
                </>
              )}
            </button>

            {isOfficeFormDirty && (
              <button
                type="button"
                onClick={() => {
                  if (officeSetting) {
                    setOfficeForm(officeSetting);
                    setIsOfficeFormDirty(false);
                  }
                }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                {isAmharic ? 'ወደ ነበረበት መልስ' : 'Revert Changes'}
              </button>
            )}
          </div>
        </div>

        {/* Right: Live Real-Time Previews */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs text-indigo-400 font-semibold border-b border-slate-800 pb-2">
              <div className="flex items-center space-x-1.5">
                <Tv className="w-3.5 h-3.5" />
                <span>{isAmharic ? 'የቀጥታ ስክሪን ቅድመ-እይታ (TV Display)' : 'TV Public Display Preview'}</span>
              </div>
              <span className="text-[10px] uppercase font-mono bg-indigo-950 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-800/60">
                Live
              </span>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-lg text-white shrink-0">
                Q
              </div>
              <div className="min-w-0">
                <p className="text-sm font-black text-white uppercase tracking-tight truncate">
                  {isAmharic 
                    ? (officeForm.officeNameAmharic || officeForm.officeName || 'የአገልግሎት መስጫ ቢሮ')
                    : (officeForm.officeName || officeForm.officeNameAmharic || 'ABC SERVICE OFFICE')}
                </p>
                <p className="text-[10px] text-indigo-400 font-medium truncate mt-0.5">
                  {isAmharic ? 'የቀጥታ የወረፋ መከታተያ ስክሪን • በአዲስ AI ድምፅ' : 'Live Official Queue Display • Addis AI Voice'}
                </p>
              </div>
            </div>

            {/* Display Video Player Status Preview */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-medium flex items-center space-x-1">
                  <Film className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{isAmharic ? 'የስክሪን ቪዲዮ ሁነታ:' : 'Display Video Mode:'}</span>
                </span>
                <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                  officeForm.displayVideoEnabled !== false ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-800 text-slate-400'
                }`}>
                  {officeForm.displayVideoEnabled !== false ? (officeForm.displayVideoLayout || 'SPLIT') : 'DISABLED'}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-medium flex items-center space-x-1">
                  <Type className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{isAmharic ? 'የፊደል መጠን:' : 'Font Size Scale:'}</span>
                </span>
                <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800/80">
                  {officeForm.displayFontSize || 'NORMAL'}
                </span>
              </div>

              {officeForm.displayVideoEnabled !== false && (
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-[10px] text-slate-300 truncate font-mono">
                  {officeForm.displayVideoUrl || presetVideos[0]?.url || 'https://www.youtube.com/watch?v=5qap5aO4i9A'}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Header Preview */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold border-b border-slate-800 pb-2">
              <div className="flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>{isAmharic ? 'የሳይድባር ቅድመ-እይታ (Sidebar Header)' : 'Navigation Sidebar Preview'}</span>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">
                  {isAmharic 
                    ? (officeForm.officeNameAmharic || officeForm.officeName || 'የኢትዮጵያ አገልግሎት መስጫ ማዕከል')
                    : (officeForm.officeName || officeForm.officeNameAmharic || 'ETHIOPIA SERVICE CENTER')}
                </p>
                <div className="flex items-center space-x-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[9px] text-slate-400 uppercase font-semibold">
                    {isAmharic ? 'የወረፋ ስርዓት' : 'Smart Queue'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Printed Thermal Ticket Preview */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-700 font-bold border-b border-slate-100 pb-2">
              <div className="flex items-center space-x-1.5">
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>{isAmharic ? 'የማተሚያ ቲኬት ቅድመ-እይታ (80mm Thermal Ticket)' : '80mm Thermal Ticket Print Preview'}</span>
              </div>
            </div>

            <div className="bg-slate-50 border border-dashed border-slate-300 p-4 rounded-xl text-center font-mono space-y-2">
              <div className="border-b border-dashed border-slate-400 pb-2">
                <p className="text-xs font-black uppercase text-slate-900">
                  {officeForm.officeNameAmharic || officeForm.officeName || 'ETHIOPIA SERVICE CENTER'}
                </p>
                <p className="text-[10px] text-slate-600 uppercase">
                  {officeForm.officeName || officeForm.officeNameAmharic || 'ETHIOPIA SERVICE CENTER'}
                </p>
              </div>
              <div className="py-1">
                <p className="text-[9px] text-slate-500 uppercase font-bold">QUEUE TICKET / የወረፋ ቲኬት</p>
                <p className="text-2xl font-black text-slate-900 tracking-wider">A-001</p>
              </div>
              <div className="border-t border-dashed border-slate-400 pt-2 text-[9px] text-slate-500">
                <p>{isAmharic ? 'እናመሰግናለን! • በሰላም ይቆዩ' : 'Thank you for your patience'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
