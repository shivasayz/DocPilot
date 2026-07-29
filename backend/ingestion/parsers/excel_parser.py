from openpyxl import load_workbook

def parse_xlsx(file_path):
    workbook = load_workbook(file_path)
    worksheet = workbook.active
    
    if not file_path.lower().endswith(".xlsx"):
        raise ValueError("File is not a XLSX")

    data = []
    for row in worksheet.iter_rows(values_only=True):
        data.append(row)
    return {
        "extracted_text": data
    }
