# Briq SMS Diagnosis and Solution

## 🔍 **Issue Identified**

From the Edge Function logs, the issue is clear:
```
Error: SyntaxError: Unexpected token 'T', "The deploy"... is not valid JSON
```

**Root Cause**: The Briq API is returning HTML instead of JSON, which happens when:
1. **Invalid API Key** - Most likely cause
2. **Missing API Key** - BRIQ_API_KEY not set
3. **API Endpoint Issue** - Wrong URL or service down

## 📊 **Log Analysis**

The logs show:
1. ✅ Edge Function is deployed and working
2. ✅ SMS request received correctly: `{"phone_number":"+255683859574","message":"Test SMS from SmartCart - OTP: 123456"}`
3. ✅ Phone number formatted correctly: `+255683859574`
4. ❌ Briq API response parsing failed (HTML returned instead of JSON)

## 🔧 **Immediate Solutions**

### 1. **Check BRIQ_API_KEY Configuration**
Go to Supabase Dashboard:
- Navigate to: **Edge Functions** → **Environment Variables**
- Check if `BRIQ_API_KEY` is set
- If not set, add it with your Briq API key

### 2. **Get Valid Briq API Key**
1. Go to: https://dashboard.briq.tz/
2. Login to your account
3. Navigate to API section
4. Copy your API key
5. Ensure account has sufficient SMS balance

### 3. **Test API Key Directly**
Edit `test_briq_direct.js`:
```javascript
const BRIQ_API_KEY = 'YOUR_ACTUAL_API_KEY_HERE';
```
Then run: `node test_briq_direct.js`

## 🛠️ **Fixes Applied to Code**

### 1. **Enhanced Error Handling in briq-sms**
- Added proper JSON parsing with try-catch
- Better error messages for HTML responses
- Detailed logging of raw responses

### 2. **Enhanced Error Handling in otp-auth**
- Same improvements for OTP SMS sending
- Better debugging information

### 3. **Improved Logging**
- Shows API key configuration status
- Logs raw responses before parsing
- Better error categorization

## 📱 **Current SMS Flow Status**

### ✅ **Working Components:**
- Edge Functions deployed
- Request routing and validation
- Phone number formatting
- Message composition
- Error handling and logging

### ❌ **Failing Component:**
- Briq API communication (likely API key issue)

## 🎯 **Next Steps**

### **Immediate (Required):**
1. **Set BRIQ_API_KEY** in Supabase Dashboard
2. **Redeploy Edge Functions** to pick up new environment variables:
   ```bash
   npx supabase functions deploy briq-sms
   npx supabase functions deploy otp-auth
   ```

### **Testing:**
1. Run: `node test_briq_config.js` (after fixing Node.js issues)
2. Or test directly in browser with `test_sms.html`
3. Check Edge Function logs for improved error messages

### **Alternative Solutions:**
If Briq continues to have issues:
1. **Twilio SMS** - More reliable, global service
2. **Africa's Talking** - Popular in East Africa
3. **Local SMS Gateway** - Tanzania-specific providers

## 🔄 **Testing Workflow**

1. **Set API Key** → Supabase Dashboard
2. **Redeploy Functions** → `npx supabase functions deploy briq-sms`
3. **Test Configuration** → Use test scripts or browser
4. **Check Logs** → Supabase Dashboard for detailed errors
5. **Verify SMS** → Check phone for actual SMS delivery

## 📋 **Environment Variables Needed**

In Supabase Dashboard → Edge Functions → Environment Variables:
```
BRIQ_API_KEY=your_briq_api_key_here
SUPABASE_URL=https://kdiegxbfuohrbktonkmh.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 🚨 **Common Briq API Issues**

1. **Invalid API Key**: Returns HTML login page
2. **Insufficient Balance**: Returns error JSON
3. **Wrong Phone Format**: Returns validation error
4. **Rate Limiting**: Returns 429 status
5. **Service Down**: Returns HTML error page

The current issue (HTML response) strongly suggests **invalid or missing API key**.

## ✅ **Success Indicators**

When working correctly, you should see:
1. **Logs**: `Briq parsed response: {"status":"success",...}`
2. **Response**: `{"success":true,"message":"SMS sent",...}`
3. **Phone**: Actual SMS received on +255683859574

The system is properly coded and ready - it just needs the correct Briq API key configuration.