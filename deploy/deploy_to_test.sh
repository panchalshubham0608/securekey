#!/bin/bash

# Get the current branch name
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Define the test branch name
TEST_BRANCH="test"

# Checkout to the test branch (create if it doesn't exist)
git checkout -B $TEST_BRANCH

# Push the test branch forcefully to origin
git push origin $TEST_BRANCH --force

# Checkout back to the original branch
git checkout $CURRENT_BRANCH

# Print a success message
echo "Successfully force-pushed current code to 'origin/$TEST_BRANCH' from '$CURRENT_BRANCH' and returned to '$CURRENT_BRANCH'."
