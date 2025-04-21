**Product Requirements Document (PRD): Beacon House Counsellor Portal**

---

## **1\. Product Overview**

The Beacon House Counsellor Portal is an internal AI-powered tool designed exclusively for counsellors to manage, track, and document the progress of students across a multi-phase roadmap for U.S. college admissions. The system enables note-taking, task management, file analysis, and natural language interaction with contextual understanding.

There is no student-side access for now. Each student is created and managed entirely by the counsellor.

---

## **2\. Key Goals**

* Allow counsellors to create a student profile ("folder")  
* Assign a default roadmap structured as Phase \> Task. The Phase and Task levels are standardized and shared across all students, based on the official roadmap. Counsellors can personalize the roadmap by adding custom Sub-tasks under each Task for each student individually.  
* Allow sub-task customization, progress tracking, and note attachment  
* Enable multiple forms of note entry: text, file upload, image, transcript  
* Use AI to extract context and surface relevant answers  
* Use AI to extract action items from transcripts and convert them into tasks/sub-tasks  
* Support chat-like querying interface with sharp, contextual results

---

## **3\. Core Functionalities**

### **3.1 Student Management**

* Create student via form: Name, Email, Phone Number  
* Each student becomes a new "folder"  
* Automatically attach the default roadmap to each new student  
* Roadmap is structured as:  
  * **Phase** (e.g., Interest Exploration)  
    * **Task** (e.g., Self-Reflection)  
      * **Sub-task** (e.g., Identify interests)  
* Ability to search/filter students

### **3.2 Roadmap Tracking & Customization**

* Phases and Tasks are predefined from the roadmap  
* Counsellors can add custom sub-tasks at any time  
* Each sub-task can be marked as: `Yet to start`, `In progress`, `Done`, `Blocked`, `Not applicable`  
* Counsellors can manually close any phase, task, or sub-task

### **3.3 Notes System (Canvas Style)**

* Notes can be added at:  
  * Student-level  
  * Phase-level  
  * Task-level  
  * Sub-task-level  
* Input types:  
  * Text entry  
  * File upload (e.g., PDF/DOC)  
  * Image upload (e.g., handwritten notes)  
  * Transcript upload (e.g., Zoom transcript)  
* Notes interface mimics a canvas-style freeform document (like ChatGPT's Canvas or Notion-style blocks)  
* File/image inputs are auto-processed via OCR/NLP using AI APIs (e.g., OpenAI, Mistral) to extract text content and insert into editable canvas note

### **3.4 Transcript Processing**

* Transcripts are treated as a special input  
* AI scans transcripts to identify and summarize:  
  * Key points  
  * Action items  
  * Assigned responsibilities (counsellor vs. student)  
* Action items are reviewed by counsellor  
  * Counsellor can approve and convert to:  
    * Sub-task (default)  
    * Task (if more significant)  
* Each action item retains origin context (timestamp \+ source transcript)

### **3.5 AI-Powered Querying**

* Chat interface for counsellors  
* Two modes:  
  * **Global Query** (across all students)  
  * **Student-Specific Query** (within a selected student folder)  
* Example queries:  
  * "Show all students blocked on Extracurriculars phase"  
  * "Summarize student's progress on Academic Enrichment"  
  * "What are Krishna's open action items from last Zoom call?"  
* Contextual answers based on all notes, tasks, transcripts, and extracted metadata

### **3.6 Student Context Summary (AI-Generated)**

* **What It Is**: A live text field stored in each student’s profile that summarizes:  
  * Student's strengths, weaknesses  
  * Progress across roadmap  
  * Key insights from notes, transcripts, tasks  
* **Where It Appears**: Visible at the top of the student’s folder view.  
* **How It’s Generated (MVP)**: Manual button (“Generate Summary”) triggers a backend function:  
  * Aggregates all student-level data (notes, transcripts, sub-task statuses)  
  * Sends to OpenAI (or similar API) for summarization  
  * Saves the result into `student_context` field  
* **Future Upgrade**: Trigger auto-regeneration on major updates (e.g., new transcript uploaded)

---

## **4\. Design & UI/UX Guidelines**

### **4.1 Visual Style**

* **Primary Background:** White  
* **Text and CTAs:** Black (minimalist, high-contrast)  
* **Layout:** Clean, modular, and Notion-style blocks  
* **Note Interface:** Canvas-style, editable blocks that accept rich content  
* **Minimalist Aesthetic:** No visual clutter, generous white space, clean typography

### **4.2 Navigation**

* Left Sidebar: Student folders  
* Main Panel:  
  * Roadmap view (Phase \> Task \> Sub-task)  
  * Note-taking interface (canvas)  
  * Upload section (drag-and-drop for image, transcript, file)  
  * AI chat panel (floating or tabbed)  
* Top Bar:  
  * Quick search for students  
  * User profile/settings

### **4.3 Interactions**

* Smooth transitions (expand/collapse tasks)  
* Inline editing  
* Tagging for tasks/statuses  
* Approval modal for AI-suggested action items

---

## **5\. Tech Stack Overview**

* **Frontend:** Bolt.new (React or lightweight equivalent)  
* **Backend/DB:** Supabase  
* **AI Layer:** OpenAI \+ Gemini (NLP, extraction, chat)  
* **Storage:** Supabase storage for files and images

---

## **6\. Future Scope (Optional for V1)**

* Student-side login (view-only or update limited areas)  
* Parent view generation (summary-based)  
* Roadmap analytics dashboard for counsellors  
* Auto-tagging & topic clustering in notes

---

## **6.1 Default Roadmap Structure**

Each student is assigned the same standardized Phase and Task structure by default. Sub-tasks, however, are not pre-filled. Counsellors can add sub-tasks at the student level to personalize the roadmap for each individual. These sub-tasks are always linked to the specific Task and Phase they were added under.

As sub-tasks are added across students, the system will track frequency and context to enable counsellors to see suggestions for new students—based on what has worked for others in the same Task context.

Below is the predefined structure of Phases and Tasks to be assigned to every student:

### **Phase 1: Interest Exploration**

* Self-Reflection & Passion Identification  
* Skills and Strengths Mapping  
* Career Exploration (Shadowing & Interviews)  
* Online Courses & Workshops  
* Extracurricular Sampling  
* Mentorship & Guidance

### **Phase 2: Academic Enrichment & Research**

* Strong Academic Foundation  
* Advanced Coursework or Self-Study  
* Academic Competitions & Olympiads  
* Independent or Mentored Research  
* Academic Summer Programs  
* Reading & Intellectual Curiosity

### **Phase 3: Innovation Capstone Project**

* Project Ideation  
* Planning & Resource Gathering  
* Execution & Development  
* Documentation & Reflection  
* Showcase & Impact  
* Continuation & Next Steps

### **Phase 4: Extracurriculars**

* Selection of Core Activities  
* Leadership & Initiative  
* Depth of Involvement  
* Community Service & Volunteering  
* Achievements & Recognition  
* Networking & Exposure

### **Phase 5: Standardized Testing**

* Test Strategy Planning  
* Preparation & Practice  
* Taking the Exams  
* Score Evaluation & Improvement  
* Balanced Perspective on Testing

### **Phase 6: Essays**

* Personal Narrative Brainstorming  
* Understanding Essay Prompts  
* Drafting the Personal Statement  
* Revising & Polishing  
* Supplemental Essays Game Plan  
* Final Essay Checklist

### **Phase 7: Letters of Recommendation**

* Choosing Recommenders  
* Building Relationships Early  
* Requesting the Letters  
* Making it Easy for Recommenders  
* Follow-Up and Gratitude

### **Phase 8: College Research**

* Define Your College Criteria  
* Build an Initial College List  
* In-Depth Research & Visits  
* Connect with Students and Alumni  
* Narrow Down and Balance Your List  
* Financial Fit & Scholarship Research

### **Phase 9: Application Prep**

* Organize Your Application Materials  
* Create Accounts & Fill Basics  
* Craft a Cohesive Narrative  
* Finalize College-Specific Components  
* Financial Aid Applications  
* Submit Applications in Phases  
* Interview Preparation (If Applicable)

---
