
# AI Voice Tutor - Architecture Deep Dive

This document outlines the architecture for transforming the AI Voice Tutor into a course-based, slide-driven, emotion-aware learning platform.

## Core Principles

1.  **Deterministic Course Flow**: The learning path is strictly defined by a course JSON file. The AI adapts its teaching style but *never* alters the sequence of modules, lectures, or slides. This prevents topic drift and ensures a structured curriculum.
2.  **Adaptive, Not Disruptive AI**: The AI's role is to enhance the pre-defined content, not create it. Emotion detection influences *how* content is explained (e.g., simplifying for confusion, adding depth for curiosity), but does not interrupt or re-route the user's progress.
3.  **SLM-First Strategy**: We prioritize Small Language Models (SLMs) for their speed, cost-effectiveness, and reduced complexity on structured tasks. SLMs handle all core course content explanations. GPT is reserved as a fallback or for more creative, out-of-course "Help Mode" queries.
4.  **Parallel Help System**: When a user needs extra help, they enter a "Branch Help Mode." This is a side-channel for exploration that does not affect their primary course progress. It's a "detour," not a "fork in the road."

## System Flow Diagram

This diagram illustrates the control and data flow of the new architecture.

```mermaid
graph TD
    subgraph User Interface
        A[CoursePlayer] -- user action --> B{TutorSession Orchestrator};
        B -- renders --> A;
        B -- renders --> C[HelpOverlay];
        D[EmotionCameraWidget] -- emotion data --> B;
    end

    subgraph Core Logic
        B -- "getNextSlide(), getCurrentSlide()" --> E[CourseEngine];
        E -- reads course data --> F[data/courses/*.json];
        B -- "getPedagogy(emotion)" --> G[EmotionPedagogyAdapter];
        B -- "generateExplanation(slide, pedagogy)" --> H[AIRouter];
    end

    subgraph AI Layer
        H -- "course content" --> I[SLM];
        H -- "help/fallback" --> J[GPT-4];
        I -- slide content --> K[API Response];
        J -- slide content --> K;
    end

    subgraph API Endpoints
        H -- makes fetch request --> L[/api/tutor];
        L -- routes based on AI Router logic --> M[generate-slides];
        M -- formats --> K;
    end

    C -- "ask for help" --> B;
```

## Component Breakdown

### 1. `CourseEngine` (`lib/course-engine.ts`)

-   **Responsibility**: The single source of truth for the course structure and user's progress. It's a state machine that manages `course -> module -> lecture -> slide`.
-   **Key Methods**:
    -   `loadCourse(courseId)`: Loads a course JSON file into memory.
    -   `getCurrentSlide()`: Returns the content and metadata for the current slide.
    -   `nextSlide()`: Advances progress to the next slide. Returns `null` if at the end.
    -   `previousSlide()`: Moves to the previous slide.
    -   `getProgress()`: Returns the user's current position (module, lecture, slide index).
    -   `setPosition(position)`: Sets the user's position to a specific slide (used for resuming sessions).
-   **Persistence**: It reads from and writes progress to `lib/progress-tracking.ts`, which abstracts away `localStorage` and Supabase.

### 2. `EmotionPedagogyAdapter` (`lib/emotion-pedagogy.ts`)

-   **Responsibility**: Decouples emotion detection from AI prompting. It maps raw emotion data into a concrete pedagogical strategy.
-   **Key Methods**:
    -   `getStrategy(emotion)`: Takes an emotion string (e.g., "CONFUSED", "CURIOUS") and returns a strategy object.
-   **Example Mapping**:
    -   `CONFUSED` -> `{ style: "simplified", use_analogies: true, pace: "slow" }`
    -   `CURIOUS` -> `{ style: "in-depth", detail_level: "high", related_topics: true }`
    -   `BORED` -> `{ style: "concise", pace: "fast", interactive_element: "quiz" }`
-   **Why?**: This allows us to fine-tune teaching strategies without changing the emotion detection logic or the main `TutorSession` orchestrator. It makes the system modular and testable.

### 3. `AIRouter` (`lib/ai-router.ts`)

-   **Responsibility**: A strict gatekeeper that decides which AI model to use for a given request. This is critical for controlling costs and ensuring predictability.
-   **Key Logic**:
    -   `IF` the request is for a standard course slide explanation:
        -   `ALWAYS` route to the **SLM**.
    -   `IF` the request is from "Branch Help Mode":
        -   `TRY` the **SLM** first.
        -   `IF` the SLM response is inadequate or the topic is too complex, `FALLBACK` to **GPT**.
    -   `IF` the request is for a creative task (e.g., generating a new diagram type not in the course plan):
        -   Route to **GPT**.
-   **Why?**: This prevents the system from using a powerful, expensive model (GPT) for simple, structured tasks that an SLM can handle perfectly well. It enforces the "SLM-First" design principle.

### 4. `HelpOverlay` (`components/HelpOverlay.tsx`)

-   **Responsibility**: Provides a sandboxed environment for users to ask for additional help without disrupting their course progress.
-   **Flow**:
    1.  User clicks a "Help" button or is prompted after repeated "CONFUSED" emotions.
    2.  The `HelpOverlay` component is rendered as a modal or side panel.
    3.  The user can ask a question related to the current slide's topic.
    4.  The request goes through `TutorSession` to the `AIRouter`, which will likely use the SLM/GPT fallback logic.
    5.  A *single* new explainer slide is generated and displayed within the overlay.
    6.  When the user closes the overlay, they are returned to the exact same course slide they were on.
-   **Crucially**: No matter what happens inside the `HelpOverlay`, the main `CourseEngine`'s state is **never** updated.

## How This Architecture Prevents Hallucination

"Hallucination" in AI often happens when the model is asked to generate content outside of its core training or a well-defined context. This architecture minimizes hallucination in several key ways:

1.  **Bounded Context**: The AI is never asked "What should we learn next?". It is only ever asked to explain the content of a *specific, pre-defined slide* from the course JSON. The context is narrow and explicit.
2.  **Deterministic Flow**: Because the `CourseEngine` dictates the flow, the AI cannot invent new, irrelevant topics or go on tangents. It is "on rails."
3.  **SLM for Core Content**: SLMs are generally less prone to complex, creative hallucinations than large models like GPT. By using the SLM for the structured part of the course, we reduce the risk surface. GPT is only used in the sandboxed "Help Mode," where the user's expectations are different.
4.  **Strict Output Contract**: The API will enforce a rigid JSON schema for the slide content. If the AI's response doesn't conform to `{ title, explanation_steps[], ... }`, the request will fail and can be retried. This prevents malformed, nonsensical outputs from reaching the user.
