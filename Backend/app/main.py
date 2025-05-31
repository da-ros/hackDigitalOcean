from fastapi import FastAPI, Form, UploadFile, HTTPException
from resume_parser import extract_text_from_pdf
from fastapi.middleware.cors import CORSMiddleware
from flow_loader import load_career_roadmap_flow
from resume_parser import extract_text_from_pdf, create_notion_page


app = FastAPI()

def create_notion_page(title: str, content: str) -> str:
    # Your Notion API logic here to create a page
    # Return URL or ID of the created page
    return "https://www.notion.com/help/category/new-to-notion"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/generate-roadmap/")
async def roadmap_api(
    current_career: str = Form(...),
    future_goal: str = Form(...),
    resume: UploadFile = Form(...)
):
    if resume is None:
        raise HTTPException(status_code=400, detail="Resume file is required.")

    try:
        resume_text = extract_text_from_pdf(resume)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read resume: {str(e)}")

    # ✅ Load Langflow JSON chain
    chain = load_career_roadmap_flow()

    # 🧠 Run the chain with inputs
    try:
        result = chain.invoke({
            "current_role": current_career,
            "future_goal": future_goal,
            "resume": resume_text
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Langflow chain error: {str(e)}")

    roadmap = result if isinstance(result, str) else str(result)

    if not roadmap.strip():
        raise HTTPException(status_code=500, detail="Empty response from Langflow flow.")

    # 📝 Create Notion page
    notion_url = create_notion_page(
        title=f"Career Roadmap for {current_career}",
        content=roadmap
    )
    

    return {"roadmap": roadmap, "notion_url": notion_url}