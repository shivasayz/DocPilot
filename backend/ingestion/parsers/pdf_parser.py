import fitz

def parse_pdf(file_path):
    # open pdf file
    doc = fitz.open(file_path)

    if not file_path.lower().endswith(".pdf"):
        raise ValueError("File is not a PDF")

    extracted_text = ""
    for page_num in range(doc.page_count):
        page = doc[page_num]
        extracted_text += page.get_text()
    doc.close()

    word_count = len(extracted_text.split())
    return {
        "text": extracted_text,
        "word_count": word_count
    }