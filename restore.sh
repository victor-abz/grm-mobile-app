#!/bin/bash

# Cache sudo credentials for the duration of the script
sudo -v

# Check if jq is installed, and if not, install it
if ! command -v jq &> /dev/null; then
    echo "jq is not installed. Installing now..."
    echo $sudo_password | sudo -S apt-get update
    echo $sudo_password | sudo -S apt-get install -y jq
fi

# Check if backup folder and db username provided
if [ $# -ne 2 ]; then
  echo "Usage: $0 backup_directory_path db_root_username"
  echo "Example: $0 /path/to/backups frappe"
  exit 1
fi

backup_directory=$1
db_root_username=$2

# Set up tracking files
tracking_dir="$(pwd)/restore_tracking"
mkdir -p "$tracking_dir"
successful_sites_file="$tracking_dir/successful_sites.txt"
expired_sites_file="$tracking_dir/expired_sites.txt"
failed_sites_file="$tracking_dir/failed_sites.txt"
processed_sites_file="$tracking_dir/processed_sites.txt"

# Initialize tracking files if they don't exist
touch "$successful_sites_file"
touch "$expired_sites_file"
touch "$failed_sites_file"
touch "$processed_sites_file"

# Set the path to the output file
output_file="$(pwd)/restore_logs.txt"

# Get admin password
read -s -p "Enter admin password: " admin_password
echo

# Get MariaDB root password
read -s -p "Enter MariaDB root password for user '$db_root_username': " mariadb_password
echo

# Function to check if site was already processed
is_site_processed() {
    local site_name=$1
    grep -q "^$site_name$" "$processed_sites_file"
}

# Function to mark site as processed
mark_site_processed() {
    local site_name=$1
    echo "$site_name" >> "$processed_sites_file"
}

# Function to log successful site
log_successful_site() {
    local site_name=$1
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "$site_name|$timestamp" >> "$successful_sites_file"
    echo "✓ Successfully restored: $site_name at $timestamp"
}

# Function to log expired site
log_expired_site() {
    local site_name=$1
    local valid_till=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "$site_name|$valid_till|$timestamp" >> "$expired_sites_file"
    echo "⚠ Expired site dropped: $site_name (valid till: $valid_till) at $timestamp"
}

# Function to log failed site
log_failed_site() {
    local site_name=$1
    local error_msg=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "$site_name|$error_msg|$timestamp" >> "$failed_sites_file"
    echo "✗ Failed to restore: $site_name - $error_msg at $timestamp"
}

echo
echo
echo "-----------------------------------------------"
echo "-----------------------------------------------"
echo "-----------------------------------------------"
echo "------ Installing Apps ---------"
echo "-----------------------------------------------"
echo "-----------------------------------------------"
echo
echo

# Check for resume capability
echo "Checking for previously processed sites..."
if [ -s "$processed_sites_file" ]; then
    echo "Found $(wc -l < "$processed_sites_file") previously processed sites. Resuming from where we left off..."
else
    echo "Starting fresh restoration process..."
fi

# Loop through the backup directory and restore each site backup
for site_backup_dir in "$backup_directory"/*; do
  if [ -d "$site_backup_dir" ]; then
    site_name=$(basename "$site_backup_dir")
    
    # Check if site was already processed
    if is_site_processed "$site_name"; then
        echo "⏭ Skipping already processed site: $site_name"
        continue
    fi

    # Set the path to the quota file
    quota_file="$site_backup_dir/quota.json"

    # Check if quota file exists
    if [ ! -f "$quota_file" ]; then
        log_failed_site "$site_name" "quota.json file not found"
        mark_site_processed "$site_name"
        continue
    fi

    # Check if the "valid_till" date is in the future
    valid_till=$(jq -r '.valid_till' "$quota_file")
    if [ "$valid_till" == "null" ]; then
        log_failed_site "$site_name" "valid_till date not found in quota.json"
        mark_site_processed "$site_name"
        continue
    fi

    current_date=$(date +"%Y-%m-%d %H:%M:%S.%N")
    valid_till_seconds=$(date --date="$valid_till" +%s 2>/dev/null)
    current_date_seconds=$(date --date="$current_date" +%s)

    if [ $? -ne 0 ]; then
        log_failed_site "$site_name" "Invalid date format in valid_till: $valid_till"
        mark_site_processed "$site_name"
        continue
    fi

    if [[ $valid_till_seconds -gt $current_date_seconds ]]; then
        echo
        echo
        echo "Creating and Installing apps on site $site_name.top1erp.com"
        echo
        echo
        
        # Wrap the entire restoration process in error handling
        (
            set -e  # Exit on any error
            
            # Create the new site
            bench new-site "$site_name.top1erp.com" --force --admin-password $admin_password --db-root-username $db_root_username --db-root-password $mariadb_password

            # Update site_config.json with the encryption key from the backup, if available
            site_config_file="$(pwd)/sites/$site_name.top1erp.com/site_config.json"
            backup_site_config_file="$site_backup_dir/site_config.json"
            if [ -f "$backup_site_config_file" ]; then
                encryption_key=$(jq -r '.encryption_key' "$backup_site_config_file")
                if [ "$encryption_key" != "null" ]; then
                    jq --arg ek "$encryption_key" '.encryption_key = $ek' "$site_config_file" > temp.json && mv temp.json "$site_config_file"
                fi
            fi

            echo
            echo
            echo "------ Site $site_name Apps Installed successfully ----"
            echo
            echo ""

            echo
            echo
            echo "-----------------------------------------------"
            echo "-----------------------------------------------"
            echo "------------------ Restoring Site -------------"
            echo "-----------------------------------------------"
            echo "-----------------------------------------------"
            echo
            echo

            # Restore the database backup
            database_file="$(pwd)/$site_backup_dir/$site_name.sql.gz"
            public_files_archive="$(pwd)/$site_backup_dir/public_files.tar.gz"
            private_files_archive="$(pwd)/$site_backup_dir/private_files.tar.gz"

            # Verify backup files exist
            if [ ! -f "$database_file" ]; then
                echo "Error: Database file not found: $database_file"
                exit 1
            fi
            if [ ! -f "$public_files_archive" ]; then
                echo "Error: Public files archive not found: $public_files_archive"
                exit 1
            fi
            if [ ! -f "$private_files_archive" ]; then
                echo "Error: Private files archive not found: $private_files_archive"
                exit 1
            fi

            echo "Restoring database for $site_name...  with files: SQL$site_name "
            echo "SQL: $database_file"
            echo "Public_folder: $public_files_archive"
            echo "Private_folder: $private_files_archive"
            echo "restoring......"
            bench --site "$site_name.top1erp.com" restore --force "$database_file" \
                --with-public-files "$public_files_archive" \
                --with-private-files "$private_files_archive" \
                --db-root-username $db_root_username \
                --db-root-password $mariadb_password

            echo
            echo
            echo "------ Site $site_name restored successfully ----"
            echo
            echo ""

            echo
            echo
            echo "-----------------------------------------------"
            echo "-----------------------------------------------"
            echo "------------- first Migration -----------------"
            echo "-----------------------------------------------"
            echo "-----------------------------------------------"
            echo
            echo

            bench --site "$site_name.top1erp.com" migrate

            echo
            echo
            echo "-----------------------------------------------"
            echo "-----------------------------------------------"
            echo "------ Install App Second Time ---------"
            echo "-----------------------------------------------"
            echo "-----------------------------------------------"
            echo
            echo

            bench --site "$site_name.top1erp.com" install-app hrms && \
            bench --site "$site_name.top1erp.com" install-app education && \
            bench --site "$site_name.top1erp.com" install-app hospitality && \
            bench --site "$site_name.top1erp.com" install-app healthcare && \
            bench --site "$site_name.top1erp.com" install-app csf_tz && \
            bench --site "$site_name.top1erp.com" install-app propms && \
            bench --site "$site_name.top1erp.com" install-app payments

            # Copy quota.json to site folder
            quota_file="$(pwd)/$site_backup_dir/quota.json"
            if [ -f "$quota_file" ]; then
                echo "Copying quota.json file for $site_name.top1erp.com..."
                cp -f "$quota_file" "$(pwd)/sites/$site_name.top1erp.com/quota.json"
            fi

            echo
            echo
            echo "-----------------------------------------------"
            echo "-----------------------------------------------"
            echo "------------- Final Migration -----------------"
            echo "-----------------------------------------------"
            echo "-----------------------------------------------"
            echo
            echo

            bench --site "$site_name.top1erp.com" migrate

        ) && {
            # Success - log the successful restoration
            log_successful_site "$site_name"
            mark_site_processed "$site_name"
        } || {
            # Failure - log the failed restoration
            log_failed_site "$site_name" "Restoration process failed"
            mark_site_processed "$site_name"
            echo "❌ Failed to restore site: $site_name"
            
            # Try to clean up failed site
            echo "Attempting to clean up failed site..."
            bench drop-site "$site_name.top1erp.com" --force --db-root-username $db_root_username --db-root-password $mariadb_password 2>/dev/null || true
        }

    else
        echo "The 'valid_till' date for $site_name is in the past or present."
        echo "Skipped $site_name as it had expired (valid till $valid_till)." >> "$output_file"
        echo "-----------------------------------------------"
        echo "------------- Dropping Expired Sites -----------------"
        echo "-----------------------------------------------"

        # Drop expired site and log it
        bench drop-site "$site_name.top1erp.com" --force --db-root-username $db_root_username --db-root-password $mariadb_password 2>/dev/null || true
        log_expired_site "$site_name" "$valid_till"
        mark_site_processed "$site_name"
    fi

  fi
done

# Generate summary report
echo
echo "-----------------------------------------------"
echo "----------- Generating Summary Report ----------"
echo "-----------------------------------------------"

# Create markdown report
report_file="$(pwd)/restoration_summary_$(date +%Y%m%d_%H%M%S).md"

cat > "$report_file" << EOF
# Site Restoration Summary Report

**Generated on:** $(date '+%Y-%m-%d %H:%M:%S')  
**Backup Directory:** $backup_directory  
**Database Root User:** $db_root_username

## Overview

EOF

# Count statistics
successful_count=$(wc -l < "$successful_sites_file" 2>/dev/null || echo "0")
expired_count=$(wc -l < "$expired_sites_file" 2>/dev/null || echo "0")
failed_count=$(wc -l < "$failed_sites_file" 2>/dev/null || echo "0")
total_processed=$((successful_count + expired_count + failed_count))

cat >> "$report_file" << EOF
- **Total Sites Processed:** $total_processed
- **Successfully Restored:** $successful_count
- **Expired Sites (Dropped):** $expired_count
- **Failed Restorations:** $failed_count

## Successfully Restored Sites

EOF

if [ $successful_count -gt 0 ]; then
    echo "| Site Name | Restoration Time |" >> "$report_file"
    echo "|-----------|------------------|" >> "$report_file"
    while IFS='|' read -r site_name timestamp; do
        echo "| $site_name.top1erp.com | $timestamp |" >> "$report_file"
    done < "$successful_sites_file"
else
    echo "*No sites were successfully restored.*" >> "$report_file"
fi

cat >> "$report_file" << EOF

## Expired Sites (Dropped)

EOF

if [ $expired_count -gt 0 ]; then
    echo "| Site Name | Valid Until | Processed Time |" >> "$report_file"
    echo "|-----------|-------------|----------------|" >> "$report_file"
    while IFS='|' read -r site_name valid_till timestamp; do
        echo "| $site_name.top1erp.com | $valid_till | $timestamp |" >> "$report_file"
    done < "$expired_sites_file"
else
    echo "*No expired sites were found.*" >> "$report_file"
fi

cat >> "$report_file" << EOF

## Failed Restorations

EOF

if [ $failed_count -gt 0 ]; then
    echo "| Site Name | Error Message | Failed Time |" >> "$report_file"
    echo "|-----------|---------------|-------------|" >> "$report_file"
    while IFS='|' read -r site_name error_msg timestamp; do
        echo "| $site_name.top1erp.com | $error_msg | $timestamp |" >> "$report_file"
    done < "$failed_sites_file"
else
    echo "*No restoration failures occurred.*" >> "$report_file"
fi

cat >> "$report_file" << EOF

## Notes

- All successfully restored sites are now available at their respective URLs
- Expired sites have been permanently dropped from the system
- Failed sites may require manual intervention
- Tracking files are stored in: \`$tracking_dir\`

---
*Report generated by restore.sh script*
EOF

echo
echo "✅ Summary report generated: $report_file"
echo
echo "📊 Restoration Statistics:"
echo "   Successfully Restored: $successful_count sites"
echo "   Expired Sites Dropped: $expired_count sites"
echo "   Failed Restorations: $failed_count sites"
echo "   Total Processed: $total_processed sites"
echo

echo "-----------------------------------------------"
echo "--------------- Please Run Patches with: ---------------"
echo "---------------------- bench update --patch  --no-backup --force --reset --restart-supervisor -------------------------"
bench update --patch  --no-backup --force --reset --restart-supervisor
