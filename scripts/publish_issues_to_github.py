import os
import subprocess
import requests

GITHUB_REPO = "Faris1015/Xtern2026-MISO"

def get_github_token() -> str:
    token = os.getenv("GITHUB_TOKEN") or os.getenv("GH_TOKEN")
    if token:
        return token
    try:
        proc = subprocess.Popen(
            ["git", "credential", "fill"],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )
        out, _ = proc.communicate("protocol=https\nhost=github.com\n\n")
        for line in out.splitlines():
            if line.startswith("password="):
                return line.split("=", 1)[1]
    except Exception as e:
        print(f"Error fetching token from git credential manager: {e}")
    return ""

def publish_all_issues():
    token = get_github_token()
    if not token:
        print("Set your GITHUB_TOKEN environment variable or authenticate git with GitHub.")
        print("Example: $env:GITHUB_TOKEN='your_token_here'; python scripts/publish_issues_to_github.py")
        return

    issues_dir = os.path.join(os.path.dirname(__file__), "..", ".github", "issues")
    issue_files = sorted(os.listdir(issues_dir))

    url = f"https://api.github.com/repos/{GITHUB_REPO}/issues"
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json"
    }

    # Fetch existing issues to avoid duplicates
    existing_titles = set()
    res = requests.get(f"{url}?state=all&per_page=100", headers=headers)
    if res.status_code == 200:
        for issue in res.json():
            existing_titles.add(issue.get("title", "").strip())

    for filename in issue_files:
        if not filename.endswith(".md"):
            continue
        filepath = os.path.join(issues_dir, filename)
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()

        lines = content.splitlines()
        title = lines[0].replace("# ", "").strip()
        body = "\n".join(lines[1:]).strip()

        if title in existing_titles:
            print(f"Skipping already existing issue: {title}")
            continue

        payload = {"title": title, "body": body}
        res = requests.post(url, json=payload, headers=headers)
        if res.status_code == 201:
            data = res.json()
            print(f"Created #{data['number']}: {title} ({data['html_url']})")
        else:
            print(f"Failed to create {title}: {res.status_code} - {res.text}")

if __name__ == "__main__":
    publish_all_issues()

