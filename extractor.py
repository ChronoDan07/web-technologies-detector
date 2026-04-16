import pandas as pd

df = pd.read_parquet("./input/raw/part-00000-66e0628d-2c7f-425a-8f5b-738bcd6bf198-c000.snappy.parquet", engine="pyarrow")
df.to_json("./input/processed/domains.json", orient="records", lines=True)
