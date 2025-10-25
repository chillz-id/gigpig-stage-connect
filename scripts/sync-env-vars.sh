#!/bin/bash
###############################################################################
# Automated Environment Variable Sync Script
#
# Purpose:
#   Syncs environment variables from .env to GitHub Actions secrets and
#   Vercel environment variables. Ensures consistency across all platforms.
#
# Usage:
#   ./scripts/sync-env-vars.sh                 # Sync all variables
#   DRY_RUN=true ./scripts/sync-env-vars.sh    # Preview changes only
#
# Requirements:
#   - gh CLI (GitHub CLI) authenticated
#   - vercel CLI authenticated or VERCEL_TOKEN in .env
#   - .env file with variables to sync
#
# Environment Variables (in .env):
#   VERCEL_TOKEN - Vercel authentication token
#   VITE_* - Variables to sync to both platforms
#
# Safety:
#   - Dry-run mode to preview changes
#   - Validates authentication before syncing
#   - Clear output showing what was synced
###############################################################################

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
RESET='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$PROJECT_ROOT/.env"
DRY_RUN="${DRY_RUN:-false}"

# Variables to sync (prefix with VITE_ for frontend variables)
SYNC_VARS=(
  "VITE_SUPABASE_URL"
  "VITE_SUPABASE_ANON_KEY"
  "VITE_GOOGLE_MAPS_API_KEY"
  "VITE_APP_URL"
  "VITE_XERO_CLIENT_ID"
  "VITE_XERO_CLIENT_SECRET"
  "VITE_RESEND_API_KEY"
  "VITE_RESEND_FROM_EMAIL"
  "VITE_GOOGLE_CLIENT_ID"
  "VITE_OAUTH_REDIRECT_URL1"
  "VITE_ENVIRONMENT"
  "VITE_GTM_ID"
)

###############################################################################
# Helper Functions
###############################################################################

log_info() {
  echo -e "${CYAN}ℹ️  $1${RESET}"
}

log_success() {
  echo -e "${GREEN}✅ $1${RESET}"
}

log_warn() {
  echo -e "${YELLOW}⚠️  $1${RESET}"
}

log_error() {
  echo -e "${RED}❌ $1${RESET}"
}

log_header() {
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
  echo -e "${BLUE}$1${RESET}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
}

###############################################################################
# Validation
###############################################################################

validate_environment() {
  log_header "Environment Validation"

  # Check .env file exists
  if [ ! -f "$ENV_FILE" ]; then
    log_error ".env file not found at $ENV_FILE"
    exit 1
  fi
  log_success ".env file found"

  # Check gh CLI
  if ! command -v gh &> /dev/null; then
    log_error "gh CLI not found. Install with: brew install gh (macOS) or apt install gh (Ubuntu)"
    exit 1
  fi
  log_success "gh CLI installed"

  # Check gh authentication
  if ! gh auth status &> /dev/null; then
    log_error "gh CLI not authenticated. Run: gh auth login"
    exit 1
  fi
  log_success "gh CLI authenticated"

  # Check vercel CLI
  if ! command -v vercel &> /dev/null; then
    log_error "vercel CLI not found. Install with: npm i -g vercel"
    exit 1
  fi
  log_success "vercel CLI installed"

  # Load VERCEL_TOKEN from .env
  source "$ENV_FILE"
  if [ -z "$VERCEL_TOKEN" ]; then
    log_error "VERCEL_TOKEN not found in .env"
    exit 1
  fi
  log_success "VERCEL_TOKEN loaded"

  # Test Vercel authentication
  if ! vercel whoami --token "$VERCEL_TOKEN" &> /dev/null; then
    log_error "Vercel authentication failed. Check VERCEL_TOKEN in .env"
    exit 1
  fi
  log_success "Vercel CLI authenticated"

  echo ""
}

###############################################################################
# Read Environment Variables
###############################################################################

read_env_vars() {
  log_header "Reading Environment Variables"

  # Source .env file
  source "$ENV_FILE"

  local found_count=0
  local missing_count=0

  for var in "${SYNC_VARS[@]}"; do
    if [ -n "${!var}" ]; then
      log_success "$var found (${#!var} chars)"
      ((found_count++))
    else
      log_warn "$var not found in .env"
      ((missing_count++))
    fi
  done

  echo ""
  log_info "Found: $found_count variables"
  if [ $missing_count -gt 0 ]; then
    log_warn "Missing: $missing_count variables (will be skipped)"
  fi
  echo ""
}

###############################################################################
# Sync to GitHub Actions
###############################################################################

sync_to_github() {
  log_header "Syncing to GitHub Actions Secrets"

  if [ "$DRY_RUN" = "true" ]; then
    log_warn "DRY RUN: Would sync to GitHub Actions"
    for var in "${SYNC_VARS[@]}"; do
      if [ -n "${!var}" ]; then
        echo "  • $var (${#!var} chars)"
      fi
    done
    echo ""
    return
  fi

  local success_count=0
  local skip_count=0

  for var in "${SYNC_VARS[@]}"; do
    if [ -z "${!var}" ]; then
      ((skip_count++))
      continue
    fi

    log_info "Syncing $var to GitHub..."
    if echo "${!var}" | gh secret set "$var" --repo chillz-id/gigpig-stage-connect 2>&1; then
      log_success "$var synced to GitHub"
      ((success_count++))
    else
      log_error "Failed to sync $var to GitHub"
    fi
  done

  echo ""
  log_info "GitHub sync complete: $success_count synced, $skip_count skipped"
  echo ""
}

###############################################################################
# Sync to Vercel
###############################################################################

sync_to_vercel() {
  log_header "Syncing to Vercel Environment Variables"

  if [ "$DRY_RUN" = "true" ]; then
    log_warn "DRY RUN: Would sync to Vercel (production, preview, development)"
    for var in "${SYNC_VARS[@]}"; do
      if [ -n "${!var}" ]; then
        echo "  • $var (${#!var} chars)"
      fi
    done
    echo ""
    return
  fi

  local success_count=0
  local skip_count=0
  local update_count=0

  for var in "${SYNC_VARS[@]}"; do
    if [ -z "${!var}" ]; then
      ((skip_count++))
      continue
    fi

    log_info "Checking $var in Vercel..."

    # Check if variable already exists
    if vercel env ls --token "$VERCEL_TOKEN" 2>&1 | grep -q "^$var "; then
      log_warn "$var already exists in Vercel (skipping, use vercel env rm to update)"
      ((update_count++))
    else
      log_info "Adding $var to Vercel (production, preview, development)..."

      # Add to all three environments
      if echo "${!var}" | vercel env add "$var" production --token "$VERCEL_TOKEN" > /dev/null 2>&1; then
        echo "${!var}" | vercel env add "$var" preview --token "$VERCEL_TOKEN" > /dev/null 2>&1
        echo "${!var}" | vercel env add "$var" development --token "$VERCEL_TOKEN" > /dev/null 2>&1
        log_success "$var added to Vercel (all environments)"
        ((success_count++))
      else
        log_error "Failed to add $var to Vercel"
      fi
    fi
  done

  echo ""
  log_info "Vercel sync complete: $success_count added, $update_count already exist, $skip_count skipped"
  echo ""
}

###############################################################################
# Summary
###############################################################################

show_summary() {
  log_header "Sync Summary"

  if [ "$DRY_RUN" = "true" ]; then
    log_warn "DRY RUN MODE: No changes were made"
    echo ""
    log_info "To apply changes, run without DRY_RUN:"
    echo "  ./scripts/sync-env-vars.sh"
  else
    log_success "Environment variables synced successfully!"
    echo ""
    log_info "Verify GitHub secrets:"
    echo "  gh secret list --repo chillz-id/gigpig-stage-connect"
    echo ""
    log_info "Verify Vercel environment variables:"
    echo "  vercel env ls --token \$VERCEL_TOKEN"
  fi

  echo ""
}

###############################################################################
# Main
###############################################################################

main() {
  echo ""
  log_header "🔄 Environment Variable Sync"
  echo ""

  if [ "$DRY_RUN" = "true" ]; then
    log_warn "🧪 DRY RUN MODE ENABLED"
    echo ""
  fi

  validate_environment
  read_env_vars
  sync_to_github
  sync_to_vercel
  show_summary
}

main "$@"
