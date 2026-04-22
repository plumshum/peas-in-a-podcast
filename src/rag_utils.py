def build_markdown_threads(podcasts_df):
    """
    Returns a list of markdown strings, one per podcast.
    """
    markdown_threads = []
    for idx, row in podcasts_df.iterrows():
        md = f"""## Podcast: {row.get('name', '')}
**Categories:** {row.get('categories', '')}  
**Author:** {row.get('author', '')}  
**Description:**  
{row.get('descr', '')}
"""
        markdown_threads.append(md)
    return markdown_threads

def format_rag_context(hits, markdown_threads, max_chars_total=120_000):
    """
    Build one LLM context string from search hits using full thread Markdown.
    Args:
        hits: List of dicts with 'doc_id', 'rank', 'title', 'score'.
        markdown_threads: List of markdown strings, indexed by doc_id.
        max_chars_total: Max characters for the combined string, or None for no cap.
    Returns:
        Prompt text for the LLM.
    """
    parts = []
    for h in hits:
        i = h["doc_id"]
        md = markdown_threads[i] if 0 <= i < len(markdown_threads) else ""
        parts.append(
            f"### [{h['rank']}] {h['title']}\n"
            f"score: {h['score']:.4f}\n\n---\n\n{md}\n"
        )
    text = "\n\n".join(parts)
    if max_chars_total is not None and len(text) > max_chars_total:
        return text[:max_chars_total] + "\n\n[truncated]"
    return text

def search_podcasts_and_episodes(query, markdown_threads, json_search_fn, top_k=5):
    """
    Wrapper around json_search to return hits in the format expected by RAG helpers.
    Args:
        query: User query string
        markdown_threads: List of markdown strings (podcasts first, then episodes)
        json_search_fn: Function to call for podcast search (should return list of podcast dicts)
        top_k: Number of results to return
    Returns:
        List of dicts with doc_id, rank, title, score
    """
    # Call the user's existing search function
    results = json_search_fn(query)
    hits = []
    # Podcasts are first in markdown_threads, so doc_id = podcast index
    for rank, podcast in enumerate(results[:top_k], 1):
        # Find doc_id by matching title and description in markdown_threads
        # (Assumes build_markdown_threads order is consistent)
        doc_id = None
        for i, md in enumerate(markdown_threads):
            if podcast['title'] in md and podcast['description'] in md:
                doc_id = i
                break
        if doc_id is None:
            doc_id = 0  # fallback to first
        hits.append({
            'doc_id': doc_id,
            'rank': rank,
            'title': podcast['title'],
            'score': podcast['score'],
        })
    return hits

def retrieve_for_rag(query, markdown_threads, json_search_fn, top_k=5, max_chars_total=120_000):
    """
    Run search, print a banner and hit list, then format context for the LLM.
    Returns: (hits, context)
    """
    print("\n" + "=" * 72)
    print(f" search_podcasts_and_episodes({query!r}, top_k={top_k})")
    print("=" * 72 + "\n")
    hits = search_podcasts_and_episodes(query, markdown_threads, json_search_fn, top_k=top_k)
    for h in hits:
        print(f" [{h['rank']}] {h['score']:.4f} {h['title'][:72]}")
    print()
    return hits, format_rag_context(hits, markdown_threads, max_chars_total)

def run_rag_modified_query(user_query, markdown_threads, client, max_chars_total=120_000):
    """
    Retrieve context, call LLM to modify query, then retrieve and answer.
    """
    # Prompt LLM to improve the query for podcast/episode retrieval
    prompt_query_modification = [
        {"role": "system", "content": "You are an expert podcast search assistant. Rewrite the user's question to maximize retrieval of relevant podcast and episode descriptions."},
        {"role": "user", "content": f"Original query: {user_query}"}
    ]
    response = client.chat(prompt_query_modification, stream=False, show_thinking=False)
    modified_query = response["content"]
    print(f"Modified query: {modified_query}")

    # Retrieve context using the modified query
    _, ctx = retrieve_for_rag(modified_query, markdown_threads, max_chars_total=max_chars_total)

    # Build the LLM prompt
    rag_system = (
        "You are a podcast assistant. Answer only from the podcast and episode descriptions below. "
        "If the answer is not there, say so. Cite podcast or episode titles when you can."
    )
    prompt = [
        {"role": "system", "content": rag_system},
        {"role": "user", "content": f"Question:\n{user_query}\n\nDescriptions:\n\n{ctx}"},
    ]
    stream_output(client.chat(prompt, stream=True, show_thinking=True))

def stream_output(generator):
  """Stream and format reasoning and content chunks from an LLM generator.

  This prints an initial banner, streams any "reasoning" chunks under a
  "### Thinking" heading, and then transitions to streaming "content" chunks
  under an "### Answer" heading once the final answer begins.

  Args:
    generator: An iterable yielding dictionaries that may contain
      "reasoning" and/or "content" string values.
  """
  print("--- LLM (streaming) ---\n### Thinking\n")
  seen_answer = False
  for ch in generator:
    if ch.get("reasoning"):
        print(ch["reasoning"], end="", flush=True)
    if ch.get("content"):
      if not seen_answer:
        print("\n\n### Answer\n", end="", flush=True)
        seen_answer = True
      print(ch["content"], end="", flush=True)
  print()
