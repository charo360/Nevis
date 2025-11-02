async function main() {
  const payload = {
    revoModel: 'revo-1.0',
    platform: 'instagram',
    brandProfile: {
      businessName: 'Paya',
      businessType: 'Financial Technology',
      location: 'Nairobi, Kenya',
      primaryColor: '#E4574C',
      accentColor: '#2A2A2A',
      backgroundColor: '#FFFFFF',
      services: 'Digital Banking\nPayment Solutions\nBuy Now Pay Later',
      keyFeatures: 'No credit checks\nQuick setup\nMobile app',
      competitiveAdvantages: 'Financial inclusivity\nUniversally accessible banking',
      targetAudience: 'small businesses'
    },
    brandConsistency: {
      includeContacts: false,
      followBrandColors: true
    }
  };

  try {
    const res = await fetch('http://localhost:3001/api/quick-content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Body:', text);
  } catch (err) {
    console.error(err);
  }
}

main();
