# Go AST Inspector - Requirements Specification

## Project Overview

### Purpose
Provide a tool that retrieves the Abstract Syntax Tree (AST) from Go language source code and visualizes it in an intuitive format for developers.

### Background & Context
- Understanding how code is parsed is crucial when learning or debugging Go language
- Existing AST tools require development environment setup and are not easily accessible
- A standalone tool that runs entirely in the browser enables immediate use without environment configuration

### Scope
- **Target Scope**: AST analysis and visualization of Go language source code
- **Delivery Format**: Standalone tool distributable as a single HTML file
- **Target Users**: Go language professional developers (primary target), learners, engineers interested in compilers and language processing systems

---

## Functional Requirements

### FR-001: Standalone Operation
**Priority**: Required  
**Description**: Operates completely in the browser without requiring any communication with external servers  
**Details**:
- Distributable as a single HTML file
- Execute all logic (AST analysis, UI control) on the client side
- Operates without internet connection

**Rationale**: 
- Can be used in environments where source code cannot be sent externally for security reasons
- Eliminates environment setup effort and enables immediate use

**Verification Criteria**:
- [ ] All features work when HTML file is opened locally
- [ ] No network traffic occurs (confirmed via DevTools)
- [ ] No dependencies on external CDNs or resources

**Dependencies**: None

---

### FR-002: AST Analysis of Go Language Source Code
**Priority**: Required  
**Description**: Parse user-input Go language source code and generate AST  
**Details**:
- Use a parser that conforms to Go language standard grammar
- Display appropriate error messages when syntax errors occur
- Can parse partial code (expressions, statements, function units)

**Rationale**: 
- Accurate parsing results are essential for understanding AST
- For learning purposes, parsing small code snippets is also important

**Verification Criteria**:
- [ ] Can correctly convert valid Go language code to AST
- [ ] Display error messages including line and column numbers for syntax errors
- [ ] Can parse major syntax elements such as function definitions, type declarations, and expressions

**Dependencies**: None

---

### FR-003: AST Tree Structure Display
**Priority**: Required  
**Description**: Visually display the parsed AST as a hierarchical tree structure  
**Details**:
- Clearly show node types (identifiers, literals, operators, etc.)
- Display format that makes parent-child relationships visually understandable
- Display detailed information of a node when selected

**Rationale**: 
- Understanding the hierarchical structure of AST is the main purpose of the tool
- Visual representation improves learning effectiveness

**Verification Criteria**:
- [ ] All nodes of the AST are displayed as a tree structure
- [ ] Node types (e.g., *ast.FuncDecl, *ast.Ident) are displayed
- [ ] Parent-child relationships are clearly identifiable

**Dependencies**: FR-002

---

### FR-004: Node Expand/Collapse Functionality
**Priority**: Required  
**Description**: Each node (branch) of the tree structure can be individually expanded or collapsed  
**Details**:
- Toggle expand/collapse with click operation
- Configurable default expansion level (e.g., expand up to 2 levels)
- Provide expand all/collapse all functionality

**Rationale**: 
- When handling large ASTs, can focus on only necessary parts
- Improved usability

**Verification Criteria**:
- [ ] Can expand/collapse each node by clicking
- [ ] Expansion state is visually identifiable (e.g., arrow icon)
- [ ] Expand all/collapse all buttons function correctly

**Dependencies**: FR-003

---

### FR-005: Bidirectional Synchronized Display Between Source Code and AST Tree
**Priority**: Required  
**Description**: Enable visual understanding of the correspondence between source code and AST tree through bidirectional synchronization  
**Details**:
- **Source Code → AST Tree Synchronization**:
  - When clicking or moving cursor on source code, highlight the corresponding AST node in the tree view
  - If the corresponding node is collapsed, automatically expand branches up to that node
  - Automatically scroll to the corresponding node
- **AST Tree → Source Code Synchronization**:
  - When selecting a node in the AST tree, highlight the corresponding source code range
  - Highlight range is indicated by background color change
  - Automatically scroll to the corresponding location (recommended)
- Synchronization and release of highlight display

**Rationale**: 
- Intuitively understand the correspondence between source code and AST
- Bidirectional synchronization enables exploration from either perspective
- Improved learning effectiveness
- Visibility is higher when confirmed in the tree than with tooltips

**Verification Criteria**:
- [ ] Clicking or moving cursor on source code highlights the corresponding AST node
- [ ] When the highlight target node is collapsed, it is automatically expanded
- [ ] Selecting a node in the AST tree highlights the corresponding source code range
- [ ] Source code highlight range is visually clear
- [ ] Highlight is properly cleared when selection is released

**Dependencies**: FR-002, FR-003, FR-004

---

### FR-006: Source Code Input Functionality
**Priority**: Required  
**Description**: Provide a text area where users can input Go language source code  
**Details**:
- Support multi-line code input
- Syntax highlighting display (recommended)
- Hello World sample code is input by default

**Rationale**: 
- Users need to be able to analyze arbitrary code
- Can immediately verify operation on first use

**Verification Criteria**:
- [ ] Can input multi-line code
- [ ] AST is updated after input via analysis button or automatic analysis
- [ ] Code including Japanese comments is handled correctly
- [ ] Hello World code is input when page loads

**Dependencies**: None

---

## Non-Functional Requirements

### NFR-001: Performance - Response Time
**Priority**: Required  
**Description**: Complete AST analysis of small to medium-scale code (1000 lines or less) within 3 seconds  
**Measurement Method**: Measure time from analysis start to result display  
**Rationale**: Maintain user experience

**Verification Criteria**:
- [ ] Parse and display 100-line code within 1 second
- [ ] Parse and display 1000-line code within 3 seconds

---

### NFR-002: Browser Compatibility
**Priority**: Required  
**Description**: Operate on the latest 2 versions of modern browsers  
**Target Browsers**:
- Google Chrome (latest 2 versions)
- Mozilla Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Microsoft Edge (latest 2 versions)

**Rationale**: 
- To provide to a wide range of users
- To utilize modern browser APIs (ES6+)

**Verification Criteria**:
- [ ] All features work correctly on the above browsers
- [ ] No layout issues
- [ ] No JavaScript errors occur

---

### NFR-003: Usability - UI/UX
**Priority**: Required  
**Description**: UI that professional developers can operate intuitively  
**Details**:
- Clean and easy-to-read layout
- Self-evident UI design for operation methods
- Provision of concise explanatory text and tooltips

**Rationale**: 
- Prioritize work efficiency of professional developers and minimize learning cost of the tool itself

**Verification Criteria**:
- [ ] Can understand main features within 5 minutes on first use
- [ ] Error messages are easy to understand
- [ ] Optimized for use on desktop browsers

---

### NFR-004: Maintainability - Code Quality
**Priority**: Recommended  
**Description**: Code structure that facilitates future feature additions and bug fixes  
**Details**:
- Modularized structure
- Appropriate comments and documentation
- Test code organization (recommended)

**Rationale**: 
- Enable continuous improvement as an open-source project

**Verification Criteria**:
- [ ] Main modules are independent
- [ ] Important functions have comments
- [ ] README.md includes usage instructions and architecture

---

### NFR-005: Security - Data Protection
**Priority**: Required  
**Description**: User-input code is not sent externally and is not stored  
**Details**:
- Complete all processing on the client side
- No storage to local storage whatsoever
- Input code is discarded on page reload

**Rationale**: 
- May handle confidential code of companies
- Minimize security risks

**Verification Criteria**:
- [ ] No network requests occur
- [ ] No writes to local storage occur
- [ ] Code is cleared on page reload

---

### NFR-006: Availability - Offline Operation
**Priority**: Required  
**Description**: Operates completely in environments without internet connection  
**Details**:
- Use of Service Worker (recommended)
- Embed all resources in HTML file

**Rationale**: 
- To satisfy standalone operation requirements

**Verification Criteria**:
- [ ] All features operate in offline environment
- [ ] No external resource dependencies

---

## Constraints

### TC-001: Technology Stack
- **Frontend**: HTML5, CSS3, TypeScript
- **UI Framework**: Svelte 5.x
- **Go AST Parser**: WebAssembly version of Go parser
- **Build Tool**: Vite (single HTML file generation)

### TC-002: Distribution Format
- Distribute as a single HTML file
- File size: 5MB or less (recommended)

### TC-003: License
- Open source (MIT License recommended)
- External libraries used must also be open source licensed

### TC-004: Development Environment
- Go language development environment (for testing AST analysis logic)
- Modern browser (for development and testing)

---

## Stakeholder Definition

### Users (End Users)
- **Go Language Developers**: Code structure understanding, debugging support
- **Go Language Learners**: Learning language specifications and parsers
- **Compiler/Language Processing System Researchers**: Understanding AST structure

**Expectations**:
- Easy to start using (no environment setup required)
- Obtain accurate AST information
- Intuitive and easy-to-understand UI

### Developers
- **Project Developers**: Responsible for implementation and maintenance of this tool

**Expectations**:
- Maintainable code structure
- Clear technical specifications
- Testable design

### Operators
- **None**: As a standalone tool, there are no specific operators

---

## Dependencies Between Requirements

```
FR-002 (AST Analysis)
  ├── FR-003 (Tree Structure Display) [MVP Required]
  │     ├── FR-004 (Expand/Collapse) [MVP Required]
  │     └── FR-005 (Hover Display) [MVP Required]

FR-006 (Input Functionality) ──→ FR-002 (AST Analysis)

FR-001 (Standalone Operation) ──→ Affects all functional requirements
```

**MVP (Minimum Viable Product) Scope**:
- FR-001, FR-002, FR-003, FR-004, FR-005, FR-006 all required
- Tree display and synchronized highlight display implementation are top priorities

---

## Technology Selection Decisions

The following technology selections have been decided:

### Technology Stack
1. **JavaScript Implementation of Go Parser**
   - **Decision**: Use WebAssembly version of Go parser

2. **UI Framework**
   - **Decision**: Use Svelte 5.x

3. **Build Process**
   - **Decision**: Use Vite to generate single HTML file

### Functional Specifications
4. **Sample Code Preset**
   - **Decision**: Hello World only, displayed in input field by default

5. **AST Display Format**
   - **Decision**: Support tree view format only

6. **Export Functionality**
   - **Decision**: Do not implement

7. **Local Storage Usage**
   - **Decision**: Do not store any input code

### Project Management
8. **Release Plan**
   - **MVP Scope**: FR-001 to FR-006 all required
   - **Top Priority Implementation**: Tree display and synchronized highlight display

9. **Target User Priority**
   - **Primary Target**: Go language professional developers

---

## Next Steps

Requirements definition is complete. For the next phase, it is recommended to execute the following command:

```
/prj-define-design
```

This command will create a technical design document based on this requirements specification, clarifying specific architecture, module composition, data flow, etc.

---

**Document Version**: 1.3  
**Created**: 2025-11-23  
**Last Updated**: 2025-11-24  
**Update History**:
- v1.3: Expanded FR-005 to bidirectional synchronized display (added source code highlight feature)
- v1.2: Changed UI framework to Svelte 5.x, specified TypeScript
- v1.1: Reflected technology selection decisions, removed export functionality, clarified target users
- v1.0: Initial version created
