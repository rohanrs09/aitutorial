import json
import os

# ============================================================
# CONFIGURATION
# ============================================================
INPUT_FILE = "dsa_course.json"
OUTPUT_FILE = "dsa_training.json"

# ============================================================
# EMOTION CONFIG (MATCHES YOUR APP + SLM LOGIC)
# ============================================================
EMOTIONS = [
    {"emotion": "confused", "tone": "calm, slow, reassuring"},
    {"emotion": "frustrated", "tone": "supportive, motivating"},
    {"emotion": "neutral", "tone": "clear, structured"},
    {"emotion": "confident", "tone": "challenging, interview-focused"}
]

# VARIANTS = [
#     "concept",
#     "step_by_step",
#     "code_example",
#     "interview",
#     "revision"
# ]


# ============================================================
# BUILD STRUCTURED TUTOR RESPONSE
# ============================================================
def build_teaching_response(topic_title, topic_content, emotion_cfg):
    return f"""Student Emotion: {emotion_cfg['emotion']}
Tutor Tone: {emotion_cfg['tone']}

Question: Explain {topic_title}

ACKNOWLEDGEMENT:
It's completely okay to be at this stage. Let's understand this step by step.

DEFINITION:
{topic_content}

INTUITION / REAL-WORLD ANALOGY:
Think of this concept like organizing items efficiently so you can find them quickly.

STEP-BY-STEP EXPLANATION:
1. Understand the problem this concept solves.
2. Learn how it works internally.
3. Apply it efficiently in real problems.

ASCII DIAGRAM:
Input  ->  Processing  ->  Output

CODE (C++):
```cpp
// Example implementation
#include <iostream>
using namespace std;

int main() {{
    // {topic_title} implementation
    cout << "Hello {topic_title}" << endl;
    return 0;
}}
```

TIME COMPLEXITY:
O(n) - Linear time complexity

SPACE COMPLEXITY:
O(1) - Constant space complexity

KEY TAKEAWAYS:
• Understand the core concept
• Practice with examples
• Apply in problem-solving""".strip()

# ============================================================
# GENERATE TRAINING DATA
# ============================================================
def generate_training_data(input_file):
    """Generate emotion-aware training examples from DSA course data"""
    
    # Load course data
    with open(input_file, 'r', encoding='utf-8') as f:
        course = json.load(f)
    
    training_examples = []
    
    print(f"Processing course: {course.get('course_name', 'DSA Course')}")
    
    for module in course.get("modules", []):
        module_title = module.get("title", "Module")
        
        for topic in module.get("topics", []):
            topic_title = topic.get("title", "Topic")
            topic_content = topic.get(
                "content",
                "This is an important Data Structures and Algorithms concept."
            )
            
            # Generate training example for each emotion and variant
            # for emotion_cfg in EMOTIONS:
            #     for variant in VARIANTS:
            #         training_examples.append({
            #             "subject": "DSA",
            #             "module": module_title,
            #             "topic": topic_title,
            #             "emotion": emotion_cfg["emotion"],
            #             "variant": variant,
            #             "text": build_teaching_response(
            #                 topic_title,
            #                 topic_content,
            #                 emotion_cfg,
            #                 variant
            #             )
            #         })

            for emotion_cfg in EMOTIONS:
                training_examples.append({
                    "subject": "DSA",
                    "module": module_title,
                    "topic": topic_title,
                    "emotion": emotion_cfg["emotion"],
                    "text": build_teaching_response(
                        topic_title,
                        topic_content,
                        emotion_cfg
                    )
                })

    
    print(f"✅ Generated {len(training_examples)} emotion-aware training samples")
    return training_examples

# ============================================================
# SAVE TRAINING DATA
# ============================================================
def save_training_data(training_data, output_file):
    """Save training data to JSON file"""
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(training_data, f, indent=2, ensure_ascii=False)
    print(f"✅ Training data saved to {output_file}")

# ============================================================
# MAIN EXECUTION
# ============================================================
def main():
    """Main function to generate training data"""
    try:
        # Check if input file exists
        if not os.path.exists(INPUT_FILE):
            print(f"❌ ERROR: Input file '{INPUT_FILE}' not found!")
            return
        
        # Generate training data
        training_data = generate_training_data(INPUT_FILE)
        
        # Save training data
        save_training_data(training_data, OUTPUT_FILE)
        
        # Print summary
        print("=" * 60)
        print("📊 GENERATION SUMMARY:")
        print(f"📁 Input: {INPUT_FILE}")
        print(f"💾 Output: {OUTPUT_FILE}")
        print(f"📝 Total samples: {len(training_data)}")
        print(f"😊 Emotions per topic: {len(EMOTIONS)}")
        print("=" * 60)
        print("🚀 NEXT STEPS:")
        print("1. Upload dsa_training.json to Google Colab")
        print("2. Train SLM with 1 epoch first")
        print("3. Test with confused vs confident prompts")
        print("4. Fine-tune based on results")
        print("=" * 60)
        
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()

# ============================================================
# RUN SCRIPT
# ============================================================
if __name__ == "__main__":
    main()
