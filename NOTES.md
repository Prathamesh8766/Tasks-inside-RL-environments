# Project Notes

## 1. What is the Existing Project and What Does It Already Have?
The existing project is **TOON** (`toon-format/toon`). It is a command-line tool that converts data between **JSON** and **TOON** (a compact data format designed to use fewer tokens than JSON).

What the project already has:

- **Two-way conversion:**
 Converts JSON into TOON and TOON back into JSON.

- **File and terminal support:** 
 Reads data from a file or terminal input, and either prints the result or saves it to an output file.

- **Formatting and validation:**
 Supports custom spacing and separators, and checks for formatting mistakes when reading TOON files.

- **Basic token stats:**
 Shows a human-readable text message telling the user how many tokens were saved after converting JSON to TOON.

---

## 2. What I Added (What These Two Tasks Do)
I built two Docker-based coding tasks to add a new feature and fix file-safety bugs in the tool:

1. **Task 1 (`toon-stats-json`) — Machine-readable token stats:**
   - Added an option to output the token-saving numbers as clean JSON instead of plain text, making it easy for other scripts or tools to read.

   - Hid the extra text messages when this option is used so the stats output stays clean.

   - Added checks so the tool shows an error if someone uses this option the wrong way (such as using it without turning stats on, or using it while decoding).

2. **Task 2 (`toon-safe-decode`) — Safe file saving and input checks:**

   - **Prevented accidental file loss:** 
   Previously, if a conversion failed halfway through, the tool had already cleared the destination file and left it broken. Now it writes to a temporary file first and only replaces the target file once the conversion succeeds.

   - **Blocked conflicting options:**
   Made the tool stop with an error if someone tries to run encode and decode at the same time.

   - **Empty input check:** 
   Made the tool show an error when given empty or blank input instead of finishing silently.

Both tasks were verified in Docker: the original repository fails the test suite, and applying the solution passes every test.