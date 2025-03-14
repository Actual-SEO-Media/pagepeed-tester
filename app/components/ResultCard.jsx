'use client';

export default function ResultCard({ result }) {
  // Add check for undefined result
  if (!result) {
    return (
      <div className="border rounded p-4 bg-yellow-50 border-yellow-200">
        <p className="text-yellow-600">No result data available</p>
      </div>
    );
  }
  
  const {
    url,
    data,
    error,
    strategy = 'Desktop' // Default to mobile if not provided
  } = result;
  
  if (error) {
    return (
      <div className="border rounded p-4 bg-red-50 border-red-200">
        <h3 className="font-semibold text-lg mb-2 break-words">{url}</h3>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }
  
  // Check if data and required properties exist to avoid errors
  if (!data || !data.lighthouseResult || !data.lighthouseResult.categories) {
    return (
      <div className="border rounded p-4 bg-yellow-50 border-yellow-200">
        <h3 className="font-semibold text-lg mb-2 break-words">{url}</h3>
        <p className="text-yellow-600">Invalid or incomplete response data</p>
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
    if (!audits[auditId]) return 'text-gray-600';
    const score = audits[auditId].score;
    if (score >= 0.9) return 'text-green-600';
    if (score >= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  return (
    <div className="border rounded p-4 bg-white shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-lg break-words">{url}</h3>
        <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-800">
          {strategy === 'mobile' ? 'Mobile' : 'Desktop'}
        </span>
      </div>
      
      {/* Main scores */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="p-2">
          <div className="text-sm text-gray-600">Performance</div>
          <div className={`font-bold text-xl ${getScoreColor(scores.performance)}`}>
            {Math.round(scores.performance)}
          </div>
        </div>
        <div className="p-2">
          <div className="text-sm text-gray-600">Accessibility</div>
          <div className={`font-bold text-xl ${getScoreColor(scores.accessibility)}`}>
            {Math.round(scores.accessibility)}
          </div>
        </div>
        <div className="p-2">
          <div className="text-sm text-gray-600">Best Practices</div>
          <div className={`font-bold text-xl ${getScoreColor(scores.bestPractices)}`}>
            {Math.round(scores.bestPractices)}
          </div>
        </div>
        <div className="p-2">
          <div className="text-sm text-gray-600">SEO</div>
          <div className={`font-bold text-xl ${getScoreColor(scores.seo)}`}>
            {Math.round(scores.seo)}
          </div>
        </div>
      </div>
      
      {/* Core Web Vitals section */}
      <div className="mt-4 border-t pt-3">
        <h4 className="text-md font-semibold mb-2">Core Web Vitals</h4>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <span className="text-gray-600">LCP: </span>
            <span className={getVitalClass('largest-contentful-paint')}>{webVitals.lcp}</span>
          </div>
          <div>
            <span className="text-gray-600">FID: </span>
            <span className={getVitalClass('max-potential-fid')}>{webVitals.fid}</span>
          </div>
          <div>
            <span className="text-gray-600">CLS: </span>
            <span className={getVitalClass('cumulative-layout-shift')}>{webVitals.cls}</span>
          </div>
          <div>
            <span className="text-gray-600">FCP: </span>
            <span className={getVitalClass('first-contentful-paint')}>{webVitals.fcp}</span>
          </div>
          <div>
            <span className="text-gray-600">TTI: </span>
            <span className={getVitalClass('interactive')}>{webVitals.tti}</span>
          </div>
          <div>
            <span className="text-gray-600">TBT: </span>
            <span className={getVitalClass('total-blocking-time')}>{webVitals.tbt}</span>
          </div>
          <div>
            <span className="text-gray-600">Speed Index: </span>
            <span className={getVitalClass('speed-index')}>{webVitals.si}</span>
          </div>
        </div>
      </div>
      
      <a 
        href={`https://developers.google.com/speed/pagespeed/insights/?url=${encodeURIComponent(url)}&strategy=${strategy}`}
        target="_blank"
        rel="noopener noreferrer"
        className="block mt-4 text-center text-sm text-blue-600 hover:underline"
      >
        View Full Report
      </a>
    </div>
  );
}