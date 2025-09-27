# Stripe Test Card Numbers for Payment Testing

## ✅ **Successful Payment Cards**

### Visa
- **Card Number**: `4242424242424242`
- **Expiry**: Any future date (e.g., `12/25`)
- **CVC**: Any 3 digits (e.g., `123`)
- **ZIP**: Any 5 digits (e.g., `12345`)

### Visa (Debit)
- **Card Number**: `4000056655665556`
- **Expiry**: Any future date
- **CVC**: Any 3 digits
- **ZIP**: Any 5 digits

### Mastercard
- **Card Number**: `5555555555554444`
- **Expiry**: Any future date
- **CVC**: Any 3 digits
- **ZIP**: Any 5 digits

### American Express
- **Card Number**: `378282246310005`
- **Expiry**: Any future date
- **CVC**: Any 4 digits (e.g., `1234`)
- **ZIP**: Any 5 digits

## ❌ **Declined Payment Cards**

### Generic Decline
- **Card Number**: `4000000000000002`
- **Result**: Generic decline

### Insufficient Funds
- **Card Number**: `4000000000009995`
- **Result**: Insufficient funds decline

### Lost Card
- **Card Number**: `4000000000009987`
- **Result**: Lost card decline

### Stolen Card
- **Card Number**: `4000000000009979`
- **Result**: Stolen card decline

## 🔄 **Special Behavior Cards**

### Requires Authentication (3D Secure)
- **Card Number**: `4000002500003155`
- **Result**: Requires customer authentication

### Always Requires Authentication
- **Card Number**: `4000002760003184`
- **Result**: Always requires authentication

### Insufficient Funds After Authentication
- **Card Number**: `4000008260003178`
- **Result**: Authenticates successfully but then declines

## 💰 **Amount-Based Testing**

You can test different scenarios by using specific amounts:

- **$0.50** - Succeeds and funds will be added to your available balance
- **$2.00** - Succeeds with a risk_level of elevated
- **$4.00** - Succeeds with a risk_level of highest
- **$84.00** - Results in a dispute (chargeback)
- **$87.00** - Results in a dispute that you lose

## 🌍 **International Cards**

### UK Visa
- **Card Number**: `4000008260000000`
- **Country**: United Kingdom

### Canadian Visa
- **Card Number**: `4000001240000000`
- **Country**: Canada

### Mexican Visa
- **Card Number**: `4000004840000008`
- **Country**: Mexico

## 📱 **Digital Wallets (Test Mode)**

### Apple Pay Test Card
- Use any of the above Visa/Mastercard numbers in Apple Pay test mode

### Google Pay Test Card
- Use any of the above Visa/Mastercard numbers in Google Pay test mode

## 🔧 **Usage Instructions**

1. **Always use test mode**: Ensure your Stripe keys start with `pk_test_` and `sk_test_`
2. **Any future expiry date**: Use any month/year in the future
3. **Any CVC**: Use any valid CVC (3 digits for most cards, 4 for Amex)
4. **Any ZIP code**: Use any 5-digit ZIP code for US cards
5. **Any name**: Use any name on the card

## ⚠️ **Important Notes**

- These cards only work in **test mode**
- Never use real card numbers in test mode
- Test transactions don't charge real money
- All test transactions appear in your Stripe test dashboard
- Webhooks are sent for test transactions just like live ones
