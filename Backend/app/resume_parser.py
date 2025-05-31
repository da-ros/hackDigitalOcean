import fitz  # PyMuPDF

def extract_text_from_pdf(file):
    doc = fitz.open(stream=file.file.read(), filetype="pdf")
    return " ".join(page.get_text() for page in doc)

def create_notion_page(title: str, content: str) -> str:
    # Your Notion API logic here to create a page
    # Return URL or ID of the created page
    return "https://www.notion.com/help/category/new-to-notion"
