#!/bin/bash

# Update all API route files to use new NextAuth v5 API

find app/api -name "*.ts" -type f | while read file; do
  # Replace import statements
  sed -i '' 's/import { getServerSession } from '\''next-auth'\'';/import { auth } from '\''@\/lib\/auth\/config'\'';/g' "$file"
  sed -i '' 's/import { authOptions } from '\''@\/lib\/auth\/config'\'';//g' "$file"
  
  # Replace getServerSession calls
  sed -i '' 's/await getServerSession(authOptions)/await auth()/g' "$file"
  sed -i '' 's/await getServerSession()/await auth()/g' "$file"
  
  # Update session checks
  sed -i '' 's/if (!session) {/if (!session?.user) {/g' "$file"
  
  # Update role checks
  sed -i '' 's/session\.user\.role/(session.user as any)?.role/g' "$file"
  sed -i '' 's/session\.user\.id/(session.user as any)?.id/g' "$file"
done

echo "Updated all API route files"

