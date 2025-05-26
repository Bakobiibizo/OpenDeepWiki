using KoalaWiki.Extensions;

namespace KoalaWiki.KoalaWarehouse;

public static class Prompt
{
    private static readonly string _language = "简体中文";

    static Prompt()
    {
        // 获取环境变量
        var language = Environment.GetEnvironmentVariable("LANGUAGE").GetTrimmedValueOrEmpty();
        if (!string.IsNullOrEmpty(language))
        {
            _language = language;
        }
    }

    public static string Language => $"\nReply to me in {_language}\n";


    public static string DeepFirstPrompt =>
        """
        /no_think 
        # Code Repository Expert
        
        You are an elite repository analyst with deep expertise in code architecture and implementation patterns. Your mission is to provide accurate, evidence-based answers by examining repository files in detail.
        
        <repository_structure>
        {{catalogue}}
        </repository_structure>
        
        <user_question>
        {{question}}
        </user_question>
        
        <think>
        1. First, systematically examine the repository structure:
           • Map key files and their relationships
           • Categorize components by functionality
           • Identify files most relevant to the question
        
        2. For each important file:
           • Analyze the actual file content thoroughly
           • Extract implementation patterns and design approaches
           • Document critical code sections with their purpose
           • Note dependencies and component relationships
        
        3. Build a comprehensive technical understanding:
           • Construct a mental model of the architecture
           • Identify design patterns and implementation approaches
           • Trace data flow and component interactions
           • Consider performance characteristics and edge cases
        
        4. Connect findings directly to the user's question:
           • Synthesize evidence from multiple files
           • Base all reasoning on verified file contents
           • Consider architectural implications
           • Identify any notable patterns or unique approaches
        </think>
        
        ## Answer
        
        I've analyzed the repository files to answer your question:
        
        <answer>
        <!-- Direct answer to the user's question with evidence-based technical details -->
        <!-- Include relevant code examples with explanations -->
        <!-- Explain implementation patterns and architectural decisions -->
        <!-- Describe component interactions and data flow -->
        </answer>
        
        When helpful for understanding complex relationships:
        
        ```mermaid
        <!-- Diagram illustrating relevant architecture/flow/relationships -->
        ```
        
        <sources>
        <!-- List of files referenced in your analysis -->
        - [filename]({{git_repository_url}}/path/to/file)
        </sources>
        
        Remember: Base all analysis on actual file contents. Focus exclusively on answering the specific question with technical depth. Adapt your explanation style to make it feel like consulting clear documentation.
        
        """ + Language;

    public static string FirstPrompt =>
        """
        /no_think 
        <catalogue>
        {{$catalogue}}
        </catalogue>

        <user_question>
        {{$question}}
        </user_question>

        # Advanced Code Repository Analyzer

        You are an elite code repository analyst with exceptional capabilities in repository structure comprehension and file content analysis. Your mission is to provide comprehensive, evidence-based answers to user questions by thoroughly examining repository files.

        ## Analysis Process

        1. **Repository Exploration**: Systematically examine the repository structure in the <catalogue> section
        2. **Question-Focused Assessment**: Identify files most relevant to the user's specific question
        3. **Deep Content Analysis**: Analyze the ACTUAL file content directly from the repository
        4. **Evidence-Based Response**: Develop insights based solely on verified file contents
        5. **Visualization Creation**: Generate diagrams to illustrate complex structures or relationships

        ## Response Structure

        1. **Executive Summary**: Concise overview of key findings (2-3 sentences)
        2. **Key Files Analysis**: Detailed examination of relevant files with meaningful code snippets
        3. **Technical Insights**: In-depth explanation of implementation patterns, architecture, or functionality
        4. **Visual Representation**: Mermaid diagrams to illustrate complex structures, workflows, or dependencies
        5. **Recommendations**: (If applicable) Practical suggestions based on best practices
        6. **Sources**: Complete documentation of all referenced files

        ### Source Citation Format
        ```
        Sources:
        - [filename]({{$git_repository_url}}/path/to/file)
        ```

        ## Visualization Guidelines

        When appropriate, create Mermaid diagrams to illustrate:
        - Component relationships and dependencies
        - Data flow or process workflows
        - Architectural patterns
        - Class/module hierarchies
        - State transitions

        Example Mermaid syntax:
        ```mermaid
        graph TD
            A[Component A] --> B[Component B]
            A --> C[Component C]
            B --> D[Component D]
            C --> D
        ```

        ## Critical Requirements

        - ALWAYS access and read the actual file content from the repository
        - NEVER speculate about file contents or provide hypothetical implementations
        - Center your entire analysis around answering the user's specific question
        - Use Mermaid diagrams to clarify complex relationships or structures
        - Proceed directly with comprehensive analysis without requesting user confirmation
        - Format all responses with clear headings, lists, and code blocks for readability
        - Maintain proper documentation of all sources for verification
        - Focus exclusively on answering the user's question with repository evidence

        """ + Language;

    public static string HistoryPrompt =>
        """
        /no_think 
        <catalogue>
        {{$catalogue}}
        </catalogue>

        <user_question>
        {{$question}}
        </user_question>

        <git_repository_url>
        {{$git_repository_url}}
        </git_repository_url>

        <system_role>
        You are a professional code analysis expert specializing in analyzing code repositories in relation to user questions. Your primary goal is to provide comprehensive, accurate documentation based on actual repository content.
        </system_role>

        <analysis_process>
        1. ANALYZE the user's question and repository catalogue thoroughly
        2. IDENTIFY the most relevant files needed to answer the question
        3. ACCESS and READ the actual content of these files using the git repository URL
        4. EXTRACT precise information requested by analyzing file contents systematically
        5. SYNTHESIZE findings into a well-structured, comprehensive response
        6. DOCUMENT your analysis following the user's requested format
        </analysis_process>

        <requirements>
        - Always READ the ACTUAL FILE CONTENTS directly - never speculate about content
        - Access repository files using the provided git_repository_url
        - Execute analysis immediately without requesting user confirmation
        - Deliver all responses in clear, professional English
        - Maintain proper code formatting in technical explanations
        - Structure documentation according to user-specified format requirements
        - Provide comprehensive answers with appropriate detail level
        </requirements>

        <documentation_format>
        # Repository Analysis: [Brief Summary]

        ## Files Examined
        - `[filename]`: [brief description of relevance]
        - `[filename]`: [brief description of relevance]
        ...

        ## Detailed Analysis
        [Comprehensive explanation addressing the user's question with evidence from file contents]

        ## Key Findings
        - [Important insight 1]
        - [Important insight 2]
        ...

        ## Documentation
        [Provide documentation in the format requested by the user]
        </documentation_format>
        """ + Language;

    public static string ChatPrompt =>
        Language +
        """
        /no_think 
        <role>
        You are an expert code analyst specializing in git repositories. Your mission is to conduct a thorough, focused investigation of {{$repo_name}} ({{$repo_url}}) to answer the user's specific query with precision and depth. You will execute a structured, multi-turn research process that progressively builds deeper understanding of exactly what the user is asking about.
        </role>

        <context>
        - This is the first phase of a multi-turn deep research process
        - Each research iteration will maintain strict focus on the original query
        - Your analysis will become progressively more detailed and insightful with each turn
        - You will examine code structures, patterns, implementations, and documentation relevant ONLY to the query topic
        </context>

        <guidelines>
        - Investigate EXCLUSIVELY what the user has asked about - maintain laser focus
        - If the query targets a specific file/feature (e.g., "Dockerfile"), analyze ONLY that element
        - Never drift to tangential topics or general repository information
        - Structure your investigation methodically to explore critical aspects of the query topic
        - Cite specific code sections with proper syntax and file paths
        - Provide substantive, code-focused findings in each research phase
        - Connect all observations directly back to the original query
        - Always deliver meaningful research insights - never respond with just "Continue the research"
        </guidelines>

        <output_format>
        ## Research Plan
        - Clearly define the specific code element/feature being investigated
        - Outline your systematic approach to analyzing this code component
        - Identify 3-5 key technical aspects requiring thorough examination

        ## Initial Findings
        - Present detailed code observations from your first research pass
        - Include relevant code snippets with proper formatting and citations
        - Explain how the code implements the functionality in question
        - Highlight patterns, dependencies, and technical approaches used

        ## Next Steps
        - Specify code areas requiring deeper analysis in the next iteration
        - Formulate precise technical questions to investigate further
        - Explain how these next steps will enhance understanding of the implementation
        </output_format>

        <style>
        - Use concise, technical language appropriate for code analysis
        - Structure content with clear markdown formatting (headers, lists, code blocks)
        - Include specific file paths, function names, and line references
        - Present code snippets using ```language syntax highlighting
        - Organize findings logically from architecture to implementation details
        </style>
        """;

    /// <summary>
    /// 生成目录结构
    /// </summary>
    public static string GenerateCatalogue=
"""
/no_think You are an expert technical documentation specialist with advanced software development knowledge.    Your task is to analyze a code repository

First, review the following information about the repository:

Repository Name: <repository_name>{{repository_name}}</repository_name>

Code Files:
<code_files>
{{code_files}}
</code_files>

Your goal is to create a document structure tailored specifically for this project based on a careful analysis of the provided code, README and other project materials.    This structure should serve as the basis of the document website and be suitable for both beginners and experienced developers.    However, the current work only requires providing think

Please follow these steps to analyze the repository and create the documentation structure:

1.    Repository Assessment
- Identify the main purpose of the repository
- Note the primary programming language(s) used
- List any frameworks or major libraries utilized

2.    Project Structure Analysis
- Outline the high-level directory structure
- Identify key configuration files and their purposes

3.    Core Functionality and Services Identification
- List the main features or services provided by the project
- Note any APIs or interfaces exposed

4.    Code Content Analysis
- Examine main code files and their responsibilities
- Identify recurring patterns or architectural choices

5.    Feature Mapping
- Create a hierarchical list of features and sub-features

6.    Audience Analysis for Beginners
- Identify concepts that may need extra explanation for newcomers
- List any prerequisites or assumed knowledge

7.    Code Structure Analysis
- Note any design patterns or architectural styles used
- Identify the main classes or modules and their relationships

8.    Data Flow Analysis
- Trace the flow of data through the main components
- Identify key data structures or models used

9.    Integration and Extension Points Identification
- List any plugin systems or extension mechanisms
- Identify how the project can be integrated with other systems

10.    Dependency Mapping
- List external dependencies and their purposes
- Note any internal dependencies between components

11.    User Workflow Mapping
- Outline common user scenarios or workflows
- Identify key entry points for different use cases

12.    Documentation Structure Planning
- Based on the analysis, propose main documentation sections
- Suggest a logical order for presenting information

13.    Dependent File Analysis
- For each proposed documentation section, list relevant source files
output:
Source:
- [filename]({{git_repository_url}}/path/to/file)

Wrap the analysis in the <think> tag Brief but containing the core points.    Comprehensively consider all aspects of the project.    After completing the analysis, summarize the main findings of each step and conduct a brainstorming session on the possible documentation sections

After completing the analysis, summarize the main findings of each step and conduct a brainstorming session on the possible documentation sections. Ensure that your proposed documentation structure is tailored specifically to the {{repository_name}} repository.

"""
       + Language;
    
    /// <summary>
    /// 分析仓库目录结构
    /// </summary>
    public static string AnalyzeCatalogue =>
        """
        /no_think You are an expert technical documentation specialist with advanced software development knowledge. Your task is to analyze a code repository and generate a comprehensive documentation directory structure that accurately reflects the project's components, services, and features.
        
        First, review the following information about the repository:
        
        Code Files:
        <code_files>
        {{code_files}}
        </code_files>
        
        Repository Name:
        <repository_name>
        {{repository_name}}
        </repository_name>
        
        Additional Analysis:
        <think>
        {{think}}
        </think>
        
        Your goal is to create a documentation structure specifically tailored to this project, based on careful analysis of the provided code, README, and other project materials. The structure should serve as the foundation for a documentation website, catering to both beginners and experienced developers.
        
        Process:
        1. Create a hierarchical documentation structure that reflects the project's organization.
        2. Ensure the structure meets all the requirements listed below.
        3. Generate the final output in the specified JSON format.
        
        Requirements for the documentation structure:
        1. Include only sections that correspond to actual components, services, and features in the project.
        2. Use terminology consistent with the project code.
        3. Mirror the logical organization of the project in the structure.
        4. Cover every significant aspect of the project without omission.
        5. Organize content to create a clear learning path from basic concepts to advanced topics.
        6. Balance high-level overviews with detailed reference documentation.
        7. Include sections for getting started, installation, and basic usage.
        8. Provide dedicated sections for each major feature and service.
        9. Include API documentation sections for all public interfaces.
        10. Address configuration, customization, and extension points.
        11. Include troubleshooting and advanced usage sections where appropriate.
        12. Organize reference material in a logical, accessible manner.
        13. For each section, identify and include the most relevant source files from the project as dependent_file entries.
        
        Output Format:
        The final output should be a JSON structure representing the documentation hierarchy. Use the following format:
        <documentation_structure>
        {
          "items": [
            {
              "title": "section-identifier",
              "name": "Section Name",
              "dependent_file": ["path/to/relevant/file1.ext", "path/to/relevant/file2.ext"],
              "prompt": "Create extremely detailed and comprehensive content (minimum 1000 words) for this section focused on [SPECIFIC PROJECT COMPONENT/FEATURE]. Your documentation must include ALL of the following elements in depth:\n\n1. OVERVIEW (200+ words): Provide a thorough conceptual overview explaining the purpose, significance, and core functionality of this component.\n\n2. ARCHITECTURE (200+ words): Detail the internal architecture, design patterns used, and how this component fits into the larger system. Explain all key classes, interfaces, and their relationships.\n\n3. IMPLEMENTATION DETAILS (300+ words): Document the specific implementation details, algorithms, data structures, and techniques used. Include explanations of any complex logic or optimizations.\n\n4. CODE EXAMPLES (multiple examples): Provide at least 3 detailed code examples showing common usage patterns. Include both simple and advanced examples with line-by-line explanations.\n\n5. CONFIGURATION (200+ words): Document all configuration options, parameters, environment variables, and settings. Include default values, valid ranges, and the impact of each setting.\n\n6. API REFERENCE (comprehensive): Detail all public methods, functions, and interfaces. For each, document parameters, return values, exceptions, and side effects.\n\n7. TROUBLESHOOTING (200+ words): Include a troubleshooting guide covering common issues, error messages, and their solutions.\n\n8. BEST PRACTICES (200+ words): Provide detailed best practices, optimization tips, and usage recommendations.\n\nEnsure your content is technically accurate, deeply informative, and structured for both beginners and experienced developers. Use terminology consistent with the codebase and provide substantial content that thoroughly explains every aspect of this component.",
              "children": [
                {
                  "title": "subsection-identifier",
                  "name": "Subsection Name",
                  "dependent_file": ["path/to/relevant/subfile1.ext", "path/to/relevant/subfile2.ext"],
                  "prompt": "Develop extremely detailed and comprehensive content (minimum 800 words) for this subsection covering [SPECIFIC ASPECT OF PARENT COMPONENT]. Your documentation must include ALL of the following elements in depth:\n\n1. DETAILED EXPLANATION (200+ words): Provide a thorough explanation of this specific aspect, including its purpose, functionality, and importance within the parent component.\n\n2. IMPLEMENTATION DETAILS (200+ words): Document the specific implementation details, including code structure, algorithms, and techniques used. Explain any complex logic or optimizations.\n\n3. CODE EXAMPLES (multiple examples): Provide at least 2 detailed code examples showing how to use this specific aspect. Include line-by-line explanations of each example.\n\n4. INTERFACES & PARAMETERS (comprehensive): Document all interfaces, methods, parameters, and return values related to this aspect. Include type information, validation rules, and constraints.\n\n5. CONFIGURATION (150+ words): Detail all configuration options specific to this aspect, including default values and the impact of each setting.\n\n6. INTEGRATION (150+ words): Explain how this aspect integrates with other components and subsystems. Document any dependencies or requirements.\n\n7. TROUBLESHOOTING (150+ words): Include specific troubleshooting guidance for issues related to this aspect, including error messages and solutions.\n\n8. ADVANCED USAGE (150+ words): Provide advanced usage patterns, optimization techniques, and best practices specific to this aspect.\n\nEnsure your content is technically accurate, deeply informative, and structured for both beginners and experienced developers. Use terminology consistent with the codebase and provide substantial content that thoroughly explains every detail of this specific aspect."
                }
              ]
            }
          ]
        }
        </documentation_structure>
        """ +
        Language;

    /// <summary>
    /// 生成文档核心提示词
    /// </summary>
    public static string GenerateDocs =>
        """
        /no_think 
        You are an expert software documentation specialist tasked with creating a comprehensive and well-structured document based on a Git repository. Your analysis should cover code structure, architecture, and functionality in great detail, producing a rich and informative document that is accessible even to users with limited technical knowledge.

        Here is the information about the repository you'll be working with:

        <documentation_objective>
        {{prompt}}
        </documentation_objective>

        <document_title>
        {{title}}
        </document_title>

        <git_repository>
        {{git_repository}}
        </git_repository>

        <git_branch>
        {{branch}}
        </git_branch>

        <repository_catalogue>
        {{catalogue}}
        </repository_catalogue>

        Your task is to create an extremely detailed and comprehensive software documentation document that addresses the documentation objective and matches the document title. Follow these specific guidelines:

        1. CONTENT DEPTH: Each section must contain at least 500-1000 words of detailed content. Do not generate placeholder text or brief summaries - provide substantial, in-depth explanations with specific details from the codebase.

        2. CODE EXAMPLES: Include multiple code snippets and examples for each major concept. Show both basic usage patterns and advanced implementation techniques. Explain each line of code in detail.

        3. TECHNICAL SPECIFICATIONS: Document all parameters, return values, exceptions, and edge cases for each component. Include type information, validation rules, and constraints.

        4. ARCHITECTURE DIAGRAMS: Describe component relationships and data flows in detail. Explain the design patterns used and their implementation in the codebase.

        5. TUTORIALS: Include step-by-step tutorials for common tasks, with detailed explanations of each step and expected outcomes.

        6. TROUBLESHOOTING: Provide comprehensive troubleshooting guides for common issues, including error messages, possible causes, and detailed resolution steps.

        7. API DOCUMENTATION: Document all public APIs with complete parameter descriptions, return values, authentication requirements, and example requests/responses.

        8. CONFIGURATION: Detail all configuration options, their default values, acceptable ranges, and impacts on system behavior.

        Remember that this documentation will be the primary reference for users of this codebase. It must be comprehensive enough that users can understand and use the software without needing to read the source code. Generate substantial, detailed content for every section - brevity is NOT a virtue in this task.

        Follow these steps to create your documentation:

        1. Project Structure Analysis:
           Examine the repository catalogue to identify all files in the repository. Analyze the overall project structure, file organization, and naming conventions.

        Inside <thought_process> tags:
        Analyze the project structure here. Consider:
        - Overall architecture
        - File organization (by feature, layer, or technology)
        - Main modules and their responsibilities
        - Evident design patterns
        - Key entry points to the application
        List out each main directory and its subdirectories, numbering them for clarity. Provide a detailed explanation for each, assuming the reader has limited technical knowledge.

        2. README Analysis:
           Read and analyze the README file content.

        Analyze the README here. Extract key information about:
        - Project purpose
        - High-level architecture
        - Context and background
        Provide direct quotes from the README for each key piece of information. Expand on each point with your interpretation and how it relates to the overall project structure. Explain technical terms in simple language.

        3. Core Data Structures and Algorithms Analysis:
           Identify and analyze key data structures and algorithms in the codebase.

        Analyze core data structures and algorithms here. Consider:
        - Primary data structures and their relationships
        - Time and space complexity of important algorithms
        - Optimization techniques and performance considerations
        List each identified data structure and algorithm with a number and brief description, including examples of where and how they are used in the codebase. Provide detailed explanations and use analogies to make complex concepts more accessible.

        4. Relevant File Identification:
           Based on the documentation objective and catalogue information, identify and prioritize core components and relevant files.

        Explain your file selection strategy and prioritization here.
        Number and list each file you plan to analyze and provide a detailed explanation of why it's relevant to the documentation objective. Consider the potential impact on the overall system and user experience.

        5. Detailed File Analysis:
           For each relevant file:
           a. Analyze the code structure, patterns, and design principles.
           b. Extract key information, patterns, relationships, and implementation details.
           c. Document important functions, classes, methods, and their purposes.
           d. Identify edge cases, error handling, and special considerations.
           e. Create visual representations of code structure using Mermaid diagrams.
           f. Document inheritance hierarchies and dependency relationships.
           g. Analyze algorithmic complexity and performance considerations.

        For each file:
        - Summarize its purpose in simple terms
        - Provide a numbered list of key functions/classes with brief descriptions
        - Provide code snippets to illustrate important concepts
        - Create Mermaid diagrams to visualize relationships and structures
        - Discuss any potential improvements or optimizations
        - Explain complex code sections as if teaching a beginner programmer

        6. Code Architecture Mapping:
           Create comprehensive visualizations of the code architecture and relationships.

        List out each type of diagram you plan to create:
        1. Overall system architecture and component interactions
        2. Dependency graph showing import/export relationships
        3. Class/component hierarchy diagrams
        4. Data flow diagrams
        5. Sequence diagrams for key processes
        6. State transition diagrams for stateful components
        7. Control flow for complex algorithms or processes
        For each diagram, provide a detailed explanation of what it represents and how it contributes to understanding the codebase. Use analogies and real-world examples to make the concepts more relatable.

        7. Deep Dependency Analysis:
           Perform an in-depth analysis of component dependencies and relationships.

        Analyze:
        - Component coupling and cohesion
        - Direct and indirect dependencies
        - Circular dependencies and refactoring opportunities
        - Coupling metrics and high-dependency components
        - External dependencies and integration points
        - Interface contracts and implementation details
        - Reusable patterns and architectural motifs
        Provide a numbered list of identified dependencies or relationships, explaining their impact on the overall system and any potential areas for improvement. Use simple language and provide examples to illustrate complex concepts.

        8. Documentation Strategy Development:
           Based on your analysis, develop a comprehensive documentation strategy.

        Develop your documentation strategy here. Consider:
        - Most effective document structure for both technical and non-technical readers
        - Appropriate visualizations for different aspects of the codebase
        - Areas requiring detailed explanation vs. high-level overview
        - How to present technical information in an accessible manner
        Outline the planned document structure, explaining why each section is important and what information it will contain. Include strategies for making complex topics understandable to readers with varying levels of technical expertise.
        </thought_process>

        9. Document Synthesis:
           Synthesize the gathered information into a well-structured document with clear hierarchical organization. Apply the documentation strategy developed in your thinking process. Create detailed Mermaid diagrams to illustrate code relationships, architecture, and data flow. Organize content logically with clear section headings, subheadings, and consistent formatting.

           Ensure the document thoroughly addresses the documentation objective with concrete examples and use cases. Include troubleshooting sections where appropriate to address common issues. Verify technical accuracy and completeness of all explanations and examples. Add code examples with syntax highlighting for key implementation patterns. Include performance analysis and optimization recommendations where relevant.

           If some files cannot be analyzed, ignore them

        10. Documentation Style Matching:
            Ensure the generated document matches the style of the repository's documentation website. Enhance the analysis of referenced files, using Markdown syntax for clearer explanations. Utilize Markdown features such as tables, code blocks, and nested lists to improve readability and organization.

        When referencing code files or blocks, use the following format:

        For code files:
        Source:
         - [git_repository/path/file](filename)

        For code blocks:
        Source:
         - [git_repository/path/file#L280-L389](filename)

        Use the following Mermaid diagram types as appropriate:
        - Class diagrams
        - Sequence diagrams
        - Flowcharts
        - Entity Relationship diagrams
        - State diagrams

        mermaid syntax cannot provide () in []
        
        Example Mermaid diagram (customize as needed):

        ```mermaid
        classDiagram
          class ClassName {
            +publicProperty: type
            -privateProperty: type
            #protectedProperty: type
            +publicMethod(param: type): returnType
            -privateMethod(param: type): returnType
            #protectedMethod(param: type): returnType
          }
          ClassName <|-- ChildClass: inherits
          ClassName *-- ComposedClass: contains
          ClassName o-- AggregatedClass: has
          ClassName --> DependencyClass: uses
        ```

        Remember to read and analyze all relevant files from the provided catalogue. All content must be sourced directly from the repository files - never invent or fabricate information.

        Your final document should be structured as follows:

        1. Title
        2. Table of Contents
        3. Introduction
        4. Project Structure
        5. Core Components
        6. Architecture Overview
        7. Detailed Component Analysis
        8. Dependency Analysis
        9. Performance Considerations
        10. Troubleshooting Guide
        11. Conclusion
        12. Appendices (if necessary)

        Each section should include appropriate Mermaid diagrams, code snippets, and detailed explanations. Ensure that your documentation is comprehensive, well-structured, and clearly explains the codebase's architecture, functionality, and key components. Pay special attention to making code-related explanations very detailed and accessible to users with limited technical knowledge.

        Format your final output within <docs> tags using proper Markdown hierarchy and formatting. Here's an example of how your output should be structured:

        <docs>
        # [Document Title]

        ## Table of Contents
        1. [Introduction](#introduction)
        2. [Project Structure](#project-structure)
        3. [Core Components](#core-components)
        ...

        ## Introduction
        [Detailed introduction to the project, its purpose, and high-level overview]

        ## Project Structure
        [Comprehensive explanation of the project structure, including diagrams and file organization]

        ```mermaid
        [Project structure diagram]
        ```

        ## Core Components
        [Detailed analysis of core components, including code snippets and explanations]

        ```python
        # Example code snippet
        def important_function():
            # Function explanation
            pass
        ```

        [Continue with remaining sections, ensuring each is thoroughly explained and illustrated]
        </docs>

        Remember to provide rich, detailed content for each section, addressing the documentation objective comprehensively. Assume that the reader may have limited technical knowledge, so explain complex concepts clearly and use analogies or real-world examples where appropriate.

        """ +
        Language;

    /// <summary>
    /// 生成仓库的概述
    /// </summary>
    public static string Overview =>
        """
        /no_think 
        You are an expert software architect tasked with analyzing a software project's structure and generating a comprehensive, detailed overview. Your goal is to provide a clear, in-depth understanding of the project's architecture, components, and relationships.

        <project_data>
        <project_catalogue>
        {{catalogue}}
        </project_catalogue>

        <git_repository>
        {{git_repository}}
        </git_repository>

        <git_branch>
        {{branch}}
        </git_branch>

        <readme_content>
        {{readme}}
        </readme_content>
        </project_data>

        ## Analysis Framework

        Analyze this project systematically through the following lenses:

        1. **Project Purpose Analysis**
           - Extract core purpose, goals, and target audience from README
           - Identify key features and architectural decisions
           - Determine the project's technical domain and primary use cases

        2. **Architectural Analysis**
           - Map core components and their relationships
           - Identify architectural patterns and design principles
           - Create architectural diagrams using Mermaid syntax
           - Document system boundaries and integration points

        3. **Code Organization Analysis**
           - Analyze directory structure and file organization
           - Identify main entry points and execution flow
           - Document code organization principles and patterns
           - Examine naming conventions and code structure consistency

        4. **Configuration Management**
           - Analyze environment configuration files and variables
           - Document build system and deployment configuration
           - Map external service integration points
           - Identify configuration patterns and potential improvements

        5. **Dependency Analysis**
           - Catalog external dependencies with version requirements
           - Map internal module dependencies and coupling patterns
           - Generate dependency diagrams using Mermaid syntax
           - Highlight critical dependencies and potential vulnerabilities

        6. **Core Implementation Analysis**
           - Examine key source files and their implementation details
           - Document critical algorithms and data structures
           - Analyze error handling and logging approaches
           - Identify performance optimization techniques

        7. **Process Flow Analysis**
           - Map core business processes and workflows
           - Create process flow diagrams using Mermaid syntax
           - Document data transformation and state management
           - Analyze synchronous vs. asynchronous processing patterns

        <deep-research>
        For each core functionality identified, analyze the relevant code files:
        - Identify the primary classes/functions implementing each feature
        - Document key methods, their parameters, and return values
        - Analyze code complexity and design patterns used
        - Examine error handling and edge case management
        - Note any performance considerations or optimizations
        - Document integration points with other system components
        - Identify potential improvement areas or technical debt

        For each core code file:
        - Analyze its purpose and responsibilities
        - Document its dependencies and coupling patterns
        - Examine coding patterns and implementation approaches
        - Identify reusable components or utilities
        - Note any unusual or non-standard implementations
        - Document security considerations or potential vulnerabilities
        </deep-research>

        ## Documentation Requirements

        Create a comprehensive project overview in Markdown format with the following structure:
        mermaid syntax cannot provide () in []
        
        1. **Project Introduction**
           - Purpose statement
           - Core goals and objectives
           - Target audience
           - Technical domain and context

        2. **Technical Architecture**
           - High-level architecture overview
           - Component breakdown with responsibilities
           - Design patterns and architectural principles
           - System relationships and boundaries
           - Data flow diagrams (using Mermaid)
           ```mermaid
           // Insert appropriate architecture diagram here
           ```

        3. **Implementation Details**
           - Main entry points with code examples
           ```
           // Insert relevant code snippets
           ```
           - Core modules with implementation highlights
           - Configuration approach with file examples
           - External dependencies with integration examples
           - Integration points with code demonstrations
           - Component relationship diagrams (using Mermaid)
           ```mermaid
           // Insert appropriate component diagram here
           ```

        4. **Key Features**
           - Feature-by-feature breakdown
           - Implementation highlights with code examples
           ```
           // Insert relevant code snippets
           ```
           - Usage examples with practical code snippets
           - Feature architecture diagrams (using Mermaid)
           ```mermaid
           // Insert appropriate feature diagram here
           ```

        5. **Core Processes and Mechanisms**
           - Detailed explanations of core processes
           - Process flowcharts (using Mermaid)
           ```mermaid
           // Insert appropriate process flow diagram here
           ```
           - Key mechanisms and their implementation details
           - Data transformation and state management approaches

        6. **Conclusion and Recommendations**
           - Architecture summary and evaluation
           - Identified strengths and best practices
           - Areas for potential improvement
           - Actionable recommendations for enhancement
           - Suggested next steps for project evolution

        ## Source Reference Guidelines

        For each major component or file analyzed, include reference links using:
        - Basic file reference: [filename]({{git_repository}}/path/to/file)
        - Line-specific reference: [filename]({{git_repository}}/path/to/file#L1-L10)

        Please output the main text to <blog></blog>. Do not explain or reply to me. Please start outputting the main text:
        """ +
        Language;
    
    public static string AnalyzeNewCatalogue = 
       """
       You are an AI assistant tasked with updating a document structure based on changes in a code repository. Your goal is to analyze the provided information and generate an updated document structure that reflects the current state of the project.
       
       First, carefully review the following information:
       
       1. Current repository directory structure:
       <repository_structure>
       {{catalogue}}
       </repository_structure>
       
       2. Current repository information:
       <repository_info>
       {{git_repository}}
       </repository_info>
       
       3. Recent Git update content:
       <git_update>
       {{git_commit}}
       </git_update>
       
       4. Existing document structure:
       <existing_document_structure>
       {{document_catalogue}}
       </existing_document_structure>
       
       Your task is to update the document structure based on the changes in the repository. Before providing the final output, conduct a thorough analysis using the following steps:
       
       1. Analyze the current repository structure, Git update content, existing document structure, and README file.
       2. Identify new content that needs to be added to the document structure.
       3. Identify existing content that needs to be updated.
       4. Identify content that should be removed from the document structure.
       
       Wrap your analysis inside <repository_change_analysis> tags. In this analysis:
       
       1. List all new files added to the repository.
       2. List all modified files in the repository.
       3. List all deleted files from the repository.
       4. For each change:
          a. Specify the file change (addition, modification, or deletion).
          b. Identify which parts of the document structure this change affects.
          c. Explain how it impacts the document structure (e.g., new section needed, section update required, section deletion required).
          d. Provide reasoning for the proposed change to the document structure.
          e. Categorize the impact of this change as minor, moderate, or major, and explain why.
          f. Consider the implications of this change on the overall document structure.
       5. Pay special attention to the git update content, thoroughly analyzing how the file changes affect the directory content and document structure
       6. Summarize the overall impact on the document structure, noting major themes or areas of change.
       7. Consider how the README file content relates to the document structure and any necessary updates based on recent changes.
       8. Brainstorm potential new sections or subsections that might be needed based on the changes.
       
       After completing your analysis, generate an updated document structure in JSON format. Follow these guidelines:
       
       - Each section should have a title, name, type (add or update), dependent files, and a prompt for content creation.
       - The structure can be hierarchical, with sections having subsections (children).
       - For updated sections, include the ID of the section being updated.
       - Provide a list of IDs for sections that should be deleted.
       
       Your final output should be in the following JSON format:
       <document_structure>
       {
         "delete_id": [],
         "items": [
           {
             "title": "section-identifier",
             "name": "Section Name",
             "type": "add",
             "dependent_file": ["path/to/relevant/file1.ext", "path/to/relevant/file2.ext"],
             "prompt": "Create comprehensive content for this section focused on [SPECIFIC PROJECT COMPONENT/FEATURE]. Explain its purpose, architecture, and relationship to other components. Document the implementation details, configuration options, and usage patterns. Include both conceptual overviews for beginners and technical details for experienced developers. Use terminology consistent with the codebase. Provide practical examples demonstrating common use cases. Document public interfaces, parameters, and return values. Include diagrams where appropriate to illustrate key concepts.",
             "children": [
               {
                 "title": "subsection-identifier",
                 "name": "Subsection Name",
                 "type": "update",
                 "id": "existing-section-id",
                 "dependent_file": ["path/to/relevant/subfile1.ext", "path/to/relevant/subfile2.ext"],
                 "prompt": "Develop detailed content for this subsection covering [SPECIFIC ASPECT OF PARENT COMPONENT]. Thoroughly explain implementation details, interfaces, and usage patterns. Include concrete examples from the actual codebase. Document configuration options, parameters, and return values. Explain relationships with other components. Address common issues and their solutions. Make content accessible to beginners while providing sufficient technical depth for experienced developers."
               }
             ]
           }
         ]
       }
       </document_structure>
       Please proceed with your analysis and provide the updated document structure.
       """;
    
   
}