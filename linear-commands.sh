#!/bin/bash

# Stand Up Sydney Linear Integration Commands
# Generated automatically - review before executing

# Create teams
echo "Creating team: Frontend Development"
# linear team create --key "FRONTEND" --name "Frontend Development" --description "React/TypeScript UI development, components, and user experience"

echo "Creating team: Backend Development"
# linear team create --key "BACKEND" --name "Backend Development" --description "Supabase, APIs, database operations, and server-side logic"

echo "Creating team: Testing & QA"
# linear team create --key "TESTING" --name "Testing & QA" --description "Test automation, quality assurance, and performance testing"

echo "Creating team: Infrastructure"
# linear team create --key "INFRA" --name "Infrastructure" --description "DevOps, deployment, monitoring, and system administration"

echo "Creating team: Integration & Automation"
# linear team create --key "INTEGRATION" --name "Integration & Automation" --description "MCP servers, N8N workflows, webhooks, and third-party integrations"

# Create projects
echo "Creating project: Platform Overhaul"
# linear project create --name "Platform Overhaul" --description "Complete modernization of Stand Up Sydney platform"

echo "Creating project: MCP Integration"
# linear project create --name "MCP Integration" --description "15 MCP server integration and management"

echo "Creating project: Knowledge Graph"
# linear project create --name "Knowledge Graph" --description "AI-powered knowledge management and session tracking"

echo "Creating project: Production Systems"
# linear project create --name "Production Systems" --description "Deployment, monitoring, and production maintenance"

# Create issues
echo "Creating issue: Fix Google Authentication System"
# linear issue create --title "Fix Google Authentication System" --description "Resolve authentication issues preventing user registration and login" --priority "Critical" --team "BACKEND"

echo "Creating issue: Resolve Event Creation Authentication Error"
# linear issue create --title "Resolve Event Creation Authentication Error" --description "Fix 'Authentication Required' error when publishing events" --priority "Critical" --team "FRONTEND"

echo "Creating issue: Restore Google Maps Integration"
# linear issue create --title "Restore Google Maps Integration" --description "Fix broken Google Maps component in event creation form" --priority "Critical" --team "FRONTEND"

echo "Creating issue: Enhanced Comedian Profile System"
# linear issue create --title "Enhanced Comedian Profile System" --description "Redesign comedian profiles with media galleries, performance history, availability calendar, and booking rates" --priority "High Priority" --team "FRONTEND"

echo "Creating issue: Photographer Profile Management"
# linear issue create --title "Photographer Profile Management" --description "Create dedicated photographer profiles with portfolio galleries, equipment lists, and booking system" --priority "High Priority" --team "FRONTEND"

echo "Creating issue: Advanced Event Management Dashboard"
# linear issue create --title "Advanced Event Management Dashboard" --description "Comprehensive event creation and management interface with lineup builder and promotional tools" --priority "High Priority" --team "FRONTEND"

echo "Creating issue: Smart Application Review System"
# linear issue create --title "Smart Application Review System" --description "AI-assisted application review with scoring, bulk actions, and automated responses" --priority "High Priority" --team "FRONTEND"

echo "Creating issue: Humanitix-Notion Integration Maintenance"
# linear issue create --title "Humanitix-Notion Integration Maintenance" --description "Maintain and monitor Humanitix data sync to Notion database" --priority "Medium Priority" --team "INTEGRATION"

echo "Creating issue: Linear MCP Server Configuration"
# linear issue create --title "Linear MCP Server Configuration" --description "Complete Linear MCP server authentication and workflow integration" --priority "High Priority" --team "INTEGRATION"

echo "Creating issue: Multi-Agent System Coordination"
# linear issue create --title "Multi-Agent System Coordination" --description "Improve coordination between Frontend, Backend, and Testing agents" --priority "Medium Priority" --team "INTEGRATION"

echo "Creating issue: Knowledge Graph Protocol Compliance"
# linear issue create --title "Knowledge Graph Protocol Compliance" --description "Ensure all sessions follow mandatory knowledge graph protocols" --priority "High Priority" --team "INTEGRATION"

echo "Creating issue: Session Documentation Automation"
# linear issue create --title "Session Documentation Automation" --description "Automate comprehensive session documentation and discovery logging" --priority "Medium Priority" --team "INTEGRATION"

echo "Creating issue: Comprehensive Test Coverage"
# linear issue create --title "Comprehensive Test Coverage" --description "Achieve 80%+ test coverage across all critical functionality" --priority "High Priority" --team "TESTING"

echo "Creating issue: E2E Testing Framework"
# linear issue create --title "E2E Testing Framework" --description "Implement end-to-end testing with Playwright for critical user flows" --priority "Medium Priority" --team "TESTING"

echo "Creating issue: Production Deployment Pipeline"
# linear issue create --title "Production Deployment Pipeline" --description "Set up automated deployment pipeline with monitoring and rollback" --priority "High Priority" --team "INFRA"

echo "Creating issue: System Monitoring & Alerting"
# linear issue create --title "System Monitoring & Alerting" --description "Implement comprehensive monitoring for all system components" --priority "Medium Priority" --team "INFRA"

