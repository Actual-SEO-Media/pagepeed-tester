'use client';

export default function ResultCard({ result }) {
  if (!result) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-5 shadow-sm">
        <p className="text-sm text-gray-500">No result data available</p>
      </div>
    );
  }
  
  const {
    url,
    data,
    error,
    strategy = 'Desktop' // Default to Desktop if not provided
  } = result;
  
  if (error) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-5 shadow-sm">
        <h3 className="mb-3 break-words text-sm font-medium text-gray-900">{url}</h3>
        <div className="rounded-md bg-red-50 p-3">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      </div>
    );
  }
  
  // Check if data and required properties exist to avoid errors
  if (!data || !data.lighthouseResult || !data.lighthouseResult.categories) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-5 shadow-sm">
        <h3 className="mb-3 break-words text-sm font-medium text-gray-900">{url}</h3>
        <div className="rounded-md bg-amber-50 p-3">
          <p className="text-sm text-amber-500">Invalid or incomplete response data</p>
        </div>
      </div>
    );
  }
  
  // Safely extract scores with fallbacks to prevent errors
  const categories = data.lighthouseResult.categories;
  const scores = {
    performance: categories.performance?.score ? categories.performance.score * 100 : 0,
    accessibility: categories.accessibility?.score ? categories.accessibility.score * 100 : 0,
    bestPractices: categories['best-practices']?.score ? categories['best-practices'].score * 100 : 0,
    seo: categories.seo?.score ? categories.seo.score * 100 : 0
  };
  
  // Extract Core Web Vitals metrics
  const audits = data.lighthouseResult.audits || {};
  
  // Get Core Web Vitals metrics
  const webVitals = {
    lcp: audits['largest-contentful-paint']?.displayValue || 'N/A',
    fid: audits['max-potential-fid']?.displayValue || 'N/A',
    cls: audits['cumulative-layout-shift']?.displayValue || 'N/A',
    fcp: audits['first-contentful-paint']?.displayValue || 'N/A',
    tti: audits['interactive']?.displayValue || 'N/A',
    tbt: audits['total-blocking-time']?.displayValue || 'N/A',
    si: audits['speed-index']?.displayValue || 'N/A'
  };

  // Get numeric values and assess performance
  const getVitalClass = (auditId) => {
    if (!audits[auditId]) return 'text-gray-400';
    const score = audits[auditId].score;
    if (score >= 0.9) return 'text-emerald-600';
    if (score >= 0.5) return 'text-amber-500';
    return 'text-rose-500';
  };
  
  const getScoreColor = (score) => {
    if (score >= 90) return 'text-emerald-600';
    if (score >= 50) return 'text-amber-500';
    return 'text-rose-500';
  };

  const getScoreBg = (score) => {
    if (score >= 90) return 'bg-emerald-50';
    if (score >= 50) return 'bg-amber-50';
    return 'bg-rose-50';
  };
  
  return (
    <div className="overflow-hidden rounded-sm border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md">
      <div className="px-5 pt-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="break-words text-sm font-medium text-gray-900">{url}</h3>
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
            {strategy === 'mobile' ? 'Mobile' : 'Desktop'}
          </span>
        </div>
        
        {/* Main scores */}
        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
          {Object.entries(scores).map(([key, score]) => (
            <div key={key} className="flex flex-col">
              <span className="text-xs font-medium text-gray-500 whitespace-nowrap">
                {key === 'bestPractices' ? 'Best Practices' : key.charAt(0).toUpperCase() + key.slice(1)}
              </span>
              <div className="mt-1">
                <span className={`text-xl font-semibold ${getScoreColor(score)}`}>
                  {Math.round(score)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Core Web Vitals section */}
      <div className="mt-4 border-t border-gray-100">
        <div className="px-5 py-3">
          <h4 className="mb-2 text-xs font-medium uppercase text-gray-500">Core Web Vitals</h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
            {Object.entries(webVitals).map(([key, value]) => (
              <div key={key} className="flex items-center">
                <span className="text-xs font-medium text-gray-500">{key.toUpperCase()}: </span>
                <span className={`ml-1 text-xs ${getVitalClass(`${key === 'lcp' ? 'largest-contentful-paint' : 
                                      key === 'fid' ? 'max-potential-fid' : 
                                      key === 'cls' ? 'cumulative-layout-shift' : 
                                      key === 'fcp' ? 'first-contentful-paint' : 
                                      key === 'tti' ? 'interactive' : 
                                      key === 'tbt' ? 'total-blocking-time' : 
                                      'speed-index'}`)}`}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="border-t border-gray-100 bg-gray-50 px-5 py-3">
        <a 
          href={`https://developers.google.com/speed/pagespeed/insights/?url=${encodeURIComponent(url)}&strategy=${strategy}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center text-xs font-medium text-blue-500 transition-colors hover:text-blue-600"
        >
          View Full Report
        </a>
      </div>
    </div>
  );
}