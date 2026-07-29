from docx import Document

def parse_docx(file_path):
    if not file_path.lower().endswith(".docx"):
        raise ValueError("File is not a DOCX")

    doc = Document(file_path)
    extracted_text = "\n".join(para.text for para in doc.paragraphs if para.text.split())
    word_count = len(extracted_text.split())

    return {
        "text": extracted_text,
        "word_count": word_count
    }
