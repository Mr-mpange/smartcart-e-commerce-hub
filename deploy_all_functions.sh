#!/bin/bash

echo "🚀 Deploying All Edge Functions to Supabase"
echo "Project: qpojzblbodlphwzfpxbi"
echo ""

echo "📋 Make sure you have:"
echo "- Supabase CLI installed"
echo "- Logged in with: supabase login"
echo "- Environment variables set in Supabase dashboard"
echo ""

read -p "Press Enter to continue..."

echo "🔧 Deploying briq-sms (Priority - OTP System)..."
if ! supabase functions deploy briq-sms --project-ref qpojzblbodlphwzfpxbi; then
    echo "❌ briq-sms deployment failed"
    exit 1
fi
echo "✅ briq-sms deployed successfully"
echo ""

echo "💳 Deploying Payment Functions..."
supabase functions deploy create-payment-link --project-ref qpojzblbodlphwzfpxbi
supabase functions deploy snippe-payment --project-ref qpojzblbodlphwzfpxbi
supabase functions deploy snippe-webhook --project-ref qpojzblbodlphwzfpxbi
supabase functions deploy zenopay-payment --project-ref qpojzblbodlphwzfpxbi
supabase functions deploy zenopay-webhook --project-ref qpojzblbodlphwzfpxbi
supabase functions deploy tembo-webhook --project-ref qpojzblbodlphwzfpxbi
supabase functions deploy tembo-payout --project-ref qpojzblbodlphwzfpxbi
echo "✅ Payment functions deployed"
echo ""

echo "🔄 Deploying Other Functions..."
supabase functions deploy auto-release-escrow --project-ref qpojzblbodlphwzfpxbi
echo "✅ Other functions deployed"
echo ""

echo "📋 Listing all deployed functions..."
supabase functions list --project-ref qpojzblbodlphwzfpxbi
echo ""

echo "🎉 All functions deployed successfully!"
echo ""
echo "🧪 Next steps:"
echo "1. Test OTP system: Open test_consolidated_otp.html in browser"
echo "2. Check function logs: supabase functions logs briq-sms --project-ref qpojzblbodlphwzfpxbi"
echo "3. Test login in the web app"
echo ""