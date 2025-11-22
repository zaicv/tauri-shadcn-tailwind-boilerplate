import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/context/ThemeContext';

const SuperpowersPage = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [superpowers, setSuperpowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleSuperpowerClick = (superpowerKey) => {
    console.log(`🎯 Navigating to /${superpowerKey}`);
    navigate(`/${superpowerKey}`);
  };

  useEffect(() => {
    const fetchSuperpowers = async () => {
      try {
        console.log('🚀 Starting fetch to /api/superpowers...');
        
        const response = await fetch('https://100.83.147.76:8003/api/superpowers');
        console.log('📡 Response received:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          url: response.url
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ HTTP Error:', response.status, response.statusText);
          console.error('❌ Error response body:', errorText);
          throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
        }
        
        // Get the raw response text first to see what we're actually getting
        const responseText = await response.text();
        console.log('📝 Raw response text:', responseText);
        console.log('📝 Response text length:', responseText.length);
        console.log('📝 Response text type:', typeof responseText);
        
        // Try to parse as JSON
        let data;
        try {
          data = JSON.parse(responseText);
          console.log('✅ Data parsed successfully:', data);
        } catch (parseError) {
          console.error('💥 JSON Parse Error:', parseError);
          console.error('💥 Failed to parse this text as JSON:', responseText);
          throw new Error(`Invalid JSON response: ${parseError.message}`);
        }
        console.log('📊 Superpowers found:', data.superpowers?.length || 0);
        
        if (!data.superpowers) {
          console.warn('⚠️ No superpowers array in response');
          setSuperpowers([]);
        } else {
          setSuperpowers(data.superpowers);
          console.log('✅ Superpowers set in state');
        }
        
      } catch (err) {
        console.error('💥 Fetch error occurred:', err);
        console.error('💥 Error type:', err.constructor.name);
        console.error('💥 Error message:', err.message);
        console.error('💥 Full error object:', err);
        setError(`${err.name}: ${err.message}`);
      } finally {
        console.log('🏁 Fetch completed, setting loading to false');
        setLoading(false);
      }
    };

    fetchSuperpowers();
  }, []);

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors ${
        isDark ? "bg-[#212121]" : "bg-gradient-to-br from-blue-50 to-indigo-100"
      }`}>
        <div className={`w-8 h-8 border-2 border-t-transparent rounded-full animate-spin ${
          isDark ? "border-blue-400" : "border-blue-400"
        }`}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors ${
        isDark ? "bg-[#212121]" : "bg-gradient-to-br from-blue-50 to-indigo-100"
      }`}>
        <div className={`backdrop-blur-lg rounded-2xl p-6 border ${
          isDark 
            ? "bg-[#2f2f2f]/80 border-gray-700" 
            : "bg-white/20 border-white/30"
        }`}>
          <div className={`font-medium ${isDark ? "text-red-400" : "text-red-600"}`}>
            <p>Failed to load superpowers</p>
            <p className={`text-sm mt-2 opacity-80 ${isDark ? "text-red-300" : ""}`}>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors ${
      isDark 
        ? "bg-[#212121]" 
        : "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
    }`}>
      {/* Background blur elements */}
      {!isDark && (
        <>
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-purple-200/30 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-indigo-200/20 rounded-full blur-3xl"></div>
        </>
      )}
      
      {/* Content */}
      <div className="relative z-10 px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h1 className={`text-3xl font-bold mb-2 ${isDark ? "text-gray-100" : "text-gray-900"}`}>Superpowers</h1>
            <p className={isDark ? "text-gray-400" : "text-gray-600"}>Discover your available capabilities</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {superpowers.map((power) => (
              <div
                key={power.key}
                onClick={() => handleSuperpowerClick(power.key)}
                className={`backdrop-blur-lg rounded-3xl p-6 border shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer active:scale-[0.98] ${
                  isDark 
                    ? "bg-[#2f2f2f] border-gray-700 hover:bg-[#3a3a3a]" 
                    : "bg-white/20 border-white/30 hover:bg-white/25"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-xl font-semibold ${isDark ? "text-gray-100" : "text-gray-900"}`}>{power.name}</h3>
                  <div className="w-3 h-3 bg-green-400 rounded-full shadow-sm"></div>
                </div>
                
                <div className="space-y-3">
                  {Object.entries(power.intents).map(([key, description], index) => (
                    <div key={key} className="flex items-start space-x-3">
                      <div className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${
                        isDark ? "bg-gray-500" : "bg-gray-400"
                      }`}></div>
                      <div>
                        <p className={`text-sm font-medium capitalize ${
                          isDark ? "text-gray-200" : "text-gray-800"
                        }`}>{key.replace('_', ' ')}</p>
                        <p className={`text-xs leading-relaxed ${
                          isDark ? "text-gray-400" : "text-gray-600"
                        }`}>{description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {superpowers.length === 0 && (
            <div className="text-center py-12">
              <div className={`backdrop-blur-lg rounded-2xl p-8 border inline-block ${
                isDark 
                  ? "bg-[#2f2f2f] border-gray-700" 
                  : "bg-white/20 border-white/30"
              }`}>
                <p className={isDark ? "text-gray-400" : "text-gray-600"}>No superpowers available</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuperpowersPage;