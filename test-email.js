// Test script to verify email endpoint works
const testEmailEndpoint = async () => {
  const testPayload = {
    message: {
      toolCallList: [{
        id: "test-call-123",
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
    const response = await fetch('https://dynamic-llama-988.convex.site/vapi/email-analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    });

    const result = await response.json();
    console.log('Email endpoint response:', result);
  } catch (error) {
    console.error('Email endpoint test failed:', error);
  }
};

testEmailEndpoint();
