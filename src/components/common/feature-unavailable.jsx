const FeatureUnavailable = () => (
  <div className="flex items-center justify-center min-h-[60vh] bg-[#0d1117]">
    <div className="text-center">
      <div className="text-4xl mb-4">🚧</div>
      <div className="text-xl text-gray-400 mb-2">Feature Temporarily Unavailable</div>
      <div className="text-gray-500 mb-6">This feature is currently being optimized and will be available soon.</div>
      <button
        onClick={() => window.history.back()}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Go Back
      </button>
    </div>
  </div>
);

export default FeatureUnavailable;