import { useState, useEffect } from 'react';
import { Save, AlertCircle } from 'lucide-react';

const SystemSettings = () => {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('appSettings');
    return saved ? JSON.parse(saved) : {
      theme: 'Light Purple',
      language: 'English',
      timezone: 'UTC',
      emailNotifications: true,
      weeklyReports: true,
      alertAnomalies: false
    };
  });

  const [saveMessage, setSaveMessage] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(settings.theme === 'Dark Purple');

  // Apply theme changes immediately
  useEffect(() => {
    const isDark = settings.theme === 'Dark Purple';
    setIsDarkMode(isDark);
    
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.body.style.backgroundColor = '#1a1a1a';
      document.body.style.color = '#ffffff';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.style.backgroundColor = 'transparent';
      document.body.style.color = 'inherit';
    }
  }, [settings.theme]);

  const handleSettingChange = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('appSettings', JSON.stringify(newSettings));
    
    // Show confirmation
    setSaveMessage('✓ Settings saved and applied!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleSaveAll = () => {
    localStorage.setItem('appSettings', JSON.stringify(settings));
    setSaveMessage('✓ All settings saved successfully!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  return (
    <div className={`space-y-6 animate-fadeIn ${isDarkMode ? 'dark' : ''}`} style={{
      backgroundColor: isDarkMode ? '#1f1f1f' : 'transparent',
      color: isDarkMode ? '#ffffff' : 'inherit'
    }}>
      <div className={`rounded-2xl p-6 shadow-md border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-purple-100'}`}
        style={{ boxShadow: '0 4px 20px rgba(124, 58, 237, 0.08)' }}>
        <h3 className={`text-lg font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>System Configuration</h3>
        
        <div className="space-y-6">
          {/* Theme Selector */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              🎨 Theme
            </label>
            <select 
              value={settings.theme}
              onChange={(e) => handleSettingChange('theme', e.target.value)}
              className={`w-full px-4 py-2 border-2 rounded-lg outline-none transition ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white focus:ring-purple-500' 
                  : 'bg-white border-purple-300 text-gray-900 focus:ring-purple-500'
              } focus:ring-2`}
            >
              <option>Light Purple</option>
              <option>Dark Purple</option>
              <option>Blue</option>
            </select>
          </div>

          {/* Language Selector */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              🌐 Language
            </label>
            <select 
              value={settings.language}
              onChange={(e) => handleSettingChange('language', e.target.value)}
              className={`w-full px-4 py-2 border-2 rounded-lg outline-none transition ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white focus:ring-purple-500' 
                  : 'bg-white border-purple-300 text-gray-900 focus:ring-purple-500'
              } focus:ring-2`}
            >
              <option>English</option>
              <option>Spanish</option>
              <option>French</option>
              <option>Hindi</option>
            </select>
          </div>

          {/* Timezone Selector */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              ⏰ Timezone
            </label>
            <select 
              value={settings.timezone}
              onChange={(e) => handleSettingChange('timezone', e.target.value)}
              className={`w-full px-4 py-2 border-2 rounded-lg outline-none transition ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white focus:ring-purple-500' 
                  : 'bg-white border-purple-300 text-gray-900 focus:ring-purple-500'
              } focus:ring-2`}
            >
              <option>UTC</option>
              <option>IST (India)</option>
              <option>EST</option>
              <option>PST</option>
            </select>
          </div>

          {/* Notification Toggles */}
          <div className={`space-y-3 pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-purple-200'}`}>
            <p className={`text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>🔔 Notifications</p>
            {[
              { key: 'emailNotifications', label: 'Email Notifications' },
              { key: 'weeklyReports', label: 'Weekly Reports' },
              { key: 'alertAnomalies', label: 'Alert on Anomalies' },
            ].map((item) => (
              <label key={item.key} className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings[item.key]}
                  onChange={(e) => handleSettingChange(item.key, e.target.checked)}
                  className="w-4 h-4 rounded accent-purple-600" 
                />
                <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{item.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSaveAll}
        className={`w-full px-6 py-3 rounded-xl transition flex items-center justify-center gap-2 font-semibold ${
          isDarkMode
            ? 'bg-purple-700 text-white hover:bg-purple-600'
            : 'bg-purple-600 text-white hover:bg-purple-700'
        }`}
      >
        <Save size={18} />
        Save All Settings
      </button>

      {/* Save Confirmation Message */}
      {saveMessage && (
        <div className={`rounded-2xl p-6 flex items-center gap-3 ${
          isDarkMode
            ? 'bg-green-900 border border-green-700'
            : 'bg-green-50 border border-green-200'
        }`}>
          <div className="text-2xl">✓</div>
          <p className={`font-semibold ${isDarkMode ? 'text-green-200' : 'text-green-700'}`}>
            {saveMessage}
          </p>
        </div>
      )}

      {/* Dark Mode Indicator */}
      {isDarkMode && (
        <div className={`rounded-2xl p-6 flex items-center gap-3 border ${
          isDarkMode ? 'bg-blue-900 border-blue-700' : 'bg-blue-50 border-blue-200'
        }`}>
          <AlertCircle size={20} className={isDarkMode ? 'text-blue-200' : 'text-blue-700'} />
          <p className={isDarkMode ? 'text-blue-200' : 'text-blue-700'}>
            Dark mode is now active across the application
          </p>
        </div>
      )}
    </div>
  );
};

export default SystemSettings;
