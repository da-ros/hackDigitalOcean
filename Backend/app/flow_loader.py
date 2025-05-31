from langflow import load_flow_from_json
from pathlib import Path

# FLOW_DIR = Path(__file__).parent / "flows"
FLOW_PATH = Path(__file__).parent.parent / "PathMakerV3.json"

def load_career_roadmap_flow():
    flow_path = FLOW_DIR / "career_roadmap.json"
    flow = load_flow_from_json(str(flow_path))
    return flow
