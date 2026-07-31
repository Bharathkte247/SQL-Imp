"""Create a sample students.xlsx with a USN column."""

from pathlib import Path

import pandas as pd

SAMPLE_USNS = [
    "1XX21CS001",
    "1XX21CS002",
    "1XX21CS003",
]

OUTPUT = Path(__file__).resolve().parent / "students.xlsx"


def main() -> None:
    df = pd.DataFrame({"USN": SAMPLE_USNS})
    df.to_excel(OUTPUT, index=False)
    print(f"Created {OUTPUT} with {len(SAMPLE_USNS)} sample USNs.")
    print("Replace the sample USNs with real student numbers before running fetch_student_results.py.")


if __name__ == "__main__":
    main()