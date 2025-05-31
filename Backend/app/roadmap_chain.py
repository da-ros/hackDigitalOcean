from langchain.chat_models import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
import os
from dotenv import load_dotenv
from langchain.schema import HumanMessage

load_dotenv()

llm = ChatOpenAI(
    model_name="gpt-4o-mini",
    openai_api_key=os.getenv("OPENAI_API_KEY")
)

def generate_roadmap(current_career, future_goal, resume_text):
    # Step 1: Extract resume summary
    summary_prompt = PromptTemplate.from_template(
        "Extract key skills, experiences, and tools from this resume:\n\n{resume_text}"
    )
    summary_chain = LLMChain(llm=llm, prompt=summary_prompt)
    resume_summary = summary_chain.run(resume_text=resume_text)

    # Step 2: Generate roadmap
    roadmap_prompt = PromptTemplate.from_template(
        "Current Career: {current_career}\nResume Summary: {resume_summary}\nFuture Goal: {future_goal}\n\n"
        "Provide a career roadmap: key gaps, skills needed, and step-by-step transition plan with realistic timelines."
    )

    roadmap_chain = LLMChain(llm=llm, prompt=roadmap_prompt)
    roadmap = roadmap_chain.run(
        current_career=current_career,
        resume_summary=resume_summary,
        future_goal=future_goal
    )

    return roadmap
