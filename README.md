# Student Results Scraper (USN → Excel)

Python tool that reads student USNs from an Excel file, opens the university results portal, solves the captcha with OCR, retries when the page fails to load, and writes all results back to Excel.

Designed for VTU-style portals (`results.vtu.ac.in`) where you enter a **USN**, a **captcha**, and submit.

## Features

- Read USNs from `students.xlsx` (column `USN`)
- Open results URL in Chrome via Selenium
- Identify captcha image with Tesseract OCR and enter it automatically
- Refresh / retry multiple times if the website fails to load
- Retry when captcha is wrong or unreadable
- Optional `--manual-captcha` fallback to type captcha yourself
- Save subject-wise marks (Internal / External / Total / Result) plus SGPA/CGPA to Excel
- Incremental save after each student so progress is not lost

## System requirements

Install these on your machine before running:

1. **Python 3.10+**
2. **Google Chrome**
3. **Tesseract OCR**

```bash
# Ubuntu / Debian
sudo apt-get update
sudo apt-get install -y tesseract-ocr

# macOS
brew install tesseract
```

## Setup

```bash
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

## Prepare the Excel file

Put your Excel file at **`D:\Students.xlsx`** with a column named **USN**:

| USN         |
|-------------|
| 1XX21CS001  |
| 1XX21CS002  |

The script is already configured for that path in `config.yaml`.  
If your file is named `Students.xls` instead, change `input_excel` accordingly.

## Configure the portal URL

`config.yaml` is set to the May/June 2026 results page:

```yaml
results_url: "https://results.vtu.ac.in/MJ26cbcs/index.php"
input_excel: "D:/Students.xlsx"
output_excel: "D:/Student_Results.xlsx"
max_page_retries: 5
max_captcha_retries: 5
```

If the portal HTML changes, adjust the CSS selectors under `selectors`.

## Run

```bash
# Process all USNs from D:\Students.xlsx
python fetch_student_results.py

# Headless Chrome
python fetch_student_results.py --headless

# Ask you to type captcha when OCR fails
python fetch_student_results.py --manual-captcha

# Override URL / files if needed
python fetch_student_results.py --url "https://results.vtu.ac.in/MJ26cbcs/index.php" --input "D:/Students.xlsx" --output "D:/Student_Results.xlsx"

# Single USN quick test
python fetch_student_results.py --usn 1XX21CS001 --manual-captcha
```

Results are written to **`D:\Student_Results.xlsx`**.

## Output columns

Typical columns:

`USN`, `Student Name`, `Subject Code`, `Subject Name`, `Internal`, `External`, `Total`, `Result`, `SGPA`, `CGPA`, `Status`

Failed students get a row with `Status=FAILED` and an `Error` message.

## Notes

- Captcha OCR is not 100% accurate. The script retries several times; use `--manual-captcha` for stubborn images.
- Be respectful of the results server: the default delay between students is 2 seconds (`delay_between_students_seconds` in config).
- Update `results_url` each semester — VTU changes the path when new results are published.
- This automates public result lookup for your own student list. Follow your institution’s terms of use.
