import os
import requests

GITHUB_REPO = "Faris1015/Xtern2026-MISO"
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN") # Set your GitHub Personal Access Token

def publish_all_issues():
    if not GITHUB_TOKEN:
        print("Set your GITHUB_TOKEN environment variable to automatically create issues on GitHub.")
        print("Example: $env:GITHUB_TOKEN='your_token_here'; python scripts/publish_issues_to_github.py")
        return

    issues_dir = os.path.join(os.path.dirname(__file__), "..", ".github", "issues")
    issue_files = sorted(os.listdir(issues_dir))

    url = f"https://api.github.com/repos/{GITHUB_REPO}/issues"
    headers = {
        "Authorization": f"token {GITHUB_TOKEN}",
        "Accept": "application/vnd.github.v3+json"
    }

    for filename in issue_files:
        if not filename.endswith(".md"):
            continue
        filepath = os.path.join(issues_dir, filename)
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()

        lines = content.splitlines()
        title = lines[0].replace("# ", "").strip()
        body = "\n".join(lines[1:]).strip()

        payload = {"title": title, "body": body}
        res = requests.post(url, json=payload, headers=headers)
        if res.status_code == 201:
            print(f"Created: {title}")
        else:
            print(f"Failed to create {title}: {res.status_code} - {res.text}")

if __name__ == "__main__":
    publish_all_issues()
