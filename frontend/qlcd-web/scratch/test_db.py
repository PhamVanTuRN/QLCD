"""Read the health endpoint without sending credentials."""
import argparse
import urllib.request

parser = argparse.ArgumentParser()
parser.add_argument("--url", required=True, help="Configured /health/live URL")
args = parser.parse_args()

with urllib.request.urlopen(args.url, timeout=5) as response:
    print(f"Liveness returned HTTP {response.status}")
