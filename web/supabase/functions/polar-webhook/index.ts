import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req: Request) => {
    try {
        const body = await req.json();
        const { type, data } = body;

        // Polar Webhook: process only paid orders for license issuance
        if (type === 'order.paid') {
            const email = data.customer_email || data.user?.email || data.customer?.email;
            const productId = data.product_id || data.product?.id || data.product?.product_id;
            const orderId = data.id || data.order_id || null;
            const customerId = data.customer_id || data.customer?.id || null;
            const paidAmountCents = Number.isFinite(Number(data.total_amount)) ? Number(data.total_amount) : null;
            const paidCurrency = typeof data.currency === 'string' ? String(data.currency).toUpperCase() : null;
            const monthlyProductId = Deno.env.get('POLAR_PRODUCT_PRO_ID');
            const lifetimeProductId = Deno.env.get('POLAR_PRODUCT_LIFETIME_ID');

            const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

            if (!normalizedEmail || !orderId) {
                return new Response(JSON.stringify({ error: 'Missing required fields: email or orderId' }), { status: 400 });
            }

            let productType: 'monthly' | 'lifetime' = 'lifetime';
            if (monthlyProductId && productId === monthlyProductId) {
                productType = 'monthly';
            } else if (lifetimeProductId && productId === lifetimeProductId) {
                productType = 'lifetime';
            } else if (typeof data.product_name === 'string' && data.product_name.toLowerCase().includes('month')) {
                productType = 'monthly';
            }

            const expiresAt = productType === 'lifetime'
                ? '9999-12-31T23:59:59Z'
                : new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString();

            // 1. Find or create profile (Auth is usually separate, but we ensure DB entry)
            // Note: Realistically, we find user by email since they should have logged in with Google first.
            const { data: profileRows, error: profileError } = await supabase
                .from('profiles')
                .select('id,email')
                .ilike('email', normalizedEmail)
                .limit(5);

            if (profileError) {
                console.error('Profile lookup error:', profileError.message);
                return new Response(JSON.stringify({ error: `Profile lookup failed: ${profileError.message}` }), { status: 500 });
            }

            if (!profileRows || profileRows.length === 0) {
                console.error('User profile not found for email:', normalizedEmail);
                return new Response(JSON.stringify({ error: `User not found for email: ${normalizedEmail}` }), { status: 404 });
            }

            if (profileRows.length > 1) {
                console.warn('Multiple profiles matched email. Using first row:', normalizedEmail);
            }

            const profile = profileRows[0];

            // 2. Idempotency guard: if already created for this order, return existing key
            const { data: existingLicense, error: existingLicenseError } = await supabase
                .from('licenses')
                .select('license_key')
                .eq('polar_order_id', orderId)
                .maybeSingle();

            if (existingLicenseError) throw existingLicenseError;
            if (existingLicense?.license_key) {
                return new Response(JSON.stringify({ success: true, licenseKey: existingLicense.license_key, existing: true }), {
                    headers: { 'Content-Type': 'application/json' },
                });
            }

            // 3. Generate specialized license key
            const licenseKey = `VL-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

            // 4. Insert into licenses table
            const { error: licenseError } = await supabase
                .from('licenses')
                .upsert({
                    user_id: profile.id,
                    license_key: licenseKey,
                    status: 'active',
                    product_type: productType,
                    expires_at: expiresAt,
                    user_email: normalizedEmail,
                    polar_order_id: orderId,
                    polar_product_id: productId || null,
                    polar_customer_id: customerId,
                    paid_amount_cents: paidAmountCents,
                    paid_currency: paidCurrency,
                    source: 'polar'
                }, {
                    onConflict: 'polar_order_id'
                });

            if (licenseError) throw licenseError;

            return new Response(JSON.stringify({ success: true, licenseKey }), {
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Optional: if refund events are connected, deactivate related license
        if (type === 'order.refunded') {
            const orderId = data.id || data.order_id || null;
            if (!orderId) {
                return new Response(JSON.stringify({ message: 'Refund event without order id' }), { status: 200 });
            }

            const { data: refundedLicenses, error: refundedLicenseFetchError } = await supabase
                .from('licenses')
                .select('id')
                .eq('polar_order_id', orderId);

            if (refundedLicenseFetchError) throw refundedLicenseFetchError;

            const licenseIds = (refundedLicenses ?? []).map((license) => license.id);

            const { error: refundUpdateError } = await supabase
                .from('licenses')
                .update({
                    status: 'refunded',
                    expires_at: new Date().toISOString(),
                })
                .eq('polar_order_id', orderId);

            if (refundUpdateError) throw refundUpdateError;

            let deactivatedCount = 0;
            if (licenseIds.length > 0) {
                const { data: deactivatedRows, error: activationDeactivateError } = await supabase
                    .from('license_activations')
                    .update({
                        deactivated_at: new Date().toISOString(),
                        deactivated_reason: 'order_refunded',
                    })
                    .in('license_id', licenseIds)
                    .is('deactivated_at', null)
                    .select('id');

                if (activationDeactivateError) throw activationDeactivateError;
                deactivatedCount = deactivatedRows?.length ?? 0;
            }

            return new Response(JSON.stringify({
                success: true,
                refundedOrderId: orderId,
                deactivatedActivations: deactivatedCount,
            }), {
                headers: { 'Content-Type': 'application/json' },
            });
        }

        return new Response(JSON.stringify({ message: 'Ignored event' }), { status: 200 });
    } catch (err) {
        console.error('Webhook error:', err);
        const message = err instanceof Error ? err.message : 'Unknown webhook error';
        return new Response(JSON.stringify({ error: message }), { status: 400 });
    }
});
