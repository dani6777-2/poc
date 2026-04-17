import psycopg2
import os
from urllib.parse import urlparse

# DATABASE_URL=postgresql://admin:password@localhost:5433/gastos
DATABASE_URL = "postgresql://admin:password@localhost:5433/gastos"

def restore_access():
    print("--- RESTORE TENANT ACCESS ---")
    
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        # 1. Find all users
        print("\nChecking users...")
        cur.execute("SELECT id, email, tenant_id FROM users;")
        users = cur.fetchall()
        
        if not users:
            print("ERROR: No users found in database.")
            return

        for user_id, email, home_tenant_id in users:
            print(f"Repairing user {user_id} ({email}) for tenant {home_tenant_id}...")
            
            # 2. Check if access already exists
            cur.execute("SELECT id FROM tenant_access WHERE user_id = %s AND tenant_id = %s;", (user_id, home_tenant_id))
            if cur.fetchone():
                print(f"Access already exists for user {user_id} in tenant {home_tenant_id}. Skipping.")
                continue
                
            # 3. Insert access record
            print(f"Inserting missing access record for user {user_id} in tenant {home_tenant_id}...")
            cur.execute(
                "INSERT INTO tenant_access (user_id, tenant_id, role) VALUES (%s, %s, %s);",
                (user_id, home_tenant_id, 'owner')
            )
            print("Success!")

        conn.commit()
        print("\nAll restoration tasks completed successfully.")
        
        # 4. Final verification
        print("\n--- FINAL VERIFICATION ---")
        cur.execute("SELECT * FROM tenant_access;")
        for row in cur.fetchall():
            print(row)
            
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"ERROR: {str(e)}")

if __name__ == "__main__":
    restore_access()
