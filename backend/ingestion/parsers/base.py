from pdf_parser import parse_pdf 
from docx_parser import parse_docx
from excel_parser import parse_xlsx
from csv_parser import parse_csv

pdf_document = "/Users/odhurishivakumar/Desktop/intellisource-forge/backend/storage/6a5cba3f9ac7782576566239/Invoice_2490711969.pdf"
docx_document = "/Users/odhurishivakumar/Desktop/intellisource-forge/backend/storage/6a5cba3f9ac7782576566239/system-design.docx"
xlsx_file = "/Users/odhurishivakumar/Desktop/intellisource-forge/backend/storage/6a5cba3f9ac7782576566239/Projects.xlsx"
csv_file = "/Users/odhurishivakumar/Desktop/intellisource-forge/backend/storage/6a5cba3f9ac7782576566239/Projects2026.csv"

print("\n\n")
print("Parsed Content: ")
print("PDF: ")
print(parse_pdf(pdf_document))
print("\n\n")
print("DOCX: ")
print(parse_docx(docx_document))
print("\n\n")
print("XLSX: ")
print(parse_xlsx(xlsx_file))
print("\n\n")
print("CSV: ")
print(parse_csv(csv_file))


