import json

def generate_training_data(course_json_path):
    with open(course_json_path, 'r') as f:
        course = json.load(f)
    
    training_examples = []
    
    print(f"Processing: {course['course_name']}\n")
    
    # Process each module
    for module in course.get('modules', []):
        module_title = module['title']
        
        for topic in module.get('topics', []):
            # Type 1: What is this topic?
            training_examples.append({
                "text": f"Question: What is {topic['title']}?\nAnswer: {topic['content']}"
            })
            
            # Type 2: Key points
            if topic.get('key_points'):
                key_points_text = "\n".join([f"• {point}" for point in topic['key_points']])
                training_examples.append({
                    "text": f"Question: What are the key points of {topic['title']}?\nAnswer:\n{key_points_text}"
                })
            
            # Type 3: Code examples
            if topic.get('code_examples'):
                for code_ex in topic['code_examples']:
                    training_examples.append({
                        "text": f"Question: Show me code example for {topic['title']}\nAnswer:\n```cpp\n{code_ex['code']}\n```\nOutput: {code_ex.get('output', 'N/A')}"
                    })
            
            # Type 4: Video references
            if topic.get('videos'):
                for video in topic['videos']:
                    training_examples.append({
                        "text": f"Question: Where can I learn about {topic['title']}?\nAnswer: Watch this video: {video['title']} - {video['youtube_url']}"
                    })
    
    print(f"✅ Generated {len(training_examples)} training examples\n")
    return training_examples

def save_training_data(examples, output_path):
    with open(output_path, 'w') as f:
        json.dump(examples, f, indent=2)
    print(f"✅ Saved to: {output_path}")

if __name__ == "__main__":
    INPUT_FILE = "dsa_course.json"
    OUTPUT_FILE = "dsa_training.json"
    
    try:
        training_data = generate_training_data(INPUT_FILE)
        save_training_data(training_data, OUTPUT_FILE)
        
        print("\n" + "="*60)
        print("NEXT: Upload dsa_training.json to Google Colab")
        print("="*60)
        
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")