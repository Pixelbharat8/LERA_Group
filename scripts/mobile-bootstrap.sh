#!/usr/bin/env bash
# mobile-bootstrap.sh
#
# Capacitor scaffolds the native iOS and Android projects on demand. Both
# require platform tooling (Xcode + CocoaPods for iOS, Android SDK for
# Android) which can't be installed from a sandboxed agent — but we can
# probe what's already on the machine, run `cap add` for whichever platforms
# are ready, and print a precise checklist for the rest.
#
# Idempotent: re-runs are safe.

set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FRONT="$ROOT/frontend"

cd "$FRONT"

step() { printf '\n=== %s ===\n' "$1"; }
ok()   { printf '  [ok]    %s\n' "$1"; }
warn() { printf '  [skip]  %s\n' "$1"; }

# --- iOS toolchain --------------------------------------------------------
have_xcode=0
have_pod=0
if xcrun --find xcodebuild >/dev/null 2>&1; then
    if xcode-select -p 2>/dev/null | grep -q 'Xcode.app'; then
        have_xcode=1
    fi
fi
if command -v pod >/dev/null 2>&1; then
    have_pod=1
fi

# --- Android toolchain ----------------------------------------------------
have_android=0
if [[ -n "${ANDROID_HOME:-}" && -d "${ANDROID_HOME}" ]] || [[ -n "${ANDROID_SDK_ROOT:-}" && -d "${ANDROID_SDK_ROOT}" ]]; then
    have_android=1
elif command -v sdkmanager >/dev/null 2>&1; then
    have_android=1
fi

step "Toolchain probe"
[[ $have_xcode  -eq 1 ]] && ok "Xcode (full)"      || warn "Xcode not found — install via App Store, then 'sudo xcode-select -s /Applications/Xcode.app/Contents/Developer'"
[[ $have_pod    -eq 1 ]] && ok "CocoaPods"         || warn "CocoaPods missing — 'sudo gem install cocoapods' or 'brew install cocoapods'"
[[ $have_android -eq 1 ]] && ok "Android SDK" || warn "Android SDK missing — install Android Studio and set ANDROID_HOME"

# --- Sync the web bundle so cap add has something to wrap ----------------
if [[ ! -d "$FRONT/out" ]]; then
    mkdir -p "$FRONT/out"
    cat > "$FRONT/out/index.html" <<'HTML'
<!doctype html><meta charset="utf-8"><title>LERA</title><body>Capacitor wrapper bootstrap. Run `npm run mobile:sync` after a real `next build && next export`.</body>
HTML
fi

# --- Capacitor add -------------------------------------------------------
step "Capacitor scaffolding"
if [[ ! -d "$FRONT/ios" ]]; then
    if [[ $have_xcode -eq 1 && $have_pod -eq 1 ]]; then
        npx cap add ios && ok "ios/ added"
    else
        warn "ios/ not added — needs Xcode + CocoaPods"
    fi
else
    ok "ios/ already present"
fi

if [[ ! -d "$FRONT/android" ]]; then
    if [[ $have_android -eq 1 ]]; then
        npx cap add android && ok "android/ added"
    else
        warn "android/ not added — needs Android SDK"
    fi
else
    ok "android/ already present"
fi

# --- Sync once if at least one platform was scaffolded -------------------
if [[ -d "$FRONT/ios" || -d "$FRONT/android" ]]; then
    step "Syncing web bundle into native projects"
    npx cap sync || warn "cap sync failed — that usually means a missing pod install / gradle sync"
fi

step "Branding assets"
if [[ ! -f "$FRONT/public/icons/icon.png" ]]; then
    if (cd "$FRONT" && npm run --silent mobile:icons); then
        ok "icon + splash PNGs generated from icons/*.svg"
    else
        warn "icon generation failed — install deps with 'cd $FRONT && npm i' first"
    fi
else
    ok "icon assets already present"
fi

step "Next steps"
cat <<EOF
- Generate native splash/icons: cd $FRONT && npm run mobile:assets   (after a platform is added)
- Real iOS build:    cd $FRONT && npm run build && npx next export -o out && npx cap sync ios && npx cap open ios
- Real Android build: cd $FRONT && npm run build && npx next export -o out && npx cap sync android && npx cap open android
- For real push:     export LERA_PUSH_ENABLED=true plus APNS_* / FCM_* env vars
                     (see backend/connect_service/src/main/resources/application.properties)
- For Web Push:      set NEXT_PUBLIC_VAPID_PUBLIC_KEY in frontend/.env.local
                     (the matching private key goes into the FCM/web-push backend creds)
EOF
