// Debug script to check what datasets are available
const debugDatasets = async () => {
  try {
    const response = await fetch('https://dynamic-llama-988.convex.site/debug/datasets', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const result = await response.json();
    console.log('Available datasets:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Debug failed:', error);
  }
};

debugDatasets();
