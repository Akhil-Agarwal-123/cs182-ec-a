import requests
import json
import time
from dotenv import load_dotenv
import os

# --- CONFIGURATION ---
COURSE_ID = '84647'
load_dotenv()
REGION = 'us'
# ---------------------

BASE_URL = f"https://{REGION}.edstem.org/api"

headers = {
    'x-token': os.getenv('API_TOKEN'),
    'Content-Type': 'application/json'
}


def get_all_threads(course_id):
    """Fetches the list of all thread summaries."""
    threads = []
    offset = 0
    limit = 30

    print(f"Fetching thread list for course {course_id}...")

    while True:
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
        time.sleep(0.5)

    return threads


def resolve_names_recursive(post_object, user_map):
    """
    Recursively injects 'user_name' into the thread, its answers, and its comments.
    """
    if not post_object:
        return

    # 1. Inject name for this specific post/comment
    user_id = post_object.get('user_id')
    if user_id:
        # Default to "Unknown" if ID not in map
        post_object['user_name'] = user_map.get(user_id, "Unknown User")

    # 2. Process comments (nested inside threads or answers)
    for comment in post_object.get('comments', []):
        resolve_names_recursive(comment, user_map)

    # 3. Process answers (usually only inside the main thread)
    for answer in post_object.get('answers', []):
        resolve_names_recursive(answer, user_map)


def get_thread_details(thread_id):
    """
    Fetches the thread AND uses the side-loaded 'users' list
    to resolve usernames immediately.
    """
    url = f"{BASE_URL}/threads/{thread_id}"
    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        data = response.json()
        thread_content = data.get('thread')

        # Ed sends a 'users' list along with the thread.
        # This list contains info for everyone who posted in this thread.
        users_list = data.get('users', [])

        # Build a quick lookup dictionary: ID -> Real Name
        user_map = {}
        for u in users_list:
            uid = u.get('id')
            # Try 'name', fallback to First+Last
            real_name = u.get('name')
            if not real_name:
                real_name = f"{u.get('firstname', '')} {u.get('lastname', '')}".strip()

            user_map[uid] = real_name

        # Inject the names into the thread object
        resolve_names_recursive(thread_content, user_map)

        return thread_content

    return None


# --- MAIN EXECUTION ---

# 1. Get list of all thread summaries
all_thread_summaries = get_all_threads(COURSE_ID)
print(f"Total threads found: {len(all_thread_summaries)}")

full_data = []

# 2. Loop through every thread to get full details + names
print("Downloading full content and resolving names...")
for index, item in enumerate(all_thread_summaries):
    t_id = item['id']
    details = get_thread_details(t_id)

    if details:
        full_data.append(details)

    if index % 10 == 0:
        print(f"Processed {index}/{len(all_thread_summaries)}")

    time.sleep(0.2)

# 3. Save to file
filename = f'ed_export_course_{COURSE_ID}.json'
with open(filename, 'w', encoding='utf-8') as f:
    json.dump(full_data, f, ensure_ascii=False, indent=4)

print(f"Done! Data saved to {filename}")
