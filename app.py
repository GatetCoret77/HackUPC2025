import os
import sys # To check Python version for ChromaDB compatibility if needed
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import PyPDF2

# --- LangChain & Vector Store Imports ---
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import OllamaEmbeddings # Use Ollama for embeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain.docstore.document import Document # To format chunks for ChromaDB

app = Flask(__name__)
CORS(app)

# --- Configuration ---
OLLAMA_BASE_URL = "http://localhost:11434" # Make sure Ollama is running here
LLM_MODEL_NAME = "llama3" # Model for answering questions
EMBEDDING_MODEL_NAME = "nomic-embed-text" # Model for creating embeddings (ensure you have pulled this: ollama pull nomic-embed-text)
PDF_FILE_PATH = "Tavascan_Manual.pdf"
CHROMA_PERSIST_DIR = "./chroma_db_tavascan" # Directory to store the vector database
CHUNK_SIZE = 1000 # How many characters per chunk
CHUNK_OVERLAP = 150 # How much overlap between chunks
RETURN_K_CHUNKS = 4 # How many relevant chunks to retrieve for context

# --- Global Variable for Vector Store ---
vectorstore = None

# --- PDF Loading and Processing Function ---
def load_and_process_pdf():
    """Loads PDF, splits into chunks, embeds, and stores in ChromaDB."""
    global vectorstore
    print(f"Loading PDF from: {PDF_FILE_PATH}")
    if not os.path.exists(PDF_FILE_PATH):
        print(f"Error: PDF file not found at {PDF_FILE_PATH}")
        return False

    pdf_text = ""
    try:
        with open(PDF_FILE_PATH, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            for page in reader.pages:
                pdf_text += page.extract_text() or ""
        print(f"Successfully loaded {len(pdf_text)} characters from PDF.")
        if not pdf_text:
             print("Warning: No text extracted from PDF.")
             return False
    except Exception as e:
        print(f"Error reading PDF: {e}")
        return False

    # 2. Split (Chunk)
    print("Splitting document into chunks...")
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        length_function=len,
    )
    # Create Document objects for LangChain/ChromaDB
    docs = [Document(page_content=chunk) for chunk in text_splitter.split_text(pdf_text)]
    print(f"Created {len(docs)} document chunks.")
    if not docs:
         print("Error: No document chunks created.")
         return False

    # 3. Embed & Store
    print(f"Initializing Ollama embeddings with model: {EMBEDDING_MODEL_NAME}")
    try:
        embeddings = OllamaEmbeddings(model=EMBEDDING_MODEL_NAME, base_url=OLLAMA_BASE_URL)
        # Test embedding function (optional but recommended)
        # try:
        #     _ = embeddings.embed_query("Test query")
        #     print("Embedding function test successful.")
        # except Exception as embed_test_e:
        #      print(f"Error testing embedding function: {embed_test_e}. Make sure Ollama is running and '{EMBEDDING_MODEL_NAME}' is pulled.")
        #      return False

        print(f"Creating/loading Chroma vector store at: {CHROMA_PERSIST_DIR}")
        # Check Python version for potential ChromaDB issues (optional)
        # if sys.version_info.major == 3 and sys.version_info.minor >= 12:
        #     print("Warning: Python 3.12+ might have compatibility issues with older sqlite versions used by ChromaDB. Ensure pysqlite3-binary is installed if needed.")
        #     # Consider: pip install pysqlite3-binary ; __import__('pysqlite3'); sys.modules['sqlite3'] = sys.modules.pop('pysqlite3')

        # Create a new ChromaDB store from the documents
        vectorstore = Chroma.from_documents(
            documents=docs,
            embedding=embeddings,
            persist_directory=CHROMA_PERSIST_DIR
        )
        vectorstore.persist() # Ensure data is saved
        print("Chroma vector store created and persisted successfully.")
        return True

    except Exception as e:
        print(f"Error during embedding or vector store creation: {e}")
        return False

# --- Ollama LLM Interaction Function (for RAG) ---
def query_ollama_rag(question, context):
    """Sends question and retrieved context to Ollama LLM."""
    OLLAMA_GENERATE_URL = f"{OLLAMA_BASE_URL}/api/generate" # Use consistent base URL

    full_prompt = f"""
    You are an expert assistant for the Cupra Tavascan electric car.
    Answer the following user question based *ONLY* on the provided context document snippets (extracted from the car manual).
    Do not use any prior knowledge or information outside of these snippets.
    If the answer cannot be found within the provided snippets, clearly state that the information is not available in the provided context.

    --- Context Snippets Start ---
    {context}
    --- Context Snippets End ---

    User Question: {question}

    Answer:
    """

    try:
        payload = {
            "model": LLM_MODEL_NAME,
            "prompt": full_prompt,
            "stream": False # Get the full response at once
        }
        print(f"Sending prompt to Ollama LLM ({LLM_MODEL_NAME})...")
        response = requests.post(OLLAMA_GENERATE_URL, json=payload, timeout=120) # Keep timeout reasonable
        response.raise_for_status()
        data = response.json()

        if 'response' in data:
             answer = data.get('response', 'Error: No response field from Ollama.')
             print(f"Ollama LLM Raw Response Length: {len(answer)}")
             return answer
        else:
            print("Error: 'response' key not found in Ollama generation data:", data)
            return f"Error processing generation request with Ollama. Details: {data.get('error', 'Unknown error')}"

    except requests.exceptions.RequestException as e:
        print(f"Error connecting to Ollama API at {OLLAMA_GENERATE_URL}: {e}")
        return f"Error: Could not connect to the Ollama generation service at {OLLAMA_BASE_URL}. Is it running?"
    except Exception as e:
        print(f"An unexpected error occurred during Ollama generation: {e}")
        return "An unexpected error occurred while processing your generation request."


# --- API Endpoint ---
@app.route('/ask', methods=['POST'])
def ask_question():
    global vectorstore
    if not vectorstore:
        return jsonify({"answer": "Sorry, the document vector store is not initialized. Cannot process questions."}), 503 # Service Unavailable

    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    data = request.get_json()
    question = data.get('question')

    if not question:
        return jsonify({"error": "Missing 'question' in request body"}), 400

    print(f"Received question: {question}")

    try:
        # 5. Retrieve relevant chunks
        print(f"Retrieving relevant chunks from ChromaDB for question: '{question}'")
        retriever = vectorstore.as_retriever(search_kwargs={"k": RETURN_K_CHUNKS})
        context_docs = retriever.invoke(question) # Use invoke instead of get_relevant_documents

        if not context_docs:
            print("No relevant context found in vector store.")
            # Optionally, still ask the LLM but indicate no specific context was found
            answer = query_ollama_rag(question, "No specific context snippets were found in the manual for this question.")

        else:
             # Format context for the LLM prompt
             context = "\n\n---\n\n".join([doc.page_content for doc in context_docs])
             print(f"Retrieved {len(context_docs)} chunks. Total context length: {len(context)} chars.")
             # print("--- Context Start ---\n", context, "\n--- Context End ---") # For debugging

             # 6. Generate answer using LLM and retrieved context
             answer = query_ollama_rag(question, context)

        print(f"Sending answer (first 100 chars): {answer[:100]}...")
        return jsonify({"answer": answer})

    except Exception as e:
        print(f"Error during retrieval or generation: {e}")
        return jsonify({"answer": f"An error occurred while processing your request: {e}"}), 500


# --- Run the App ---
if __name__ == '__main__':
    # Load and process the PDF ONCE on startup
    if load_and_process_pdf():
        print("Backend ready. Starting Flask server...")
        # Run Flask app
        app.run(host='127.0.0.1', port=5000, debug=True) # debug=True for development
    else:
        print("Failed to initialize backend due to PDF/Vector Store errors. Server not starting.")