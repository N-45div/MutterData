// Test script to verify email analysis endpoint works
const testEmailAnalysis = async () => {
  const testPayload = {
    message: {
      toolCallList: [{
        id: "test-email-123",
        function: {
          arguments: {
            analysis_type: "summary"
            // No email_address - should auto-detect
          }
        }
      }]
    }
  };

  try {
    console.log('Testing email analysis endpoint...');
    console.log('Payload:', JSON.stringify(testPayload, null, 2));
    
    const response = await fetch('https://dynamic-llama-988.convex.site/vapi/email-analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    });

    const result = await response.json();
    console.log('Email analysis response:', JSON.stringify(result, null, 2));
    console.log('Status:', response.status);
  } catch (error) {
    console.error('Email analysis test failed:', error);
  }
};

testEmailAnalysis();
