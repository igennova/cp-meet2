import json
import sys
from pymongo import MongoClient
from jsonschema import validate, ValidationError

# Schema to validate the question format
question_schema = {
    "type": "object",
    "properties": {
        "question_id": {"type": "string"},
        "title": {"type": "string"},
        "description": {"type": "string"},
        "input_format": {"type": "array", "items": {"type": "string"}},
        "output_format": {"type": "string"},
        "constraints": {"type": "object"},
        "example": {"type": "object"},
        "test_cases": {"type": "array"}
    },
    "required": ["question_id", "title", "description", "input_format", "output_format", "constraints", "example", "test_cases"]
}

def load_questions(json_path):
    with open(json_path, "r") as f:
        data = json.load(f)

    if isinstance(data, list):
        for q in data:
            validate(instance=q, schema=question_schema)
        return data
    else:
        validate(instance=data, schema=question_schema)
        return [data]

def insert_to_mongo(questions):
    client = MongoClient("mongodb://localhost:27017/")
    db = client["question_db"]
    collection = db["questions"]
    result = collection.insert_many(questions)
    print(f"Inserted {len(result.inserted_ids)} questions into MongoDB.")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python insert_questions.py <path_to_json_file>")
        sys.exit(1)
    
    try:
        questions = load_questions(sys.argv[1])
        insert_to_mongo(questions)
    except ValidationError as e:
        print("Validation failed:", e)
    except Exception as e:
        print("Error:", e)
