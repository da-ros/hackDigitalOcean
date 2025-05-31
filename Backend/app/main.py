from fastapi import FastAPI, Form, UploadFile
from roadmap_chain import generate_roadmap
from resume_parser import extract_text_from_pdf
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI()

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
    resume_text = extract_text_from_pdf(resume)
    roadmap = generate_roadmap(current_career, future_goal, resume_text)
    return {"roadmap": roadmap}
