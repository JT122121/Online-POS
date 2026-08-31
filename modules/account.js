// Account & Subscription (Supabase Auth + profiles/redemption_codes).
// This is the live site's ONLY Premium mechanism now - sign in with Google
// (or any other provider enabled in the Supabase dashboard), start on the
// free tier, redeem a code to unlock Premium. Replaces the old Google
// Sheet + Apps Script code-entry system entirely (see CLAUDE.md).
// The offline package keeps its own separate, network-free local-code
// mechanism - see the OFFLINE-SWAP:PREMIUM-PANEL/PREMIUM-ACTIVATION
// markers in app.html and modules/offline-builder.js.
const SUPABASE_URL = "https://kimaefdizuvkxzvttzhh.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_n3YJh5yBQkzNg-xv6OgeoQ_f_owgu-9";

let supabaseClient = null;
let currentUser = null;
let currentProfile = null;

function getSupabaseClient() {
  if (!supabaseClient && window.supabase && typeof window.supabase.createClient === "function") {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabaseClient;
}

function isProfilePremium(profile) {
  return !!(profile && profile.premium_until && new Date(profile.premium_until) > new Date());
}

async function fetchOrCreateProfile(userId, email) {
  const client = getSupabaseClient();
  let res = await client.from("profiles").select("*").eq("user_id", userId).maybeSingle();
  if (res.error) throw res.error;
  if (res.data) return res.data;

  // Defensive fallback only - handle_new_user() in supabase/schema.sql
  // normally provisions this row automatically on sign-in.
  const insertRes = await client.from("profiles").insert({ user_id: userId, email: email || "" }).select().maybeSingle();
  if (insertRes.error) throw insertRes.error;
  return insertRes.data;
}

async function lazyExpireProfileIfStale(profile) {
  if (profile && profile.subscription_status === "premium" && !isProfilePremium(profile)) {
    const client = getSupabaseClient();
    await client.from("profiles").update({ subscription_status: "free" }).eq("user_id", profile.user_id);
    profile.subscription_status = "free";
  }
  return profile;
}

async function refreshAccountState() {
  const client = getSupabaseClient();
  if (!client) { premiumUnlocked = false; renderAccountPanel(); return; }
  const { data } = await client.auth.getSession();
  const session = data && data.session;
  currentUser = (session && session.user) || null;

  if (!currentUser) {
    currentProfile = null;
    premiumUnlocked = false;
    renderAccountPanel();
    if (typeof applyPremiumLocks === "function") applyPremiumLocks();
    return;
  }

  try {
    let profile = await fetchOrCreateProfile(currentUser.id, currentUser.email);
    profile = await lazyExpireProfileIfStale(profile);
    currentProfile = profile;
    premiumUnlocked = isProfilePremium(profile);
  } catch (e) {
    console.error("Failed to load account profile:", e);
    currentProfile = null;
    premiumUnlocked = false;
  }
  lastActivityWriteTime = 0;
  await recordActivity();
  renderAccountPanel();
  if (typeof applyPremiumLocks === "function") applyPremiumLocks();
}

async function initAccount() {
  const client = getSupabaseClient();
  if (!client) return;
  client.auth.onAuthStateChange(function() { refreshAccountState(); });
  await refreshAccountState();
  initInactivityLogout();
}

// Auto sign-out after 8 hours of inactivity - enforces Premium
// re-verification rather than letting a signed-in tab stay open
// indefinitely as a way around it. Only ever active while signed in;
// harmless no-ops otherwise.
const INACTIVITY_LOGOUT_MS = 8 * 60 * 60 * 1000;
const INACTIVITY_CHECK_INTERVAL_MS = 60 * 1000;
let inactivityCheckTimer = null;
let lastActivityWriteTime = 0;

async function recordActivity() {
  if (!currentUser) return;
  const now = Date.now();
  if (now - lastActivityWriteTime < 60 * 1000) return;
  lastActivityWriteTime = now;
  await storageSet("account-last-activity", String(now));
}

async function checkInactivityLogout() {
  if (!currentUser) return;
  const stored = await storageGet("account-last-activity");
  const lastActivity = stored ? parseInt(stored, 10) : NaN;
  if (!lastActivity || isNaN(lastActivity)) {
    await recordActivity();
    return;
  }
  if (Date.now() - lastActivity >= INACTIVITY_LOGOUT_MS) {
    await signOutAccount();
  }
}

function initInactivityLogout() {
  if (inactivityCheckTimer) return;
  ["mousedown", "keydown", "touchstart", "scroll"].forEach(function(evt) {
    document.addEventListener(evt, recordActivity, { passive: true });
  });
  inactivityCheckTimer = setInterval(checkInactivityLogout, INACTIVITY_CHECK_INTERVAL_MS);
}

function accountShowError(text) {
  const box = document.getElementById("accountError");
  if (box) { box.textContent = text; box.classList.remove("hidden"); }
}
function accountClearError() {
  const box = document.getElementById("accountError");
  if (box) box.classList.add("hidden");
}

async function signInWithGoogle() {
  const client = getSupabaseClient();
  if (!client) { accountShowError(tr("accountErrorText")); return; }
  accountClearError();
  const { error } = await client.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.href }
  });
  if (error) { console.error("Sign-in failed:", error); accountShowError(tr("accountErrorText")); }
}

async function signOutAccount() {
  const client = getSupabaseClient();
  if (!client) return;
  await client.auth.signOut();
  currentUser = null;
  currentProfile = null;
  premiumUnlocked = false;
  renderAccountPanel();
  if (typeof applyPremiumLocks === "function") applyPremiumLocks();
}

function formatPremiumUntil(iso) {
  const d = new Date(iso);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return d.getDate() + " " + months[d.getMonth()] + " " + d.getFullYear();
}

function renderWelcomeBadge() {
  const subtitleEl = document.getElementById("appSubtitle");
  const welcomeEl = document.getElementById("accountWelcomeBadge");
  const textEl = document.getElementById("accountWelcomeText");
  if (!welcomeEl || !textEl || !subtitleEl) return;
  if (!currentUser) {
    welcomeEl.classList.add("hidden");
    subtitleEl.classList.remove("hidden");
    return;
  }
  const name = (currentUser.user_metadata && (currentUser.user_metadata.full_name || currentUser.user_metadata.name)) || currentUser.email;
  const statusLabel = premiumUnlocked ? tr("premiumBadgeLabel") : tr("basicBadgeLabel");
  textEl.textContent = tr("accountWelcomeLabel") + " " + name + " · " + statusLabel;
  welcomeEl.classList.remove("hidden");
  subtitleEl.classList.add("hidden");
}

function renderAccountPanel() {
  renderWelcomeBadge();
  const signedOut = document.getElementById("accountSignedOut");
  const signedIn = document.getElementById("accountSignedIn");
  if (!signedOut || !signedIn) return;

  const isSignedIn = !!currentUser;
  signedOut.classList.toggle("hidden", isSignedIn);
  signedIn.classList.toggle("hidden", !isSignedIn);
  if (!isSignedIn) return;

  const emailEl = document.getElementById("accountEmail");
  if (emailEl) emailEl.textContent = currentUser.email || "";

  const isPremium = isProfilePremium(currentProfile);
  const freeBox = document.getElementById("accountStatusFree");
  const premiumBox = document.getElementById("accountStatusPremium");
  if (freeBox) freeBox.classList.toggle("hidden", isPremium);
  if (premiumBox) premiumBox.classList.toggle("hidden", !isPremium);
  const untilEl = document.getElementById("accountPremiumUntil");
  if (untilEl) untilEl.textContent = isPremium ? ("(" + formatPremiumUntil(currentProfile.premium_until) + ")") : "";
}

async function redeemCodeNow() {
  const client = getSupabaseClient();
  const input = document.getElementById("redeemCodeInput");
  const errorBox = document.getElementById("redeemCodeError");
  const successBox = document.getElementById("redeemCodeSuccess");
  const btn = document.getElementById("redeemCodeButton");
  if (!client || !input) return;

  errorBox.classList.add("hidden");
  successBox.classList.add("hidden");
  const code = input.value.trim();
  if (!code) { errorBox.textContent = tr("redeemCodeInvalid"); errorBox.classList.remove("hidden"); return; }

  btn.disabled = true;
  try {
    const { data, error } = await client.rpc("redeem_code", { p_code: code });
    if (error) throw error;
    if (data && data.success) {
      input.value = "";
      successBox.textContent = tr("redeemCodeSuccess");
      successBox.classList.remove("hidden");
      trackEvent("code_redeemed", {});
      await refreshAccountState();
    } else {
      const reason = data && data.reason;
      const key = reason === "already_used" ? "redeemCodeAlreadyUsed" : "redeemCodeInvalid";
      errorBox.textContent = tr(key);
      errorBox.classList.remove("hidden");
    }
  } catch (e) {
    console.error("Redeem failed:", e);
    errorBox.textContent = tr("redeemCodeNetworkError");
    errorBox.classList.remove("hidden");
  } finally {
    btn.disabled = false;
  }
}
