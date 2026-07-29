import csv

def parse_csv(file_path):
    if not file_path.lower().endswith(".csv"):
        raise ValueError("File is not a CSV")

    with open(file_path, 'r') as f:
        reader = csv.reader(f)
        data = [row for row in reader]

        return {
            "extracted_content": data
        }