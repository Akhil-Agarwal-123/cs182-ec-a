import requests
import json
import time
from dotenv import load_dotenv
import os

# --- CONFIGURATION ---
# Replace with your actual values
COURSE_ID = '84647'
load_dotenv()
REGION = 'us'  # Use 'us' for North America, 'au' for Australia, etc.
# ---------------------

BASE_URL = f"https://{REGION}.edstem.org/api"

headers = {
    'x-token': os.getenv('API_TOKEN'),
    'Content-Type': 'application/json'
}


def get_all_threads(course_id):
    threads = []
    offset = 0
    limit = 30  # Ed usually loads in batches

    print(f"Fetching thread list for course {course_id}...")

    while True:
        # Request a batch of threads
        url = f"{BASE_URL}/courses/{course_id}/threads?limit={limit}&offset={offset}&sort=new"
        response = requests.get(url, headers=headers)

        if response.status_code != 200:
            print(f"Error fetching threads: {response.status_code} - {response.text}")
            break

        data = response.json()
        current_batch = data.get('threads', [])

        if not current_batch:
            break

        threads.extend(current_batch)
        offset += len(current_batch)
        print(f"Collected {len(threads)} threads so far...")

        # Respectful pause to avoid rate limiting
        time.sleep(0.5)

    return threads


def get_thread_details(thread_id):
    """Fetches the full content, including comments/answers, for a specific thread."""
    url = f"{BASE_URL}/threads/{thread_id}"
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        return response.json().get('thread')
    return None


# --- MAIN EXECUTION ---

# 1. Get list of all thread summaries
all_thread_summaries = get_all_threads(COURSE_ID)
print(f"Total threads found: {len(all_thread_summaries)}")

full_data = []

# 2. Loop through every thread to get full details (comments, answers, etc.)
print("Downloading full content for each thread...")
for index, item in enumerate(all_thread_summaries):
    t_id = item['id']
    details = get_thread_details(t_id)

    if details:
        full_data.append(details)

    if index % 10 == 0:
        print(f"Processed {index}/{len(all_thread_summaries)}")

    # CRITICAL: Sleep to prevent API blocking
    time.sleep(0.2)

# 3. Save to file
filename = f'ed_export_course_{COURSE_ID}.json'
with open(filename, 'w', encoding='utf-8') as f:
    json.dump(full_data, f, ensure_ascii=False, indent=4)

print(f"Done! Data saved to {filename}")
