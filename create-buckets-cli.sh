#!/bin/bash
# Create storage buckets using Supabase CLI

# Make sure you're in the project directory
cd /root/agents

# Login to Supabase if needed
echo "Making sure you're logged in to Supabase..."
supabase login

# Link to your project if not already linked
echo "Checking project link..."
supabase link --project-ref pdikjpfulhhpqpxzpgtu

# Create buckets using the CLI
echo "Creating storage buckets..."

# Create profile-images bucket
supabase storage create profile-images --public --file-size-limit 5MB

# Create comedian-media bucket  
supabase storage create comedian-media --public --file-size-limit 50MB

# Create event-media bucket
supabase storage create event-media --public --file-size-limit 10MB

echo "Storage buckets creation attempted via CLI"
echo "Checking status..."

# List buckets
supabase storage list

echo "Done! Check if buckets were created successfully."